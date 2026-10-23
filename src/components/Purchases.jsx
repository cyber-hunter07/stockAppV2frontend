import React, { useEffect, useState } from "react";
import { getPurchases, addPurchase, deletePurchase, downloadPurchaseBill, getEquipment, getVendors } from "../api";
import { useAuth } from "../context/AuthContext";

const emptyLine = { equipment: "", specification: "", qty: 1, unitCost: 0, gstPercent: 18 };
const ACCEPTED_BILL_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

function readBill(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(undefined);
    if (!ACCEPTED_BILL_TYPES.includes(file.type)) return reject(new Error("Purchase bill must be a PDF, JPG, PNG, or WebP file."));
    if (file.size > 2 * 1024 * 1024) return reject(new Error("Purchase bill must be 2 MB or smaller."));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the purchase bill."));
    reader.onload = () => resolve({ name: file.name, mimeType: file.type, dataUrl: reader.result });
    reader.readAsDataURL(file);
  });
}

export default function Purchases() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [form, setForm] = useState({ purchaseDate: new Date().toISOString().slice(0, 10), invoiceNumber: "", vendor: "", notes: "", billAttachment: undefined });
  const [items, setItems] = useState([{ ...emptyLine }]);
  const [message, setMessage] = useState("");

  const load = () => Promise.all([getPurchases(), getEquipment(), getVendors()]).then(([purchases, equipment, vendorRows]) => { setList(purchases); setEquipmentList(equipment); setVendors(vendorRows); }).catch((error) => setMessage(error.response?.data?.error || "Could not load purchase records."));
  useEffect(() => { load(); }, []);
  const updateLine = (i, field, value) => setItems((current) => current.map((line, index) => index === i ? { ...line, [field]: value } : line));
  const addLine = () => setItems((current) => [...current, { ...emptyLine }]);
  const removeLine = (i) => setItems((current) => current.filter((_, index) => index !== i));
  const lineTotal = (it) => { const taxable = (Number(it.qty) || 0) * (Number(it.unitCost) || 0); const gst = taxable * (Number(it.gstPercent) || 0) / 100; return { total: taxable + gst }; };
  const grandTotal = items.reduce((sum, item) => sum + lineTotal(item).total, 0);
  const viewBill = async (purchase) => {
    const tab = window.open("", "_blank");
    try { const blob = await downloadPurchaseBill(purchase._id); const url = URL.createObjectURL(blob); if (tab) tab.location.href = url; else window.open(url, "_blank"); setTimeout(() => URL.revokeObjectURL(url), 60000); }
    catch (error) { if (tab) tab.close(); setMessage(error.response?.data?.error || "Could not open the purchase bill."); }
  };
  const handleSubmit = async (event) => { event.preventDefault(); setMessage(""); try { await addPurchase({ ...form, items: items.map((it) => ({ ...it, qty: Number(it.qty), unitCost: Number(it.unitCost), gstPercent: Number(it.gstPercent) })) }); setMessage("Purchase recorded — asset codes generated in Store Room."); setItems([{ ...emptyLine }]); setForm({ purchaseDate: new Date().toISOString().slice(0, 10), invoiceNumber: "", vendor: "", notes: "", billAttachment: undefined }); load(); } catch (error) { setMessage(error.response?.data?.error || "Error recording purchase."); } };
  const removePurchase = async (purchase) => {
    if (!window.confirm(`Delete purchase ${purchase.invoiceNumber || "record"}? This is allowed only when its generated assets are still unused in Store Room.`)) return;
    try { await deletePurchase(purchase._id); setMessage("Purchase deleted."); load(); }
    catch (error) { setMessage(error.response?.data?.error || "Could not delete the purchase."); }
  };
  return <>
    <div className="panel"><h2>Record New Purchase</h2><p className="msg">Purchased items automatically go to Store Room and get asset codes.</p>
      <form onSubmit={handleSubmit}><div className="stock-form"><input type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} required /><input placeholder="Invoice Number" value={form.invoiceNumber} onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })} /><select value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })}><option value="">Select vendor</option>{vendors.map((vendor) => <option key={vendor._id} value={vendor._id}>{vendor.companyName}</option>)}</select><label>Purchase bill <small>PDF, JPG, PNG, or WebP · max 2 MB</small><input type="file" accept=".pdf,image/jpeg,image/png,image/webp" onChange={async (e) => { try { setForm({ ...form, billAttachment: await readBill(e.target.files?.[0]) }); setMessage(""); } catch (error) { e.target.value = ""; setMessage(error.message); } }} />{form.billAttachment && <span className="attachment-name">Attached: {form.billAttachment.name}</span>}</label></div>
        <table><thead><tr><th>Item name</th><th>Qty</th><th>Unit Cost</th><th>GST%</th><th>Line Total</th><th /></tr></thead><tbody>{items.map((item, index) => <tr key={index}><td><select value={item.equipment} onChange={(e) => updateLine(index, "equipment", e.target.value)} required style={{ minWidth: 160 }}><option value="">Select item</option>{equipmentList.map((equipment) => <option key={equipment._id} value={equipment._id}>{equipment.name}</option>)}</select></td><td><input type="number" min="1" value={item.qty} onChange={(e) => updateLine(index, "qty", e.target.value)} style={{ width: 70 }} /></td><td><input type="number" min="0" value={item.unitCost} onChange={(e) => updateLine(index, "unitCost", e.target.value)} style={{ width: 100 }} /></td><td><select value={item.gstPercent} onChange={(e) => updateLine(index, "gstPercent", e.target.value)}><option value="0">0%</option><option value="5">5%</option><option value="12">12%</option><option value="18">18%</option><option value="28">28%</option></select></td><td>₹{lineTotal(item).total.toLocaleString("en-IN")}</td><td>{items.length > 1 && <button type="button" className="danger" onClick={() => removeLine(index)}>✕</button>}</td></tr>)}</tbody></table>
        <button type="button" onClick={addLine}>+ Add Another Item</button><p style={{ textAlign: "right", fontWeight: 700, margin: "10px 0" }}>Invoice Total: ₹{grandTotal.toLocaleString("en-IN")}</p><button type="submit">Save Purchase</button>{message && <p className="msg">{message}</p>}
      </form>
    </div>
    <div className="panel"><h2>Purchase Records</h2><table><thead><tr><th>Date</th><th>Item name</th><th>Qty</th><th>Total (Incl. GST)</th><th>Vendor</th><th>Invoice</th><th>Purchase bill</th>{user?.role === "Administrator" && <th>Action</th>}</tr></thead><tbody>{list.map((purchase) => <tr key={purchase._id}><td>{new Date(purchase.purchaseDate).toLocaleDateString()}</td><td>{purchase.items.map((item) => item.equipment?.name || "Unknown item").join(", ")}</td><td>{purchase.items.reduce((sum, item) => sum + item.qty, 0)}</td><td>₹{purchase.grandTotal?.toLocaleString("en-IN")}</td><td>{purchase.vendor?.companyName || "-"}</td><td>{purchase.invoiceNumber || "-"}</td><td>{purchase.billAttachment?.name ? <button type="button" className="btn-outline" onClick={() => viewBill(purchase)}>View bill</button> : "—"}</td>{user?.role === "Administrator" && <td><button type="button" className="danger" onClick={() => removePurchase(purchase)}>Delete</button></td>}</tr>)}{list.length === 0 && <tr><td colSpan={user?.role === "Administrator" ? 8 : 7}>No purchase records yet.</td></tr>}</tbody></table></div>
  </>;
}
