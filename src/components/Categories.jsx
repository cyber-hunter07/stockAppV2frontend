import React, { useEffect, useState } from "react";
import { getCategories, addCategory, updateCategory, deleteCategory, getDisciplines, addDiscipline, deleteDiscipline } from "../api";
import Modal from "./Modal";
import ReportActions from "./ReportActions";

const emptyCat = { name: "", discipline: "", description: "" };

export default function Categories() {
  const [cats, setCats] = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const [showDisciplines, setShowDisciplines] = useState(false);
  const [newDiscipline, setNewDiscipline] = useState("");
  const [form, setForm] = useState(emptyCat);
  const [editing, setEditing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState("");

  const load = () => {
    getCategories().then(setCats);
    getDisciplines().then(setDisciplines);
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(emptyCat); setEditing(null); setShowModal(true); };
  const openEdit = (c) => { setForm({ name: c.name, discipline: c.discipline?._id || "", description: c.description || "" }); setEditing(c._id); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      if (editing) await updateCategory(editing, form);
      else await addCategory(form);
      setShowModal(false);
      setMessage(editing ? "Category updated." : "Category added.");
      load();
    } catch (error) { setMessage(error.response?.data?.error || "Could not save category."); }
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`Delete category ${category.name}?`)) return;
    try { await deleteCategory(category._id); setMessage("Category deleted."); load(); }
    catch (error) { setMessage(error.response?.data?.error || "Could not delete category."); }
  };

  const handleAddDiscipline = async (e) => {
    e.preventDefault();
    if (!newDiscipline.trim()) return;
    const code = newDiscipline.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    try {
      await addDiscipline({ name: newDiscipline.trim(), code });
      setNewDiscipline("");
      setMessage("Discipline added.");
      load();
    } catch (error) { setMessage(error.response?.data?.error || "Could not add discipline."); }
  };

  return (
    <>
      <div className="panel">
        <div className="list-header">
          <h2>🎓 Disciplines <span className="dash-subtext">— the branches your categories are grouped under</span></h2>
          <div className="list-header-actions">
            <span className="qty-badge">{disciplines.length} in use</span>
            <button className="btn-outline" onClick={() => setShowDisciplines(!showDisciplines)}>
              {showDisciplines ? "▲ Hide" : "▼ Manage"}
            </button>
          </div>
        </div>

        {showDisciplines && (
          <>
            <form onSubmit={handleAddDiscipline} className="inline-form" style={{ marginTop: 12 }}>
              <input placeholder="New discipline — e.g. Automobile, Textile Technology, Library" value={newDiscipline} onChange={(e) => setNewDiscipline(e.target.value)} />
              <button type="submit">+ Add</button>
            </form>
            <table>
              <thead><tr><th>DISCIPLINE</th><th>CATEGORIES USING IT</th><th>ACTIONS</th></tr></thead>
              <tbody>
                {disciplines.map((d) => {
                  const usage = cats.filter((c) => c.discipline?._id === d._id).length;
                  return (
                    <tr key={d._id}>
                      <td>{d.name}<div className="dash-subtext">code: {d.code}</div></td>
                      <td><span className="qty-badge">{usage}</span></td>
                      <td>
                        {usage === 0
                          ? <button className="icon-action danger-action" onClick={async () => {
                              if (!window.confirm(`Delete discipline ${d.name}?`)) return;
                              try { await deleteDiscipline(d._id); setMessage("Discipline deleted."); load(); }
                              catch (error) { setMessage(error.response?.data?.error || "Could not delete discipline."); }
                            }}>🗑️</button>
                          : <span className="dash-subtext">in use — cannot remove</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="msg">A discipline groups categories by branch, so a register can be printed for one department at a time.</p>
          </>
        )}
      </div>

      <div className="panel">
        <div className="list-header">
          <h2>🏷️ Equipment Categories</h2>
          <div className="list-header-actions">
            <ReportActions title="categories" />
            <button className="btn-outline" onClick={load}>↺ Refresh</button>
            <button className="primary-btn" onClick={openAdd}>+ Add Category</button>
          </div>
        </div>
        {message && <p className={message.toLowerCase().includes("could not") ? "error" : "success"} role="status">{message}</p>}

        <table>
          <thead>
            <tr><th>CATEGORY</th><th>DISCIPLINE</th><th>DESCRIPTION</th><th>EQUIPMENT TYPES</th><th>TOTAL ITEMS</th><th>TOTAL VALUE</th><th>ACTIONS</th></tr>
          </thead>
          <tbody>
            {cats.map((c) => (
              <tr key={c._id}>
                <td>🏷️ <strong>{c.name}</strong></td>
                <td>{c.discipline?.name ? <span className="discipline-pill">{c.discipline.name}</span> : "-"}</td>
                <td>{c.description || "-"}</td>
                <td><span className="badge-count blue">{c.equipmentTypes ?? 0}</span></td>
                <td><span className="badge-count green">{c.totalItems ?? 0}</span></td>
                <td>₹{(c.totalValue ?? 0).toLocaleString("en-IN")}</td>
                <td>
                  <button className="icon-action" onClick={() => openEdit(c)} title="Edit">✏️</button>
                  <button className="icon-action danger-action" onClick={() => handleDelete(c)} title="Delete">🗑️</button>
                </td>
              </tr>
            ))}
            {cats.length === 0 && <tr><td colSpan="7">No categories yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal title={editing ? "Edit Category" : "Add New Category"} icon="🏷️" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="modal-form">
            <label>Category Name *</label>
            <input placeholder="e.g. Computer" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength="80" required />
            <label>Discipline *</label>
            <select value={form.discipline} onChange={(e) => setForm({ ...form, discipline: e.target.value })} required>
              <option value="">Select discipline</option>
              {disciplines.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
            <label>Description</label>
            <input placeholder="optional" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="modal-actions">
              <button type="submit" className="primary-btn">💾 Save</button>
              <button type="button" onClick={() => setShowModal(false)}>✕ Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
