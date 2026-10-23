import React, { useCallback, useEffect, useState } from "react";
import {
  addConsumable, addMaintenance, addPowerUnit, addQuotation, deletePowerUnit, deleteQuotation, downloadCsv,
  deleteAssetCode, distributeAssets, getAssetCodes, getConsumables,
  getCompanyProfile, getDepartments, getEquipment, getLegacyStock, getLocations, getMaintenance, getPowerUnits, getPurchases, getQuotations, getScrapList, getScrapRequests, getStockMovements,
  getVendors, reviewScrapRequest, stockMoveAssets, submitScrapRequest, transferAssets, updateAssetCode, updateConsumable, downloadScrapCertificate,
  updateMaintenance, updatePowerUnit, updateQuotation,
} from "../api";
import { useAuth } from "../context/AuthContext";
import Modal from "./Modal";
import ReportActions from "./ReportActions";

const money = (value) => `₹${(Number(value) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const date = (value) => value ? new Date(value).toLocaleDateString("en-GB") : "—";
const ACCEPTED_DOCUMENT_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const readAttachment = (file, label) => new Promise((resolve, reject) => {
  if (!file) return resolve(undefined);
  if (!ACCEPTED_DOCUMENT_TYPES.includes(file.type)) return reject(new Error(label + " must be a PDF, JPG, PNG, or WebP file."));
  if (file.size > 2 * 1024 * 1024) return reject(new Error(label + " must be 2 MB or smaller."));
  const reader = new FileReader(); reader.onerror = () => reject(new Error("Could not read " + label.toLowerCase() + "."));
  reader.onload = () => resolve({ name: file.name, mimeType: file.type, dataUrl: reader.result }); reader.readAsDataURL(file);
});

export function AssetCodesPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [legacy, setLegacy] = useState({ items: [], transactions: [] });
  const [equipment, setEquipment] = useState([]);
  const [locations, setLocations] = useState([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [equipmentFilter, setEquipmentFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ code: "", serialNo: "", unitCost: 0, remarks: "" });
  const [message, setMessage] = useState("");
  const load = () => Promise.all([getAssetCodes(), getEquipment(), getLocations(), getLegacyStock()]).then(([codes, types, rooms, legacyData]) => { setRows(codes); setEquipment(types); setLocations(rooms); setLegacy(legacyData); }).catch((error) => setMessage(error.response?.data?.error || "Could not load asset register."));
  useEffect(() => { load(); }, []);
  const filtered = rows.filter((row) => (!status || row.status === status) && (!equipmentFilter || row.equipment?._id === equipmentFilter) && (!locationFilter || row.location?._id === locationFilter) &&
    `${row.code} ${row.equipment?.name || ""} ${row.location?.name || ""} ${row.department?.code || ""}`.toLowerCase().includes(query.toLowerCase()));
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const shown = filtered.slice((page - 1) * pageSize, page * pageSize);
  const startEdit = (row) => { setEditing(row); setForm({ code: row.code || "", serialNo: row.serialNo || "", unitCost: row.unitCost ?? 0, remarks: row.remarks || "" }); };
  const saveEdit = async (event) => { event.preventDefault(); try { await updateAssetCode(editing._id, { ...form, unitCost: Number(form.unitCost) }); setMessage("Asset details updated."); setEditing(null); await load(); } catch (error) { setMessage(error.response?.data?.error || "Could not update asset."); } };
  const remove = async (row) => { if (!window.confirm(`Delete asset ${row.code}? This cannot be undone.`)) return; try { await deleteAssetCode(row._id); setMessage("Asset code deleted."); await load(); } catch (error) { setMessage(error.response?.data?.error || "Could not delete asset code."); } };
  return <>
    <div className="panel equipment-search-panel"><input aria-label="Search asset register" placeholder="Search asset code, equipment or location..." value={query} onChange={(e) => setQuery(e.target.value)} />
      <select aria-label="Filter status" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option><option value="in_store">In store</option><option value="issued">Issued</option><option value="transferred">Transferred</option><option value="maintenance">Maintenance</option><option value="scrap">Scrap</option></select>
      <select aria-label="Filter equipment" value={equipmentFilter} onChange={(e) => setEquipmentFilter(e.target.value)}><option value="">All equipment</option>{equipment.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select>
      <select aria-label="Filter location" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}><option value="">All locations</option>{locations.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select>
      <button className="btn-outline" onClick={() => { setQuery(""); setStatus(""); setEquipmentFilter(""); setLocationFilter(""); setPage(1); }}>↺ Reset</button></div>
    <div className="panel"><div className="list-header"><h2>🏷️ Asset Register</h2><div className="list-header-actions"><span className="qty-badge">{filtered.length} assets</span><label>Rows <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}><option value="25">25</option><option value="50">50</option><option value="100">100</option></select></label></div></div>
      {message && <p className="msg" role="status">{message}</p>}
      <table><thead><tr><th>Asset code</th><th>Equipment</th><th>Location</th><th>Department</th><th>Status</th><th>Purchase date</th><th>Value</th><th>Actions</th></tr></thead>
        <tbody>{shown.map((row) => <tr key={row._id}><td><span className="badge-code">{row.code}</span></td><td>{row.equipment?.name || "—"}</td><td>{row.location?.name || "—"}</td><td>{row.department?.code || "—"}</td><td><span className="status-pill">{row.status?.replace("_", " ")}</span></td><td>{date(row.purchaseDate)}</td><td>{money(row.unitCost)}</td><td><button type="button" className="icon-action" onClick={() => startEdit(row)} title="Edit">✏️</button>{user?.role === "Administrator" && <button type="button" className="icon-action danger-action" onClick={() => remove(row)} title="Delete">🗑️</button>}</td></tr>)}
          {shown.length === 0 && <tr><td colSpan="8">No asset codes found.</td></tr>}</tbody></table>
      <div className="list-header"><span>Showing {filtered.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}</span><div className="list-header-actions"><button className="btn-outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {pages}</span><button className="btn-outline" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button></div></div>
    </div>
    {legacy.items.length > 0 && <div className="panel">
      <div className="list-header"><div><h2>📦 Legacy Quantity Stock</h2><p className="msg">These records are preserved from the previous stock ledger and remain separate from individually tagged asset codes.</p></div><span className="qty-badge">{legacy.items.length} records</span></div>
      {legacy.items.some((item) => item.reconciles === false) && <p className="error" role="alert">Some saved quantities do not match their recorded opening quantity plus transaction changes. Review the legacy ledger before migrating; no stock values have been changed.</p>}
      <p className="msg">Ledger in/out values are changes, not a current balance. Reconciliation is only possible when an opening quantity was recorded.</p>
      <table><thead><tr><th>Item</th><th>Category</th><th>Location</th><th>Saved Qty</th><th>Ledger In</th><th>Ledger Out</th><th>Net Change</th><th>Reconciliation</th></tr></thead><tbody>
        {legacy.items.map((item) => <tr key={item._id}><td>{item.itemName}</td><td>{item.categoryName}</td><td>{item.location}</td><td>{item.quantity} {item.unit}</td><td>{item.stockIn}</td><td>{item.stockOut}</td><td>{item.ledgerNet}</td><td><span className={`status-pill ${item.reconciles === false ? "inactive" : ""}`}>{item.reconciles === true ? "Matched" : item.reconciles === false ? "Review needed" : "Opening quantity not recorded"}</span></td></tr>)}
      </tbody></table>
      <h3>Previous Stock Transactions</h3>
      <table><thead><tr><th>Date</th><th>Item</th><th>Type</th><th>Quantity</th><th>From</th><th>To / issued to</th><th>Reason</th><th>Notes</th></tr></thead><tbody>
        {legacy.transactions.map((item) => <tr key={item._id}><td>{date(item.createdAt)}</td><td>{item.itemName}</td><td>{item.type?.replace("stock_", "").toUpperCase() || "—"}</td><td>{item.quantity}</td><td>{item.fromLocation || "—"}</td><td>{item.toLocation || item.issuedTo || "—"}</td><td>{item.reason || "—"}</td><td>{item.notes || "—"}</td></tr>)}
        {legacy.transactions.length === 0 && <tr><td colSpan="8">No legacy transactions recorded.</td></tr>}
      </tbody></table>
    </div>}
    {editing && <Modal title={`Edit ${editing.code}`} icon="🏷️" onClose={() => setEditing(null)}><form className="modal-form" onSubmit={saveEdit}>
      <label>Asset code *</label><input required minLength="3" maxLength="40" pattern="[A-Za-z0-9-]+" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
      <label>Serial number</label><input maxLength="120" value={form.serialNo} onChange={(e) => setForm({ ...form, serialNo: e.target.value })} />
      <label>Unit cost</label><input type="number" min="0" step="0.01" value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: e.target.value })} />
      <label>Remarks</label><input maxLength="1000" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
      <div className="modal-actions"><button className="primary-btn">Save Changes</button><button type="button" className="btn-outline" onClick={() => setEditing(null)}>Cancel</button></div>
    </form></Modal>}
  </>;
}

export function UpsPowerPage() {
  const { user } = useAuth();
  const empty = { assetCode: "", makeModel: "", kvaRating: 0, batteryCount: 0, backupMinutes: 0, loadWatts: 0, location: "", installedDate: "", lastServiceDate: "", status: "working", remarks: "" };
  const [rows, setRows] = useState([]); const [assets, setAssets] = useState([]); const [locations, setLocations] = useState([]);
  const [form, setForm] = useState(empty); const [editing, setEditing] = useState(null); const [open, setOpen] = useState(false); const [message, setMessage] = useState("");
  const load = () => Promise.all([getPowerUnits(), getAssetCodes(), getLocations()]).then(([power, codes, rooms]) => { setRows(power); setAssets(codes.filter((asset) => asset.status !== "scrap" && /ups|power/i.test(`${asset.equipment?.name || ""} ${asset.equipment?.specification || ""}`))); setLocations(rooms); }).catch((error) => setMessage(error.response?.data?.error || "Could not load UPS records."));
  useEffect(() => { load(); }, []);
  const openAdd = () => { setEditing(null); setForm(empty); setOpen(true); setMessage(""); };
  const openEdit = (record) => { setEditing(record._id); setForm({ ...empty, ...record, assetCode: record.assetCode?._id || "", location: record.location?._id || "", installedDate: record.installedDate ? new Date(record.installedDate).toISOString().slice(0, 10) : "", lastServiceDate: record.lastServiceDate ? new Date(record.lastServiceDate).toISOString().slice(0, 10) : "" }); setOpen(true); setMessage(""); };
  const submit = async (event) => { event.preventDefault(); try { const payload = { ...form, kvaRating: Number(form.kvaRating), batteryCount: Number(form.batteryCount), backupMinutes: Number(form.backupMinutes), loadWatts: Number(form.loadWatts) }; if (editing) await updatePowerUnit(editing, payload); else await addPowerUnit(payload); setOpen(false); setMessage(editing ? "UPS record updated." : "UPS record saved."); await load(); } catch (error) { setMessage(error.response?.data?.error || "Could not save UPS record."); } };
  const remove = async (record) => { if (!window.confirm(`Delete UPS register entry for ${record.assetCode?.code}?`)) return; try { await deletePowerUnit(record._id); setMessage("UPS register entry deleted."); await load(); } catch (error) { setMessage(error.response?.data?.error || "Could not delete UPS record."); } };
  const allowed = ["Administrator", "Store Manager"].includes(user?.role);
  return <>
    <div className="panel"><div className="list-header"><h2>🔋 UPS / Power Register</h2><div className="list-header-actions"><ReportActions title="UPS register" />{allowed && <button type="button" className="primary-btn" onClick={openAdd}>＋ Add UPS</button>}</div></div>
      <p className="msg">Track UPS assets, capacity, battery count, backup time, load, service dates and current condition.</p>{message && <p className="msg" role="status">{message}</p>}
      <table><thead><tr><th>Asset code</th><th>Equipment / model</th><th>Location</th><th>KVA</th><th>Batteries</th><th>Backup</th><th>Load (W)</th><th>Status</th><th>Actions</th></tr></thead><tbody>
        {rows.map((record) => <tr key={record._id}><td>{record.assetCode?.code || "—"}</td><td>{record.assetCode?.equipment?.name || "—"}<div className="dash-subtext">{record.makeModel}</div></td><td>{record.location?.name || "—"}</td><td>{record.kvaRating}</td><td>{record.batteryCount}</td><td>{record.backupMinutes} min</td><td>{record.loadWatts}</td><td><span className={`status-pill ${record.status === "not_working" ? "inactive" : ""}`}>{record.status?.replaceAll("_", " ")}</span></td><td>{allowed && <button type="button" className="icon-action" onClick={() => openEdit(record)} title="Edit">✏️</button>}{user?.role === "Administrator" && <button type="button" className="icon-action danger-action" onClick={() => remove(record)} title="Delete">🗑️</button>}</td></tr>)}
        {rows.length === 0 && <tr><td colSpan="9">No UPS records yet. Add an active UPS or power asset to start its register.</td></tr>}
      </tbody></table>
      {rows.length > 0 && <div className="panel-header-row"><strong>UPS load overview</strong><span className="qty-badge">{rows.filter((row) => row.status === "not_working").length} not working · {rows.filter((row) => row.status === "needs_service").length} need service</span></div>}
    </div>
    {open && <Modal title={editing ? "Edit UPS Register Entry" : "Add UPS"} icon="🔋" onClose={() => setOpen(false)}><form className="modal-form" onSubmit={submit}>
      <label>UPS asset code *</label><select required value={form.assetCode} onChange={(event) => setForm({ ...form, assetCode: event.target.value })}><option value="">Select UPS asset</option>{assets.map((asset) => <option key={asset._id} value={asset._id}>{asset.code} — {asset.equipment?.name}</option>)}</select>
      <label>Make / model</label><input maxLength="160" value={form.makeModel} onChange={(event) => setForm({ ...form, makeModel: event.target.value })} />
      <label>Capacity (KVA)</label><input type="number" min="0" step="0.01" value={form.kvaRating} onChange={(event) => setForm({ ...form, kvaRating: event.target.value })} />
      <label>Battery count</label><input type="number" min="0" step="1" value={form.batteryCount} onChange={(event) => setForm({ ...form, batteryCount: event.target.value })} />
      <label>Backup time (minutes)</label><input type="number" min="0" step="1" value={form.backupMinutes} onChange={(event) => setForm({ ...form, backupMinutes: event.target.value })} />
      <label>Load (watts)</label><input type="number" min="0" step="0.01" value={form.loadWatts} onChange={(event) => setForm({ ...form, loadWatts: event.target.value })} />
      <label>Location</label><select value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })}><option value="">Select location</option>{locations.map((location) => <option key={location._id} value={location._id}>{location.name}</option>)}</select>
      <label>Installed date</label><input type="date" value={form.installedDate} onChange={(event) => setForm({ ...form, installedDate: event.target.value })} />
      <label>Last service date</label><input type="date" value={form.lastServiceDate} onChange={(event) => setForm({ ...form, lastServiceDate: event.target.value })} />
      <label>Status</label><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="working">Working</option><option value="needs_service">Needs service</option><option value="not_working">Not working</option></select>
      <label>Remarks</label><textarea maxLength="1000" value={form.remarks} onChange={(event) => setForm({ ...form, remarks: event.target.value })} />
      <div className="modal-actions"><button className="primary-btn">{editing ? "Save Changes" : "Save UPS"}</button><button type="button" className="btn-outline" onClick={() => setOpen(false)}>Cancel</button></div>
    </form></Modal>}
  </>;
}

export function ReportsPage() {
  const [assets, setAssets] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [locations, setLocations] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [consumables, setConsumables] = useState([]);
  const [movements, setMovements] = useState([]);
  const [scrap, setScrap] = useState([]);
  const [report, setReport] = useState("assets");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ status: "", equipment: "", location: "" });
  const [message, setMessage] = useState("");
  useEffect(() => {
    Promise.all([getAssetCodes(), getEquipment(), getLocations(), getPurchases(), getMaintenance(), getConsumables(), getStockMovements(), getScrapList()])
      .then(([codes, types, rooms, purchaseRows, serviceRows, consumableRows, movementRows, scrapRows]) => { setAssets(codes); setEquipment(types); setLocations(rooms); setPurchases(purchaseRows); setMaintenance(serviceRows); setConsumables(consumableRows); setMovements(movementRows); setScrap(scrapRows); })
      .catch((error) => setMessage(error.response?.data?.error || "Could not load report data."));
  }, []);
  const assetRows = assets.filter((asset) => (!filters.status || asset.status === filters.status) &&
    (!filters.equipment || asset.equipment?._id === filters.equipment) &&
    (!filters.location || asset.location?._id === filters.location) &&
    `${asset.code} ${asset.equipment?.name || ""} ${asset.location?.name || ""} ${asset.department?.code || ""}`.toLowerCase().includes(search.trim().toLowerCase()));
  const purchaseRows = purchases.filter((row) => `${row.invoiceNumber || ""} ${row.vendor?.companyName || ""} ${row.items?.map((item) => item.equipment?.name).join(" ") || ""}`.toLowerCase().includes(search.trim().toLowerCase()));
  const maintenanceRows = maintenance.filter((row) => `${row.assetCode?.code || ""} ${row.assetCode?.equipment?.name || ""} ${row.issue || ""} ${row.serviceEngineer || ""}`.toLowerCase().includes(search.trim().toLowerCase()));
  const consumableRows = consumables.filter((row) => `${row.equipment?.name || ""} ${row.assetCode?.code || ""} ${row.modelName || ""}`.toLowerCase().includes(search.trim().toLowerCase()));
  const movementRows = movements.filter((row) => `${row.type || ""} ${row.reason || ""} ${row.items?.map((item) => item.assetCode?.code).join(" ") || ""}`.toLowerCase().includes(search.trim().toLowerCase()));
  const scrapRows = scrap.filter((row) => `${row.code || ""} ${row.equipment?.name || ""} ${row.remarks || ""}`.toLowerCase().includes(search.trim().toLowerCase()));
  const totalValue = assetRows.reduce((sum, asset) => sum + (Number(asset.unitCost) || 0), 0);
  const tabs = [["assets", "Asset Register"], ["purchases", "Purchases"], ["maintenance", "Maintenance"], ["consumables", "Consumables"], ["movements", "Stock Movements"], ["scrap", "Scrap Stock"]];
  const currentCount = { assets: assetRows.length, purchases: purchaseRows.length, maintenance: maintenanceRows.length, consumables: consumableRows.length, movements: movementRows.length, scrap: scrapRows.length }[report];
  return <>
    <div className="panel"><div className="list-header"><h2>📈 Stock Reports</h2><ReportActions title="stock report" /></div>
      <p className="msg">Choose a report to review live stock and operations data. Search and available filters apply to the selected report.</p>
      {message && <p className="error" role="alert">{message}</p>}
      <div className="list-header-actions report-tabs">{tabs.map(([key, label]) => <button type="button" key={key} className={report === key ? "primary-btn" : "btn-outline"} onClick={() => setReport(key)}>{label}</button>)}</div>
      <div className="equipment-search-panel"><input aria-label="Search report" placeholder="Search this report..." value={search} onChange={(event) => setSearch(event.target.value)} />
        {report === "assets" && <><select aria-label="Status" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">All statuses</option><option value="in_store">In store</option><option value="issued">Issued</option><option value="transferred">Transferred</option><option value="maintenance">Maintenance</option><option value="scrap">Scrap</option></select><select aria-label="Equipment type" value={filters.equipment} onChange={(event) => setFilters({ ...filters, equipment: event.target.value })}><option value="">All equipment</option>{equipment.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select><select aria-label="Location" value={filters.location} onChange={(event) => setFilters({ ...filters, location: event.target.value })}><option value="">All locations</option>{locations.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></>}
        <button type="button" className="btn-outline" onClick={() => { setSearch(""); setFilters({ status: "", equipment: "", location: "" }); }}>↺ Reset</button></div>
      <div className="list-header"><span className="qty-badge">{currentCount} records</span>{report === "assets" && <strong>Total value: {money(totalValue)}</strong>}</div>
      {report === "assets" && <table><thead><tr><th>Asset code</th><th>Equipment</th><th>Location</th><th>Department</th><th>Status</th><th>Purchase date</th><th>Unit value</th></tr></thead><tbody>
        {assetRows.map((asset) => <tr key={asset._id}><td><span className="badge-code">{asset.code}</span></td><td>{asset.equipment?.name || "—"}</td><td>{asset.location?.name || "—"}</td><td>{asset.department?.code || "—"}</td><td>{asset.status?.replace("_", " ") || "—"}</td><td>{date(asset.purchaseDate)}</td><td>{money(asset.unitCost)}</td></tr>)}{assetRows.length === 0 && <tr><td colSpan="7">No assets match these report filters.</td></tr>}
      </tbody></table>}
      {report === "purchases" && <table><thead><tr><th>Date</th><th>Invoice</th><th>Vendor</th><th>Items</th><th>Quantity</th><th>Total</th></tr></thead><tbody>{purchaseRows.map((row) => <tr key={row._id}><td>{date(row.purchaseDate)}</td><td>{row.invoiceNumber || "—"}</td><td>{row.vendor?.companyName || "—"}</td><td>{row.items?.map((item) => item.equipment?.name).join(", ") || "—"}</td><td>{row.items?.reduce((sum, item) => sum + item.qty, 0) || 0}</td><td>{money(row.grandTotal)}</td></tr>)}{purchaseRows.length === 0 && <tr><td colSpan="6">No purchase records.</td></tr>}</tbody></table>}
      {report === "maintenance" && <table><thead><tr><th>Date</th><th>Asset</th><th>Equipment</th><th>Issue</th><th>Engineer</th><th>Cost</th><th>Status</th></tr></thead><tbody>{maintenanceRows.map((row) => <tr key={row._id}><td>{date(row.date)}</td><td>{row.assetCode?.code || "—"}</td><td>{row.assetCode?.equipment?.name || "—"}</td><td>{row.issue || "—"}</td><td>{row.serviceEngineer || "—"}</td><td>{money(row.cost)}</td><td>{row.status}</td></tr>)}{maintenanceRows.length === 0 && <tr><td colSpan="7">No maintenance records.</td></tr>}</tbody></table>}
      {report === "consumables" && <table><thead><tr><th>Date</th><th>Equipment</th><th>Asset</th><th>Model</th><th>Cost</th><th>Status</th></tr></thead><tbody>{consumableRows.map((row) => <tr key={row._id}><td>{date(row.installedDate)}</td><td>{row.equipment?.name || "—"}</td><td>{row.assetCode?.code || "—"}</td><td>{row.modelName}</td><td>{money(row.cost)}</td><td>{row.status}</td></tr>)}{consumableRows.length === 0 && <tr><td colSpan="6">No consumable records.</td></tr>}</tbody></table>}
      {report === "movements" && <table><thead><tr><th>Date</th><th>Type</th><th>Assets</th><th>Reason</th><th>Performed by</th></tr></thead><tbody>{movementRows.map((row) => <tr key={row._id}><td>{date(row.createdAt)}</td><td>{row.type?.replace("_", " ")}</td><td>{row.items?.map((item) => item.assetCode?.code).filter(Boolean).join(", ") || "—"}</td><td>{row.reason || "—"}</td><td>{row.performedBy || "—"}</td></tr>)}{movementRows.length === 0 && <tr><td colSpan="5">No movement records.</td></tr>}</tbody></table>}
      {report === "scrap" && <table><thead><tr><th>Asset</th><th>Equipment</th><th>Remarks</th><th>Value</th><th>Last updated</th></tr></thead><tbody>{scrapRows.map((row) => <tr key={row._id}><td>{row.code}</td><td>{row.equipment?.name || "—"}</td><td>{row.remarks || "—"}</td><td>{money(row.unitCost)}</td><td>{date(row.updatedAt)}</td></tr>)}{scrapRows.length === 0 && <tr><td colSpan="5">No scrap records.</td></tr>}</tbody></table>}
    </div>
  </>;
}

export function MaintenancePage() {
  const [rows, setRows] = useState([]);
  const [assets, setAssets] = useState([]);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ assetCode: "", date: new Date().toISOString().slice(0, 10), issue: "", serviceEngineer: "", cost: 0, status: "pending", notes: "" });
  const load = () => Promise.all([getMaintenance(), getAssetCodes()]).then(([records, codes]) => { setRows(records); setAssets(codes.filter((code) => code.status !== "scrap")); });
  useEffect(() => { load(); }, []);
  const submit = async (event) => { event.preventDefault(); try { await addMaintenance({ ...form, cost: Number(form.cost) }); setOpen(false); setMessage("Maintenance record added."); load(); } catch (e) { setMessage(e.response?.data?.error || "Could not save maintenance record."); } };
  const changeStatus = async (row, value) => { try { await updateMaintenance(row._id, { status: value }); load(); } catch (e) { setMessage(e.response?.data?.error || "Could not update status."); } };
  return <>
    <div className="panel"><div className="list-header"><h2>🛠️ Maintenance Records</h2><button className="primary-btn" onClick={() => setOpen(true)}>＋ Add Record</button></div>{message && <p className="msg">{message}</p>}
      <table><thead><tr><th>Date</th><th>Asset</th><th>Issue</th><th>Engineer</th><th>Cost</th><th>Status</th></tr></thead>
        <tbody>{rows.map((row) => <tr key={row._id}><td>{date(row.date)}</td><td>{row.assetCode?.code || "—"}<div className="dash-subtext">{row.assetCode?.equipment?.name}</div></td><td>{row.issue || "—"}</td><td>{row.serviceEngineer || "—"}</td><td>{money(row.cost)}</td><td><select value={row.status} onChange={(e) => changeStatus(row, e.target.value)}><option value="pending">Pending</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option></select></td></tr>)}
          {rows.length === 0 && <tr><td colSpan="6">No maintenance records yet.</td></tr>}</tbody></table></div>
    {open && <Modal title="Add Maintenance Record" icon="🛠️" onClose={() => setOpen(false)}><form className="modal-form" onSubmit={submit}>
      <label>Asset *</label><select required value={form.assetCode} onChange={(e) => setForm({ ...form, assetCode: e.target.value })}><option value="">Select asset</option>{assets.map((a) => <option key={a._id} value={a._id}>{a.code} — {a.equipment?.name}</option>)}</select>
      <label>Date *</label><input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
      <label>Issue</label><input value={form.issue} onChange={(e) => setForm({ ...form, issue: e.target.value })} />
      <label>Service engineer</label><input value={form.serviceEngineer} onChange={(e) => setForm({ ...form, serviceEngineer: e.target.value })} />
      <label>Cost</label><input type="number" min="0" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
      <div className="modal-actions"><button className="primary-btn">Save Record</button><button type="button" className="btn-outline" onClick={() => setOpen(false)}>Cancel</button></div>
    </form></Modal>}
  </>;
}

export function ConsumablesPage() {
  const [rows, setRows] = useState([]);
  const [printers, setPrinters] = useState([]);
  const [assets, setAssets] = useState([]);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ equipment: "", assetCode: "", modelName: "", cost: 0, installedDate: new Date().toISOString().slice(0, 10), status: "installed" });
  const load = () => Promise.all([getConsumables(), getEquipment(), getAssetCodes()]).then(([items, equipment, codes]) => { setRows(items); setPrinters(equipment.filter((item) => item.isConsumable)); setAssets(codes); });
  useEffect(() => { load(); }, []);
  const submit = async (event) => { event.preventDefault(); try { await addConsumable({ ...form, assetCode: form.assetCode || undefined, cost: Number(form.cost) }); setOpen(false); setMessage("Consumable record added."); load(); } catch (e) { setMessage(e.response?.data?.error || "Could not save consumable."); } };
  const setStatus = async (row, status) => { try { await updateConsumable(row._id, { status }); load(); } catch (e) { setMessage(e.response?.data?.error || "Could not update status."); } };
  return <>
    <div className="panel"><div className="list-header"><h2>🧴 Toner &amp; Consumables</h2><button className="primary-btn" onClick={() => setOpen(true)}>＋ Record Consumable</button></div>{message && <p className="msg">{message}</p>}
      <table><thead><tr><th>Installed</th><th>Printer</th><th>Asset code</th><th>Model</th><th>Cost</th><th>Status</th></tr></thead>
        <tbody>{rows.map((row) => <tr key={row._id}><td>{date(row.installedDate)}</td><td>{row.equipment?.name || "—"}</td><td>{row.assetCode?.code || "—"}</td><td>{row.modelName}</td><td>{money(row.cost)}</td><td><select value={row.status} onChange={(e) => setStatus(row, e.target.value)}><option value="installed">Installed</option><option value="needs_toner">Needs toner</option><option value="ordered">Ordered</option></select></td></tr>)}
          {rows.length === 0 && <tr><td colSpan="6">No consumables tracked yet.</td></tr>}</tbody></table></div>
    {open && <Modal title="Record Consumable" icon="🧴" onClose={() => setOpen(false)}><form className="modal-form" onSubmit={submit}>
      <label>Printer type *</label><select required value={form.equipment} onChange={(e) => setForm({ ...form, equipment: e.target.value })}><option value="">Select printer</option>{printers.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}</select>
      <label>Printer asset (optional)</label><select value={form.assetCode} onChange={(e) => setForm({ ...form, assetCode: e.target.value })}><option value="">Select asset</option>{assets.filter((a) => a.equipment?.isConsumable || printers.some((p) => p._id === a.equipment?._id)).map((a) => <option key={a._id} value={a._id}>{a.code}</option>)}</select>
      <label>Consumable model *</label><input required value={form.modelName} onChange={(e) => setForm({ ...form, modelName: e.target.value })} />
      <label>Cost</label><input type="number" min="0" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
      <label>Fitted date</label><input type="date" value={form.installedDate} onChange={(e) => setForm({ ...form, installedDate: e.target.value })} />
      <div className="modal-actions"><button className="primary-btn">Save Consumable</button><button type="button" className="btn-outline" onClick={() => setOpen(false)}>Cancel</button></div>
    </form></Modal>}
  </>;
}

export function QuotationsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [items, setItems] = useState([{ itemName: "", specifications: "", qty: 1 }]);
  const [form, setForm] = useState({ vendor: "", requestDate: new Date().toISOString().slice(0, 10), replyRequiredBy: "", paymentTerms: "", deliveryTerms: "", warrantyExpected: "", additionalNotes: "", billAttachment: undefined });
  const load = () => Promise.all([getQuotations(), getVendors()]).then(([requests, vendorList]) => { setRows(requests); setVendors(vendorList); });
  useEffect(() => { load(); }, []);
  const submit = async (event) => { event.preventDefault(); try { await addQuotation({ ...form, replyRequiredBy: form.replyRequiredBy || undefined, items: items.map((item) => ({ ...item, qty: Number(item.qty) })) }); setOpen(false); setForm({ vendor: "", requestDate: new Date().toISOString().slice(0, 10), replyRequiredBy: "", paymentTerms: "", deliveryTerms: "", warrantyExpected: "", additionalNotes: "", billAttachment: undefined }); setItems([{ itemName: "", specifications: "", qty: 1 }]); setMessage("Quotation request created."); load(); } catch (e) { setMessage(e.response?.data?.error || "Could not create quotation request."); } };
  const statusChange = async (row, status) => { try { await updateQuotation(row._id, { status }); load(); } catch (e) { setMessage(e.response?.data?.error || "Could not update request."); } };
  const remove = async (row) => { if (!window.confirm(`Delete quotation ${row.reference}?`)) return; try { await deleteQuotation(row._id); load(); } catch (e) { setMessage(e.response?.data?.error || "Could not delete request."); } };
  return <>
    <div className="panel"><div className="list-header"><h2>📝 Quotation Requests</h2><button className="primary-btn" onClick={() => setOpen(true)}>＋ New Request</button></div>{message && <p className="msg">{message}</p>}
      <table><thead><tr><th>Reference</th><th>Date</th><th>Vendor</th><th>Items</th><th>Reply by</th><th>Bill</th><th>Status</th>{user?.role === "Administrator" && <th>Actions</th>}</tr></thead>
        <tbody>{rows.map((row) => <tr key={row._id}><td><span className="badge-code">{row.reference}</span></td><td>{date(row.requestDate)}</td><td>{row.vendor?.companyName || "—"}</td><td>{row.items?.map((item) => `${item.itemName} (${item.qty})`).join(", ")}</td><td>{date(row.replyRequiredBy)}</td><td>{row.billAttachment?.dataUrl ? <a href={row.billAttachment.dataUrl} target="_blank" rel="noreferrer">View bill</a> : "—"}</td><td><select value={row.status} onChange={(e) => statusChange(row, e.target.value)}><option value="pending">Pending</option><option value="received">Received</option><option value="closed">Closed</option></select></td>{user?.role === "Administrator" && <td><button className="icon-action danger-action" onClick={() => remove(row)} title="Delete">×</button></td>}</tr>)}
          {rows.length === 0 && <tr><td colSpan={user?.role === "Administrator" ? 8 : 7}>No quotation requests yet.</td></tr>}</tbody></table></div>
    {open && <Modal title="New Quotation Request" icon="📝" onClose={() => setOpen(false)}><form className="modal-form" onSubmit={submit}>
      <label>Vendor *</label><select required value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })}><option value="">Select vendor</option>{vendors.map((v) => <option key={v._id} value={v._id}>{v.companyName}</option>)}</select>
      <label>Request date *</label><input type="date" required value={form.requestDate} onChange={(e) => setForm({ ...form, requestDate: e.target.value })} />
      <label>Reply required by</label><input type="date" value={form.replyRequiredBy} onChange={(e) => setForm({ ...form, replyRequiredBy: e.target.value })} />
      <label>Bill / supporting document <small>PDF, JPG, PNG, or WebP · max 2 MB</small><input type="file" accept=".pdf,image/jpeg,image/png,image/webp" onChange={async (e) => { try { setForm({ ...form, billAttachment: await readAttachment(e.target.files?.[0], "Bill attachment") }); setMessage(""); } catch (error) { e.target.value = ""; setMessage(error.message); } }} />{form.billAttachment && <span className="attachment-name">Attached: {form.billAttachment.name}</span>}</label>
      <label>Requested items *</label>{items.map((item, index) => <div className="quotation-item-row" key={index}>
        <input aria-label={`Item ${index + 1} name`} placeholder="Item name" maxLength="160" required value={item.itemName} onChange={(e) => setItems((current) => current.map((row, i) => i === index ? { ...row, itemName: e.target.value } : row))} />
        <input aria-label={`Item ${index + 1} specifications`} placeholder="Specifications" maxLength="500" value={item.specifications} onChange={(e) => setItems((current) => current.map((row, i) => i === index ? { ...row, specifications: e.target.value } : row))} />
        <input aria-label={`Item ${index + 1} quantity`} type="number" min="1" max="100000" required value={item.qty} onChange={(e) => setItems((current) => current.map((row, i) => i === index ? { ...row, qty: e.target.value } : row))} />
        {items.length > 1 && <button type="button" className="btn-outline" onClick={() => setItems((current) => current.filter((_, i) => i !== index))}>Remove</button>}
      </div>)}
      {items.length < 50 && <button type="button" className="btn-outline" onClick={() => setItems((current) => [...current, { itemName: "", specifications: "", qty: 1 }])}>＋ Add item</button>}
      <div className="modal-actions"><button className="primary-btn">Create Request</button><button type="button" className="btn-outline" onClick={() => setOpen(false)}>Cancel</button></div>
    </form></Modal>}
  </>;
}

function AssetActionPage({ kind }) {
  const [assets, setAssets] = useState([]);
  const [locations, setLocations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [history, setHistory] = useState([]);
  const [selected, setSelected] = useState([]);
  const [toLocation, setToLocation] = useState("");
  const [toDepartment, setToDepartment] = useState("");
  const [remarks, setRemarks] = useState("");
  const [message, setMessage] = useState("");
  const distribution = kind === "distribution";
  const load = useCallback(() => Promise.all([getAssetCodes(), getLocations(), getDepartments(), getStockMovements({ type: distribution ? "distribution" : kind === "stockmove" ? "stock_move" : "transfer" })]).then(([codes, locs, depts, movements]) => {
    const eligible = kind === "stockmove" ? ["in_store", "issued", "transferred"] : distribution ? ["in_store"] : ["issued", "transferred"];
    setAssets(codes.filter((code) => eligible.includes(code.status)));
    setLocations(locs.filter((location) => !location.isCentralStore && !location.isScrapStore));
    setDepartments(depts);
    setHistory(movements);
  }), [distribution, kind]);
  useEffect(() => { load(); }, [load]);
  const toggle = (id) => setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  const submit = async (event) => {
    event.preventDefault();
    if (!selected.length) { setMessage("Select at least one asset."); return; }
    if (kind === "stockmove" && !toDepartment) { setMessage("Choose the department receiving the assets."); return; }
    if (kind !== "stockmove" && !toLocation) { setMessage("Choose a destination location."); return; }
    if (!distribution && !remarks.trim()) { setMessage("Enter a reason for this movement."); return; }
    try {
      const payload = { assetCodeIds: selected, toLocation: toLocation || undefined, toDepartment: toDepartment || undefined, reason: remarks.trim(), remarks: remarks.trim() };
      if (distribution) await distributeAssets(payload);
      else if (kind === "stockmove") await stockMoveAssets(payload);
      else await transferAssets(payload);
      setMessage(`${selected.length} asset(s) ${distribution ? "distributed" : "transferred"}.`);
      setSelected([]); setRemarks(""); setToDepartment(""); setToLocation(""); load();
    } catch (e) { setMessage(e.response?.data?.error || "Could not complete the asset movement."); }
  };
  const title = distribution ? "Distribution" : kind === "stockmove" ? "Stock Move" : "Stock Transfers";
  return <>
    <div className="panel"><div className="list-header"><h2>{distribution ? "📤" : "🔄"} {title}</h2><span className="qty-badge">{selected.length} selected</span></div>
      <form className="movement-form" onSubmit={submit}>
        {kind === "stockmove" && <label>Receiving department *<select required value={toDepartment} onChange={(e) => setToDepartment(e.target.value)}><option value="">Select department</option>{departments.map((department) => <option key={department._id} value={department._id}>{department.code} — {department.description}</option>)}</select></label>}
        <label>{kind === "stockmove" ? "Destination location (optional)" : "Destination location *"}<select required={kind !== "stockmove"} value={toLocation} onChange={(e) => setToLocation(e.target.value)}><option value="">{kind === "stockmove" ? "Keep current location" : "Select location"}</option>{locations.map((location) => <option key={location._id} value={location._id}>{location.name}</option>)}</select></label>
        <label>{distribution ? "Remarks" : "Reason *"}<input required={!distribution} value={remarks} onChange={(e) => setRemarks(e.target.value)} maxLength="500" placeholder={distribution ? "Optional notes" : "Reason for this movement"} /></label>
        <button className="primary-btn">{distribution ? "Distribute selected" : kind === "stockmove" ? "Confirm permanent move" : "Confirm transfer"}</button>
      </form>
      {message && <p className="msg">{message}</p>}
      <table><thead><tr><th>Select</th><th>Asset code</th><th>Equipment</th><th>Current location</th><th>Department</th><th>Status</th></tr></thead>
        <tbody>{assets.map((asset) => <tr key={asset._id}><td><input aria-label={`Select ${asset.code}`} type="checkbox" checked={selected.includes(asset._id)} onChange={() => toggle(asset._id)} /></td><td><span className="badge-code">{asset.code}</span></td><td>{asset.equipment?.name || "—"}</td><td>{asset.location?.name || "—"}</td><td>{asset.department?.code || "—"}</td><td>{asset.status?.replace("_", " ")}</td></tr>)}
          {assets.length === 0 && <tr><td colSpan="6">No eligible assets found.</td></tr>}</tbody></table>
    </div>
    <div className="panel"><div className="list-header"><h2>📋 {title} History</h2><span className="qty-badge">{history.length} records</span></div>
      <table><thead><tr><th>Date</th><th>Assets</th><th>From</th><th>To</th><th>Reason</th><th>Performed by</th></tr></thead><tbody>
        {history.map((row) => <tr key={row._id}><td>{date(row.createdAt)}</td><td>{row.items?.map((item) => item.assetCode?.code).filter(Boolean).join(", ") || "—"}</td><td>{[...new Set(row.items?.map((item) => item.fromLocation?.name || item.fromDepartment?.code).filter(Boolean))].join(", ") || "—"}</td><td>{[...new Set(row.items?.map((item) => item.toLocation?.name || item.toDepartment?.code).filter(Boolean))].join(", ") || "—"}</td><td>{row.reason || "—"}</td><td>{row.performedBy || "—"}</td></tr>)}
        {history.length === 0 && <tr><td colSpan="6">No {title.toLowerCase()} yet.</td></tr>}
      </tbody></table>
    </div>
  </>;
}

export function DistributionPage() { return <AssetActionPage kind="distribution" />; }
export function TransfersPage() { return <AssetActionPage kind="transfer" />; }

export function StockMovePage() { return <AssetActionPage kind="stockmove" />; }

export function ScrapPage() {
  const { user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [scrapped, setScrapped] = useState([]);
  const [requests, setRequests] = useState([]);
  const [tab, setTab] = useState("pending");
  const [selected, setSelected] = useState([]);
  const [remarks, setRemarks] = useState("");
  const [message, setMessage] = useState("");
  const [certificateAttachment, setCertificateAttachment] = useState(undefined);
  const [profile, setProfile] = useState(null);
  const load = () => Promise.all([getAssetCodes(), getScrapList(), getScrapRequests(), getCompanyProfile()]).then(([codes, scrap, requestsList, companyProfile]) => { setAssets(codes.filter((item) => item.status !== "scrap")); setScrapped(scrap); setRequests(requestsList); setProfile(companyProfile); }).catch((error) => setMessage(error.response?.data?.error || "Could not load scrap records."));
  useEffect(() => { load(); }, []);
  const submit = async (event) => { event.preventDefault(); if (!selected.length) { setMessage("Select at least one asset."); return; } try { await submitScrapRequest({ assetCodeIds: selected, reason: remarks.trim(), certificateAttachment }); setMessage(`${selected.length} asset(s) submitted for approval.`); setSelected([]); setRemarks(""); setCertificateAttachment(undefined); load(); } catch (e) { setMessage(e.response?.data?.error || "Could not submit scrap request."); } };
  const viewCertificate = async (request) => {
    const tab = window.open("", "_blank");
    try { const blob = await downloadScrapCertificate(request._id); const url = URL.createObjectURL(blob); if (tab) tab.location.href = url; else window.open(url, "_blank"); setTimeout(() => URL.revokeObjectURL(url), 60000); }
    catch (error) { if (tab) tab.close(); setMessage(error.response?.data?.error || "Could not open the certificate."); }
  };
  const review = async (request, status) => {
    const verb = status === "approved" ? "approve" : "reject";
    if (!window.confirm(`${verb[0].toUpperCase()}${verb.slice(1)} this scrap request? ${status === "approved" ? "The selected assets will be moved to Scrap Store." : "The request will be marked rejected."}`)) return;
    try { await reviewScrapRequest(request._id, { status }); setMessage(`Scrap request ${status}.`); load(); }
    catch (error) { setMessage(error.response?.data?.error || "Could not review scrap request."); }
  };
  const visibleRequests = requests.filter((request) => request.status === tab);
  return <>
    <div className="panel"><div className="list-header"><h2>🗑️ Scrap / Dead Stock</h2><div className="list-header-actions"><span className="qty-badge">{scrapped.length} in Scrap Store</span><ReportActions title="Scrap / Dead Stock register" /></div></div>
      <form className="movement-form" onSubmit={submit}><label>Reason for scrap request *<input required maxLength="500" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Condition and reason for scrapping" /></label><label>Dead stock / scrap certificate <small>PDF, JPG, PNG, or WebP · max 2 MB</small><input type="file" accept=".pdf,image/jpeg,image/png,image/webp" onChange={async (e) => { try { setCertificateAttachment(await readAttachment(e.target.files?.[0], "Certificate")); setMessage(""); } catch (error) { e.target.value = ""; setMessage(error.message); } }} />{certificateAttachment && <span className="attachment-name">Attached: {certificateAttachment.name}</span>}</label><button className="danger">Submit for approval</button></form>
      {message && <p className="msg">{message}</p>}
      <table><thead><tr><th>Select</th><th>Asset code</th><th>Equipment</th><th>Location</th><th>Department</th><th>Status</th><th>Value</th></tr></thead><tbody>
        {assets.map((asset) => <tr key={asset._id}><td><input type="checkbox" aria-label={`Select ${asset.code}`} checked={selected.includes(asset._id)} onChange={() => setSelected((current) => current.includes(asset._id) ? current.filter((id) => id !== asset._id) : [...current, asset._id])} /></td><td>{asset.code}</td><td>{asset.equipment?.name || "—"}</td><td>{asset.location?.name || "—"}</td><td>{asset.department?.code || "—"}</td><td>{asset.status?.replace("_", " ")}</td><td>{money(asset.unitCost)}</td></tr>)}
        {assets.length === 0 && <tr><td colSpan="7">No active assets available.</td></tr>}</tbody></table>
    </div>
    <div className="panel"><div className="list-header"><h2>🕒 Scrap Requests</h2><div className="list-header-actions">{["pending", "approved", "rejected"].map((status) => <button type="button" key={status} className={tab === status ? "primary-btn" : "btn-outline"} onClick={() => setTab(status)}>{status[0].toUpperCase() + status.slice(1)} ({requests.filter((request) => request.status === status).length})</button>)}</div></div>
      <table><thead><tr><th>Requested</th><th>Assets</th><th>Reason</th><th>Requested by</th><th>Certificate</th><th>Status</th>{user?.role === "Administrator" && <th>Review</th>}</tr></thead><tbody>
        {visibleRequests.map((request) => <tr key={request._id}><td>{date(request.createdAt)}</td><td>{request.assetCodes?.map((asset) => asset.code).join(", ") || "—"}</td><td>{request.reason}</td><td>{request.requestedBy}</td><td>{request.certificateAttachment?.name ? <button type="button" className="btn-outline" onClick={() => viewCertificate(request)}>View certificate</button> : "—"}</td><td><span className={`status-pill ${request.status === "rejected" ? "inactive" : ""}`}>{request.status}</span></td>{user?.role === "Administrator" && <td>{request.status === "pending" ? <><button className="primary-btn" onClick={() => review(request, "approved")}>Approve</button> <button className="btn-outline" onClick={() => review(request, "rejected")}>Reject</button></> : <span>{request.reviewedBy || "—"}</span>}</td>}</tr>)}
        {visibleRequests.length === 0 && <tr><td colSpan={user?.role === "Administrator" ? 7 : 6}>No {tab} scrap requests.</td></tr>}
      </tbody></table></div>
    <div className="panel"><h2>Scrapped Assets</h2><table><thead><tr><th>Asset code</th><th>Equipment</th><th>Remarks</th><th>Value</th><th>Updated</th></tr></thead><tbody>
      {scrapped.map((asset) => <tr key={asset._id}><td>{asset.code}</td><td>{asset.equipment?.name || "—"}</td><td>{asset.remarks || "—"}</td><td>{money(asset.unitCost)}</td><td>{date(asset.updatedAt)}</td></tr>)}
      {scrapped.length === 0 && <tr><td colSpan="5">No scrapped assets.</td></tr>}</tbody></table></div>
    <section className="pdf-signature-block" aria-label="Required signatures for printed scrap register"><div><div className="signature-line">{profile?.principalSignature && <img src={profile.principalSignature} alt="Principal signature" />}</div><strong>Principal</strong><span>Signature</span></div><div><div className="signature-line">{profile?.hodSignature && <img src={profile.hodSignature} alt="HOD signature" />}</div><strong>HOD</strong><span>Signature</span></div></section>
  </>;
}

export function ExportDataPage() {
  const { user } = useAuth();
  const options = [["asset-codes", "Asset register"], ["purchases", "Purchases"], ["maintenance", "Maintenance"], ["consumables", "Consumables"], ["departments", "Departments"], ["categories", "Categories"], ["vendors", "Vendors"], ["equipment", "Equipment types"], ["locations", "Locations"]];
  const [selected, setSelected] = useState(["asset-codes", "purchases"]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const toggle = (key) => setSelected((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  const download = async () => {
    if (!selected.length) { setMessage("Select at least one dataset."); return; }
    setLoading(true); setMessage("");
    const failed = [];
    for (const dataset of selected) {
      try {
        const blob = await downloadCsv(dataset);
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a"); anchor.href = url; anchor.download = `stock-${dataset}.csv`; anchor.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (error) { failed.push(dataset); if (!error.response && error.message) setMessage(error.message); }
    }
    setMessage(failed.length ? `Could not download: ${failed.join(", ")}. Check your role or connection.` : `${selected.length} CSV file(s) downloaded.`);
    setLoading(false);
  };
  if (!user || !["Administrator", "Store Manager"].includes(user.role)) return <div className="panel"><h2>📄 Export Data</h2><p className="error">Exports are available to Administrators and Store Managers.</p></div>;
  return <div className="panel export-card"><div className="export-icon">⇩</div><h2>Export Data</h2><p className="msg">Choose one or more current datasets. Each is downloaded as a spreadsheet-friendly CSV file.</p>
    <div className="guide-grid">{options.map(([key, label]) => <label key={key} className="checkbox-label"><input type="checkbox" checked={selected.includes(key)} onChange={() => toggle(key)} />{label}</label>)}</div>
    <div className="list-header-actions"><button type="button" className="btn-outline" onClick={() => setSelected(options.map(([key]) => key))}>Select all</button><button type="button" className="btn-outline" onClick={() => setSelected([])}>Clear</button><button type="button" className="primary-btn export-button" disabled={loading} onClick={download}>{loading ? "Preparing…" : `Download ${selected.length} CSV file(s)`}</button></div>
    {message && <p className="msg" role="status">{message}</p>}
  </div>;
}

export function UserGuidePage() {
  const [search, setSearch] = useState("");
  const guide = [
    ["Set up master data", "Create departments and disciplines first. Add categories, equipment types, locations, and vendors before recording purchases. Select a department when a location belongs to one."],
    ["Record purchases", "Choose the purchase date, vendor, invoice number, and one or more equipment lines. Quantity must be a whole number. The system calculates GST and totals, saves the purchase, and generates unique asset codes in Store Room in one database transaction."],
    ["Manage asset codes", "Use Asset Codes to search or filter by status, equipment, and location. Edit code, serial number, value, or remarks. Purchase linked assets cannot be deleted so their stock history remains intact."],
    ["Distribute stock", "Select in-store assets, choose the destination location, and submit. Distribution moves those assets from Store Room into the department register and records who performed the movement."],
    ["Transfer and permanent move", "Stock Transfers move issued assets to another location and require a reason. Stock Move records a permanent department handover. Both actions check current asset status and save the movement history."],
    ["Maintenance and consumables", "Create maintenance records for active assets and update their status as service progresses. Use Consumables to record printer model, cost, fitted date, and replenishment status."],
    ["UPS / Power register", "Add an active UPS or power asset with its model, KVA, batteries, backup minutes, load, location, dates, and condition. The equipment type must be named as UPS or power equipment."],
    ["Scrap approvals", "Select assets and enter the reason to request scrap. An Administrator reviews pending requests. Approved assets move to Scrap Store; rejected requests leave the assets unchanged."],
    ["Reports and exports", "Reports provide filtered views for assets, purchases, maintenance, consumables, movements, and scrap. Export Data creates separate CSV files for the selected collections."],
    ["Legacy stock reconciliation", "Older quantity-based stock appears in the Legacy Quantity Stock ledger. Compare saved quantity with the transaction balance before migrating it to the asset-code register. Unmatched values are flagged and never silently rewritten."],
    ["Users and access", "Administrators can add users, assign roles and departments, and deactivate accounts. At least one active Administrator must remain. Store Managers can operate inventory workflows."],
    ["Backup and audit history", "Administrators can create and download a JSON backup and inspect recent audit events. Backup downloads use the signed-in session. Do not share downloaded backup files publicly."],
  ];
  const filtered = guide.filter(([title, body]) => `${title} ${body}`.toLowerCase().includes(search.trim().toLowerCase()));
  return <div className="panel guide-panel"><div className="list-header"><h2>❔ User Guide</h2><ReportActions title="user guide" /></div>
    <p className="msg">Instructions for day-to-day stock workflows and the records each action updates.</p>
    <input aria-label="Search user guide" placeholder="Search the guide..." value={search} onChange={(event) => setSearch(event.target.value)} />
    <div className="guide-grid">{filtered.map(([title, body], index) => <details key={title} open={Boolean(search.trim())}><summary><strong>{index + 1}. {title}</strong></summary><span>{body}</span></details>)}
      {filtered.length === 0 && <p className="msg">No guide section matches this search.</p>}</div>
  </div>;
}
