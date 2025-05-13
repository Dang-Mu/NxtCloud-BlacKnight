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
s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

# 환경 변수
PDF_BUCKET = os.environ['PDF_BUCKET']
USERS_TABLE = os.environ['USERS_TABLE']
PDF_FILES_TABLE = os.environ['PDF_FILES_TABLE']
URL_EXPIRATION = 3600  # 1시간

def lambda_handler(event, context):
    """
    AWS Lambda 핸들러 함수 - PUT, DELETE, POST 요청 처리
    """
    # 요청 정보 로깅
    logger.info(f"[PUT] 수신된 이벤트: {json.dumps(event)}")
    
    try:
        headers = {
            'Content-Type': 'application/json'
        }

        # 요청에서 사용자 ID 가져오기
        user_id = event.get('headers', {}).get('authorization', '0')
        logger.info(f"[PUT] 요청 사용자 ID: {user_id}")
        
        # 사용자 정보 가져오기
        user_info = get_user_info(user_id)
        if not user_info:
            logger.warning(f"[PUT] 인증되지 않은 사용자: {user_id}")
            return {
                'statusCode': 401,
                'headers': headers,
                'body': json.dumps({'error': '인증되지 않은 사용자입니다'})
            }

        logger.info(f"[PUT] 사용자 정보: {json.dumps(user_info)}")
        
        # 쿼리 파라미터에서 액션 가져오기
        query_params = event.get('queryStringParameters', {}) or {}

        # HTTP 메서드에 따라 다른 처리
        http_method = query_params.get('method', '')
        action = query_params.get('action', '')
        logger.info(f"[PUT] HTTP 메서드: {http_method}, 요청 액션: {action}")

        # HTTP 메서드 및 액션에 따른 처리
        if http_method == 'GET':
            if action == 'getPresignedUrl':
                return generate_presigned_url(user_info, query_params, headers)
            elif action == 'getUploadedFile':
                return get_uploaded_file(user_info, query_params, headers)
            else:
                logger.warning(f"[PUT] 유효하지 않은 GET 액션: {action}")
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': '유효하지 않은 액션입니다'})
                }
        elif http_method == 'POST':
            if action == 'saveFileMetadata':
                # POST 요청 본문에서 파일 메타데이터 가져오기
                body = json.loads(event.get('body', '{}'))
                return save_file_metadata(user_info, body, headers)
            else:
                logger.warning(f"[PUT] 유효하지 않은 POST 액션: {action}")
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': '유효하지 않은 액션입니다'})
                }
        elif http_method == 'DELETE':
            if action == 'deleteFile':
                return delete_file(user_info, query_params, headers)
            else:
                logger.warning(f"[PUT] 유효하지 않은 DELETE 액션: {action}")
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': '유효하지 않은 액션입니다'})
                }
        else:
            logger.warning(f"[PUT] 지원하지 않는 HTTP 메서드: {http_method}")
            return {
                'statusCode': 405,
                'headers': headers,
                'body': json.dumps({'error': '지원하지 않는 HTTP 메서드입니다'})
            }

    except Exception as e:
        logger.error(f"[PUT] 오류 발생: {str(e)}", exc_info=True)
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
        logger.warning("[PUT] 사용자 ID가 0으로 설정됨")
        return None

    try:
        logger.info(f"[PUT] 사용자 정보 조회 시작: {user_id}")
        table = dynamodb.Table(USERS_TABLE)
        response = table.get_item(
            Key={'id': user_id}
        )
        
        user = response.get('Item')
        if user:
            logger.info(f"[PUT] 사용자 정보 조회 성공: {user.get('id')}, 조직: {user.get('organization')}")
        else:
            logger.warning(f"[PUT] 사용자 정보 없음: {user_id}")
            
        return user
    except Exception as e:
        logger.error(f"[PUT] 사용자 정보 조회 오류: {str(e)}", exc_info=True)
        return None

