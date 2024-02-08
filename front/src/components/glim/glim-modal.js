import React from 'react';
import '../../static/glim/glim-modal.css'

const ModalComponent = ({ isOpen, onClose, children, className }) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    // If className is 'chat-box', don't close the modal when the overlay is clicked
    if (className !== 'chat-box') {
      onClose?.();
    }
  };

  const overlayClass = `glim-modal-overlay ${className}-overlay`;
  const contentClass = `glim-modal-content ${className}-content`;

  return (
    <div className={overlayClass} onClick={handleOverlayClick}>
      <div className={contentClass} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

export default ModalComponent;
