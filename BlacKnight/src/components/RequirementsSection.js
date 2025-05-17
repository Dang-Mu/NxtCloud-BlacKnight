// src/components/RequirementsSection.js
import React, { useState, useEffect } from "react";
import { Form, Button, Spinner } from "react-bootstrap";
import ArticleModal from "./ArticleModal";

// 로깅 유틸리티 추가
const logger = {
  log: process.env.NODE_ENV === "production" ? () => {} : console.log,
  warn: process.env.NODE_ENV === "production" ? () => {} : console.warn,
  error: process.env.NODE_ENV === "production" ? () => {} : console.error,
};

const RequirementsSection = ({
  onGenerateArticle,
  isLoading,
  isDisabled, // 새로운 prop 추가
  defaultOrganization = "",
}) => {
  const [organization, setOrganization] = useState(
    defaultOrganization || "00대학교"
  );
  const [project, setProject] = useState("2025 클라우드 AI 연구 프로젝트");
  const [company, setCompany] = useState("넥스트클라우드");
  const [keywords, setKeywords] = useState(
    "클라우드, AI, 빅데이터, AWS, Bedrock"
  );
  const [additional, setAdditional] = useState(
    "00대학교 총장님 성함 000이 기사에 포함되어야합니다."
  );
  const [showModal, setShowModal] = useState(false);
  const [generatedArticle, setGeneratedArticle] = useState(null);

  // 사용자 조직이 변경되면 폼 값도 업데이트
  useEffect(() => {
    if (defaultOrganization) {
      setOrganization(defaultOrganization);
    }
  }, [defaultOrganization]);

  // 키워드 문자열을 배열로 변환하는 함수
  const parseKeywords = (keywordsString) => {
    if (!keywordsString || keywordsString.trim() === "") {
      return [];
    }

    // 쉼표(,)로 구분하여 배열로 변환하고 각 항목의 앞뒤 공백 제거
    return keywordsString
      .split(",")
      .map((keyword) => keyword.trim())
      .filter((keyword) => keyword !== ""); // 빈 문자열 제거
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // 키워드를 배열로 변환
    const keywordsArray = parseKeywords(keywords);

    // JSON으로 변환될 폼 데이터 객체 생성
    const formData = {
      organization,
      project,
      company,
      keywords: keywordsArray, // 배열로 변환된 키워드
      additional,
    };

    // JSON 문자열로 변환
    const jsonData = JSON.stringify(formData);

    logger.log("기사 생성 요청 (JSON):", jsonData);

    // 콜백 함수를 통해 생성된 기사를 받음
    // JSON 문자열과 원본 객체 둘 다 전달
    onGenerateArticle(jsonData, formData, (article) => {
      logger.log(
        "기사 생성 완료, 모달 표시:",
        article ? article.substring(0, 50) + "..." : "기사 없음"
      );
      setGeneratedArticle(article);
      setShowModal(true);
    });
  };

  const handleModalClose = () => {
    logger.log("모달 닫기");
    setShowModal(false);
  };

  const handleConfirm = () => {
    logger.log("기사 확인");
    setShowModal(false);
    // 필요한 경우 부모 컴포넌트에 확인 이벤트 전달
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
            disabled={isDisabled} // 작업 중일 때 입력 비활성화
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>사업명</Form.Label>
          <Form.Control
            type="text"
            value={project}
            onChange={(e) => setProject(e.target.value)}
            placeholder="예: AI 연구 프로젝트"
            disabled={isDisabled} // 작업 중일 때 입력 비활성화
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>업체명</Form.Label>
          <Form.Control
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="예: 넥스트클라우드"
            disabled={isDisabled} // 작업 중일 때 입력 비활성화
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>핵심 키워드</Form.Label>
          <Form.Control
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="예: 인공지능, 빅데이터, 머신러닝"
            disabled={isDisabled} // 작업 중일 때 입력 비활성화
          />
          <Form.Text className="text-muted">
            쉼표(,)로 구분하여 여러 키워드를 입력할 수 있습니다.
          </Form.Text>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>기타 추가 내용</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={additional}
            onChange={(e) => setAdditional(e.target.value)}
            placeholder="추가로 포함하고 싶은 내용을 자유롭게 작성해주세요. (예: 00대학교 총장님 성함 000이 기사에 포함되어야합니다.)"
            disabled={isDisabled} // 작업 중일 때 입력 비활성화
          />
        </Form.Group>

        <Button
          variant="primary"
          type="submit"
          disabled={isLoading || isDisabled} // isDisabled 추가
          className="mt-3"
        >
          {isLoading ? (
            <>
              <Spinner animation="border" size="sm" /> 기사 생성 중...
            </>
          ) : (
            "기사 생성"
          )}
        </Button>
      </Form>

      {/* 모달 컴포넌트 */}
      <ArticleModal
        show={showModal}
        onHide={handleModalClose}
        article={generatedArticle}
        onConfirm={handleConfirm}
      />
    </>
  );
};

export default RequirementsSection;
