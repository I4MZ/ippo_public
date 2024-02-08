// ChatContext.js
import React, { createContext, useState } from 'react';

export const ChatContext = createContext({
    sendChatCount: 0,
    setSendChatCount: () => {},
    selectedKeywords: [],
    setSelectedKeywords: () => {}
});

export const ChatProvider = ({ children }) => {
    const [sendChatCount, setSendChatCount] = useState(0);
    const [selectedKeywords, setSelectedKeywords] = useState([]);

    return (
        <ChatContext.Provider value={{ sendChatCount, setSendChatCount, selectedKeywords, setSelectedKeywords }}>
            {children}
        </ChatContext.Provider>
    );
};
