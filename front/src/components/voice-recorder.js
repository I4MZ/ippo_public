import React, { useState, useRef, useEffect } from 'react';
import '../static/voice-recorder.css'

const VoiceRecorder = ({ onRecordingComplete, className }) => {
    const mediaRecorderRef = useRef(null);
    const [isRecording, setIsRecording] = useState(false);

    useEffect(() => {
        console.log(`Recording State: ${isRecording}`);
      }, [isRecording]);

    const toggleRecording = async () => {
      if (isRecording) {
        // 녹음 중지
        const mediaRecorder = mediaRecorderRef.current;
        if (mediaRecorder && mediaRecorder.state === "recording") {
          mediaRecorder.stop();
        }
        setIsRecording(false);
      } else {
        // 녹음 시작
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          let audioChunks = [];

          mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
          };

          mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
            onRecordingComplete(audioBlob); // Pass the blob to the parent component
          };

          mediaRecorder.start();
          setIsRecording(true);
        } catch (error) {
          console.error("Error starting recording:", error);
          // 에러 처리 로직 추가
        }
      }
    };
    
    return (
        <button className={`voice-btn ${className}`} onClick={toggleRecording}>
            <img
                alt="recording"
                src={isRecording ? "/stop-button.png" : "/microphone.png"}
            />
        </button>
    );
};

export default VoiceRecorder;
