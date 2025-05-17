// src/components/ModificationSection.js
import React, { useState } from "react";
import { Form, Button, Alert, Spinner } from "react-bootstrap";
import ModificationModal from "./ModificationModal";

// 로깅 유틸리티 추가
const logger = {
  log: process.env.NODE_ENV === "production" ? () => {} : console.log,
  warn: process.env.NODE_ENV === "production" ? () => {} : console.warn,
  error: process.env.NODE_ENV === "production" ? () => {} : console.error,
};

const ModificationSection = ({
  article,
  highlightedDiff,
  onModifyArticle,
  isLoading,
}) => {
  const [modificationRequest, setModificationRequest] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modifiedArticle, setModifiedArticle] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    logger.log("수정 요청:", modificationRequest);

    // 콜백 함수를 통해 수정된 기사를 받음
    onModifyArticle(modificationRequest, (updatedArticle) => {
      logger.log(
        "기사 수정 완료, 모달 표시:",
        updatedArticle ? updatedArticle.substring(0, 50) + "..." : "기사 없음"
      );
      setModifiedArticle(updatedArticle);
      setShowModal(true);
    });
  };

  const handleModalClose = () => {
    logger.log("모달 닫기");
    setShowModal(false);
  };

  const handleConfirm = () => {
    logger.log("수정된 기사 확인");
    setShowModal(false);
    // 필요한 경우 부모 컴포넌트에 확인 이벤트 전달
  };

  return (
    <>
      <h3 className="text-gray font-italic section-header">
        수정 요청 및 하이라이트된 변경사항
      </h3>
      <hr className="divider-gray" />

      {article ? (
        <Form onSubmit={handleSubmit}>
          <Form.Group>
            <Form.Label>수정 요청 사항을 입력하세요:</Form.Label>
            <Form.Control
              as="textarea"
              rows={5}
              value={modificationRequest}
              onChange={(e) => setModificationRequest(e.target.value)}
            />
          </Form.Group>

          <Button
            variant="primary"
            type="submit"
            disabled={isLoading || !modificationRequest}
            className="mt-3"
          >
            {isLoading ? (
              <>
                <Spinner animation="border" size="sm" /> 수정 중...
              </>
            ) : (
              "수정 요청"
            )}
          </Button>

          {highlightedDiff && (
            <div
              className="highlighted-diff mt-4"
              dangerouslySetInnerHTML={{ __html: highlightedDiff }}
            />
          )}
        </Form>
      ) : (
        <Alert variant="info">기사를 먼저 생성해주세요.</Alert>
      )}

      {/* 모달 컴포넌트 */}
      <ModificationModal
        show={showModal}
        onHide={handleModalClose}
        article={modifiedArticle}
        onConfirm={handleConfirm}
      />
    </>
  );
};

export default ModificationSection;
