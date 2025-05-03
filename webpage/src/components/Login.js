import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import knightLogo from '../assets/blacknight.png';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate API call - In a real app, this would be a fetch to your backend
    setTimeout(() => {
      // Demo login - this would be replaced with actual authentication logic
      if (email === 'demo@example.com' && password === 'password') {
        const userData = {
          id: '1',
          email: 'demo@example.com',
          name: '데모 사용자',
          organization: 'BlackNight 기사단'
        };
        onLogin(userData);
      } else {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
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
        <h2 className="auth-heading">BlackNight 로그인</h2>
        <p className="auth-subheading">AI 기사 생성 및 수정 흑기사에 오신 것을 환영합니다</p>
        
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
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
              '로그인'
            )}
          </button>
        </form>
        
        <div className="auth-footer">
          계정이 없으신가요? <Link to="/signup">회원가입</Link>
        </div>
      </div>
      
      <div className="auth-note">
        <p>데모 계정: demo@example.com / password</p>
      </div>
    </div>
  );
};

export default Login;