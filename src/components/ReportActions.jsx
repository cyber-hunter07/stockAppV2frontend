import React from "react";

export default function ReportActions({ title = "Report" }) {
  return <div className="report-actions">
    <button type="button" className="btn-outline" onClick={() => window.print()}>▣ Print A4</button>
    <button type="button" className="btn-outline" onClick={() => window.print()} title={`Open print dialog to save ${title} as PDF`}>⇩ Save as PDF</button>
  </div>;
}
