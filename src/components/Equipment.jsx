import React, { useEffect, useState } from "react";
import { getEquipment, addEquipment, updateEquipment, deleteEquipment, getCategories } from "../api";
import Modal from "./Modal";
import ReportActions from "./ReportActions";

const emptyForm = { name: "", specification: "", category: "", isConsumable: false, codePrefix: "", lowStockThreshold: 2 };

export default function Equipment() {
  const [list, setList] = useState([]);
  const [cats, setCats] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [query, setQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [equipment, categories] = await Promise.all([getEquipment(), getCategories()]);
      setList(equipment); setCats(categories);
    } catch (error) { setMessage(error.response?.data?.error || "Could not load equipment."); }
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setMessage(""); setShowModal(true); };
  const openEdit = (item) => {
    setEditing(item._id);
    setForm({ name: item.name || "", specification: item.specification || "", category: item.category?._id || "", isConsumable: Boolean(item.isConsumable), codePrefix: item.codePrefix || "", lowStockThreshold: item.lowStockThreshold ?? 2 });
    setMessage(""); setShowModal(true);
  };
  const handleSubmit = async (event) => {
    event.preventDefault(); setSaving(true); setMessage("");
    try {
      const payload = { ...form, name: form.name.trim(), specification: form.specification.trim(), codePrefix: form.codePrefix.trim().toUpperCase(), lowStockThreshold: Number(form.lowStockThreshold) };
      if (editing) await updateEquipment(editing, payload); else await addEquipment(payload);
      setShowModal(false); setMessage(editing ? "Equipment updated." : "Equipment added."); await load();
    } catch (error) { setMessage(error.response?.data?.error || "Could not save equipment."); }
    finally { setSaving(false); }
  };
  const remove = async (item) => {
    if (!window.confirm(`Delete equipment type “${item.name}”?`)) return;
    try { await deleteEquipment(item._id); setMessage("Equipment deleted."); await load(); }
    catch (error) { setMessage(error.response?.data?.error || "Could not delete equipment."); }
  };
  const filtered = list.filter((equipment) => [equipment.name, equipment.specification, equipment.category?.name].join(" ").toLowerCase().includes(query.trim().toLowerCase()));

  return <>
    <div className="panel equipment-search-panel">
      <input aria-label="Search equipment" placeholder="Search equipment name, specifications or category..." value={query} onChange={(event) => setQuery(event.target.value)} />
      <button type="button" className="primary-btn" onClick={() => setQuery(query.trim())}>⌕ Search</button>
      <button type="button" className="btn-outline" onClick={() => setQuery("")}>↺ Reset</button>
    </div>
    <div className="panel equipment-list-panel">
      <div className="list-header"><h2>💻 Equipment Types</h2><div className="list-header-actions"><ReportActions title="equipment" /><button type="button" className="primary-btn" onClick={openAdd}>＋ Add Equipment</button></div></div>
      {message && <p className="msg" role="status">{message}</p>}
      <table><thead><tr><th>Name</th><th>Specification</th><th>Category</th><th>Consumables</th><th>Purchases</th><th>Total Qty</th><th>Total Value</th><th>Actions</th></tr></thead>
        <tbody>{filtered.map((item) => <tr key={item._id}><td>{item.name}</td><td>{item.specification || "—"}</td><td>{item.category?.name || "—"}</td><td>{item.isConsumable ? "Yes" : "No"}</td><td>{item.purchases ?? 0}</td><td>{item.totalQty ?? 0}</td><td>₹{(item.totalValue || 0).toLocaleString("en-IN")}</td><td><button type="button" className="icon-action" onClick={() => openEdit(item)} title="Edit">✏️</button><button type="button" className="icon-action danger-action" onClick={() => remove(item)} title="Delete">🗑️</button></td></tr>)}
          {filtered.length === 0 && <tr><td colSpan="8">No equipment types match your search.</td></tr>}</tbody></table>
    </div>
    {showModal && <Modal title={editing ? "Edit Equipment Type" : "Add Equipment Type"} icon="💻" onClose={() => setShowModal(false)}><form onSubmit={handleSubmit} className="modal-form">
      {message && <p className="msg" role="alert">{message}</p>}
      <label>Equipment Name *</label><input maxLength="120" placeholder="e.g. Desktop Computer i5" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
      <label>Specifications</label><input maxLength="500" placeholder="Processor, memory, size..." value={form.specification} onChange={(event) => setForm({ ...form, specification: event.target.value })} />
      <label>Category *</label><select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} required><option value="">Select category</option>{cats.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}</select>
      <label>Asset code prefix</label><input maxLength="12" placeholder="e.g. DESK" value={form.codePrefix} onChange={(event) => setForm({ ...form, codePrefix: event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "") })} />
      <label>Low stock alert level</label><input type="number" min="0" max="1000000" value={form.lowStockThreshold} onChange={(event) => setForm({ ...form, lowStockThreshold: event.target.value })} />
      <label className="checkbox-label"><input type="checkbox" checked={form.isConsumable} onChange={(event) => setForm({ ...form, isConsumable: event.target.checked })} /> Uses toner/ink</label>
      <div className="modal-actions"><button type="submit" className="primary-btn" disabled={saving}>{saving ? "Saving…" : editing ? "Save Changes" : "Save Equipment"}</button><button type="button" className="btn-outline" onClick={() => setShowModal(false)}>Cancel</button></div>
    </form></Modal>}
  </>;
}
