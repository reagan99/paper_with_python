import React, { useState } from 'react';
import {useEffect, useRef} from 'react';
import './Chatbot.scss';
import { Link } from 'react-router-dom';
import Nav from './components/Nav';

const api_key = process.env.REACT_APP_OPENAI_API_KEY; // API 키 환경 변수에서 로드
const isMobileDevice = () => {
  return /Mobi|Android/i.test(navigator.userAgent);
};

const Message = ({ isUser, text, type }) => {
  // URL을 찾아 하이퍼링크로 변환
  const formatLink = (text) => {
    const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#/%=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])|(\bwww\.[a-z0-9-]+\.[a-z0-9\/\-]+)/ig;
    return text.split(urlRegex).map((part, index) => {
      if (part && part.match(urlRegex)) {
        // URL이 'http' 또는 'https'로 시작하지 않는 경우에만 'http://' 추가
        const url = part.startsWith('http') ? part : `http://${part}`;
        return <a key={index} href={url} target="_blank" rel="noopener noreferrer">{part}</a>;
        
      } else {
        // URL이 아니면 일반 텍스트
        return part;
      }
    });
  };




  const formatText = (text) => {
    if (typeof text !== 'string') {
      // 만약 text가 문자열이 아니라면 적절하게 처리하세요 (예: 오류 메시지 반환 또는 다른 방식으로 처리)
      return <p>Error: 잘못된 텍스트 형식</p>;
    }
  
    return text.split(/(```.*?```)/gs).map((part, index) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        // 코드 블록 내의 줄바꿈을 <br />로 바꾸기
        const codeContent = part.slice(3, -3).replace(/\n/g, '<br />');
        return <pre key={index}><code dangerouslySetInnerHTML={{ __html: codeContent }} /></pre>;
      } else {
        // 일반 텍스트에서 줄바꿈 문자를 <br/>로 바꾸기
        const lines = part.split(/\n/).reduce((acc, line, lineIndex) => {
          if (line !== '') {
            acc.push(<span key={`${index}-${lineIndex}`}>{formatLink(line)}</span>);
          }
          acc.push(<br key={`br-${index}-${lineIndex}`} />);
          return acc;
        }, []);
  
        lines.pop();
        return lines;
      }
    });
  };
  

  // // 코드 블록, 문단 분리, URL 링크 처리 및 번호 목록 굵게 표시
  // const formatText = (text) => {
  //   return text.split(/(```.*?```)/gs).map((part, index) => {
  //     if (part.startsWith("```") && part.endsWith("```")) {
  //       return <pre key={index}><code>{part.slice(3, -3)}</code></pre>;
  //     } else {
  //       return part.split(/\n/).map((line, lineIndex) => {
  //         // 번호 목록 감지 및 굵게 표시
  //         if (line.match(/^\d+\./)) {
  //           return <p key={`${index}-${lineIndex}`}><strong>{formatLink(line)}</strong></p>;
  //         }
  //         return <p key={`${index}-${lineIndex}`}>{formatLink(line)}</p>;
  //       });
  //     }
  //   });
  // };

  const renderContent = () => {
    if (type === 'image') {
      return <img src={text} alt="Uploaded" style={{ maxWidth: '100%' }} />;
    } else {
      return formatText(text);
    }
  };

  return (
    <div className={`message ${isUser ? 'user' : 'gpt'}`}>
      {renderContent()}
    </div>
  );
};

const MessageList = ({ messages }) => {
    const messagesEndRef = useRef(null); // 스크롤 이동을 위한 ref 생성
  
    useEffect(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, [messages]);
  
    return (
      <div className="message-list">
        {messages.map((msg, index) => (
          <Message key={index} isUser={msg.isUser} text={msg.text} type={msg.type} />
        ))}
        <div ref={messagesEndRef} /> {/* 스크롤 이동을 위한 빈 div */}
      </div>
    );
  };

