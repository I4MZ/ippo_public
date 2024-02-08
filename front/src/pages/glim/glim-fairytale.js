import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { FlippingPages } from 'flipping-pages';
import VoiceRecorder from "../../components/voice-recorder";
import 'flipping-pages/dist/style.css';
import '../../static/glim/glim-fairytale.scss'
import axios from 'axios';

import { REQUEST_TO_GLIM_URL } from "../../config"

function GlimFairytale() {
  const [selected, setSelected] = useState(0);
  const [messageGroups, setMessageGroups] = useState([]); // 상태 추가
  const [audioBlob, setAudioBlob] = useState(null); // 새로운 상태 변수 추가
  const [question, setQuestion] = useState([]); // 상태 추가: 질문 텍스트
  const [isAllChaptersCompleted, setIsAllChaptersCompleted] = useState(false);

  const navigate = useNavigate();

  const back = () => {
    setSelected(selected => Math.max(selected - 1, 0));
  };

  const next = () => {
    setSelected(selected => Math.min(selected + 1, 2));
  };

  const location = useLocation();
  const { messages } = location.state || {};

  useEffect(() => {
    if (!messages || messages.length === 0) {
      setErrorMessage('동화 내용이 없습니다. 이전 페이지로 돌아가 주세요.');
      return;
    }

    // 메시지 그룹 초기화
    const groups = [
      messages.slice(0, 3),   // page1에 해당하는 메시지 묶음
      messages.slice(3, 6),   // page2에 해당하는 메시지 묶음
      messages.slice(6, 9),   // page3에 해당하는 메시지 묶음
    ];
    setMessageGroups(groups);
  }, []); // messageGroups가 변경될 때마다 실행

  useEffect(() => {
    // Extract text for each chapter
    const chapterData = {
      child_id: 1,
      child_name: "신우철",
      chapter1: messages[1]?.text || '', // Assuming messages[1] is chapter 1 text
      chapter2: messages[4]?.text || '', // Assuming messages[4] is chapter 2 text
      chapter3: messages[7]?.text || '', // Assuming messages[7] is chapter 3 text
    };
    console.log(chapterData);

    // Send the chapter data to FastAPI
    sendChapterDataToFastAPI(chapterData);
  }, [messages]); // Ensures this runs only once when the component mounts

  useEffect(() => {
    // messageGroups가 변경될 때마다 모든 챕터가 완료되었는지 확인
    setIsAllChaptersCompleted(allChaptersCompleted());
  }, [messageGroups]); // messageGroups가 변경될 때마다 useEffect 실행

  const sendChapterDataToFastAPI = async (groups) => {
    try {
      const response = await axios.post(`/questions`, groups);
      console.log('Response from FastAPI:', response.data);
      // Handle any additional logic with the response
      // 여기에서 서버 응답을 처리하여 messageGroups에 질문 데이터를 추가합니다.
      const questions = extractQuestions(response.data);

      // messageGroups 상태 업데이트
      setMessageGroups(prevGroups => prevGroups.map((group, index) => {
        const chapterQuestion = questions[index];
        return [...group, { sender: "bot", text: chapterQuestion }];
      }));
    } catch (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error data:', error.response.data);
        console.error('Error status:', error.response.status);
        console.error('Error headers:', error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error request:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', error.message);
      }
      console.error('Error config:', error.config);
    }
  };

  function extractQuestions(text) {
    const chapterRegex = /챕터 \d+: [^\n]+\n질문: ([^\n]+)/g;
    const questions = [];
    let match;

    while ((match = chapterRegex.exec(text)) !== null) {
      questions.push(match[1]);
    }

    return questions;
  }

  const handleAudioComplete = async (audioBlob) => {
    console.log("handleAudioComplete 호출됨", audioBlob);
    setAudioBlob(audioBlob);

    // Prepare the audio file to be sent to the server
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audioFile.wav');

    // POST request to the server
    try {
      const response = await fetch(`/record`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      // Assuming the server returns a JSON response with the transcript
      const audioData = await response.json();
      console.log(audioData);

      // Append the transcript to the messageGroups
      setMessageGroups(prevGroups => prevGroups.map((group, index) => {
        if (index === selected) {
          return [...group, { sender: "user", text: audioData.transcript.text }];
        }
        return group;
      }));

    } catch (error) {
      console.error('Error during audio upload:', error);
    }
  };

  function splitAndStyleText(text, conversation_num) {
    // 줄바꿈, 문장 부호, 쌍따옴표를 기준으로 문장을 분리합니다.
    const paragraphs = text.split('\n');
    // console.log(paragraphs);
    return paragraphs.map((paragraph, index) => {
      // 각 문단 내에서 추가적인 분할을 수행합니다.
      const styledParagraph = paragraph.split(/(?<=[.!?\n])\s+|("[^"]*")/).map((part, partIndex) => {
        if (!part) return null; // part가 undefined이면 null 반환

        // 양쪽 공백을 제거
        const trimmedPart = part.trim();

        // 각 부분을 감싸는 div를 추가하고, 여기에 마진 스타일을 적용합니다.
        return (
          <div key={partIndex} className="text-part">
            {trimmedPart.includes(`챕터 ${conversation_num + 1}`) ? (
              <div key={partIndex} className="glim-chapter-title">{trimmedPart}</div>
            ) : trimmedPart.startsWith('"') && trimmedPart.endsWith('"') ? (
              <span key={partIndex} className="quoted-text" style={{ backgroundColor: getRandomPastelColor() }}>
                {trimmedPart.split('').map((char, i) => (
                  <React.Fragment key={i}>
                    {char !== ' ' ? <span style={{ '--i': i }}>{char}</span> : ' '}
                  </React.Fragment>
                ))}
              </span>
            ) : (
              <span key={partIndex} className="normal-text">{trimmedPart}</span>
            )}
          </div>
        );
      });

      return <div key={index} className="paragraph">{styledParagraph}</div>;
    });
  }

  function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
  function getRandomPastelColor() {
    const hue = Math.floor(Math.random() * 360); // 색상 범위
    const saturation = 60; // 낮은 채도
    const lightness = 85; // 높은 밝기
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  const allChaptersCompleted = () => {
    return messageGroups.every(group => group[4] && group[4].sender === "user");
  };

  const createStoryBook = async (storyBookData) => {
    const response = await axios.post('/api/story-books', storyBookData);
    return response.data.bookId; // Assuming the response includes the bookId
  };

  const createGlimContent = async (glimContent, report, bookId) => {
      const fullGlimData = { ...glimContent, report, bookId };
      await axios.post('/api/glim-contents', fullGlimData);
  };

  // Usage
  const handleSaveData = async (glimContent) => {
    const bookId = await createStoryBook(storyBookData);
    await createGlimContent(glimContent, report, bookId);
  };

  const handleFinish = async () => {
    // 여기에 '끝내기' 버튼 클릭 시 수행할 로직을 작성하세요.
    // 예: 결과 페이지로 리디렉션, 상태 초기화, 데이터베이스에 저장 등
    console.log("모든 챕터 완료! 끝내기 버튼 클릭됨.");

    try {
      const storyContent = messageGroups.map((chapter, index) => {
        const chapterNumber = index + 1; // 1부터 시작하는 챕터 번호
        const chapterContent = [chapter[0], chapter[1], chapter[3], chapter[4]]
          .map((message, messageIndex) => {
            // chapter[1]의 text에 대해서만 줄바꿈과 공백을 제거
            let text = message.text;
            if (messageIndex === 1) {
              text = text.replace(/\s+/g, ' ').trim();
              text = text.length > 250 ? text.substring(0, 250) : text; // If text is longer than 300 characters, truncate it
            }
            return `sender: ${message.sender}, text: ${text}`;
          })
          .join(", ");

        return `chapter_number: ${chapterNumber}, chapter_content: ${chapterContent}`;
      }).join(" | \n");
      console.log('전송하는 데이터:', JSON.stringify(storyContent, null, 2));
      const response = await axios.post(`/analysis`, storyContent);
      console.log('데이터 전송 성공:', response.data);

      // 
      handleSaveData(messageGroups);

      navigate('/');
    } catch (error) {
      console.log('데이터 전송 실패:', error);
    }
  };

  return (
    <>
      <div className="pages">
        <FlippingPages
          direction="right-to-left"
          onSwipeEnd={setSelected}
          selected={selected}
        >
          {messageGroups.map((msg, index) => (
            <div key={index} className={`page page${index + 1}`}>
              {/* 이미지 컨테이너 */}
              <div className="page-half page-image-container">
                {msg[2] && msg[2].sender === "bot" && msg[2].imageUrl && (
                  <img
                    className="page-image"
                    src={msg[2].imageUrl}
                    alt="Story Image"
                    draggable="false"
                  />
                )}
              </div>
              {/* 텍스트 컨테이너 */}
              <div className="page-half page-text-container font-jua text-16xl">
                {/* {msg[0] && msg[0].sender === "user" && (
                  <div className="user-message-title">동화 키워드 : {msg[0].text}</div>
                )} */}
                {msg[1] && msg[1].sender === "bot" && msg[1].text && (
                  <>
                    <div className="bot-message-content">
                      {splitAndStyleText(msg[1].text, index)}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </FlippingPages>
        {messageGroups[selected] && (
          <div
            className="question-container font-jua text-26xl"
            style={{ backgroundColor: getRandomPastelColor() }}
          >
            {/* Display the question for the current page */}
            {messageGroups[selected][3] && (
              <div className="question">{messageGroups[selected][3]?.text}</div>
            )}
            {messageGroups[selected][4] && (
              <div className="child-response">
                {messageGroups[selected][4].text}
              </div>
            )}
            <VoiceRecorder
              onRecordingComplete={handleAudioComplete}
              className="fairytale-voice-btn"
            />
          </div>
        )}
        {/* 모든 챕터가 완료되었을 때 '끝내기' 버튼을 보여줍니다. */}
        {isAllChaptersCompleted && (
          <button className='finish-btn font-jua text-26xl' onClick={handleFinish}>저장하고 나가기</button>
        )}
      </div>
    </>
  );
}

export default GlimFairytale;
