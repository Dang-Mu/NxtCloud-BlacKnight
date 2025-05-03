import json
import boto3

# Bedrock runtime
bedrock_runtime = boto3.client(
    service_name="bedrock-runtime", region_name="ap-northeast-2"
)

def response_handler(err, res):
    return {
        "statusCode": "400" if err else "200",
        "body": json.dumps(res, ensure_ascii=False),
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",  # 모든 출처 허용 (개발용)
            "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
            "Access-Control-Allow-Methods": "OPTIONS,POST",
            "Access-Control-Max-Age": "86400"  # CORS 프리플라이트 캐시 (24시간)
        },
    }

def lambda_handler(event, context):
    # OPTIONS 요청 처리 (CORS 프리플라이트 요청)
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",  # 모든 출처 허용 (개발용)
                "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
                "Access-Control-Allow-Methods": "OPTIONS,POST",
                "Access-Control-Max-Age": "86400"  # CORS 프리플라이트 캐시 (24시간)
            },
            "body": json.dumps({"message": "CORS preflight request successful"})
        }
    
    try:
        # 디버깅용 로그
        print("이벤트 데이터:", event)
        
        # 요청 본문 파싱
        request_body = json.loads(event.get("body", "{}"))
        prompt = request_body.get("prompt")
        
        # 프롬프트 유효성 검사
        if not prompt:
            print("프롬프트가 없습니다.")
            return response_handler(True, {"message": "프롬프트는 필수 항목입니다."})
        
        print("프롬프트:", prompt[:100] + "..." if len(prompt) > 100 else prompt)
        
        # Bedrock API 요청 본문 구성
        body = json.dumps(
            {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 10000,
                "messages": [
                    {
                        "role": "user",
                        "content": [{"type": "text", "text": prompt}],
                    }
                ],
            }
        )
        
        # Bedrock API 호출
        print("Bedrock API 호출 시작")
        response = bedrock_runtime.invoke_model(
            modelId="anthropic.claude-3-haiku-20240307-v1:0",
            body=body,
        )
        
        # 응답 처리
        response_body = json.loads(response.get("body").read())
        print("Bedrock API 응답 수신 완료")
        
        # 결과 반환
        result = {
            "output": response_body["content"][0]["text"],
            "input_tokens": response_body["usage"]["input_tokens"],
            "output_tokens": response_body["usage"]["output_tokens"],
        }
        
        return response_handler(None, result)
    except Exception as e:
        print("오류 발생:", str(e))
        return response_handler(True, {"message": f"오류 발생: {str(e)}"})