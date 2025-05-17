import React, { useState, useEffect, useCallback } from "react";
import { Form, Button, Spinner } from "react-bootstrap";
import { v4 as uuidv4 } from "uuid"; // UUID 생성을 위한 라이브러리 추가
import { saveArticleToDatabase } from "../services/articleService";

const RequirementsSection = ({
  onGenerateArticle,
  isLoading,
  defaultOrganization = "",
  user, // user props 직접 받기
}) => {
  const [organization, setOrganization] = useState(
    defaultOrganization || "00대학교"
  );
  const [project, setProject] = useState("2024 클라우드 AI 연구 프로젝트");
  const [company, setCompany] = useState("넥스트클라우드");
  const [keywords, setKeywords] = useState(
    "클라우드, AI, 빅데이터, AWS, Bedrock"
  );
  const [additional, setAdditional] = useState(
    "00대학교 총장님 성함 000이 기사에 포함되어야합니다."
  );
  const [generatedArticle, setGeneratedArticle] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);

  // 사용자 인증 헤더 생성 함수
  const getAuthHeaders = useCallback(() => {
    if (!user) return {};
    return {
      authorization: user.token || user.id, // 토큰 우선, 토큰 없을 경우 ID 사용
    };
  }, [user]);

  // 사용자 조직이 변경되면 폼 값도 업데이트
  useEffect(() => {
    if (defaultOrganization) {
      setOrganization(defaultOrganization);
    } else if (user && user.organization) {
      setOrganization(user.organization);
    }
  }, [defaultOrganization, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const requirements = {
      organization,
      project,
      company,
      keywords,
      additional,
    };

    // 기사 생성 요청
    try {
      const article = await onGenerateArticle(requirements);
      setGeneratedArticle(article); // 생성된 기사 저장

      // 생성 후 바로 "기사 수정 확인" 모달 표시 (별도 컴포넌트에서 관리)
      const event = new CustomEvent("showArticleConfirmModal", {
        detail: {
          article,
          onConfirm: () => handleSaveArticle(article),
        },
      });
      window.dispatchEvent(event);
    } catch (error) {
      console.error("기사 생성 중 오류 발생:", error);
      alert("기사 생성 중 오류가 발생했습니다.");
    }
  };

  // DB에 기사 저장
  const handleSaveArticle = async (articleContent = generatedArticle) => {
    setSaveLoading(true);
    try {
      const newsId = uuidv4(); // 고유한 newsId 생성
      const userId = user ? user.id : 1; // 기본값으로 1 설정

      // 키워드를 배열로 변환
      const keywordsArray = keywords
        .split(",")
        .map((keyword) => keyword.trim());

      // 모든 요구사항을 포함하는 구조화된 객체
      const requirementsData = {
        organization,
        project,
        company,
        keywords: keywordsArray,
        additional,
      };

      const articleData = {
        newsId,
        articleId: newsId, // 첫 버전은 articleId와 newsId가 동일
        content: articleContent,
        ownerId: userId, // user.id 사용
        version: "1", // 첫 번째 버전
        description: JSON.stringify(requirementsData), // JSON 문자열로 저장
        createdAt: new Date().toISOString(), // 현재 시간
        isCurrent: true, // 활성화 상태
      };

      // 인증 헤더 생성 및 기사 저장
      await saveArticleToDatabase(articleData, getAuthHeaders());
      alert("기사가 성공적으로 저장되었습니다.");
    } catch (error) {
      console.error("기사 저장 중 오류 발생:", error);
      alert("기사 저장 중 오류가 발생했습니다.");
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <>
      <h3 className="text-gray font-italic section-header">요구사항 입력</h3>
      <hr className="divider-gray" />

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>기관/학교/조직/회사명</Form.Label>
          <Form.Control
            type="text"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            placeholder="예: 00대학교"
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>사업명</Form.Label>
          <Form.Control
            type="text"
            value={project}
            onChange={(e) => setProject(e.target.value)}
            placeholder="예: AI 연구 프로젝트"
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>업체명</Form.Label>
          <Form.Control
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="예: 넥스트클라우드"
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>핵심 키워드</Form.Label>
          <Form.Control
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="예: 인공지능, 빅데이터, 머신러닝"
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>기타 추가 내용</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={additional}
            onChange={(e) => setAdditional(e.target.value)}
            placeholder="추가로 포함하고 싶은 내용을 자유롭게 작성해주세요. (예: 00대학교 총장님 성함 000이 기사에 포함되어야합니다.)"
          />
        </Form.Group>

        <Button
          variant="primary"
          type="submit"
          disabled={isLoading || saveLoading}
          className="mt-3"
        >
          {isLoading ? (
            <>
              <Spinner animation="border" size="sm" /> 기사 생성 중...
            </>
          ) : saveLoading ? (
            <>
              <Spinner animation="border" size="sm" /> 저장 중...
            </>
          ) : (
            "기사 생성"
          )}
        </Button>
      </Form>

      {/* 저장 확인 모달은 제거하고, ArticleConfirmModal 컴포넌트를 별도로 관리 */}
    </>
  );
};

export default RequirementsSection;
