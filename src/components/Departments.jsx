import React, { useEffect, useState } from "react";
import { getDepartments, addDepartment, updateDepartment, deleteDepartment } from "../api";
import Modal from "./Modal";
import ReportActions from "./ReportActions";

const empty = { code: "", description: "", headOfDept: "" };

export default function Departments() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => { setLoading(true); getDepartments().then(setList).catch((error) => setMessage(error.response?.data?.error || "Could not load departments.")).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(empty); setEditing(null); setShowModal(true); };
  const openEdit = (d) => { setForm({ code: d.code, description: d.description, headOfDept: d.headOfDept }); setEditing(d._id); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      if (editing) await updateDepartment(editing, form);
      else await addDepartment(form);
      setShowModal(false);
      setMessage(editing ? "Department updated." : "Department added.");
      load();
    } catch (error) { setMessage(error.response?.data?.error || "Could not save department."); }
  };

  const handleDelete = async (department) => {
    if (!window.confirm(`Delete department ${department.code}?`)) return;
    try { await deleteDepartment(department._id); setMessage("Department deleted."); load(); }
    catch (error) { setMessage(error.response?.data?.error || "Could not delete department."); }
  };

  return (
    <div className="panel">
      <div className="list-header">
        <h2>🏛️ Departments</h2>
        <div className="list-header-actions">
          <ReportActions title="departments" />
          <button className="primary-btn" onClick={openAdd}>+ Add Department</button>
        </div>
      </div>
      {message && <p className={message.toLowerCase().includes("could not") ? "error" : "success"} role="status">{message}</p>}

      <table>
        <thead>
          <tr><th>CODE</th><th>DESCRIPTION</th><th>HEAD OF DEPT</th><th>LOCATIONS</th><th>ITEMS HELD</th><th>ACTIONS</th></tr>
        </thead>
        <tbody>
          {list.map((d) => (
            <tr key={d._id}>
              <td><span className="badge-code">🏛️ {d.code}</span></td>
              <td><strong>{d.description}</strong></td>
              <td>{d.headOfDept || "-"}</td>
              <td><span className="badge-count amber">{d.locationCount}</span></td>
              <td><span className="badge-count green">{d.itemCount}</span></td>
              <td>
                <button className="icon-action" onClick={() => openEdit(d)} title="Edit">✏️</button>
              <button className="icon-action danger-action" onClick={() => handleDelete(d)} title="Delete">🗑️</button>
              </td>
            </tr>
          ))}
          {list.length === 0 && <tr><td colSpan="6">{loading ? "Loading departments…" : "No departments yet."}</td></tr>}
        </tbody>
      </table>

      <div className="hint-note">
        💡 <strong>Next step:</strong> assign each department to its locations in the <strong>Locations</strong> page.
        Department-wise stock reports are then available under <strong>Reports → By Department</strong>.
      </div>

      {showModal && (
        <Modal title={editing ? "Edit Department" : "Add New Department"} icon="🏛️" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="modal-form">
            <label>Code *</label>
            <input placeholder="e.g. CSE" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} pattern="[A-Z0-9-]{2,12}" maxLength="12" title="Use 2–12 letters, numbers, or hyphens" required />
            <label>Description *</label>
            <input placeholder="e.g. Computer Science and Engineering" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength="120" required />
            <label>Head of Department</label>
            <input placeholder="e.g. Dr. S. Ramesh" value={form.headOfDept} onChange={(e) => setForm({ ...form, headOfDept: e.target.value })} />
            <div className="modal-actions">
              <button type="submit" className="primary-btn">💾 Save</button>
              <button type="button" onClick={() => setShowModal(false)}>✕ Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
