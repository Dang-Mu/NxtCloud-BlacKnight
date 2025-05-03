// src/services/api.js
import axios from "axios";

// Lambda 함수 URL
const LAMBDA_URL = process.env.REACT_APP_LAMBDA_URL;

// 기사 생성 API 호출
export const generateArticle = async (prompt) => {
  try {
    // LAMBDA_URL이 설정되어 있지 않으면 오류 발생
    if (!LAMBDA_URL) {
      console.error(
        "LAMBDA_URL이 설정되지 않았습니다. .env 파일을 확인하세요."
      );
      throw new Error("API URL이 구성되지 않았습니다. 관리자에게 문의하세요.");
    }

    console.log("API 요청 전송:", LAMBDA_URL);
    console.log("요청 데이터:", { prompt });

    const response = await axios.post(LAMBDA_URL, { prompt });
    console.log("API 응답:", response);

    return response.data.output;
  } catch (error) {
    console.error("API 호출 오류:", error);

    // 오류 유형에 따른 메시지 설정
    if (error.response) {
      // 서버 응답을 받았지만 2xx 범위가 아닌 상태 코드
      console.error("응답 데이터:", error.response.data);
      console.error("응답 상태:", error.response.status);
      throw new Error(
        `서버 오류 (${error.response.status}): ${
          error.response.data.message || "서버에서 오류가 발생했습니다."
        }`
      );
    } else if (error.request) {
      console.error("요청 데이터:", error.request);
      // 요청은 전송되었지만 응답을 받지 못함
      throw new Error(
        "서버에 연결할 수 없습니다. 네트워크 연결을 확인하거나 나중에 다시 시도하세요."
      );
    } else {
      // 요청 설정 중 오류 발생
      throw new Error(`요청 오류: ${error.message}`);
    }
  }
};
