// src/components/ModificationModal.js
import React from "react";
import { Modal, Button, Alert } from "react-bootstrap";

const ModificationModal = ({ show, onHide, article, onConfirm, onEdit }) => {
  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      aria-labelledby="modification-modal"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title id="modification-modal">수정된 기사 확인</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="article-preview">
          {article ? (
            <div className="article-container">{article}</div>
          ) : (
            <Alert variant="warning">수정된 기사가 없습니다.</Alert>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer className="justify-content-end">
        <Button variant="primary" onClick={onConfirm}>
          적용
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModificationModal;
