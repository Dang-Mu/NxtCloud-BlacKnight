import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Login from './components/Login';
import Signup from './components/Signup';
import ArticleGenerator from './components/ArticleGenerator';
import './styles.css';

function App() {
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  
  // Load user from localStorage on initial render
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Save user to localStorage when it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  return (
    <Router>
      <div className={`app ${darkMode ? 'dark-mode' : 'light-mode'}`}>
        <Header 
          user={user} 
          onLogout={handleLogout} 
          darkMode={darkMode}
          toggleTheme={toggleTheme}
        />
        <main className="main-content">
          <Routes>
            <Route 
              path="/" 
              element={user ? <ArticleGenerator user={user} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/login" 
              element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} 
            />
            <Route 
              path="/signup" 
              element={!user ? <Signup onLogin={handleLogin} /> : <Navigate to="/" />} 
            />
          </Routes>
        </main>
        <footer className="footer">
          <p>&copy; 2025 BlackNight (흑기사) - AI 기사 생성 및 수정</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;