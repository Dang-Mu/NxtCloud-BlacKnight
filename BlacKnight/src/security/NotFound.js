// src/components/NotFound.js
import React from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Container className="text-center mt-5">
      <Row className="justify-content-center">
        <Col md={6}>
          <h1 className="display-1">404</h1>
          <h2 className="mb-4">페이지를 찾을 수 없습니다</h2>
          <p className="lead mb-4">
            요청하신 페이지가 존재하지 않거나 다른 주소로 이동되었습니다.
          </p>
          <Button variant="dark" size="lg" onClick={() => navigate("/")}>
            홈으로 돌아가기
          </Button>
        </Col>
      </Row>
    </Container>
  );
};

export default NotFound;
