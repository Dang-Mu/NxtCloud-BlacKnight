import json
import boto3

# Bedrock runtime
bedrock_runtime = boto3.client(
    service_name="bedrock-runtime", region_name="ap-northeast-2"
)

def lambda_handler(event, context):
    try:
        # 디버깅용 로그
        print("이벤트 데이터:", event)
        
        # 요청 본문 파싱
        request_body = json.loads(event.get("body", "{}"))
        prompt = request_body.get("prompt")
        
        # 프롬프트 유효성 검사
        if not prompt:
            print("프롬프트가 없습니다.")
            return {
                "statusCode": 400,
                "body": json.dumps({"message": "프롬프트는 필수 항목입니다."}, ensure_ascii=False)
            }
        
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
        
        return {
            "statusCode": 200,
            "body": json.dumps(result, ensure_ascii=False)
        }
    except Exception as e:
        print("오류 발생:", str(e))
        return {
            "statusCode": 500,
            "body": json.dumps({"message": f"오류 발생: {str(e)}"}, ensure_ascii=False)
        }