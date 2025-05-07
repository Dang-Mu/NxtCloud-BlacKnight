import json
import os
import boto3
import logging

# 로깅 설정 - CloudWatch에 로그 출력
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# AWS 서비스 클라이언트 초기화
s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

# 환경 변수
PDF_BUCKET = os.environ['PDF_BUCKET']
USERS_TABLE = os.environ['USERS_TABLE']
PDF_FILES_TABLE = os.environ['PDF_FILES_TABLE']
URL_EXPIRATION = 3600  # 1시간

def lambda_handler(event, context):
    """
    AWS Lambda GET 핸들러 함수
    """
    # 요청 정보 로깅
    logger.info(f"[GET] 수신된 이벤트: {json.dumps(event)}")
    
    try:
        headers = {
            'Content-Type': 'application/json'
        }

        # 요청에서 사용자 ID 가져오기
        user_id = event.get('headers', {}).get('authorization', '0')
        logger.info(f"[GET] 요청 사용자 ID: {user_id}")
        
        # 사용자 정보 가져오기
        user_info = get_user_info(user_id)
        if not user_info:
            logger.warning(f"[GET] 인증되지 않은 사용자: {user_id}")
            return {
                'statusCode': 401,
                'headers': headers,
                'body': json.dumps({'error': '인증되지 않은 사용자입니다'})
            }

        logger.info(f"[GET] 사용자 정보: {json.dumps(user_info)}")

        # 쿼리 파라미터에서 액션 가져오기
        query_params = event.get('queryStringParameters', {}) or {}
        action = query_params.get('action', '')
        logger.info(f"[GET] 요청 액션: {action}")

        # 액션에 따라 처리
        if action == 'listTemplates':
            return list_templates(user_info, query_params, headers)
        elif action == 'getTemplate':
            return get_template(user_info, query_params, headers)
        elif action == 'getUploadedFile':
            return get_uploaded_file(user_info, query_params, headers)
        else:
            logger.warning(f"[GET] 유효하지 않은 액션: {action}")
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': '유효하지 않은 액션입니다'})
            }

    except Exception as e:
        logger.error(f"[GET] 오류 발생: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'error': f'서버 오류가 발생했습니다: {str(e)}'})
        }

def get_user_info(user_id):
    """
    사용자 정보 가져오기
    """
    if user_id == '0':
        logger.warning("[GET] 사용자 ID가 0으로 설정됨")
        return None

    try:
        logger.info(f"[GET] 사용자 정보 조회 시작: {user_id}")
        table = dynamodb.Table(USERS_TABLE)
        response = table.get_item(
            Key={'id': user_id}
        )
        
        user = response.get('Item')
        if user:
            logger.info(f"[GET] 사용자 정보 조회 성공: {user.get('id')}, 조직: {user.get('organization')}")
        else:
            logger.warning(f"[GET] 사용자 정보 없음: {user_id}")
            
        return user
    except Exception as e:
        logger.error(f"[GET] 사용자 정보 조회 오류: {str(e)}", exc_info=True)
        return None

def list_templates(user_info, query_params, headers):
    """
    사용자가 접근 가능한 템플릿 목록 가져오기
    """
    organization = user_info.get('organization', '')
    role = user_info.get('role', '')
    user_id = user_info.get('id', '')
    
    logger.info(f"[GET] 템플릿 목록 조회 시작: 사용자={user_id}, 조직={organization}, 역할={role}")

    table = dynamodb.Table(PDF_FILES_TABLE)
    
    try:
        if role == 'admin':
            # 관리자는 조직 내 모든 템플릿을 볼 수 있음
            logger.info(f"[GET] 관리자 권한으로 모든 템플릿 조회: 조직={organization}")
            response = table.scan(
                FilterExpression='organization = :org',
                ExpressionAttributeValues={
                    ':org': organization
                }
            )
        else:
            # 일반 사용자는 자신의 템플릿 + 조직 내 공유된 템플릿을 볼 수 있음
            logger.info(f"[GET] 일반 사용자 권한으로 템플릿 조회: 사용자={user_id}, 조직={organization}")
            response = table.scan(
                FilterExpression='organization = :org AND (ownerId = :userId OR isPublic = :isPublic)',
                ExpressionAttributeValues={
                    ':org': organization,
                    ':userId': user_id,
                    ':isPublic': True
                }
            )

        # 조회 결과 로깅
        items = response.get('Items', [])
        logger.info(f"[GET] 템플릿 조회 결과: {len(items)}개 항목 발견")
        
        # 클라이언트에 필요한 정보만 포함하여 반환
        templates = []
        for item in items:
            template = {
                'fileId': item.get('fileId', ''),
                'fileName': item.get('fileName', ''),
                'description': item.get('description', ''),
                'isPublic': item.get('isPublic', False),
                'isOwner': item.get('ownerId', '') == user_id,
                'createdAt': item.get('createdAt', '')
            }
            templates.append(template)
            logger.info(f"[GET] 템플릿 발견: ID={template['fileId']}, 이름={template['fileName']}")

        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'templates': templates})
        }
    except Exception as e:
        logger.error(f"[GET] 템플릿 목록 조회 오류: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': f'템플릿 목록 조회 실패: {str(e)}'})
        }

