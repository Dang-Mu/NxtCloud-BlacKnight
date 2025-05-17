import React, { useState, useEffect } from "react";
import { Modal, Button, Spinner } from "react-bootstrap";

const ArticleConfirmModal = () => {
  const [showModal, setShowModal] = useState(false);
  const [articleContent, setArticleContent] = useState("");
  const [onConfirm, setOnConfirm] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 이벤트 리스너 등록
    const handleShowModal = (event) => {
      setArticleContent(event.detail.article);
      setOnConfirm(() => event.detail.onConfirm);
      setShowModal(true);
    };

    window.addEventListener("showArticleConfirmModal", handleShowModal);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener("showArticleConfirmModal", handleShowModal);
    };
  }, []);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      if (onConfirm) {
        await onConfirm();
      }
      setShowModal(false);
    } catch (error) {
      console.error("기사 저장 중 오류 발생:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={showModal} onHide={() => setShowModal(false)}>
      <Modal.Header closeButton>
        <Modal.Title>기사 수정 확인</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>생성된 기사를 수정하시겠습니까?</p>
        <p>기사 내용 미리보기:</p>
        <div
          style={{
            maxHeight: "300px",
            overflow: "auto",
            padding: "10px",
            border: "1px solid #ddd",
            borderRadius: "5px",
          }}
        >
          {articleContent}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowModal(false)}>
          아니오
        </Button>
        <Button variant="primary" onClick={handleConfirm} disabled={loading}>
          {loading ? (
            <>
              <Spinner animation="border" size="sm" /> 저장 중...
            </>
          ) : (
            "예"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ArticleConfirmModal;
