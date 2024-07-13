import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.scss';
import Nav from './components/Nav';
import Footer from './components/Footer';
import logo from './img/icon1.png';
import Modal from 'react-modal';

const modalStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    width: '600px',
    transform: 'translate(-50%, -50%)',
  },
};

const pdfUploadStyle = {
  textAlign: 'center',
  margin: '20px auto',
  maxWidth: '400px',
};

const inputFileStyle = {
  display: 'none',
};

const submitButtonStyle = {
  backgroundColor: '#4CAF50',
  color: 'white',
  padding: '10px 20px',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  margin: '10px 0',
};

const labelStyle = {
  backgroundColor: '#4CAF50',
  color: 'white',
  padding: '10px 20px',
  borderRadius: '5px',
  cursor: 'pointer',
};

const Home = () => {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [file, setFile] = useState(null);
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [count, setCount] = useState(0);
  const [wsMessage, setWsMessage] = useState('');

  const welcome_msg = "RAG 챗봇에 오신걸 환영합니다 🎈\n저는 여러분의 수업을 도와줄 챗봇 DAC라고 합니다.\n 잘 부탁드립니다 :)";

  useEffect(() => {
    const interval = setInterval(() => {
      setText((prev) => prev + welcome_msg[count]);
      setCount((prev) => prev + 1);
    }, 50);
    if (count === welcome_msg.length) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [count, welcome_msg]);

  useEffect(() => {
    const ws = new WebSocket('ws://127.0.0.1:8000/ws');

    ws.onmessage = (event) => {
      setWsMessage(event.data);
    };

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleEnter = () => {
    navigate('/chatbot');
  };

  const iCampus_link = "https://canvas.skku.edu/courses/46987";

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleFileUpload = async (event) => {
    event.preventDefault();

    const formData = new FormData();
    formData.append("files", file);

    try {
      const response = await fetch("http://127.0.0.1:8000/upload/", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("파일 업로드에 실패했습니다.");
      }

      console.log("파일이 성공적으로 업로드되었습니다.");
    } catch (error) {
      console.error("파일 업로드 오류:", error.message);
    }
  };

  return (
    <div>
      <Nav />
      <div className="home-container">
        <div className="logo">
          <img className='logoImage' src={logo} width='450' height='450' />
        </div>
        <div className="welcome-message">{text}</div>
        <div className='table'>
          <button className="enter-button" onClick={() => { window.open(iCampus_link); }}>i-Campus</button>
          <button className="enter-button" onClick={() => setModalIsOpen(true)}>입장하기</button>
        </div>
        <Footer />
      </div>
      <Modal isOpen={modalIsOpen} onRequestClose={() => setModalIsOpen(false)} style={modalStyles}>
        <div className='modal-container'>
          <Nav />
          <div style={pdfUploadStyle}>
            <form encType="multipart/form-data" onSubmit={handleFileUpload}>
              <label htmlFor="file" style={labelStyle}>PDF 파일 선택</label><br />
              <input type="file" id="file" name="files" accept=".pdf" onChange={handleFileChange} style={inputFileStyle} />
              <input type="submit" value="업로드" style={submitButtonStyle} />
            </form>
          </div>
          <div className='button-area'>
            <button className="enter-button" onClick={() => setModalIsOpen(false)}>Back</button>
            <button className="enter-button" onClick={handleEnter}>Start</button>
          </div>
        </div>
        {wsMessage && <p>{wsMessage}</p>}
      </Modal>
    </div>
  );
};

export default Home;
