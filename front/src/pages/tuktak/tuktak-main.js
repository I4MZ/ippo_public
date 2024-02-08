import { useState, useCallback, useEffect, useRef } from "react";
import TuktakStopModal from "../../components/tuktak-stop-modal";
import PortalPopup from "../../components/portal-popup";
import { useNavigate } from 'react-router-dom';
import VoiceRecorder from "../../components/voice-recorder";
import './tuktak_main.css';
import './ScrollbarStyles.css';


const TuktakMain = () => {
  const [userInput, setUserInput] = useState('');
  const [userMessages, setUserMessages] = useState([]); // 사용자 메시지를 저장
  const [conversation, setConversation] = useState([]); // To store the overall conversation
  const [isTuktakStopModalPopupOpen, setTuktakStopModalPopupOpen] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const chatEndRef = useRef(null);
  const navigate = useNavigate(); // useHistory 대신 useNavigate 사용
  const [audioBlob, setAudioBlob] = useState(null); // 새로운 상태 변수 추가
  const REACT_APP_TO_TUKTAK = process.env.REACT_APP_TO_TUKTAK;

  const onTuktakMainContainerClick = useCallback(() => {
    // Please sync "뚝딱동화1-1-2" to the project
  }, []);

  const openTuktakStopModalPopup = useCallback(() => {
    setTuktakStopModalPopupOpen(true);
  }, []);

  const closeTuktakStopModalPopup = useCallback(() => {
    setTuktakStopModalPopupOpen(false);
  }, []);

  const questions = [
    "  안녕 반가워 포포와 함께하는 신나는 동화만들기 시간이야 포포!", 
    "  최근에 행복했던 일이 있었다면 이야기 해줄 수 있어?",
    "  최근에 속상했던 일이 있었다면 이야기 해줄 수 있어?",
    "  최근에 무서웠던 일이 있었다면 이야기 해줄 수 있어?",
    "  친구의 이야기는 충분히 들은거 같아, 이제 같이 동화를 만들러 가볼까 포포?"
  ]; 

  const displayMessageCharByChar = (message) => {
    let index = 0;
    const chars = message.trim().split(''); // 문자열 앞뒤 공백을 제거합니다.
    let messageInProgress = '';

    const outputChar = () => {
      if (index < chars.length) {
        messageInProgress += chars[index];
        // 기존 대화에 새로운 문자를 추가하지 않고, 현재 진행 중인 메시지만 업데이트합니다.
        setConversation(prev => prev.length > 0 ? 
          [...prev.slice(0, prev.length - 1), { sender: 'bot', message: messageInProgress }] :
          [{ sender: 'bot', message: messageInProgress }]);
        index++;
        if (index < chars.length) {
          setTimeout(outputChar, 110); // 다음 글자를 65ms 후에 출력합니다.
        }
      }
    };
    outputChar(); // 메시지 출력을 시작합니다.
  };
  
  useEffect(() => {
    if (questions.length > 0) {
      displayMessageCharByChar(questions[0]); // 첫 번째 질문 출력 시작
    }
  }, []);
  
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  // Scroll to bottom every time conversation updates
  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const handleInputChange = (e) => {
    setUserInput(e.target.value);
  };

  const handleStoryButton = () => {
    navigate('/tuktaktale', { state: { userMessages } }); // Navigate to tuktak-tale.js
  };

  const WS = useRef(null);

  const WS_URL = 'ws://ippo.live:8002/tuktak/ws'; // Add this line at the top of your component

  const handleEnterPress = (event) => {
    if (event.key === 'Enter') {
      handleSubmit(event);
    }
  };

  const handleAudioComplete = async (audioBlob) => {
      setAudioBlob(audioBlob);

      // Prepare the audio file to be sent to the server
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audioFile.wav');

      // POST request to the server
      try {
          const response = await fetch('/tuktak/record', {
              method: 'POST',
              body: formData,
          });

          if (!response.ok) {
              throw new Error('Network response was not ok');
          }

          // Assuming the server returns a JSON response with the transcript
          const data = await response.json();

          // You might want to do something with the transcript, like updating state
          // For example, append the transcript to the existing input or messages
          setUserInput(prevInput => prevInput + data.transcript.text);

          // Handle any additional logic here, like updating UI components
      } catch (error) {
          console.error('Error during audio upload:', error);
      }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim()) {
      console.error('Please enter a response.');
      return;
    }
  
    // Add user message to userMessages and conversation
    setUserMessages(prev => [...prev, userInput]);
    setConversation(prev => [...prev, { sender: 'user', message: userInput }]);
  
    // Start the WebSocket connection
    WS.current = new WebSocket(WS_URL);
  
    WS.current.onopen = () => {
      console.log('Connected to the WebSocket server');
      // Send the user's message to start the streaming session
      WS.current.send(JSON.stringify({ message: userInput }));
    };
    
    WS.current.onmessage = (event) => {
      // First check if the message is JSON (for the end_of_stream case)
      try {
        const data = JSON.parse(event.data);
        
        // If parsing succeeded and end_of_stream is present, handle the end of the stream
        if (data.end_of_stream) {
          WS.current.close(); // Close the WebSocket connection when the stream is complete

          // Process the end of the stream here
          if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            
            setConversation(prev => [...prev, { sender: 'bot', message: displayMessageCharByChar(questions[currentQuestionIndex + 1]) }]);
          }
        }
      } catch (e) {
        // If parsing fails, it's just a text message, not JSON
        // Add the text message to the conversation
        const msg = event.data;

        setConversation(prevMessages => {
            const lastMessage = prevMessages[prevMessages.length - 1];
            if (lastMessage && lastMessage.sender === 'bot') {
                return [
                    ...prevMessages.slice(0, -1),
                    { ...lastMessage, message: lastMessage.message + msg }
                ];
            } 
            return [...prevMessages, { sender: 'bot', message: msg }];
        });
      }  
    };
    
    WS.current.onclose = () => {
      console.log('Disconnected from the WebSocket server');
    };
  
    WS.current.onerror = (error) => {
      console.error('WebSocket Error: ', error);
    };
  
    setUserInput(''); // Clear the input field
  };

  return (
    <>
      <div className="tuktak-main flex flex-col justify-center items-end relative">
          <img
            className="tuktak_background"
            alt="tuktak_background image"
            src="/tuktak_background.png"
          />

          <img
            className="tuktak-stop-button absolute top-[82px] right-[102px] w-[6rem] h-[6rem] object-fit cursor-pointer"
            alt=""
            src="/delete-2@2x.png"
            onClick={openTuktakStopModalPopup}
          />

          <div className="chatContainer">
            {conversation.map((msg, index) => (
              <div key={index} className={`tuktak-message ${msg.sender === 'user' ? 'userMessage' : 'otherMessage'}`}>
                {msg.message}
              </div>
            ))}
            <div ref={chatEndRef} /> {/* Invisible element for auto-scrolling */}
          </div>          
          <div className="input-box mt-auto absolute bottom-[10rem] right-[15rem] w-[36.13rem] h-[4.56rem] text-[2.81rem] text-silver">
              {currentQuestionIndex < questions.length - 1 ? (
                <div className="flex-container">
                  <div class="tooltip">
                    <VoiceRecorder onRecordingComplete={handleAudioComplete} className="voice-btn"/>
                    <span class="tooltiptext" id="tooltipText">
                      버튼을 누르고 말을 한 뒤 다시 누르면 음성 녹음이 종료됩니다.
                    </span>
                  </div>
                  <input
                    type="text"
                    onChange={handleInputChange}
                    value={userInput}
                    onKeyDown={handleEnterPress}
                    className="tuktak_in"
                    placeholder="대화를 입력해주세요."
                  />
                </div>
              ) : (
                <button onClick={handleStoryButton} className="button-class">뚝딱동화 만들기</button>
              )}
          </div>
      </div>

      {isTuktakStopModalPopupOpen && (
        <PortalPopup
          overlayColor="rgba(113, 113, 113, 0.3)"
          placement="Centered"
          onOutsideClick={closeTuktakStopModalPopup}
        >
          <TuktakStopModal onClose={closeTuktakStopModalPopup} />
        </PortalPopup>
      )}
    </>
  );
};

export default TuktakMain;