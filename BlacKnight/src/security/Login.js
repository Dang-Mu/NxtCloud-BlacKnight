// src/components/Login.js
import React, { useState } from "react";
import {
  Form,
  Button,
  Alert,
  Container,
  Row,
  Col,
  Card,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/authService";

const Login = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // 실제 로그인 요청
      const userData = await loginUser(credentials);

      // 로그인 성공 시 상태 업데이트 및 리디렉션
      onLogin(userData);
      navigate("/");
    } catch (error) {
      setError(error.message || "로그인 중 오류가 발생했습니다.");
      console.error("로그인 오류:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={6}>
          <Card className="shadow-sm">
            <Card.Header className="bg-dark text-white text-center">
              <h2>BlacKnight</h2>
              <p className="mb-0">AI 기사 생성 서비스 로그인</p>
            </Card.Header>
            <Card.Body className="p-4">
              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>이메일</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={credentials.email}
                    onChange={handleChange}
                    placeholder="이메일 주소 입력"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>비밀번호</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={credentials.password}
                    onChange={handleChange}
                    placeholder="비밀번호 입력"
                    required
                  />
                </Form.Group>

                <div className="d-flex justify-content-between align-items-center">
                  <Form.Check
                    type="checkbox"
                    id="remember-me"
                    label="로그인 상태 유지"
                  />
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => navigate("/forgot-password")}
                  >
                    비밀번호 찾기
                  </Button>
                </div>

                <div className="d-grid gap-2 mt-4">
                  <Button variant="dark" type="submit" disabled={isLoading}>
                    {isLoading ? "로그인 중..." : "로그인"}
                  </Button>
                </div>
              </Form>

              <div className="text-center mt-3">
                <p className="mb-0">
                  계정이 없으신가요?{" "}
                  <Button
                    variant="link"
                    className="p-0"
                    onClick={() => navigate("/register")}
                  >
                    회원가입
                  </Button>
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;
