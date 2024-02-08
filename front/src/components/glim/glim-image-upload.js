import React, { useState, useEffect } from 'react';
import { FileUploader } from "react-drag-drop-files";

const fileTypes = ["JPG", "PNG"];
import { REQUEST_TO_GLIM_URL } from "../../config"

import "../../static/glim/common.css"
import "../../static/glim/glim-image-upload.css"

function ImageUploader({ onClose, onImageProcessed }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // 이미지가 업로드되면 미리보기 URL을 생성합니다.
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const fileReader = new FileReader();
    fileReader.onload = () => {
      setPreviewUrl(fileReader.result);
    };
    fileReader.readAsDataURL(file);
  }, [file]);

  const handleChange = (file) => {
    setFile(file);
  };

  const handleClose = (e) => {
    e.stopPropagation(); // 이벤트 전파 중지
    onClose(); // 닫기 함수 호출
  };

  // 이미지 전송 및 변환된 이미지 받기
  const sendImageToSketch = async () => {
    try {
      const formData = new FormData();
      formData.append("file", file); // file 사용

      const apiResponse = await fetch('/glim/convert-to-sketch/', {
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
      formData.append("file", file); // file 사용

      const apiResponse = await fetch('/glim/convert-to-cartoon/', {
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

  const retakeImage = () => {
    setFile(null); // 현재 선택된 이미지 초기화
    setPreviewUrl(null); // 미리보기 URL 초기화
  };

  return (
    <div className='imageup-container'>
      {!previewUrl && (
        <FileUploader handleChange={handleChange} name="file" types={fileTypes} classes="custom-uploader">
          <div className="uploader-content">
            <p>여기에 파일을 끌어다 놓거나 클릭하여 업로드하세요.</p>
            <p>JPG, PNG 파일만 주세요 😊</p>
            {/* 업로드된 이미지 미리보기 */}
          </div>
        </FileUploader>)}
      {previewUrl && (
        <>
          <img src={previewUrl} alt="Captured" className="captured-image" />
          <button className="common-button retake-button" onClick={retakeImage}>다른 이미지 고르기</button>
          <button className="common-button sketch-button" onClick={sendImageToSketch}>스케치 적용</button>
          <button className="common-button cartoon-button" onClick={sendImageToCartoon}>카툰 적용</button>
        </>
      )}
      <button className="common-button close-button" onClick={handleClose}>
        닫기
      </button>
    </div>
  );
}

export default ImageUploader;
