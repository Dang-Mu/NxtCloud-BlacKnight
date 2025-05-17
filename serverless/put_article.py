import json
import os
import boto3
import logging
import uuid
from datetime import datetime, timezone

# 로깅 설정 - CloudWatch에 로그 출력
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# AWS 서비스 클라이언트 초기화
dynamodb = boto3.resource('dynamodb')

# 환경 변수
ARTICLES_TABLE = os.environ.get('ARTICLES_TABLE', 'Articles')
USERS_TABLE = os.environ.get('USERS_TABLE', 'Users')

def lambda_handler(event, context):
    """
    AWS Lambda 핸들러 함수 - 기사 저장 및 조회 처리
    """
    # 요청 정보 로깅
    logger.info(f"[ARTICLE] 수신된 이벤트: {json.dumps(event)}")
    
    try:
        headers = {
            'Content-Type': 'application/json'
        }

        # 요청에서 사용자 ID 가져오기
        user_id = event.get('headers', {}).get('authorization', '0')
        logger.info(f"[ARTICLE] 요청 사용자 ID: {user_id}")
        
        # 사용자 정보 가져오기
        user_info = get_user_info(user_id)
        if not user_info:
            logger.warning(f"[ARTICLE] 인증되지 않은 사용자: {user_id}")
            return {
                'statusCode': 401,
                'headers': headers,
                'body': json.dumps({'error': '인증되지 않은 사용자입니다'})
            }

        logger.info(f"[ARTICLE] 사용자 정보: {json.dumps(user_info)}")
        
        # HTTP 메서드 및 리소스 경로 확인
        http_method = event.get('httpMethod', '')
        resource_path = event.get('resource', '')
        
        # 경로 매개변수
        path_parameters = event.get('pathParameters', {}) or {}
        
        logger.info(f"[ARTICLE] HTTP 메서드: {http_method}, 리소스 경로: {resource_path}")

        # HTTP 메서드 및 경로에 따른 처리
        if http_method == 'POST' and resource_path == '/articles':
            # 기사 저장
            body = json.loads(event.get('body', '{}'))
            return save_article(user_info, body, headers)
        elif http_method == 'GET' and resource_path == '/articles/user/{ownerId}':
            # 사용자별 기사 목록 조회
            user_id = path_parameters.get('ownerId', '')
            return get_user_articles(user_info, user_id, headers)
        elif http_method == 'GET' and resource_path == '/articles/{originId}/version':
            # 기사 버전 목록 조회
            article_id = path_parameters.get('originId', '')
            return get_article_version(user_info, article_id, headers)
        elif http_method == 'GET' and resource_path == '/articles/version/{versionId}':
            # 특정 버전 조회
            version_id = path_parameters.get('versionId', '')
            return get_article_version(user_info, version_id, headers)
        else:
            logger.warning(f"[ARTICLE] 지원하지 않는 경로 또는 메서드: {http_method} {resource_path}")
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': '지원하지 않는 요청입니다'})
            }

    except Exception as e:
        logger.error(f"[ARTICLE] 오류 발생: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'error': f'서버 오류가 발생했습니다: {str(e)}'})
        }

def get_user_info(user_id):
    """
    사용자 정보 가져오기
    """
    if user_id == '0':
        logger.warning("[ARTICLE] 사용자 ID가 0으로 설정됨")
        return None

    try:
        logger.info(f"[ARTICLE] 사용자 정보 조회 시작: {user_id}")
        table = dynamodb.Table(USERS_TABLE)
        response = table.get_item(
            Key={'id': user_id}
        )
        
        user = response.get('Item')
        if user:
            logger.info(f"[ARTICLE] 사용자 정보 조회 성공: {user.get('id')}, 조직: {user.get('organization')}")
        else:
            logger.warning(f"[ARTICLE] 사용자 정보 없음: {user_id}")
            
        return user
    except Exception as e:
        logger.error(f"[ARTICLE] 사용자 정보 조회 오류: {str(e)}", exc_info=True)
        return None