def get_template(user_info, query_params, headers):
    """
    템플릿 파일에 대한 서명된 URL 생성
    """
    file_id = query_params.get('fileId', '')
    if not file_id:
        logger.warning("[GET] 파일 ID가 제공되지 않음")
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': '파일 ID가 필요합니다'})
        }
    
    logger.info(f"[GET] 템플릿 정보 조회 시작: fileId={file_id}")

    # DynamoDB에서 파일 메타데이터 조회
    file_metadata = get_file_metadata(file_id)
    if not file_metadata:
        logger.warning(f"[GET] 파일 메타데이터 없음: fileId={file_id}")
        return {
            'statusCode': 404,
            'headers': headers,
            'body': json.dumps({'error': '파일을 찾을 수 없습니다'})
        }
    
    logger.info(f"[GET] 파일 메타데이터 조회 성공: fileName={file_metadata.get('fileName')}")

    # 접근 권한 확인
    if not can_access_file(user_info, file_metadata):
        logger.warning(
            f"[GET] 파일 접근 권한 없음: 사용자={user_info.get('id')}, " +
            f"파일소유자={file_metadata.get('ownerId')}, " +
            f"공유={file_metadata.get('isPublic')}"
        )
        return {
            'statusCode': 403,
            'headers': headers,
            'body': json.dumps({'error': '파일 접근 권한이 없습니다'})
        }

    # S3 키 가져오기
    s3_key = file_metadata.get('s3Key', '')
    logger.info(f"[GET] S3 객체 조회 시작: 버킷={PDF_BUCKET}, 키={s3_key}")

    # 파일이 존재하는지 확인
    try:
        s3.head_object(
            Bucket=PDF_BUCKET,
            Key=s3_key
        )
        logger.info(f"[GET] S3 객체 존재 확인 성공: 키={s3_key}")
    except Exception as e:
        logger.error(f"[GET] S3 객체 조회 실패: {str(e)}", exc_info=True)
        return {
            'statusCode': 404,
            'headers': headers,
            'body': json.dumps({'error': 'S3에서 파일을 찾을 수 없습니다'})
        }

    # 서명된 URL 생성
    try:
        url = s3.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': PDF_BUCKET,
                'Key': s3_key
            },
            ExpiresIn=URL_EXPIRATION
        )
        logger.info(f"[GET] 서명된 URL 생성 성공: 만료시간={URL_EXPIRATION}초")
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'url': url, 'metadata': file_metadata})
        }
    except Exception as e:
        logger.error(f"[GET] 서명된 URL 생성 실패: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': f'서명된 URL 생성 실패: {str(e)}'})
        }

def get_uploaded_file(user_info, query_params, headers):
    """
    업로드된 파일에 대한 서명된 URL 생성 (getTemplate과 동일)
    """
    logger.info(f"[GET] 업로드된 파일 조회: {json.dumps(query_params)}")
    return get_template(user_info, query_params, headers)

def get_file_metadata(file_id):
    """
    DynamoDB에서 파일 메타데이터 조회
    """
    try:
        logger.info(f"[GET] 파일 메타데이터 조회 시작: fileId={file_id}")
        table = dynamodb.Table(PDF_FILES_TABLE)
        response = table.get_item(
            Key={'fileId': file_id}
        )
        
        item = response.get('Item')
        if item:
            logger.info(f"[GET] 파일 메타데이터 조회 성공: fileName={item.get('fileName')}")
        else:
            logger.warning(f"[GET] 파일 메타데이터 없음: fileId={file_id}")
            
        return item
    except Exception as e:
        logger.error(f"[GET] 파일 메타데이터 조회 오류: {str(e)}", exc_info=True)
        return None

def can_access_file(user_info, file_metadata):
    """
    파일 접근 권한 확인
    """
    user_id = user_info.get('id', '')
    role = user_info.get('role', '')
    organization = user_info.get('organization', '')
    
    owner_id = file_metadata.get('ownerId', '')
    file_org = file_metadata.get('organization', '')
    is_public = file_metadata.get('isPublic', False)
    
    logger.info(
        f"[GET] 파일 접근 권한 확인: 사용자={user_id}, 소유자={owner_id}, " +
        f"사용자조직={organization}, 파일조직={file_org}, " +
        f"사용자역할={role}, 공유={is_public}"
    )
    
    # 1. 파일 소유자인 경우
    if owner_id == user_id:
        logger.info(f"[GET] 파일 접근 권한 있음 (소유자): 사용자={user_id}")
        return True

    # 2. 관리자이고 같은 조직의 파일인 경우
    if role == 'admin' and file_org == organization:
        logger.info(f"[GET] 파일 접근 권한 있음 (관리자): 사용자={user_id}, 조직={organization}")
        return True

    # 3. 같은 조직이고 파일이 공개(isPublic)된 경우
    if file_org == organization and is_public:
        logger.info(f"[GET] 파일 접근 권한 있음 (공유): 사용자={user_id}, 조직={organization}")
        return True

    logger.warning(f"[GET] 파일 접근 권한 없음: 사용자={user_id}")
    return False