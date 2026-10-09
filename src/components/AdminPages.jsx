import React, { useEffect, useState } from "react";
import {
  addUser, deleteUser, getAuditLogs, getCompanyProfile, getDepartments, getUsers,
  updateCompanyProfile, updateUser,
} from "../api";
import ReportActions from "./ReportActions";

const PROFILE_FIELDS = [
  ["name", "Institute name"],
  ["subtitle", "Subtitle"],
  ["orgCode", "Asset code prefix"],
  ["address", "Address"],
  ["phone", "Phone"],
  ["email", "Email"],
];

export function CompanyProfilePage() {
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState("");
  useEffect(() => { getCompanyProfile().then(setProfile).catch(() => setMessage("Could not load company profile.")); }, []);

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");
    try {
      setProfile(await updateCompanyProfile(profile));
      setMessage("Company profile saved.");
    } catch (error) {
      setMessage(error.response?.data?.error || "Could not save company profile.");
    }
  };

  if (!profile) return <div className="panel">Loading company profile...</div>;
  return (
    <div className="panel admin-panel">
      <div className="list-header"><h2>🏢 Company Profile</h2><span className="msg">Used in asset codes and reports</span></div>
      <form onSubmit={submit} className="admin-form-grid">
        {PROFILE_FIELDS.map(([key, label]) => (
          <label key={key}>{label}<input value={profile[key] || ""} onChange={(event) => setProfile({ ...profile, [key]: event.target.value })} /></label>
        ))}
        <div className="admin-form-actions"><button className="primary-btn" type="submit">Save Profile</button>{message && <span className="msg">{message}</span>}</div>
      </form>
    </div>
  );
}

export function UsersPage() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [edits, setEdits] = useState({});
  const [message, setMessage] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", username: "", email: "", password: "", role: "Department User", department: "" });
  const load = () => Promise.all([getUsers(), getDepartments()]).then(([userList, departmentList]) => {
    setUsers(userList);
    setDepartments(departmentList);
    setEdits(Object.fromEntries(userList.map((user) => [user._id, {
      role: user.role, department: user.department?._id || "", active: user.active !== false,
    }])));
  }).catch(() => setMessage("Could not load users. Administrator access is required."));
  useEffect(() => { load(); }, []);

  const save = async (user) => {
    try {
      const edit = edits[user._id];
      await updateUser(user._id, { ...edit, department: edit.department || null });
      setMessage(`Updated ${user.name}.`);
      load();
    } catch (error) {
      setMessage(error.response?.data?.error || "Could not update user.");
    }
  };
  const remove = async (user) => {
    if (!window.confirm(`Delete ${user.name}?`)) return;
    try {
      await deleteUser(user._id);
      setMessage(`Deleted ${user.name}.`);
      load();
    } catch (error) {
      setMessage(error.response?.data?.error || "Could not delete user.");
    }
  };
  const editField = (id, field, value) => setEdits((current) => ({ ...current, [id]: { ...current[id], [field]: value } }));
  const createUser = async (event) => {
    event.preventDefault();
    setMessage("");
    try {
      await addUser({ ...newUser, department: newUser.department || undefined });
      setNewUser({ name: "", username: "", email: "", password: "", role: "Department User", department: "" });
      setShowAdd(false);
      setMessage("User account created.");
      await load();
    } catch (error) {
      setMessage(error.response?.data?.error || "Could not create user.");
    }
  };

  return (
    <div className="panel admin-panel">
      <div className="list-header"><h2>👥 User Management</h2><div className="list-header-actions"><span className="qty-badge">{users.length} users</span><button className="primary-btn" onClick={() => setShowAdd(true)}>＋ Add User</button></div></div>
      {message && <p className="msg">{message}</p>}
      <table>
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>{users.map((user) => {
          const edit = edits[user._id] || {};
          return <tr key={user._id}>
            <td><strong>{user.name}</strong></td><td>{user.email}</td>
            <td><select aria-label={`Role for ${user.name}`} value={edit.role || user.role} onChange={(event) => editField(user._id, "role", event.target.value)}>
              <option>Administrator</option><option>Store Manager</option><option>Department User</option>
            </select></td>
            <td><select aria-label={`Department for ${user.name}`} value={edit.department || ""} onChange={(event) => editField(user._id, "department", event.target.value)}>
              <option value="">All / none</option>{departments.map((department) => <option key={department._id} value={department._id}>{department.code}</option>)}
            </select></td>
            <td><select aria-label={`Status for ${user.name}`} value={edit.active === false ? "false" : "true"} onChange={(event) => editField(user._id, "active", event.target.value === "true")}><option value="true">Active</option><option value="false">Inactive</option></select></td>
            <td><button className="icon-action" onClick={() => save(user)} title="Save changes">✓</button><button className="icon-action danger-action" onClick={() => remove(user)} title="Delete user">×</button></td>
          </tr>;
        })}{users.length === 0 && <tr><td colSpan="6">No users found.</td></tr>}</tbody>
      </table>
      {showAdd && <div className="modal-overlay" onClick={() => setShowAdd(false)}><section className="modal-card" style={{ maxWidth: 500 }} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="add-user-heading">
        <div className="modal-head"><div className="modal-title"><h3 id="add-user-heading">＋ Add User</h3></div><button type="button" className="icon-btn" aria-label="Close" onClick={() => setShowAdd(false)}>×</button></div>
        <div className="modal-body" style={{ paddingTop: 16, paddingBottom: 4 }}>
        <form className="modal-form" onSubmit={createUser}>
          <label>Full name *</label><input autoComplete="name" value={newUser.name} onChange={(event) => setNewUser({ ...newUser, name: event.target.value })} maxLength="100" required />
          <label>Username *</label><input autoComplete="username" value={newUser.username} onChange={(event) => setNewUser({ ...newUser, username: event.target.value.toLowerCase() })} pattern="[a-z0-9._-]{3,30}" title="3–30 lowercase letters, numbers, dots, underscores, or hyphens" required />
          <label>Email *</label><input type="email" autoComplete="email" value={newUser.email} onChange={(event) => setNewUser({ ...newUser, email: event.target.value })} maxLength="254" required />
          <label>Temporary password *</label><input type="password" autoComplete="new-password" minLength="8" value={newUser.password} onChange={(event) => setNewUser({ ...newUser, password: event.target.value })} required />
          <label>Role *</label><select value={newUser.role} onChange={(event) => setNewUser({ ...newUser, role: event.target.value })}><option>Department User</option><option>Store Manager</option><option>Administrator</option></select>
          <label>Department</label><select value={newUser.department} onChange={(event) => setNewUser({ ...newUser, department: event.target.value })}><option value="">No department</option>{departments.map((department) => <option key={department._id} value={department._id}>{department.code} — {department.description}</option>)}</select>
          <div className="modal-actions"><button className="primary-btn" type="submit">Create User</button><button type="button" className="btn-outline" onClick={() => setShowAdd(false)}>Cancel</button></div>
        </form>
        </div>
      </section></div>}
    </div>
  );
}

