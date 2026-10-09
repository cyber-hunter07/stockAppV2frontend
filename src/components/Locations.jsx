import React, { useEffect, useState } from "react";
import { getLocations, addLocation, updateLocation, deleteLocation, getDepartments } from "../api";

const empty = { name: "", type: "", department: "", areaFloor: "", description: "" };

export default function Locations() {
  const [list, setList] = useState([]);
  const [depts, setDepts] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState("");
  const load = async () => {
    try { const [locations, departments] = await Promise.all([getLocations(), getDepartments()]); setList(locations); setDepts(departments); }
    catch (error) { setMessage(error.response?.data?.error || "Could not load locations."); }
  };
  useEffect(() => { load(); }, []);
  const submit = async (event) => {
    event.preventDefault(); setMessage("");
    try {
      const payload = { ...form, name: form.name.trim(), areaFloor: form.areaFloor.trim(), description: form.description.trim() };
      if (editing) await updateLocation(editing, payload); else await addLocation(payload);
      setForm(empty); setEditing(null); setMessage(editing ? "Location updated." : "Location added."); await load();
    } catch (error) { setMessage(error.response?.data?.error || "Could not save location."); }
  };
  const edit = (location) => { setEditing(location._id); setForm({ name: location.name || "", type: location.type || "", department: location.department?._id || "", areaFloor: location.areaFloor || "", description: location.description || "" }); setMessage(""); };
  const remove = async (location) => {
    if (!window.confirm(`Delete location “${location.name}”?`)) return;
    try { await deleteLocation(location._id); setMessage("Location deleted."); await load(); }
    catch (error) { setMessage(error.response?.data?.error || "Could not delete location."); }
  };
  return <div className="panel">
    <div className="list-header"><h2>📍 Locations</h2><span className="qty-badge">{list.length} locations</span></div>
    {message && <p className="msg" role="status">{message}</p>}
    <form onSubmit={submit} className="stock-form">
      <input placeholder="Location name *" maxLength="120" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
      <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} required><option value="">Location type *</option><option value="Lab">Lab</option><option value="Office">Office</option><option value="Store">Store</option><option value="Staff Room">Staff Room</option><option value="Classroom">Classroom</option></select>
      <select value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })}><option value="">Department (optional)</option>{depts.map((department) => <option key={department._id} value={department._id}>{department.code}</option>)}</select>
      <input placeholder="Area / Floor" maxLength="120" value={form.areaFloor} onChange={(event) => setForm({ ...form, areaFloor: event.target.value })} />
      <button type="submit" className="primary-btn">{editing ? "Save Location" : "+ Add Location"}</button>
      {editing && <button type="button" className="btn-outline" onClick={() => { setEditing(null); setForm(empty); }}>Cancel</button>}
    </form>
    <table><thead><tr><th>Location</th><th>Type</th><th>Department</th><th>Area/Floor</th><th>Current Stock</th><th>Actions</th></tr></thead><tbody>
      {list.map((location) => <tr key={location._id}><td>{location.name} {location.isCentralStore && <span className="qty-badge">Central Store</span>}{location.isScrapStore && <span className="qty-badge">Scrap Store</span>}</td><td>{location.type || "—"}</td><td>{location.department?.code || "—"}</td><td>{location.areaFloor || "—"}</td><td>{location.currentStock ?? 0}</td><td><button type="button" className="icon-action" onClick={() => edit(location)} title="Edit">✏️</button><button type="button" className="icon-action danger-action" onClick={() => remove(location)} title="Delete">🗑️</button></td></tr>)}
      {list.length === 0 && <tr><td colSpan="6">No locations found.</td></tr>}
    </tbody></table>
  </div>;
}
