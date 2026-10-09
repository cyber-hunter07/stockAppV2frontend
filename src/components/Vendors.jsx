import React, { useEffect, useState } from "react";
import { getVendors, addVendor, updateVendor, deleteVendor } from "../api";

const empty = { companyName: "", gstNumber: "", contactPerson: "", address: "", city: "", state: "", pincode: "", phone: "", mobile: "", email: "", website: "", remarks: "" };

export default function Vendors() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState("");
  const load = async () => { try { setList(await getVendors()); } catch (error) { setMessage(error.response?.data?.error || "Could not load vendors."); } };
  useEffect(() => { load(); }, []);
  const submit = async (event) => {
    event.preventDefault(); setMessage("");
    try {
      const payload = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, typeof value === "string" ? value.trim() : value]));
      if (editing) await updateVendor(editing, payload); else await addVendor(payload);
      setForm(empty); setEditing(null); setMessage(editing ? "Vendor updated." : "Vendor added."); await load();
    } catch (error) { setMessage(error.response?.data?.error || "Could not save vendor."); }
  };
  const edit = (vendor) => { setEditing(vendor._id); setForm({ ...empty, ...Object.fromEntries(Object.keys(empty).map((key) => [key, vendor[key] || ""])) }); setMessage(""); };
  const remove = async (vendor) => {
    if (!window.confirm(`Delete vendor “${vendor.companyName}”?`)) return;
    try { await deleteVendor(vendor._id); setMessage("Vendor deleted."); await load(); }
    catch (error) { setMessage(error.response?.data?.error || "Could not delete vendor."); }
  };
  const toggleActive = async (vendor) => {
    try { await updateVendor(vendor._id, { active: vendor.active === false }); setMessage(`Vendor marked ${vendor.active === false ? "active" : "inactive"}.`); await load(); }
    catch (error) { setMessage(error.response?.data?.error || "Could not update vendor status."); }
  };
  return <>
    <div className="panel"><div className="list-header"><h2>🚚 Vendors / Suppliers</h2><span className="qty-badge">{list.length} vendors</span></div>
      {message && <p className="msg" role="status">{message}</p>}
      <form onSubmit={submit} className="stock-form">
        <input placeholder="Company Name *" maxLength="160" value={form.companyName} onChange={(event) => setForm({ ...form, companyName: event.target.value })} required />
        <input placeholder="GST Number" maxLength="20" value={form.gstNumber} onChange={(event) => setForm({ ...form, gstNumber: event.target.value.toUpperCase() })} />
        <input placeholder="Contact Person" maxLength="120" value={form.contactPerson} onChange={(event) => setForm({ ...form, contactPerson: event.target.value })} />
        <input placeholder="City" maxLength="100" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
        <input placeholder="Phone" maxLength="20" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
        <input type="email" placeholder="Email" maxLength="160" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        <button type="submit" className="primary-btn">{editing ? "Save Vendor" : "+ Add Vendor"}</button>
        {editing && <button type="button" className="btn-outline" onClick={() => { setEditing(null); setForm(empty); }}>Cancel</button>}
      </form>
      <table><thead><tr><th>Company</th><th>Contact</th><th>Phone</th><th>Email</th><th>City</th><th>Status</th><th>Actions</th></tr></thead><tbody>
        {list.map((vendor) => <tr key={vendor._id}><td>{vendor.companyName}</td><td>{vendor.contactPerson || "—"}</td><td>{vendor.phone || "—"}</td><td>{vendor.email || "—"}</td><td>{vendor.city || "—"}</td><td>{vendor.active === false ? "Inactive" : "Active"}</td><td><button type="button" className="icon-action" onClick={() => edit(vendor)} title="Edit">✏️</button><button type="button" className="btn-outline" onClick={() => toggleActive(vendor)}>{vendor.active === false ? "Activate" : "Deactivate"}</button><button type="button" className="icon-action danger-action" onClick={() => remove(vendor)} title="Delete">🗑️</button></td></tr>)}
        {list.length === 0 && <tr><td colSpan="7">No vendors found.</td></tr>}
      </tbody></table>
    </div>
  </>;
}
