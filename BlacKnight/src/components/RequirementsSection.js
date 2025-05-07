// src/components/RequirementsSection.js
import React, { useState, useEffect } from "react";
import { Form, Button, Spinner } from "react-bootstrap";

const RequirementsSection = ({
  onGenerateArticle,
  isLoading,
  defaultOrganization = "",
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

  // 사용자 조직이 변경되면 폼 값도 업데이트
  useEffect(() => {
    if (defaultOrganization) {
      setOrganization(defaultOrganization);
    }
  }, [defaultOrganization]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onGenerateArticle({
      organization,
      project,
      company,
      keywords,
      additional,
    });
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
          disabled={isLoading}
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
    </>
  );
};

export default RequirementsSection;
