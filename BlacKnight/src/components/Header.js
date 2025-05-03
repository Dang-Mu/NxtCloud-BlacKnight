// src/components/Header.js
import React from "react";
import { Navbar, Nav, Container, Button, NavDropdown } from "react-bootstrap";
import { Link } from "react-router-dom";
import { logoutUser } from "../services/authService";

const Header = ({ user, onLogout }) => {
  const handleLogout = () => {
    logoutUser();
    if (onLogout) {
      onLogout();
    }
    // 페이지 새로고침하여 로그인 페이지로 리디렉션
    window.location.href = "/login";
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
      <Container>
        <Navbar.Brand as={Link} to="/">
          <span className="fw-bold">BlacKnight</span>
          <span className="ms-2 small">AI 기사 생성</span>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />

        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">
              홈
            </Nav.Link>
            {user?.role === "admin" && (
              <Nav.Link as={Link} to="/admin">
                관리자
              </Nav.Link>
            )}
          </Nav>

          <Nav>
            {user ? (
              <NavDropdown
                title={
                  <span>
                    <i className="bi bi-person-circle me-1"></i>
                    {user.username}
                  </span>
                }
                id="user-dropdown"
              >
                <NavDropdown.Item as={Link} to="/profile">
                  내 프로필
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/my-articles">
                  내 기사
                </NavDropdown.Item>
                {user.organization && (
                  <NavDropdown.Item disabled>
                    소속: {user.organization}
                  </NavDropdown.Item>
                )}
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>
                  로그아웃
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <>
                <Button
                  variant="outline-light"
                  as={Link}
                  to="/login"
                  className="me-2"
                >
                  로그인
                </Button>
                <Button variant="light" as={Link} to="/register">
                  회원가입
                </Button>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;