def save_article(user_info, article_data, headers):
    """
    기사 저장 함수
    """
    # 필수 필드 검증
    required_fields = ['newsId', 'originId', 'content', 'ownerId', 'version', 'description', 'createdAt']
    for field in required_fields:
        if field not in article_data:
            logger.warning(f"[ARTICLE] 필수 필드 누락: {field}")
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': f'필수 필드가 누락되었습니다: {field}'})
            }
    
    logger.info(f"[ARTICLE] 기사 저장 시작: newsId={article_data.get('newsId')}")
    
    # 사용자 ID 확인
    if article_data.get('ownerId') != user_info.get('id'):
        logger.warning(f"[ARTICLE] 요청자 ID와 본문의 소유자 ID가 불일치: {user_info.get('id')} vs {article_data.get('ownerId')}")
        # 관리자 권한 확인
        role = user_info.get('role', '')
        if role != 'admin':
            return {
                'statusCode': 403,
                'headers': headers,
                'body': json.dumps({'error': '권한이 없습니다'})
            }
    
    # 타임스탬프 추가
    if 'createdAt' not in article_data:
        article_data['createdAt'] = datetime.now(timezone.utc).isoformat()
    
    try:
        # DynamoDB에 저장
        table = dynamodb.Table(ARTICLES_TABLE)
        table.put_item(Item=article_data)
        
        logger.info(f"[ARTICLE] 기사 저장 성공: newsId={article_data.get('newsId')}")
        
        return {
            'statusCode': 201,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'message': '기사가 성공적으로 저장되었습니다',
                'originId': article_data.get('originId')
            })
        }
    except Exception as e:
        logger.error(f"[ARTICLE] 기사 저장 실패: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': f'기사 저장 실패: {str(e)}'})
        }

def get_user_articles(user_info, user_id, headers):
    """
    특정 사용자의 모든 기사 목록 조회
    """
    if not user_id:
        logger.warning("[ARTICLE] 사용자 ID가 제공되지 않음")
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': '사용자 ID가 필요합니다'})
        }
    
    logger.info(f"[ARTICLE] 사용자 기사 목록 조회 시작: ownerId={user_id}")
    
    # 권한 검증
    requester_id = user_info.get('id', '')
    role = user_info.get('role', '')
    organization = user_info.get('organization', '')
    
    # 자신의 기사 또는 관리자인 경우에만 접근 허용
    if requester_id != user_id and role != 'admin':
        logger.warning(
            f"[ARTICLE] 권한 없음: 요청자={requester_id}, 대상={user_id}, " +
            f"요청자역할={role}"
        )
        return {
            'statusCode': 403,
            'headers': headers,
            'body': json.dumps({'error': '권한이 없습니다'})
        }
    
    try:
        # 기사 목록 조회
        table = dynamodb.Table(ARTICLES_TABLE)
        response = table.query(
            IndexName='OwnerIdIndex',
            KeyConditionExpression='ownerId = :oid',
            FilterExpression='isCurrent = :ic',
            ExpressionAttributeValues={
                ':oid': user_id,
                ':ic': True
            }
        )
        
        articles = response.get('Items', [])
        
        # 모든 페이지 처리
        while 'LastEvaluatedKey' in response:
            response = table.query(
                IndexName='OwnerIdIndex',
                KeyConditionExpression='ownerId = :oid',
                FilterExpression='isCurrent = :ic',
                ExpressionAttributeValues={
                    ':oid': user_id,
                    ':ic': True
                },
                ExclusiveStartKey=response['LastEvaluatedKey']
            )
            articles.extend(response.get('Items', []))
        
        logger.info(f"[ARTICLE] 사용자 기사 목록 조회 성공: ownerId={user_id}, 개수={len(articles)}")
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(articles, default=str)
        }
    except Exception as e:
        logger.error(f"[ARTICLE] 사용자 기사 목록 조회 실패: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': f'사용자 기사 목록 조회 실패: {str(e)}'})
        }