def generate_presigned_url(user_info, query_params, headers):
    """
    파일 업로드를 위한 pre-signed URL 생성
    """
    # 쿼리 파라미터 가져오기
    file_name = query_params.get('fileName', '')
    file_type = query_params.get('fileType', 'upload')
    is_public = query_params.get('isPublic', 'false').lower() == 'true'
    description = query_params.get('description', '')
    
    if not file_name:
        logger.warning("[PUT] 파일 이름이 제공되지 않음")
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': '파일 이름이 필요합니다'})
        }
    
    logger.info(f"[PUT] Pre-signed URL 생성 시작: 파일명={file_name}, 타입={file_type}, 공개={is_public}")
    
    try:
        # 파일 ID 생성 (UUID)
        file_id = str(uuid.uuid4())
        # S3 키 생성 (사용자ID/파일ID_파일명)
        organization = user_info.get('organization', 'no-org')
        user_id = user_info.get('id', 'unknown')
        s3_key = f"{user_id}/{file_id}_{file_name}"
        
        logger.info(f"[PUT] S3 키 생성: {s3_key}")
        
        # 현재 시간 (ISO 형식)
        created_at = datetime.now(timezone.utc).isoformat()
        # 파일 메타데이터 생성
        file_metadata = {
            'fileId': file_id,
            'fileName': file_name,
            'organization': organization,
            'ownerId': user_id,
            'isPublic': is_public,
            'description': description,
            's3Key': s3_key,
            'createdAt': created_at
        }
        
        logger.info(f"[PUT] 파일 메타데이터 생성: {json.dumps(file_metadata)}")
        
        # S3 업로드용 pre-signed URL 생성
        upload_url = s3.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': PDF_BUCKET,
                'Key': s3_key,
                'ContentType': 'application/pdf'
            },
            ExpiresIn=URL_EXPIRATION
        )
        
        logger.info(f"[PUT] 업로드 URL 생성 성공: 만료시간={URL_EXPIRATION}초")
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'uploadUrl': upload_url,
                'fileMetadata': file_metadata
            })
        }
    except Exception as e:
        logger.error(f"[PUT] Pre-signed URL 생성 실패: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': f'Pre-signed URL 생성 실패: {str(e)}'})
        }

def save_file_metadata(user_info, file_metadata, headers):
    """
    업로드된 파일의 메타데이터를 DynamoDB에 저장
    """
    if not file_metadata or not isinstance(file_metadata, dict):
        logger.warning("[PUT] 유효하지 않은 파일 메타데이터")
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': '유효한 파일 메타데이터가 필요합니다'})
        }
    
    file_id = file_metadata.get('fileId', '')
    if not file_id:
        logger.warning("[PUT] 파일 ID가 제공되지 않음")
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': '파일 ID가 필요합니다'})
        }
    
    logger.info(f"[PUT] 파일 메타데이터 저장 시작: fileId={file_id}")
    
    # 메타데이터에 사용자 ID와 조직 정보가 올바르게 설정되었는지 확인
    if file_metadata.get('ownerId') != user_info.get('id'):
        logger.warning(f"[PUT] 요청자 ID와 메타데이터의 소유자 ID가 불일치: {user_info.get('id')} vs {file_metadata.get('ownerId')}")
        return {
            'statusCode': 403,
            'headers': headers,
            'body': json.dumps({'error': '권한이 없습니다'})
        }
    
    try:
        # DynamoDB에 메타데이터 저장
        table = dynamodb.Table(PDF_FILES_TABLE)
        table.put_item(Item=file_metadata)
        
        logger.info(f"[PUT] 메타데이터 저장 성공: fileId={file_id}")
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'success': True, 'fileId': file_id})
        }
    except Exception as e:
        logger.error(f"[PUT] 메타데이터 저장 실패: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': f'메타데이터 저장 실패: {str(e)}'})
        }

def get_uploaded_file(user_info, query_params, headers):
    """
    업로드된 파일에 대한 서명된 URL 생성 (get_template과 동일)
    """
    file_id = query_params.get('fileId', '')
    if not file_id:
        logger.warning("[PUT] 파일 ID가 제공되지 않음")
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': '파일 ID가 필요합니다'})
        }
    
    logger.info(f"[PUT] 업로드된 파일 정보 조회 시작: fileId={file_id}")

    # DynamoDB에서 파일 메타데이터 조회
    file_metadata = get_file_metadata(file_id)
    if not file_metadata:
        logger.warning(f"[PUT] 파일 메타데이터 없음: fileId={file_id}")
        return {
            'statusCode': 404,
            'headers': headers,
            'body': json.dumps({'error': '파일을 찾을 수 없습니다'})
        }
    
    logger.info(f"[PUT] 파일 메타데이터 조회 성공: fileName={file_metadata.get('fileName')}")

    # 접근 권한 확인
    if not can_access_file(user_info, file_metadata):
        logger.warning(
            f"[PUT] 파일 접근 권한 없음: 사용자={user_info.get('id')}, " +
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
    logger.info(f"[PUT] S3 객체 조회 시작: 버킷={PDF_BUCKET}, 키={s3_key}")

    # 파일이 존재하는지 확인
    try:
        s3.head_object(
            Bucket=PDF_BUCKET,
            Key=s3_key
        )
        logger.info(f"[PUT] S3 객체 존재 확인 성공: 키={s3_key}")
    except Exception as e:
        logger.error(f"[PUT] S3 객체 조회 실패: {str(e)}", exc_info=True)
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
        logger.info(f"[PUT] 서명된 URL 생성 성공: 만료시간={URL_EXPIRATION}초")
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'url': url, 'metadata': file_metadata})
        }
    except Exception as e:
        logger.error(f"[PUT] 서명된 URL 생성 실패: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': f'서명된 URL 생성 실패: {str(e)}'})
        }

