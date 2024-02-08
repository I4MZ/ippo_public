import React, { useState, useContext } from "react";
import '../../static/glim/glim-keyword-component.css';
import { ChatContext } from '../../components/glim/chat-context';

function GlimKeywordComponent({keywords}) {
    const { selectedKeywords, setSelectedKeywords } = useContext(ChatContext);

    const toggleKeyword = (keyword) => {
        setSelectedKeywords((prevKeywords) => {
          const newKeywords = prevKeywords.includes(keyword)
            ? prevKeywords.filter((k) => k !== keyword)
            : [...prevKeywords, keyword];
          console.log("Updated Keywords:", newKeywords); // 로그 추가
          return newKeywords;
        });
    };

    // const handleComplete = () => {
    //     onKeywordsComplete?.(); // Call the callback when the button is clicked
    // };

    if (!keywords) return null;

    return (
      <div className="keywords-container font-jua text-26xl">
        <div className="w-20 h-20 rounded-full overflow-hidden bot bot-image">
          <img
            className="object-cover w-full h-full"
            src="/popo_profile.png"
            alt="profile"
          />
        </div>

        <div className="flex justify-center items-center">
          <div>원하는 단어를 고르고 동화 생성 버튼을 눌러봐!</div>
        </div>
        <div className="keywords">
          {Array.isArray(keywords.descriptions) &&
            keywords.descriptions.map((item, index) => (
              <div
                key={index}
                className={`keyword-bubble ${
                  selectedKeywords.includes(item) ? "selected" : ""
                }`}
                onClick={() => toggleKeyword(item)}
              >
                {item}
              </div>
            ))}
        </div>
        {/* <button onClick={handleSubmit} className="submit-button">키워드 제출</button> */}
        {/* {selectedKeywords.length > 0 && (<button onClick={handleComplete} className="submit-button">
                키워드 선택 완료
            </button>
            )} */}
      </div>
    );
}

export default GlimKeywordComponent;
