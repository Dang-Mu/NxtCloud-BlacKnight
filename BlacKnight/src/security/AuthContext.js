// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from "react";

// Auth Context 생성
const AuthContext = createContext();

// Auth Context Hook
export function useAuth() {
  return useContext(AuthContext);
}

// Auth Provider 컴포넌트
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 로그인 함수
  async function login(email, password) {
    setError(null);

    try {
      // 예제 사용자 데이터 (실제로는 API 호출로 대체)
      const users = [
        {
          id: 1,
          email: "admin@example.com",
          password: "admin123",
          organization: "넥스트클라우드",
          role: "admin",
        },
        {
          id: 2,
          email: "user@example.com",
          password: "user123",
          organization: "00대학교",
          role: "user",
        },
      ];

      // 사용자 찾기
      const user = users.find(
        (user) => user.email === email && user.password === password
      );

      if (user) {
        // 전체 사용자 정보는 내부적으로 저장
        setCurrentUser(user);
        // 로컬 스토리지에도 저장
        localStorage.setItem("currentUser", JSON.stringify(user));
        return user;
      } else {
        throw new Error("이메일 또는 비밀번호가 잘못되었습니다");
      }
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }

  // 로그아웃 함수
  function logout() {
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
  }

  // 초기 로드 시 로그인 상태 확인
  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");

    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("로그인 정보 파싱 오류:", e);
        localStorage.removeItem("currentUser");
      }
    }

    setLoading(false);
  }, []);

  // 컨텍스트 값
  const value = {
    currentUser,
    login,
    logout,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