def delete_file(user_info, query_params, headers):
    """
    파일 삭제
    """
    file_id = query_params.get('fileId', '')
    if not file_id:
        logger.warning("[PUT] 파일 ID가 제공되지 않음")
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': '파일 ID가 필요합니다'})
        }
    
    logger.info(f"[PUT] 파일 삭제 시작: fileId={file_id}")

    # DynamoDB에서 파일 메타데이터 조회
    file_metadata = get_file_metadata(file_id)
    if not file_metadata:
        logger.warning(f"[PUT] 파일 메타데이터 없음: fileId={file_id}")
        return {
            'statusCode': 404,
            'headers': headers,
            'body': json.dumps({'error': '파일을 찾을 수 없습니다'})
        }
    
    logger.info(f"[PUT] 파일 메타데이터 조회 성공: fileName={file_metadata.get('fileName')}")

    # 삭제 권한 확인 (파일 소유자 또는 관리자만 삭제 가능)
    user_id = user_info.get('id', '')
    role = user_info.get('role', '')
    owner_id = file_metadata.get('ownerId', '')
    organization = user_info.get('organization', '')
    file_org = file_metadata.get('organization', '')
    
    if owner_id != user_id and (role != 'admin' or organization != file_org):
        logger.warning(
            f"[PUT] 파일 삭제 권한 없음: 사용자={user_id}, 소유자={owner_id}, " +
            f"사용자역할={role}, 사용자조직={organization}, 파일조직={file_org}"
        )
        return {
            'statusCode': 403,
            'headers': headers,
            'body': json.dumps({'error': '파일 삭제 권한이 없습니다'})
        }

    try:
        # S3 키 가져오기
        s3_key = file_metadata.get('s3Key', '')
        logger.info(f"[PUT] S3 객체 삭제 시작: 버킷={PDF_BUCKET}, 키={s3_key}")

        # S3에서 파일 삭제
        s3.delete_object(
            Bucket=PDF_BUCKET,
            Key=s3_key
        )
        logger.info(f"[PUT] S3 객체 삭제 성공: 키={s3_key}")

        # DynamoDB에서 메타데이터 삭제
        table = dynamodb.Table(PDF_FILES_TABLE)
        table.delete_item(
            Key={'fileId': file_id}
        )
        logger.info(f"[PUT] 메타데이터 삭제 성공: fileId={file_id}")
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'success': True, 'message': '파일이 성공적으로 삭제되었습니다'})
        }
    except Exception as e:
        logger.error(f"[PUT] 파일 삭제 실패: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': f'파일 삭제 실패: {str(e)}'})
        }

def get_file_metadata(file_id):
    """
    DynamoDB에서 파일 메타데이터 조회
    """
    try:
        logger.info(f"[PUT] 파일 메타데이터 조회 시작: fileId={file_id}")
        table = dynamodb.Table(PDF_FILES_TABLE)
        response = table.get_item(
            Key={'fileId': file_id}
        )
        
        item = response.get('Item')
        if item:
            logger.info(f"[PUT] 파일 메타데이터 조회 성공: fileName={item.get('fileName')}")
        else:
            logger.warning(f"[PUT] 파일 메타데이터 없음: fileId={file_id}")
            
        return item
    except Exception as e:
        logger.error(f"[PUT] 파일 메타데이터 조회 오류: {str(e)}", exc_info=True)
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
        f"[PUT] 파일 접근 권한 확인: 사용자={user_id}, 소유자={owner_id}, " +
        f"사용자조직={organization}, 파일조직={file_org}, " +
        f"사용자역할={role}, 공유={is_public}"
    )
    
    # 1. 파일 소유자인 경우
    if owner_id == user_id:
        logger.info(f"[PUT] 파일 접근 권한 있음 (소유자): 사용자={user_id}")
        return True

    # 2. 관리자이고 같은 조직의 파일인 경우
    if role == 'admin' and file_org == organization:
        logger.info(f"[PUT] 파일 접근 권한 있음 (관리자): 사용자={user_id}, 조직={organization}")
        return True

    # 3. 같은 조직이고 파일이 공개(isPublic)된 경우
    if file_org == organization and is_public:
        logger.info(f"[PUT] 파일 접근 권한 있음 (공유): 사용자={user_id}, 조직={organization}")
        return True

    logger.warning(f"[PUT] 파일 접근 권한 없음: 사용자={user_id}")
    return False