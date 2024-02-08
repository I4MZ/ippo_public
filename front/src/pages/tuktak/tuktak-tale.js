import React, { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import TuktakStopModal from "../../components/tuktak-stop-modal";
import PortalPopup from "../../components/portal-popup";
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import './tuktak_tale.css';
import './ScrollbarStyles.css';

const TuktakTale = () => {
  const [currentChapter, setCurrentChapter] = useState(1);
  const [fullStory, setFullStory] = useState([]);
  const [chapterImages, setChapterImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState([]);
  const [interpretations, setInterpretations] = useState([]);
  const [isTuktakStopModalPopupOpen, setTuktakStopModalPopupOpen] = useState(false);
  const location = useLocation();
  const [fullInterpretations, setFullInterpretations] = useState([]);
  const REACT_APP_TO_SPRING = process.env.REACT_APP_TO_SPRING;
  const REACT_APP_TO_TUKTAK = process.env.REACT_APP_TO_TUKTAK;
  const [userMessages, setUserMessages] = useState(location.state.userMessages.slice(1, 4));
  const [currentImage, setCurrentImage] = useState(null);
  const [userChoices, setUserChoices] = useState([]); 
  const [streamedContent, setStreamedContent] = useState('');
  const [currentTitle, setCurrentTitle] = useState('');
  const [fullContents, setFullContents] = useState([]);
  const [buffer, setBuffer] = useState('');
  const [streamingComplete, setStreamingComplete] = useState(false);
  const [chapterAdded, setChapterAdded] = useState(false);
  const navigate = useNavigate();
  
  const onTuktakMainContainerClick = useCallback(() => {
    // Please sync "뚝딱동화1-1-2" to the project
  }, []);

  const openTuktakStopModalPopup = useCallback(() => {
    setTuktakStopModalPopupOpen(true);
  }, []);

  const closeTuktakStopModalPopup = useCallback(() => {
    setTuktakStopModalPopupOpen(false);
  }, []);

  const WS = useRef(null);
  const WS_URL = 'ws://ippo.live:8002/tuktak/tuktak_tale/ws'; // 웹소켓 서버 주소

  const createChapter = useCallback(async () => {
    if (currentChapter > 4 || chapterAdded) return; // 첫 세 챕터만 처리

    setChapterAdded(false); // 새 챕터가 아직 추가되지 않음을 표시
    setOptions([]); // 새 챕터 시작 전 선택지 초기화
    setCurrentImage(null);
    setCurrentTitle('');

    try {
        let topic, userChoice;

        if (currentChapter === 1) {
            topic = userMessages[0];
            userChoice = "이야기의 시작"; 
        } else if (currentChapter === 2) {
            topic = userMessages[1];
            userChoice = userChoices[userChoices.length - 1];
        } else if (currentChapter === 3) {
            topic = userMessages[2];
            userChoice = userChoices[userChoices.length - 1];
        } else {
            topic = "교훈적인 결말"; 
            userChoice = userChoices[userChoices.length - 1];
        }

        // 챕터 데이터 준비
        const chapterData = {
            chapter: currentChapter,
            topic: topic,
            user_input: userChoice,
            full_story: fullStory.map(story => story.content),
            conclusion: currentChapter === 4
        };

        WS.current = new WebSocket(WS_URL); // 웹소켓을 통해 챕터 데이터 전송

        WS.current.onopen = () => {
          console.log('Connected to the WebSocket server');
          WS.current.send(JSON.stringify(chapterData));
        };

        // 웹소켓 메시지 처리 로직 수정
        WS.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.message) {

              // 스트리밍된 내용을 streamedContent에 누적합니다.
              setBuffer(prevContent => prevContent + data.message);
              setCurrentChapter(currentChapter + 1);
            } else if (data.end_of_stream) {

              // 이후 필요한 상태 업데이트를 진행합니다.
              const newChapter = {
                title: data.chapter_title,
                content: data.chapter_content,
                options: data.options,
                interpretations: data.interpretations
              };

              setFullContents(prev => [...prev, newChapter]);
              setFullStory(prev => [...prev, newChapter]);
              setCurrentTitle(data.chapter_title);
              setOptions(data.options);
              setInterpretations(data.interpretations)
              setChapterAdded(true);

              WS.current.close();
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        WS.current.onclose = () => {
          console.log('Disconnected from the WebSocket server');
        };

        WS.current.onerror = (error) => {
          console.error('WebSocket Error: ', error);
        };

    } catch (error) {
    console.error('Error in chapter creation:', error);
    }

  }, [currentChapter, userMessages, userChoices, fullStory, interpretations]);

  // 버퍼에서 문자를 순차적으로 가져와 출력하는 로직
  useEffect(() => {
    if (buffer.length > 0) {
      const timer = setTimeout(() => {
        setStreamedContent(prevContent => prevContent + buffer.charAt(0));
        setBuffer(prevBuffer => prevBuffer.substring(1));
  
        // 버퍼가 비어있고, 마지막 문자가 streamedContent에 추가된 경우에만
        // 스트리밍 완료 상태를 true로 설정합니다.
        if (buffer.length === 1) {
          setStreamingComplete(true);
        }
      }, 120); // 여기서 120ms는 출력 간격을 의미합니다.
  
      return () => clearTimeout(timer);
    }
  }, [buffer, setStreamedContent]);

  // 선택지를 처리하는 함수
  const handleOptionSelection = useCallback((selectedOption) => {
    const optionIndex = options.findIndex(option => option === selectedOption);

    if (optionIndex !== -1) {
      const selectedInterpretation = interpretations[optionIndex];
      setUserChoices(prevChoices => [...prevChoices, selectedOption]);
      setFullStory(prevStory => [...prevStory, { type: 'choice', content: selectedOption }]);
      setFullInterpretations(prevInter => [...prevInter, selectedInterpretation]);
    } else {
      console.error("Option not found in options array.");
    }

    setStreamedContent('');
    setChapterAdded(false);
    setLoading(true);
    setStreamingComplete(false);
  }, [options, interpretations, setFullStory, setFullInterpretations]);

  // 이미지 생성 로직
  useEffect(() => {
    if (chapterAdded && currentChapter < 4 && fullStory.length > 0) {
      const chapterContent = streamedContent;
      
      axios.post(`/tuktak/generate_image`, {
        chapter_content: chapterContent,
        image_style_keywords: "bright, colorful",
        previous_chapters: chapterImages
      }).then(imageResponse => {
        const newImageUrl = imageResponse.data.image_url;
        setChapterImages([...chapterImages, imageResponse.data.image_url]);
        setCurrentImage(newImageUrl);
        setChapterAdded(false); // 이미지 생성 후 상태 초기화
        setLoading(false);
      }).catch(error => {
        console.error('Error in image generation:', error);
      });
    }
  }, [chapterAdded, currentChapter, fullStory, chapterImages]);

  // 전체적인 제목과 총합해석 생성
  const handleAnalyzeInterpretation = async () => {
    try {
      
      const response = await axios.post('/tuktak/analyze_intepretation', {
        full_interpretations: fullInterpretations,
      });
  
      console.log("Overall Interpretation:", response.data.overallInterpretation);
      // 추가 처리: 결과를 상태에 저장하거나 UI에 표시 등
    } catch (error) {
      console.error("Error in analyze interpretation:", error);
      // 오류 처리: 사용자에게 오류 메시지 표시 등
    }
    navigate("/");
  };

  // 첫 번째 챕터 자동 생성을 위한 useEffect
  useEffect(() => {
    if (currentChapter === 1) {
      createChapter();
    }
  }, [createChapter]);

  // 사용자의 선택에 반응하여 챕터 생성을 위한 useEffect
  useEffect(() => {
    // 결론 챕터 생성 조건 추가
    // currentChapter가 4이고 userChoices 배열의 길이가 currentChapter와 동일할 경우 결론 챕터 생성
    if (currentChapter === 4 && userChoices.length === currentChapter && !chapterAdded) {
      createChapter();
    } else if (currentChapter > 1 && userChoices.length >= currentChapter - 1 && !chapterAdded) {
      // 나머지 챕터들에 대한 생성 로직
      createChapter();
    }
  }, [userChoices, createChapter, currentChapter]);

  // 줄바꿈 추가 함수
  const formatPeriods = (text) => {
    const sentences = text.split(/(?<=[".])\s/); // 정규표현식을 사용하여 마침표와 쌍따옴표 뒤에 오는 공백을 기준으로 분할
    return sentences.map((sentence, index, array) => {
      // 문장 끝이 마침표나 쌍따옴표로 끝나거나, 배열의 마지막 요소가 아닌 경우 줄바꿈 추가
      const isEndOfSentence = index < array.length - 1 || /[".]$/.test(sentence);
      return (
        <div className="story-text" key={index}>
          {sentence}{isEndOfSentence ? '\n' : ''}
        </div>
      );
    });
  };

  const saveStory = async () => {

    try {
      const currentDateTime = new Date();
      currentDateTime.setHours(currentDateTime.getHours() + 9);

      const postData = {
        bookId: parseInt(bookId),// 동적으로 설정된 bookId 사용
        storyNum: parseInt(storyNum),// 동적으로 설정된 storyNum 사용
        author: "작가 이름",
        creatingDate: currentDateTime.toISOString(),
        fullcontent: JSON.stringify(fullContents),// 전체 스토리 내용
        completionDate: currentDateTime.toISOString(),
        imageUrl: currentImage,
      };

      //데이터 전송
      const response = await axios.post('/api/book/tuktak/tuktak_book', postData, {
        headers: {
          'Content-Type': 'application/json' // Explicitly set the content type
        }

      });
      console.log("Story saved:", response);
      alert("동화가 저장되었습니다!");
    } catch (error) {
      console.error("Error saving story:", error.response ? error.response : error);
      alert("동화 저장에 실패했습니다.");
    }
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

            <div className="textAreaLeft">
              {/* Content for the left text area */}
              {currentChapter === 5 ? (
                // 챕터 번호가 4일 때 tuktak_end.png 출력
                <div className="centerContent">
                  <img 
                    src="/tuktak_end.png"
                    alt="Tuktak Story End Image"
                    className="endImage"
                  />
                  <br></br>
                  <br></br>
                  <p>동화를 끝까지 완성했어요!</p>
                  {streamingComplete && 
                    (<button className="button-class"
                      onClick={handleAnalyzeInterpretation}>저장하고 나가기</button>)
                  }
                </div>
              ) : (
                // 챕터 번호가 4가 아닐 때 기존 콘텐츠 출력
                <>
                  <h2 className="chapter-title">{currentTitle}</h2>

                  {loading && (
                    <div>
                      <img 
                        src="/loading.gif" 
                        alt="Loading"
                        className="loadingContainer"
                      />
                      <br></br><p>포포가 그림을 가져오고 있어요</p>
                    </div>
                  )}

                  {currentImage && (
                    <div>
                      <img 
                        src={currentImage}
                        alt={`Chapter ${currentChapter} Image`}
                        className="chapterImage"
                        style={{
                          display: loading ? 'none' : 'block',
                        }}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
            
            {/* Right text area */}
            <div className="textAreaRight">
              {streamedContent && options && (
                <div className="storybookScrollbar">
                  
                  <div style={{ whiteSpace: 'pre-line' }}>{formatPeriods(streamedContent)}</div>
                  <br></br>
                  {streamingComplete && options.map((option, index) => (
                    <button className="button-class" 
                      key={index} 
                      onClick={() => handleOptionSelection(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
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

export default TuktakTale;
