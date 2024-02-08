import { useState, useCallback, useEffect, useRef, useContext } from "react";
import { useNavigate } from 'react-router-dom';
import GlimStopModal from "../../components/glim/glim-stop-modal";
import PortalPopup from "../../components/portal-popup";
import ChatComponent from "../../components/glim/glim-chat-component";
import ModalComponent from "../../components/glim/glim-modal";
import CameraComponent from "../../components/camera-component";
import { ChatContext } from '../../components/glim/chat-context';
import GlimKeywordComponent from "../../components/glim/glim-keyword-component";


import ImageUploader from "../../components/glim/glim-image-upload";
import VoiceRecorder from "../../components/voice-recorder";
import "../../static/glim/glim.css"
import "../../static/glim/common.css"

import { REQUEST_TO_GLIM_URL } from "../../config"
import { getHealthStatus } from "../../components/getHealthStatus";

const Glim = () => {
  const [isGlimStopModalPopupOpen, setGlimStopModalPopupOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const canvasRef = useRef(null); // canvas에 대한 참조 생성
  const ctx = useRef(null); // 캔버스의 컨텍스트에 대한 참조 생성
  const [isRangeActive, setIsRangeActive] = useState(false); // 상태 변수 생성
  const { sendChatCount, setSendChatCount } = useContext(ChatContext);
  const { selectedKeywords, setSelectedKeywords } = useContext(ChatContext);
  const [keywordsData, setKeywordsData] = useState(null);
  const [showKeywordsModal, setShowKeywordsModal] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null); // 새로운 상태 변수 추가
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isWaitingForImage, setIsWaitingForImage] = useState(false);
  const [showBottomBox, setShowBottomBox] = useState(false);


  

  const sendChat = () => {
    // 둘 중 하나라도 비어있지 않은 경우에만 전송
    if (!input.trim() && selectedKeywords.length === 0) return;

    // Combine keywords into a single string separated by '|'
    const keywordsString = selectedKeywords.join(',');

    // Construct the combined message
    const showMessages = `그림 단어: ${keywordsString}\n추가 문장: ${input.trim() ? input.trim() : ''
      }`;

    const combinedMessage = input.trim()
      ? `${keywordsString} | ${input.trim()}`
      : keywordsString;

    console.log(combinedMessage);

    // Add the user's message to the messages state immediately
    setMessages(prevMessages => [
      ...prevMessages,
      { text: showMessages, keywords: keywordsString, sender: 'user', gender: 'boy' }
    ]);

    // Create a new WebSocket connection to the /chat1 endpoint
    // const ws = new WebSocket(`ws://fastapi-glim-app:8000/chat`);
    const ws = new WebSocket(`ws://ippo.live:8000/glim/ws/chat/chapter${sendChatCount + 1}`);

    ws.onopen = () => {
      console.log('Connected to the server');
      // Send the combined message data once WebSocket connection is opened
      ws.send(JSON.stringify({ child_id: '1', child_name: '신우철', text: combinedMessage }));
    };


    ws.onmessage = (event) => {
      const rawMessage = event.data;
      // console.log(rawMessage);
      const processedMessage = processStreamingData(rawMessage, context);

      setMessages(prevMessages => updateMessagesWithProcessedData(prevMessages, processedMessage));
    };
    ws.onclose = () => {
      console.log('Disconnected from the server');
      getImage(context);
    };
    ws.onerror = (error) => {
      console.log('WebSocket Error: ', error);
    };

    setInput('');

    // 호출 횟수 증가
    setSendChatCount(prevCount => prevCount + 1);
    setShowKeywordsModal(false);
    setShowBottomBox(false);
  };

  // 사용 예
  let context = {
    inQuote: false,
    partialData: '',
    sceneDescription: '',
    sceneDescriptionStarted: false
  };

  function processStreamingData(data, context) {
    let result = '';
    let tempData = '';

    // "장면묘사" 이후 데이터 처리
    if (context.sceneDescriptionStarted) {
      context.sceneDescription += data;
      return '';
    }
    // "장면묘사" 시작 감지
    if (context.partialData.includes("장면묘사")) {
      context.sceneDescriptionStarted = true;
      context.partialData = '';
      return '';
    }

    // 특수 문자 처리
    for (let char of data) {
      if (char === '"') {
        if (!context.inQuote) {
          tempData += '\n\n"';
        } else {
          tempData += '"\n';
        }
        context.inQuote = !context.inQuote;
      } else {
        tempData += char;
      }
    }

    // 공백 처리 로직
    if (data.startsWith(' ')) {
      result += context.partialData; // 이전 단어를 결과에 추가
      context.partialData = tempData; // 새로운 단어 시작
    } else if (data.endsWith(' ')) {
      context.partialData += tempData; // 현재 단어 완성
      result += context.partialData; // 결과에 추가
      context.partialData = ''; // 초기화
    } else {
      context.partialData += tempData; // 현재 단어에 추가
    }

    return result;
  }

  // 메시지 업데이트 로직을 별도의 함수로 분리
  function updateMessagesWithProcessedData(prevMessages, processedMessage) {
    const lastMessage = prevMessages[prevMessages.length - 1];
    if (lastMessage && lastMessage.sender === 'bot') {
      return [
        ...prevMessages.slice(0, -1),
        { ...lastMessage, text: lastMessage.text + processedMessage }
      ];
    }
    return [...prevMessages, { text: processedMessage, sender: 'bot' }];
  }
  console.log(context.partialData);

  // POST 요청을 보내는 함수
  const getImage = async (contextData) => {
    console.log(sendChatCount);
    console.log(contextData);
    try {
      setIsWaitingForImage(true); // 이미지 요청 중임을 나타내는 상태를 true로 설정
      const response = await fetch(`/glim/generate_image/chapter${sendChatCount + 1}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sceneDescription: contextData.sceneDescription }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      // 이미지 데이터를 Blob 객체로 변환합니다.
      const blob = await response.blob();
      // Blob 객체를 URL로 변환합니다.
      const imageUrl = URL.createObjectURL(blob);
      console.log(imageUrl);
      // 이미지 URL을 상태에 저장합니다.
      setMessages(prevMessages => [...prevMessages, { sender: 'bot', imageUrl: imageUrl }]);
      setIsWaitingForImage(false); // 이미지를 받았으므로 상태를 false로 설정
      setSelectedKeywords([]); // Clear the selected keywords after image is fetched
    } catch (error) {
      console.error('Error fetching image:', error);
    }
  };

  let navigate = useNavigate();

  function handleNavigate() {
    navigate('/glim-fairytale', { state: { messages: messages } }); // 이동하고자 하는 경로
  }


  // 버튼 클릭 이벤트 핸들러
  const toggleRange = () => {
    setIsRangeActive(!isRangeActive);
  };

  // Range input 변경 이벤트 핸들러
  const handleRangeChange = (event) => {
    const size = event.target.value;
    if (ctx.current) {
      ctx.current.lineWidth = size;
    }
  };


  // canvas 기능
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    ctx.current = canvas.getContext('2d');
    canvas.width = 900;
    canvas.height = 900;

    let painting = false;

    const startPainting = (e) => {
      painting = true;
      draw(e);
    };

    const stopPainting = () => {
      painting = false;
      ctx.current.beginPath();
    };

    function draw(e) {
      if (!painting) return; // 그리기 상태가 아니면 그리지 않음

      const app = document.querySelector('#App');
      const zoomLevel = parseFloat(app.style.zoom) || 1;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / (rect.width * zoomLevel);
      const scaleY = canvas.height / (rect.height * zoomLevel);

      const x = (e.clientX - rect.left * zoomLevel) * scaleX;
      const y = (e.clientY - rect.top * zoomLevel) * scaleY;

      ctx.current.lineTo(x, y);
      ctx.current.stroke();
      ctx.current.beginPath();
      ctx.current.moveTo(x, y);
    }

    canvas.addEventListener('mousedown', startPainting);
    canvas.addEventListener('mouseup', stopPainting);
    canvas.addEventListener('mouseleave', stopPainting); // 캔버스를 벗어날 때도 그리기 중지
    canvas.addEventListener('mousemove', draw);

    return () => {
      canvas.removeEventListener('mousedown', startPainting);
      canvas.removeEventListener('mouseup', stopPainting);
      canvas.removeEventListener('mouseleave', stopPainting);
      canvas.removeEventListener('mousemove', draw);
    };
  }, []);


  // 캔버스 지우기 함수
  const clearCanvas = () => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  // 색상 선택 핸들러
  const handleColorChange = (color) => {
    if (ctx.current) {
      ctx.current.strokeStyle = color;
    }
  };

  const handleAudioComplete = async (audioBlob) => {
    setAudioBlob(audioBlob);

    // Prepare the audio file to be sent to the server
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audioFile.wav');

    // POST request to the server
    try {
      const response = await fetch(`/glim/record`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      // Assuming the server returns a JSON response with the transcript
      const data = await response.json();
      console.log(data); // Log the response

      // You might want to do something with the transcript, like updating state
      // For example, append the transcript to the existing input or messages
      setInput(prevInput => prevInput + data.transcript.text);

      // Handle any additional logic here, like updating UI components
    } catch (error) {
      console.error('Error during audio upload:', error);
    }
  };



  // 캔버스 이미지를 캡처하여 Blob 형태로 반환하는 함수
  const captureCanvasImage = () => {
    return new Promise((resolve, reject) => {
      const canvas = canvasRef.current;
      canvas.toBlob(blob => {
        resolve(blob); // Blob 객체를 반환
      }, 'image/png');
    });
  };


  const handleImageSubmit = async () => {
    // 캔버스 이미지 캡처
    const capturedImage = await captureCanvasImage();
    if (capturedImage) {
      // 이미지 전송 및 키워드 받기
      const keywords = await sendImageAndGetKeywords(capturedImage);

    }
    // Clear the canvas after the image has been sent
    clearCanvas();
  };

  // 이미지를 서버로 전송하고 키워드 받는 함수
  const sendImageAndGetKeywords = async (capturedImage) => {
    const formData = new FormData();
    formData.append('picture', capturedImage, 'canvasImage.png');

    try {
      const response = await fetch(`/glim/vision`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const imageData = await response.json();
        console.log(imageData);

        // 선택된 키워드를 대입
        setKeywordsData(imageData);
        setShowKeywordsModal(true); // 키워드 모달을 표시
        setShowBottomBox(true); // buttom line 표시 안함
        return imageData; // 가정: 응답에서 키워드가 'keywords' 필드에 있음
      } else {
        throw new Error('Failed to get response from the server');
      }
    } catch (error) {
      console.error('Error in sending image:', error);
    }
  };

  const onGlimContainerClick = useCallback(() => {
    // Please sync "그림동화  1-1" to the project
  }, []);

  const openGlimStopModalPopup = useCallback(() => {
    setGlimStopModalPopupOpen(true);
  }, []);

  const closeGlimStopModalPopup = useCallback(() => {
    setGlimStopModalPopupOpen(false);
  }, []);

  const [showCamera, setShowCamera] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // 카메라 컴포넌트를 표시하는 함수
  const handleCameraClick = () => {
    setShowCamera(true);
  };

  const drawImageOnCanvas = (imageUrl) => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const image = new Image();
    image.onload = () => {
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
    };
    image.src = imageUrl;
  };

  const [isImageUploaderOpen, setImageUploaderOpen] = useState(false);

  const openImageUploader = () => {
    setImageUploaderOpen(true);
  };
  const closeImageUploader = () => {
    setImageUploaderOpen(false);
  };

  // 버튼이 비활성화되어야 하는지 확인
  const isButtonDisabled = isWaitingForImage || sendChatCount >= 3;

  return (
    <div className="glim-main" onClick={onGlimContainerClick}>
      <div className="my-0 mx-[!important] absolute top-[0%] right-[0%] bottom-[0%] left-[0%] flex flex-row flex-wrap items-start justify-between">
        <img
          className="object-cover z-[0] background"
          alt=""
          src="/glim_back.webp"
        />
      </div>

      <div className="stop-button">
        <img
          className="stop-btn-img absolute w-[3.94rem] h-[3.94rem] object-fit cursor-pointer"
          alt=""
          src="/stopglimbutton@2x.png"
          onClick={openGlimStopModalPopup}
        />
      </div>

      {/* 수정 되는 그림북 */}
      <div className="glim-book">
        {/* chat-box, elements, drawing-board를 가로로 배치 */}
        <div className="top-row">
          <div className="chat-box">
            {/* 아래 값이 지속적으로 chat, user가 번갈아가며 요소를 쌓는다.  */}
            <ChatComponent
              onSend={sendChat}
              messages={messages}
              isLoading={isWaitingForImage}
              selectedKeywords={selectedKeywords}
            />
            {sendChatCount >= 3 && !isWaitingForImage && (
              <button
                className="end-button"
                onClick={() => {
                  handleNavigate();
                }}
              >
                내가 만든 동화 보러가기
              </button>
            )}
            {/* 키워드 모달을 조건부 렌더링 */}
            {showKeywordsModal && (
              <ModalComponent
                isOpen={showKeywordsModal}
                onClose={() => setShowKeywordsModal(false)}
                className="chat-box" // Pass a custom class name for styling
              >
                <GlimKeywordComponent
                  keywords={keywordsData}
                />
              </ModalComponent>
            )}
          </div>
          <div className="elements">
            <div className="element-india">
              <div className="element-round" />
            </div>
            <div className="element-darkturquoise">
              <div className="element-round" />
            </div>
            <div className="element-dodgerblue">
              <div className="element-round" />
            </div>
            <div className="element-india">
              <div className="element-round" />
            </div>
            <div className="element-darkturquoise">
              <div className="element-round" />
            </div>
          </div>

          <div className="drawing-board">
            <div className="button-container">
              {/* 내 사진 가져오기 버튼 */}
              <button
                type="button"
                className="upload-btn"
                onClick={openImageUploader}
              >
                <span className="upload-span">내 사진 가져오기</span>
              </button>
              {/* 카메라 버튼 */}
              <button
                type="button"
                className="camera-btn"
                onClick={() => setIsCameraOpen(true)}
              >
                <span className="camera-span">카메라 열기</span>
              </button>
              {/* 그리기 도구와 캔버스 */}
              <button
                type="reset"
                className="glim-reset-btn"
                onClick={clearCanvas}
              >
                <span className="reset-span">그림 지우기</span>
              </button>
            </div>
            <canvas ref={canvasRef} className="glim-canvas" />
          </div>
        </div>

        {/* resultbox와 palette를 가로로 배치 */}
        {showBottomBox && selectedKeywords.length > 0 && (
          <div className="bottom-row">
            {/* 음성 녹음 & 텍스트 */}
            <div className="result-box">
              <VoiceRecorder
                onRecordingComplete={handleAudioComplete}
                className="glim-voice-btn"
              />
              <div className="input-box">
                <input
                  type="text"
                  value={input}
                  placeholder="오른쪽 버튼을 눌러 동화 만들기!"
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      sendChat();
                    }
                  }}
                />
                <button
                  onClick={sendChat}
                  disabled={isButtonDisabled}
                  className="input-btn"
                >
                  <img className="send-img" src="/send-mail.png" />
                </button>
              </div>
            </div>
          </div>
        )}
        {!showBottomBox && (
          <button
            onClick={handleImageSubmit}
            disabled={isButtonDisabled}
            className="submit-img"
          >
            그림 제출
          </button>
        )}

        {/* 색상 선택 팔레트 */}
        {/* </div> */}
        <div className="palette">
          <button className="" onClick={toggleRange}>
            <img className="" alt="" src="/vector1.svg" />
          </button>

          <div className="controls">
            <div className="controls__colors">
              {[
                "black",
                "red",
                "orange",
                "yellow",
                "green",
                "blue",
                "navy",
                "purple",
              ].map((color) => (
                <div
                  key={color}
                  className="controls__color jsColor"
                  style={{ backgroundColor: color, marginRight: "2vw" }}
                  onClick={() => handleColorChange(color)} // 클릭 이벤트 핸들러 연결
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 조건부 렌더링: isRangeActive가 true일 때만 표시 */}
      {isRangeActive && (
        <div className="controls__range absolute">
          <input
            type="range"
            min="0.1"
            max="5.0"
            defaultValue="2.5"
            step="0.1"
            onChange={handleRangeChange}
          />
        </div>
      )}

      {isGlimStopModalPopupOpen && (
        <PortalPopup
          overlayColor="rgba(113, 113, 113, 0.3)"
          placement="Centered"
          onOutsideClick={closeGlimStopModalPopup}
        >
          <GlimStopModal onClose={closeGlimStopModalPopup} />
        </PortalPopup>
      )}
      {/* ImageUploader 컴포넌트를 ModalComponent로 감싸서 표시 */}
      <ModalComponent
        isOpen={isImageUploaderOpen}
        onClose={() => closeImageUploader(false)}
      >
        <ImageUploader
          onClose={() => closeImageUploader(false)}
          onImageProcessed={drawImageOnCanvas}
        />
      </ModalComponent>
      <ModalComponent
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
      >
        <CameraComponent
          onClose={() => setIsCameraOpen(false)}
          onImageProcessed={drawImageOnCanvas}
        />
      </ModalComponent>
    </div>
  );
};

export default Glim;
