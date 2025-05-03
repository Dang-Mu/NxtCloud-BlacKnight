import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import knightLogo from '../assets/blacknight.png';

const Signup = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    organization: '',
    password: '',
    signupCode: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Check if all fields are filled
    const { email, name, organization, password, signupCode } = formData;
    if (!email || !name || !organization || !password || !signupCode) {
      setError('모든 필드를 입력해주세요.');
      setLoading(false);
      return;
    }

    // Validate email format
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(email)) {
      setError('유효하지 않은 이메일 형식입니다.');
      setLoading(false);
      return;
    }

    // Simulate API call - In a real app, this would validate the signup code and create a user
    setTimeout(() => {
      // Demo signup code
      if (signupCode === 'DEMO2025') {
        const userData = {
          id: '2',
          email,
          name,
          organization
        };
        onLogin(userData); // Log in the user immediately after signup
      } else {
        setError('유효하지 않은 가입 코드입니다.');
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="auth-form-container">
      <div className="auth-logo">
        <img src={knightLogo} alt="BlackNight Logo" />
      </div>
      
      <div className="card auth-form">
        <h2 className="auth-heading">BlackNight 회원가입</h2>
        <p className="auth-subheading">AI 기사 생성 및 수정 흑기사 서비스에 가입하세요</p>
        
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">이메일</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="name">이름</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="홍길동"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="organization">소속</label>
            <input
              type="text"
              id="organization"
              name="organization"
              value={formData.organization}
              onChange={handleChange}
              placeholder="00대학교"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="signupCode">가입 코드</label>
            <input
              type="text"
              id="signupCode"
              name="signupCode"
              value={formData.signupCode}
              onChange={handleChange}
              placeholder="XXXX0000"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <span className="spinner-small"></span>
            ) : (
              '회원가입'
            )}
          </button>
        </form>
        
        <div className="auth-footer">
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </div>
      </div>
      
      <div className="auth-note">
        <p>데모 가입 코드: DEMO2025</p>
      </div>
    </div>
  );
};

export default Signup;