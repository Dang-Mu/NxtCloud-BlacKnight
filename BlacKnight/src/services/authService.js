// src/services/authService.js

// 임시 사용자 데이터베이스 (실제로는 API 호출로 대체해야 함)
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

// 로컬 스토리지 키
const TOKEN_KEY = "blacknight_auth_token";
const USER_KEY = "blacknight_user";
const INVITE_CODE_KEY = "REACT_APP_INVITE_CODE";

// 로그인 함수
export const loginUser = async (credentials) => {
  // API 호출 시뮬레이션
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const { email, password } = credentials;

  // 사용자 찾기 (이메일로 검색)
  const user = users.find((u) => u.email === email);

  if (!user || user.password !== password) {
    throw new Error("이메일 주소 또는 비밀번호가 올바르지 않습니다.");
  }

  // 민감한 정보 제거
  const { password: _, ...safeUserData } = user;

  // 토큰 생성 (실제로는 JWT 같은 보안 토큰을 사용)
  const token = btoa(
    JSON.stringify({ userId: user.id, timestamp: Date.now() })
  );

  // 로컬 스토리지에 저장
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(safeUserData));

  return safeUserData;
};

// 회원가입 함수
export const registerUser = async (userData) => {
  // API 호출 시뮬레이션
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const { email, inviteCode } = userData;

  // 가입 코드 확인
  const validInviteCode = process.env.REACT_APP_INVITE_CODE;
  if (inviteCode !== validInviteCode) {
    throw new Error("유효하지 않은 가입 코드입니다.");
  }

  // 이메일 중복 확인
  if (users.some((u) => u.email === email)) {
    throw new Error("이미 사용 중인 이메일입니다.");
  }

  // 실제로는 서버에 사용자 등록 요청을 보내야 함
  // 여기서는 성공으로 가정하고 진행

  return { success: true };
};

// 로그아웃 함수
export const logoutUser = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

// 현재 로그인한 사용자 가져오기
export const getCurrentUser = () => {
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch (e) {
    console.error("사용자 정보 파싱 오류:", e);
    return null;
  }
};

// 인증 상태 확인
export const isAuthenticated = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  const user = getCurrentUser();

  if (!token || !user) return false;

  // 토큰 유효성 검사 (실제로는 JWT 검증 등을 수행)
  try {
    const decoded = JSON.parse(atob(token));

    // 예시: 24시간 이내 발급된 토큰만 유효하게 처리
    const isValid = Date.now() - decoded.timestamp < 24 * 60 * 60 * 1000;

    return isValid;
  } catch (e) {
    console.error("토큰 검증 오류:", e);
    return false;
  }
};
