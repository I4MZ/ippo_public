import React from 'react';
import '../../static/glim/glim-modal.css'

const ModalComponent = ({ isOpen, children }) => {
  if (!isOpen) return null;

  return (
    <div className="glim-modal-overlay">
      <div className="glim-modal-content">{children}</div>
    </div>
  );
};

export default ModalComponent;
