import axios from "axios";

// Lambda 함수 URL
const AI_LAMBDA_URL = process.env.REACT_APP_TEXT_AI_LAMBDA_URL;
const DB_LAMBDA_URL = process.env.REACT_APP_UPLOAD_ARTICLE_LAMBDA_URL;

// 로깅 유틸리티
const logger = {
  log: process.env.NODE_ENV === "production" ? () => {} : console.log,
  warn: process.env.NODE_ENV === "production" ? () => {} : console.warn,
  error: process.env.NODE_ENV === "production" ? () => {} : console.error,
};

// 기사 생성 API 호출
export const generateArticle = async (prompt) => {
  try {
    logger.log("기사 생성 API 요청 전송:", AI_LAMBDA_URL);
    logger.log("요청 데이터:", { prompt });

    const response = await axios.post(
      AI_LAMBDA_URL,
      { prompt },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        timeout: 30000,
      }
    );

    logger.log("API 응답 수신 완료");
    return response.data.output;
  } catch (error) {
    logger.error("generateArticle 오류:", error);

    if (error.response) {
      logger.error("응답 데이터:", error.response.data);
      logger.error("응답 상태:", error.response.status);
      throw new Error(
        `서버 오류 (${error.response.status}): ${
          error.response.data.message || "서버에서 오류가 발생했습니다."
        }`
      );
    } else if (error.request) {
      throw new Error(
        "서버에 연결할 수 없습니다. 네트워크 연결을 확인하거나 나중에 다시 시도하세요."
      );
    } else {
      throw new Error(`요청 오류: ${error.message}`);
    }
  }
};

// 기사 저장 API 호출
export async function saveArticleVersion({
  newsId,
  originId,
  ownerId,
  version,
  createdAt,
  content,
  description,
}) {
  const payload = {
    newsId,
    originId,
    ownerId,
    version,
    createdAt,
    content,
    description,
  };

  logger.log("saveArticleVersion 호출");
  logger.log("전송할 데이터:", JSON.stringify(payload, null, 2));
  logger.log("호출 대상 URL:", DB_LAMBDA_URL);

  try {
    const response = await axios({
      method: "POST",
      url: `${DB_LAMBDA_URL}?action=saveArticle&method=POST`,
      data: payload,
      headers: {
        "Content-Type": "application/json",
        Authorization: ownerId, // 사용자 인증용
      },
    });

    logger.log("기사 저장 API 응답:", response.data);
    return response.data;
  } catch (error) {
    logger.error("saveArticleVersion 오류:", error);
    throw error;
  }
}
