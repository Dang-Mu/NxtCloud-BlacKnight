// src/components/Register.js
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

const Register = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    organization: "",
    inviteCode: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return false;
    }

    if (formData.password.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다.");
      return false;
    }

    // 가입 코드 검증
    if (!formData.inviteCode) {
      setError("가입 코드는 필수 입력 항목입니다.");
      return false;
    }

    // .env에 설정된 가입 코드와 비교
    if (formData.inviteCode !== process.env.REACT_APP_INVITE_CODE) {
      setError("유효하지 않은 가입 코드입니다.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // 회원가입 처리 로직
      // 여기서는 단순히 성공 메시지만 표시

      // 회원가입 성공
      setSuccess("회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      setError("회원가입 중 오류가 발생했습니다.");
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
              <h2>회원가입</h2>
              <p className="mb-0">BlacKnight AI 기사 생성 서비스</p>
            </Card.Header>
            <Card.Body className="p-4">
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>이메일 *</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="이메일 주소 입력"
                    required
                  />
                  <Form.Text className="text-muted">
                    이메일은 로그인 ID로 사용됩니다.
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>소속 기관/회사</Form.Label>
                  <Form.Control
                    type="text"
                    name="organization"
                    value={formData.organization}
                    onChange={handleChange}
                    placeholder="소속 기관 또는 회사명 입력"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>비밀번호 *</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="비밀번호 입력 (6자 이상)"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>비밀번호 확인 *</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="비밀번호 재입력"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>가입 코드 *</Form.Label>
                  <Form.Control
                    type="text"
                    name="inviteCode"
                    value={formData.inviteCode}
                    onChange={handleChange}
                    placeholder="가입 코드 입력"
                    required
                  />
                  <Form.Text className="text-muted">
                    서비스 이용을 위한 가입 코드를 입력해주세요.
                  </Form.Text>
                </Form.Group>

                <div className="d-grid gap-2 mt-4">
                  <Button variant="dark" type="submit" disabled={isLoading}>
                    {isLoading ? "처리 중..." : "가입하기"}
                  </Button>
                </div>
              </Form>

              <div className="text-center mt-3">
                <p className="mb-0">
                  이미 계정이 있으신가요?{" "}
                  <Button
                    variant="link"
                    className="p-0"
                    onClick={() => navigate("/login")}
                  >
                    로그인
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

export default Register;
