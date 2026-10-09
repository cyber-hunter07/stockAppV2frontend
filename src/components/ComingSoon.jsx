import React from "react";

export default function ComingSoon({ title }) {
  return (
    <div className="panel" style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{ fontSize: 40, marginBottom: 10 }}>🚧</div>
      <h2>{title}</h2>
      <p className="msg">This module is being built next — coming soon.</p>
    </div>
  );
}
