import React, { useRef } from "react";
import ProgressBar from "../doduk-progressBar";

import giff from "./imgs/loading.gif";

function PopoGameModal({ isOpen, children, onClose, progress }) {
  if (!isOpen) {
    return null;
  }
  const modalRef = useRef(null);

  const handleModalClick = (e) => {
    // Prevent the click event from propagating to the outside elements
    e.stopPropagation();
  };
  return (
    <div className="modal-backdrop" ref={modalRef} onClick={handleModalClick}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <img className="loading-gif" src={giff}></img>
        <div class="typewriter">모험을 준비중이에요!</div>
        <ProgressBar progress={progress} />
        {children}
        {/* <button onClick={onClose}>닫기</button> */}
      </div>
    </div>
  );
}

export default PopoGameModal;
