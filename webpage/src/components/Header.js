import React from 'react';
import { Link } from 'react-router-dom';
import knightLogo from '../assets/blacknight.png'; // You'll need this image asset

const Header = ({ user, onLogout, darkMode, toggleTheme }) => {
  return (
    <header className="header">
      <div className="logo">
        <img src={knightLogo} alt="BlackNight Logo" />
        <h1>Black<span>Knight</span> <small>흑기사</small></h1>
      </div>
      
      <div className="header-nav">
        <label className="theme-toggle">
          <input 
            type="checkbox"
            checked={darkMode}
            onChange={toggleTheme}
          />
          <span className="slider"></span>
        </label>
        
        {user ? (
          <>
            <span>안녕하세요, {user.name}님</span>
            <button className="btn btn-outline" onClick={onLogout}>
              로그아웃
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-outline">로그인</Link>
            <Link to="/signup" className="btn btn-primary">회원가입</Link>
          </>
        )}
      </div>
    </header>
  );
};