export function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [message, setMessage] = useState("");
  const [filters, setFilters] = useState({ search: "", from: "", to: "" });
  useEffect(() => { getAuditLogs().then(setLogs).catch(() => setMessage("Could not load audit log.")); }, []);
  const visible = logs.filter((log) => {
    const date = new Date(log.createdAt).toISOString().slice(0, 10);
    const text = `${log.action} ${log.entity || ""} ${log.performedBy || ""} ${log.details || ""}`.toLowerCase();
    return (!filters.from || date >= filters.from) && (!filters.to || date <= filters.to) && text.includes(filters.search.trim().toLowerCase());
  });
  return (
    <div className="panel admin-panel">
      <div className="list-header"><h2>🕘 Audit Log</h2><div className="list-header-actions"><span className="qty-badge">{visible.length} shown · {logs.length} latest records</span><ReportActions title="audit log" /></div></div>
      {message && <p className="msg">{message}</p>}
      <div className="equipment-search-panel">
        <input aria-label="Search audit history" placeholder="Search action, user, entity or details" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
        <input aria-label="From date" type="date" value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value })} />
        <input aria-label="To date" type="date" value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value })} />
        <button type="button" className="btn-outline" onClick={() => setFilters({ search: "", from: "", to: "" })}>↺ Reset</button>
      </div>
      <table>
        <thead><tr><th>Date &amp; time</th><th>Action</th><th>Entity</th><th>Performed by</th><th>Details</th></tr></thead>
        <tbody>{visible.map((log) => <tr key={log._id}>
          <td>{new Date(log.createdAt).toLocaleString("en-GB")}</td><td><span className="badge-code">{log.action}</span></td>
          <td>{log.entity || "—"}</td><td>{log.performedBy || "system"}</td><td>{log.details || "—"}</td>
        </tr>)}{visible.length === 0 && <tr><td colSpan="5">No audit events match these filters.</td></tr>}</tbody>
      </table>
    </div>
  );
}