def get_article_version(user_info, article_id, headers):
    """
    특정 기사의 모든 버전 목록 조회
    """
    if not article_id:
        logger.warning("[ARTICLE] 기사 ID가 제공되지 않음")
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': '기사 ID가 필요합니다'})
        }
    
    logger.info(f"[ARTICLE] 기사 버전 목록 조회 시작: originId={article_id}")
    
    try:
        # 기사 버전 목록 조회
        table = dynamodb.Table(ARTICLES_TABLE)
        response = table.query(
            IndexName='ArticleIdIndex',
            KeyConditionExpression='originId = :aid',
            ExpressionAttributeValues={
                ':aid': article_id
            }
        )
        
        version = response.get('Items', [])
        
        # 모든 페이지 처리
        while 'LastEvaluatedKey' in response:
            response = table.query(
                IndexName='ArticleIdIndex',
                KeyConditionExpression='originId = :aid',
                ExpressionAttributeValues={
                    ':aid': article_id
                },
                ExclusiveStartKey=response['LastEvaluatedKey']
            )
            version.extend(response.get('Items', []))
        
        # 결과가 없는 경우
        if not version:
            logger.warning(f"[ARTICLE] 기사 버전 없음: originId={article_id}")
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({'error': '해당 기사를 찾을 수 없습니다'})
            }
        
        # 권한 검증
        owner_id = version[0].get('ownerId', '')
        requester_id = user_info.get('id', '')
        role = user_info.get('role', '')
        organization = user_info.get('organization', '')
        
        # 기사 소유자 또는 관리자만 접근 허용
        if owner_id != requester_id and role != 'admin':
            logger.warning(
                f"[ARTICLE] 권한 없음: 요청자={requester_id}, 소유자={owner_id}, " +
                f"요청자역할={role}"
            )
            return {
                'statusCode': 403,
                'headers': headers,
                'body': json.dumps({'error': '권한이 없습니다'})
            }
        
        logger.info(f"[ARTICLE] 기사 버전 목록 조회 성공: originId={article_id}, 개수={len(version)}")
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(version, default=str)
        }
    except Exception as e:
        logger.error(f"[ARTICLE] 기사 버전 목록 조회 실패: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': f'기사 버전 목록 조회 실패: {str(e)}'})
        }

def get_article_version(user_info, version_id, headers):
    """
    특정 기사 버전 조회
    """
    if not version_id:
        logger.warning("[ARTICLE] 버전 ID가 제공되지 않음")
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': '버전 ID가 필요합니다'})
        }
    
    logger.info(f"[ARTICLE] 기사 버전 조회 시작: versionId(newsId)={version_id}")
    
    try:
        # 기사 버전 조회
        table = dynamodb.Table(ARTICLES_TABLE)
        response = table.get_item(
            Key={'newsId': version_id}
        )
        
        article = response.get('Item')
        if not article:
            logger.warning(f"[ARTICLE] 기사 버전 없음: versionId={version_id}")
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({'error': '해당 기사 버전을 찾을 수 없습니다'})
            }
        
        # 권한 검증
        owner_id = article.get('ownerId', '')
        requester_id = user_info.get('id', '')
        role = user_info.get('role', '')
        organization = user_info.get('organization', '')
        
        # 기사 소유자 또는 관리자만 접근 허용
        if owner_id != requester_id and role != 'admin':
            logger.warning(
                f"[ARTICLE] 권한 없음: 요청자={requester_id}, 소유자={owner_id}, " +
                f"요청자역할={role}"
            )
            return {
                'statusCode': 403,
                'headers': headers,
                'body': json.dumps({'error': '권한이 없습니다'})
            }
        
        logger.info(f"[ARTICLE] 기사 버전 조회 성공: versionId={version_id}")
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(article, default=str)
        }
    except Exception as e:
        logger.error(f"[ARTICLE] 기사 버전 조회 실패: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': f'기사 버전 조회 실패: {str(e)}'})
        }