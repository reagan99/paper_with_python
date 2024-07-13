import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './Home';
import Chatbot from './Chatbot'; // Chatbot 컴포넌트를 이미 만들었다고 가정합니다.

const App = () => {
  return (
    <BrowserRouter> {/* 이 부분에서 'BrowserRouter'를 정의합니다. */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chatbot" element={<Chatbot />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;