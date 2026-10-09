import React from "react";

export default function Modal({ title, icon, onClose, children, width = 480 }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: width }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">
            {icon && <span style={{ fontSize: 22 }}>{icon}</span>}
            <h3>{title}</h3>
          </div>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ paddingTop: 16, paddingBottom: 4 }}>{children}</div>
      </div>
    </div>
  );
}
