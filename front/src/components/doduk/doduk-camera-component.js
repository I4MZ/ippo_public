import React, { useRef, useState, useEffect } from "react";
import "../../static/camera-component.css";
import "../../static/glim/common.css";

const CameraComponent = ({
  onClose,
  onImageProcessed,
  openModal,
  storyStart,
}) => {
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
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
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
    const ctx = canvas.getContext("2d");

    // 비디오가 좌우 대칭되어 있는 경우, 캔버스에도 같은 대칭 적용
    if (!isFlipped) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 변환을 다시 초기화합니다.
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // 웹캠 종료
    stopWebcam();
    const imageData = canvas.toDataURL("image/png");
    setCapturedImage(imageData);
  };

  // 다시 촬영
  const retakeImage = () => {
    setCapturedImage(null);
    startCamera(); // 비디오 스트림 재개
  };

  const selectImage = () => {
    if (!capturedImage) return;

    // base64 문자열에서 파일 형식을 결정합니다. 예: 'data:image/png;base64,...'
    const format = capturedImage.split(";")[0].split("/")[1];

    // base64 인코딩된 문자열을 Blob으로 변환합니다.
    const byteString = atob(capturedImage.split(",")[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: `image/${format}` });

    // Blob을 파일로 변환합니다.
    const file = new File([blob], `captured-image.${format}`, {
      type: `image/${format}`,
    });

    // FormData 객체 생성
    const formData = new FormData();

    // FormData 객체에 이미지 파일 추가
    formData.append("image", file, `captured-image.${format}`);

    console.log(formData);
    onClose();
    //doduk-q-image에 있음
    storyStart(formData);
    openModal();
  };
  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();

      tracks.forEach((track) => {
        track.stop();
      });

      videoRef.current.srcObject = null;
    }
  };
  return (
    <div className="video-container">
      {!capturedImage && (
        <>
          <video
            ref={videoRef}
            autoPlay
            className={`glim-video ${isFlipped ? "flipped" : ""}`}
          ></video>
          <button
            className="common-button capture-button"
            onClick={captureImage}
          >
            사진 촬영
          </button>
          <button className="flip-button" onClick={toggleFlip}>
            <img src="/horizon_reflection.png" alt="Flip" />
          </button>
        </>
      )}
      {capturedImage && (
        <>
          <img src={capturedImage} alt="Captured" className="captured-image" />
          <button className="common-button retake-button" onClick={retakeImage}>
            다시 촬영
          </button>
          <button
            className="common-button cartoon-button"
            onClick={selectImage}
          >
            이 사진으로 하기!
          </button>
        </>
      )}
      <button className="common-button close-button" onClick={onClose}>
        닫기
      </button>
      <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
    </div>
  );
};

export default CameraComponent;
