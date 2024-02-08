import React, { useRef, useState, useEffect } from 'react';
import '../static/camera-component.css'
import '../static/glim/common.css'

import { REQUEST_TO_GLIM_URL } from '../config';

const CameraComponent = ({ onClose, onImageProcessed }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false); // 비디오 반전 상태

  // 카메라 접근
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing the camera:", err);
    }
  };

  useEffect(() => {
    startCamera();
    // Cleanup function to stop the camera stream when the component unmounts
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // 비디오 반전 토글
  const toggleFlip = () => {
    console.log(isFlipped);
    setIsFlipped(!isFlipped);
  };

  // 이미지 캡처

  const captureImage = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');

    // 비디오가 좌우 대칭되어 있는 경우, 캔버스에도 같은 대칭 적용
    if (!isFlipped) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 변환을 다시 초기화합니다.
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const imageData = canvas.toDataURL('image/png');
    setCapturedImage(imageData);
  };

  // 다시 촬영
  const retakeImage = () => {
    setCapturedImage(null);
    startCamera(); // 비디오 스트림 재개
  };

  // 이미지 전송 및 변환된 이미지 받기
  const sendImageToSketch = async () => {
    try {
      const formData = new FormData();
      // capturedImage를 Blob으로 변환
      const response = await fetch(capturedImage);
      const respBlob = await response.blob();
      formData.append("file", new File([respBlob], "image.png", { type: "image/png" }));

      const apiResponse = await fetch('/convert-to-sketch', {
        method: 'POST',
        body: formData,
      });
      const blob = await apiResponse.blob();
      const convertedImageUrl = URL.createObjectURL(blob);

      // 부모 컴포넌트에 이미지 URL 전달
      if (onImageProcessed) {
        onImageProcessed(convertedImageUrl);
      }

      // 이미지 전송이 성공하면 모달을 닫습니다.
      onClose(); // 모달 닫기
    } catch (err) {
      console.error("Error sending the image to the server:", err);
    }
  };
  // 이미지 전송 및 변환된 이미지 받기
  const sendImageToCartoon = async () => {
    try {
      const formData = new FormData();
      // capturedImage를 Blob으로 변환
      const response = await fetch(capturedImage);
      const respBlob = await response.blob();
      formData.append("file", new File([respBlob], "image.png", { type: "image/png" }));

      const apiResponse = await fetch('/convert-to-cartoon', {
        method: 'POST',
        body: formData,
      });
      const blob = await apiResponse.blob();
      const convertedImageUrl = URL.createObjectURL(blob);

      // 부모 컴포넌트에 이미지 URL 전달
      if (onImageProcessed) {
        onImageProcessed(convertedImageUrl);
      }

      // 이미지 전송이 성공하면 모달을 닫습니다.
      onClose(); // 모달 닫기
    } catch (err) {
      console.error("Error sending the image to the server:", err);
    }
  };

  return (
    <div className="video-container">
      {!capturedImage && (
        <>
          <video ref={videoRef} autoPlay className={`glim-video ${isFlipped ? 'flipped' : ''}`}></video>
          <button className="common-button capture-button" onClick={captureImage}>사진 촬영</button>
          <button className="flip-button" onClick={toggleFlip}>
            <img src="/horizon_reflection.png" alt="Flip" />
          </button>
        </>
      )}
      {capturedImage && (
        <>
          <img src={capturedImage} alt="Captured" className="captured-image" />
          <button className="common-button retake-button" onClick={retakeImage}>다시 촬영</button>
          <button className="common-button sketch-button" onClick={sendImageToSketch}>스케치 적용</button>
          <button className="common-button cartoon-button" onClick={sendImageToCartoon}>카툰 적용</button>
        </>
      )}
      <button className="common-button close-button" onClick={onClose}>닫기</button>
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
    </div>
  );
};

export default CameraComponent;
