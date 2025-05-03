// src/components/ModificationSection.js
import React, { useState } from "react";
import { Form, Button, Alert, Spinner } from "react-bootstrap";

const ModificationSection = ({
  article,
  highlightedDiff,
  onModifyArticle,
  isLoading,
}) => {
  const [modificationRequest, setModificationRequest] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onModifyArticle(modificationRequest);
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
    </>
  );
};

export default ModificationSection;
