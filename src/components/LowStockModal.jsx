import React from "react";

export default function LowStockModal({ items, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">
            <span className="warn-icon">⚠️</span>
            <div>
              <h3>Low Stock Alert</h3>
              <p>{items.length} item{items.length !== 1 ? "s" : ""} need restocking</p>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal-body">
          {items.length === 0 ? (
            <p className="all-good">✅ All stock levels are healthy.</p>
          ) : (
            <table>
              <thead>
                <tr><th>Item</th><th>Category</th><th>Location</th><th>Qty</th></tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i._id}>
                    <td>{i.itemName}</td>
                    <td>{i.category?.name || "-"}</td>
                    <td>{i.location}</td>
                    <td>
                      <span className={`qty-badge ${i.quantity === 0 ? "zero" : ""}`}>
                        {i.quantity} <small>/ {i.lowStockThreshold}</small>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="modal-foot">
          <button className="primary-btn" onClick={onClose}>Got it</button>
        </div>
      </div>
    </div>
  );
}
