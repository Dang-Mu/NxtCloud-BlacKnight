// src/components/ArticleModal.js
import React from "react";
import { Modal, Button, Alert } from "react-bootstrap";

const ArticleModal = ({ show, onHide, article, onConfirm, onEdit }) => {
  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      aria-labelledby="article-modal"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title id="article-modal">기사 확인</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="article-preview">
          {article ? (
            <div className="article-container">{article}</div>
          ) : (
            <Alert variant="secondary">생성된 기사가 없습니다.</Alert>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer className="justify-content-end">
        <Button variant="primary" onClick={onConfirm}>
          확인
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ArticleModal;
