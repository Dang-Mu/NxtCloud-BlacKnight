// src/services/articleService.js
import axios from "axios";

// 환경 변수로부터 API 엔드포인트를 가져오거나, 기본값을 사용
const API_ENDPOINT =
  process.env.REACT_APP_UPLOAD_ARTICLE_LAMBDA_URL || "/api/articles";

/**
 * 기사를 데이터베이스에 저장하는 함수
 * @param {Object} articleData - 저장할 기사 데이터
 * @param {string} articleData.newsId - 뉴스 ID (UUID)
 * @param {string} articleData.articleId - 기사 ID (UUID)
 * @param {string} articleData.content - 기사 내용
 * @param {string} articleData.ownerId - 사용자 ID
 * @param {string} articleData.version - 기사 버전
 * @param {string} articleData.description - 기사 설명
 * @param {string} articleData.createdAt - 생성 시간 (ISO 형식)
 * @param {boolean} articleData.isCurrent - 활성화 여부
 * @param {Object} authHeaders - 인증 헤더 (optional)
 * @returns {Promise<Object>} - 저장된 기사 데이터
 */
export const saveArticleToDatabase = async (articleData, authHeaders = {}) => {
  try {
    // API 요청 데이터 구조를 DB 스키마에 맞게 변환
    const dbData = {
      newsId: articleData.newsId,
      articleId: articleData.articleId,
      content: articleData.content,
      ownerId: articleData.ownerId,
      version: articleData.version,
      description: articleData.description,
      createdAt: articleData.createdAt,
      isCurrent: articleData.isCurrent,
    };

    // 인증 헤더 설정
    let headers = {
      "Content-Type": "application/json",
    };

    // 전달받은 authHeaders가 있으면 사용, 없으면 localStorage에서 토큰 가져오기
    if (Object.keys(authHeaders).length > 0) {
      headers = {
        ...headers,
        ...authHeaders,
      };
    } else {
      // 이전 방식 - localStorage에서 토큰 가져오기
      const token = localStorage.getItem("token");
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      } else {
        console.warn("인증 토큰이 없습니다. 인증 없이 요청을 진행합니다.");
      }
    }

    // API 호출을 통해 기사 저장
    const response = await axios.post(API_ENDPOINT, dbData, {
      headers: headers,
    });

    // 요청 성공 시 저장된 기사 데이터 반환
    return response.data;
  } catch (error) {
    // 오류 발생 시 콘솔에 로깅하고 예외 전파
    console.error("기사 저장 중 오류 발생:", error);
    throw error;
  }
};

/**
 * 특정 사용자의 모든 기사를 가져오는 함수
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Array>} - 기사 목록
 */
export const getUserArticles = async (userId) => {
  try {
    // 현재 사용자의 인증 토큰 가져오기
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("인증 토큰이 없습니다. 로그인이 필요합니다.");
    }

    // API 호출을 통해 사용자의 기사 목록 가져오기
    const response = await axios.get(`${API_ENDPOINT}/user/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // 요청 성공 시 기사 목록 반환
    return response.data;
  } catch (error) {
    // 오류 발생 시 콘솔에 로깅하고 예외 전파
    console.error("사용자 기사 조회 중 오류 발생:", error);
    throw error;
  }
};

/**
 * 특정 기사의 모든 버전을 가져오는 함수
 * @param {string} articleId - 기사 ID
 * @returns {Promise<Array>} - 기사 버전 목록
 */
export const getArticleVersions = async (articleId) => {
  try {
    // 현재 사용자의 인증 토큰 가져오기
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("인증 토큰이 없습니다. 로그인이 필요합니다.");
    }

    // API 호출을 통해 기사의 버전 목록 가져오기
    const response = await axios.get(`${API_ENDPOINT}/${articleId}/versions`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // 요청 성공 시 기사 버전 목록 반환
    return response.data;
  } catch (error) {
    // 오류 발생 시 콘솔에 로깅하고 예외 전파
    console.error("기사 버전 조회 중 오류 발생:", error);
    throw error;
  }
};

/**
 * 특정 기사 버전을 가져오는 함수
 * @param {string} versionId - 버전 ID
 * @returns {Promise<Object>} - 기사 버전 데이터
 */
export const getArticleVersion = async (versionId) => {
  try {
    // 현재 사용자의 인증 토큰 가져오기
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("인증 토큰이 없습니다. 로그인이 필요합니다.");
    }

    // API 호출을 통해 특정 버전의 기사 가져오기
    const response = await axios.get(`${API_ENDPOINT}/version/${versionId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // 요청 성공 시 기사 버전 데이터 반환
    return response.data;
  } catch (error) {
    // 오류 발생 시 콘솔에 로깅하고 예외 전파
    console.error("기사 버전 조회 중 오류 발생:", error);
    throw error;
  }
};
