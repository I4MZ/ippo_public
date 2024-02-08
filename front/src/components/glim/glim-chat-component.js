import React from 'react';
import '../../static/glim/glim-chat-component.css';
import GlimKeywordComponent from "./glim-keyword-component";

function ChatComponent({ messages, isLoading }) {
  const getProfileImagePath = (sender, gender) => {
    if (sender === 'bot') {
      return "/popo_profile.png";
    } else {
      return gender === 'boy' ? "/boy_profile.png" : "/girl_profile.png";
    }
  };

  return (
      <div className="chat-container">
        <div className="messages">
          {messages.map((msg, index) => {
            const messageClass = msg.sender === 'user' ? 'user' : 'bot';
            const profileImagePath = getProfileImagePath(msg.sender, msg.gender);

          return (
            <div
              key={index}
              className={`message ${messageClass} font-jua text-16xl`}
            >
              {/* Include the profile image within a rounded div */}
              <div className="profile-image w-20 h-20 rounded-full overflow-hidden">
                <img
                  className="object-cover w-full h-full"
                  src={profileImagePath}
                  alt="profile"
                />
              </div>
              {/* Render the message bubble */}
              {msg.imageUrl ? (
                isLoading ? (
                  <>
                    <img src="popo.gif" alt="Loading"/>
                    <p>동화 이미지를 생성 중이야! 잠시만 기다려줘!</p>
                  </>
                ) : (
                <img
                  className="glim-image"
                  src={msg.imageUrl}
                  alt="Generated image"
                /> 
                )
              ) : (
                <div className={`glim-chat-bubble ${messageClass}`}>{msg.text}</div>
              )}
            </div>
          );
        })}
      </div>
      {/* GlimKeywordComponent를 여기로 이동 */}
      {/* {keywords && <GlimKeywordComponent keywords={keywords}/>} */}
    </div>
  );
}

export default ChatComponent;