const TextInputBox = ({ onSendMessage, setInputType }) => {
  const [message, setMessage] = useState('');
  //const [inputType, setInputType] = useState('text'); // 입력 타입

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <div className="input-box">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
      />
      <button onClick={() => setInputType('image')} className="button">Switch to Image Upload</button>
      <SendButton onSend={handleSend} />
    </div>
  );
};

const ImageInputBox = ({ onSendImage, setInputType }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null); // 파일 입력 필드 참조 생성

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleSendImage = () => {
    if (selectedFile) {
      onSendImage(selectedFile);
      setSelectedFile(null); // 선택된 파일 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // 파일 입력 필드 초기화
      }
    }
  };

  return (
    <div className="input-box">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
      />    
      <button onClick={() => setInputType('text')} className="button">Switch to Text Input</button>
      <button onClick={handleSendImage} className="button">Send</button>
    </div>
  );
};



const SendButton = ({ onSend }) => (
  <button onClick={onSend} className="send-button">
    Send
  </button>
);

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // 로딩 상태
  const [summaries, setSummaries] = useState([]);
  const [shouldFetchSummary, setShouldFetchSummary] = useState(false);
  const [inputType, setInputType] = useState('text');
  const [serverData, setServerData] = useState(null);

  const sendLogToServer = async (messages) => {
   
    try {
        await fetch('http://127.0.0.1:8000/save-log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({messages})  // 수정된 부분
        });
    } catch (error) {
        console.error('Error sending log to server:', error);
    }
};


  const handleSendMessage = async (text) => {
    if (text.trim()) {
      const newMessages = [...messages, { text, isUser: true }];
      setMessages(newMessages);
      setIsLoading(true);
      
      const chatMessages = newMessages.slice(-2).map((m) => {
        if (m.isUser) {
          let content;
          if (m.text.length <= 10) {
            content = `${m.text}에 대해 짧은 답변을 생성해줘.`
          } else {
            content = `${m.text}에 대해 대답해줘. 답변이 길다면 1.~ 2.~ 이런 식으로 번호를 매겨줘. 가독성을 위해 문단을 구분해줘. 추천할 웹사이트가 있다면 링크를 추천해줘. 이 메시지에 대한 내용은 답변에 중복 생성하지 마.`;
          }
          return {
            role: 'user',
            content: content
          };
        } else {
          // GPT의 응답 메시지 (이 부분은 일반적으로 포함되지 않음)
          return {
            role: 'assistant',
            content: `${m.text}에 대해 친절하게 설명드리겠습니다.`
          };
        }
      });

      console.log({chatMessages});
      

      const sendChatMessagesToServer = async (chatMessages) => {
   
        try {
          const textData = chatMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n');
          const question = await fetch('http://127.0.0.1:8000/chat2', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text_data: textData }),
          });
      
          if (!question.ok) {
            throw new Error('서버 응답이 실패했습니다.');
          }
          
          const serverData = await question.json();
          console.log('서버 응답:', serverData);
          setServerData(serverData);
          return serverData;

        } catch (error) {
          console.error('서버와의 통신 중 오류 발생:', error.message);
          return null;
        }
      };

      try {
   
        const data = await sendChatMessagesToServer(chatMessages);
        console.log('서버 응답2:', data);
        console.log('데이터 타입:', typeof data);
        //const Textdata = JSON.stringify(data);
        //const rangchainAnswer= Textdata.replace('{"answer":"', '').replace('"}', '');
        const rangchainAnswer = data.answer ? data.answer : '답변이 없습니다.';
        console.log('추출된 답변:',rangchainAnswer);
        const updatedMessages = [...newMessages, { text: rangchainAnswer}];
        setMessages(updatedMessages);
        setShouldFetchSummary(true);

        const recentGPTMessage = updatedMessages; //log 저장
        await sendLogToServer(recentGPTMessage);

        localStorage.setItem('chatMessages', JSON.stringify([...newMessages, { text: rangchainAnswer }]));

        // 데스크톱 알림 기능이 있는지 확인하고, 데스크톱 환경인 경우에만 알림 표시
      if (!isMobileDevice() && typeof Notification !== 'undefined') {
        if (Notification.permission === 'granted') {
          new Notification("새로운 메시지가 도착했습니다.", {
            body: data.choices[0].message.content,
            icon: '/path/to/icon.png'
          });
        }
        }
 
    } catch (error) {
      console.error('Error sending message:', error);
    }

    setIsLoading(false);
  }
};

  const lastMessage = messages[messages.length -1]?.text;

  const fetchSummary = async () => {
    setSummaries(prevSummaries => [...prevSummaries, {loading: true, text: "요약을 생성중입니다.."}]);
    const summaryMessages = [{
      role: 'assistant',
      content: `${lastMessage}를 3 문장 이내로 요약해줘.`
    }];
  
    const summaryRequestBody = {
      model: "ft:gpt-3.5-turbo-0613:shinkisa::8Wn3OFbA",
      //model: "gpt-4",
      messages: summaryMessages,
      //max_tokens: 150,
    };

    try {
      const summaryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: "Bearer "+ api_key,
        },
        body: JSON.stringify(summaryRequestBody),
      });

      const summaryData = await summaryResponse.json();

      if (summaryData.choices && summaryData.choices.length > 0 && summaryData.choices[0].message) {
        // 요약 상태 업데이트
        setSummaries(prevSummaries => {
          const updatedSummaries = prevSummaries.map((summary, index) => 
            index === prevSummaries.length - 1 
              ? { loading: false, text: summaryData.choices[0].message.content }
              : summary
          );
          // 로딩 메시지를 제외한 상태를 로컬 스토리지에 저장
          localStorage.setItem('chatSummaries', JSON.stringify(updatedSummaries.filter(s => !s.loading)));
          return updatedSummaries;
        });
      } else{
        console.error('Invalid response from summary API:',summaryData);
      }
    } catch(error){
      console.error('Error sending summary Message: ',error);
    }
  };

  const handleImageUpload = async (file) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      const imageURL = reader.result;
      const newMessage = {
        text: imageURL, // 이미지의 Data URL
        isUser: true,
        type: 'image'
      };
      const updatedMessages = [...messages, newMessage];

      try {
        localStorage.setItem('chatMessages', JSON.stringify(updatedMessages));
      } catch (error) {
        if(error.name === 'QuotaExceededError'){
          console.error('로컬 스토리지 용량 초과:',error);
          const fallbackMessage = {
            text: 'image', // 이미지 URL 대신 'image' 문자열 저장
            isUser: true,
            type: 'text'
          };
          const fallbackMessages = [...messages, fallbackMessage];
          localStorage.setItem('chatMessages', JSON.stringify(fallbackMessages));
          setMessages(fallbackMessages);

          const recentfallbackMessage = fallbackMessages.slice(-1)[0]; //log 저장
          await sendLogToServer(recentfallbackMessage);
        } else {
          console.error('Error while saving to localStorage:', error);
        }
      }

      setMessages(updatedMessages);
      //localStorage.setItem('chatMessages', JSON.stringify(updatedMessages));
      setIsLoading(true);

      const requestBody = {
        model: "gpt-4-vision-preview",
        messages: [
          {
            "role": "user",
            "content": [
              {"type": "text", "text": "이 이미지에 대해서 300자 이내로 간단히 설명해줘. 만약 code error에 관한 것이라면 해결법을 알려줘. 1.~, 2.~ 이렇게 번호를 매겨서 설명해줘. 가독성을 위해 문단을 구분해줘. 이 메시지에 대한 내용은 답변에 중복 생성하지 마."},
              {"type": "image_url", "image_url":{"url": imageURL}}
            ]
          }
        ], max_tokens: 500,
      };

      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${api_key}`
          },
          body: JSON.stringify(requestBody)
        });
  
        const data = await response.json();
        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
          setShouldFetchSummary(true);
          const descriptionMessage = {
            text: data.choices[0].message.content, 
            isUser: false,
            type: 'text' // 이 부분은 텍스트 메시지로 처리
          };
          setMessages(prevMessages => [...prevMessages, descriptionMessage]);
          localStorage.setItem('chatMessages', JSON.stringify([...updatedMessages, descriptionMessage]));     

          const recentGPTimageMessage = updatedMessages.slice(-1)[0]; //log 저장
          await sendLogToServer(recentGPTimageMessage);
        } else {
          console.error('Invalid response from the API:', data);
        }
      } catch (error) {
        console.error('Error sending image:', error);
      }
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const clearAll = () => {
    // 사용자에게 확인 요청
    const confirmClear = window.confirm("모든 대화 기록을 삭제하시겠습니까?");
  
    // 사용자가 '확인'을 누른 경우
    if (confirmClear) {
      setMessages([]);
      setSummaries([]);
  
      localStorage.removeItem('chatMessages');
      localStorage.removeItem('chatSummaries');
    }
  };

  useEffect(() => {
    // 대화 내용 로드
    const savedMessages = localStorage.getItem('chatMessages');
    if(savedMessages){
      setMessages(JSON.parse(savedMessages));
    } else {
      // 로컬 스토리지에 저장된 메시지가 없을 경우, 초기 메시지 설정
      const initialMessage = {
        text: "안녕하세요! 무엇을 도와드릴까요?",
        isUser: false,
        type: 'text'
      };
      setMessages([initialMessage]);
    }

    // 요약 카드 로드
    const savedSummaries = localStorage.getItem('chatSummaries');
    if (savedSummaries) {
      setSummaries(JSON.parse(savedSummaries));
    }
  }, []);
  
  useEffect(() => {
    if(!isMobileDevice()){
    if(Notification.permission === 'default'){
      Notification.requestPermission();
    } }
    if(shouldFetchSummary && messages.length > 0){
      const lastMessageText = messages[messages.length -1].text;
      fetchSummary(lastMessageText);
      setShouldFetchSummary(false);
    }
  }, [messages, shouldFetchSummary]);

  //loading animation
  const [loadingProgress, setLoadingProgress] = useState(0);
  useEffect(() => {
    let interval;
    if (isLoading) {
      setLoadingProgress(0);
      interval = setInterval(() => {
        setLoadingProgress(prev => {
          const nextProgress = prev + 0.1; // 작은 값으로 더 자주 업데이트
          if (nextProgress >= 100) {
            clearInterval(interval);
            return 100;
          }
          return nextProgress;
        });
      }, 50); // 50ms마다 실행하여 더 자주 업데이트
    } else {
      setLoadingProgress(0);
    }
  
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isLoading]);

  const LoadingOverlay = ({ isLoading, loadingProgress }) => {
    if (!isLoading) return null;
  
    const maskStyle = {
      transform: `translateY(${100 - loadingProgress}%)`
    };
  
    return (
      <div className="loading-overlay">
        <div className="loading-circle">
          <div className="loading-mask" style={maskStyle}></div>
          <span className="loading-text">{`${loadingProgress.toFixed(0)}%`}</span>
        </div>
        <div className="loading">답변을 열심히 생성중입니다. 잠시만 기다려주세요!</div>
      </div>
    );
  };


  return (
    <div>
      <Nav/>
      <div className="nav">
        <Link to="/">Home</Link>
        <br></br>
        <button onClick={clearAll} className="clear-button">Clean</button>
      </div>
      <div className="chatbot">
      <LoadingOverlay isLoading={isLoading} loadingProgress={loadingProgress} />

        <div className="chat-container">
          <MessageList messages={messages} />
          {inputType === 'text' ?
          <TextInputBox onSendMessage={handleSendMessage} setInputType={setInputType}/> :
          <ImageInputBox onSendImage={handleImageUpload} setInputType={setInputType}/>
        }
          
        </div>
        <div className="summary-container">
          {summaries.map((summary, index) => (
            <div className="summary" key={index}>
              <h4>GPT 답변 요약 - {index+1} </h4>
              <p>{summary.loading ? summary.text : summary.text}</p>
            </div>
          ))}
        </div>
      </div>    
    </div>
  );
};

export default Chatbot;
