import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { runBackupNow, listBackups, downloadBackup, restoreBackup, runAlertCheck } from "../api";

const BACKUP_COLLECTIONS = ["departments", "disciplines", "categories", "vendors", "equipment", "locations", "assetCodes", "purchases", "maintenance", "consumables", "quotations", "scrapRequests", "stockMovements", "powerUnits", "auditLogs"];

export default function BackupPanel() {
  const { user } = useAuth();
  const [backups, setBackups] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [restorePreview, setRestorePreview] = useState(null);

  const load = () => listBackups().then(setBackups).catch(() => {});

  useEffect(() => {
    if (user.role === "Administrator") load();
  }, [user.role]);

  const handleBackup = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await runBackupNow();
      setMessage(`Backup created: ${res.filename}`);
      load();
    } catch (err) {
      setMessage(err.response?.data?.error || "Backup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAlertCheck = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await runAlertCheck();
      setMessage(res.message);
    } catch (err) {
      setMessage(err.response?.data?.error || "Alert check failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (filename) => {
    try {
      const blob = await downloadBackup(filename);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) { setMessage(err.response?.data?.error || "Could not download backup."); }
  };

  const handleBackupFile = async (event) => {
    const file = event.target.files?.[0];
    setRestorePreview(null);
    setMessage("");
    if (!file) return;
    try {
      if (file.size > 25 * 1024 * 1024) throw new Error("Backup file must be 25 MB or smaller.");
      const backup = JSON.parse(await file.text());
      if (backup.schemaVersion !== 2 || BACKUP_COLLECTIONS.some((key) => !Array.isArray(backup[key]))) {
        throw new Error("This file is incomplete or is not a supported version 2 application backup.");
      }
      setRestorePreview({ backup, filename: file.name });
    } catch (err) {
      setMessage(err.message || "Could not read this backup file.");
      event.target.value = "";
    }
  };

  const handleRestore = async () => {
    if (!restorePreview || loading) return;
    const confirmed = window.confirm(`Restore ${restorePreview.filename}? This replaces current business records with the selected backup. User accounts and passwords are retained. This cannot be undone unless you have a current backup.`);
    if (!confirmed) return;
    setLoading(true);
    setMessage("");
    try {
      const result = await restoreBackup(restorePreview.backup, true);
      setMessage(result.message);
      setRestorePreview(null);
      load();
    } catch (err) {
      setMessage(err.response?.data?.error || "Restore failed.");
    } finally {
      setLoading(false);
    }
  };

  if (user.role !== "Administrator") {
    return <div className="panel">Backup & Notification controls are available to Administrators only.</div>;
  }

  return (
    <div className="panel">
      <h2>Backup Service & Email Notifications</h2>
      <p className="msg">
        Automated backups run daily at 2:00 AM. Automated low-stock/expiry alert emails go out daily at 8:00 AM.
        Use the buttons below to trigger either one immediately.
      </p>

      <div className="stock-form">
        <button onClick={handleBackup} disabled={loading}>Run Backup Now</button>
        <button onClick={handleAlertCheck} disabled={loading}>Send Alert Emails Now</button>
      </div>
      {message && <p className="msg">{message}</p>}

      <h3>Available Backups</h3>
      <table>
        <thead><tr><th>File</th><th></th></tr></thead>
        <tbody>
          {backups.map((f) => (
            <tr key={f}>
              <td>{f}</td>
              <td><button type="button" onClick={() => handleDownload(f)}>Download</button></td>
            </tr>
          ))}
          {backups.length === 0 && <tr><td colSpan="2">No backups yet — click "Run Backup Now".</td></tr>}
        </tbody>
      </table>

      <h3>Restore from a backup file</h3>
      <p className="msg">Choose a version 2 JSON backup to review its contents. The app will ask for confirmation before replacing business records; user accounts are retained.</p>
      <div className="stock-form">
        <label>
          Backup JSON file
          <input type="file" accept=".json,application/json" onChange={handleBackupFile} disabled={loading} />
        </label>
      </div>
      {restorePreview && (
        <section className="panel" aria-label="Backup restore preview">
          <h3>Review restore</h3>
          <p><strong>File:</strong> {restorePreview.filename}</p>
          <p><strong>Created:</strong> {restorePreview.backup.exportedAt ? new Date(restorePreview.backup.exportedAt).toLocaleString() : "Date not provided"}</p>
          <p><strong>Business records to restore:</strong></p>
          <ul>
            {BACKUP_COLLECTIONS.map((key) => <li key={key}>{key}: {restorePreview.backup[key].length}</li>)}
            <li>Legacy items: {restorePreview.backup.legacyItems?.length ?? "not included (current records will be kept)"}</li>
            <li>Legacy stock transactions: {restorePreview.backup.legacyStockTransactions?.length ?? "not included (current records will be kept)"}</li>
          </ul>
          <p>User accounts and passwords will remain unchanged.</p>
          <div className="stock-form">
            <button type="button" onClick={handleRestore} disabled={loading}>{loading ? "Restoring…" : "Confirm and Restore"}</button>
            <button type="button" onClick={() => setRestorePreview(null)} disabled={loading}>Cancel</button>
          </div>
        </section>
      )}
    </div>
  );
}
