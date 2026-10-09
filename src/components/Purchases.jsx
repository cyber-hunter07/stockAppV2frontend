import React, { useEffect, useState } from "react";
import { getPurchases, addPurchase, deletePurchase, getEquipment, getVendors } from "../api";

const emptyLine = { equipment: "", specification: "", qty: 1, unitCost: 0, gstPercent: 18 };

export default function Purchases() {
  const [list, setList] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [form, setForm] = useState({ purchaseDate: new Date().toISOString().slice(0, 10), invoiceNumber: "", vendor: "", notes: "" });
  const [items, setItems] = useState([{ ...emptyLine }]);
  const [message, setMessage] = useState("");

  const load = () => {
    getPurchases().then(setList);
    getEquipment().then(setEquipmentList);
    getVendors().then(setVendors);
  };
  useEffect(() => { load(); }, []);

  const updateLine = (i, field, value) => {
    const copy = [...items];
    copy[i][field] = value;
    setItems(copy);
  };
  const addLine = () => setItems([...items, { ...emptyLine }]);
  const removeLine = (i) => setItems(items.filter((_, idx) => idx !== i));

  const lineTotal = (it) => {
    const taxable = (Number(it.qty) || 0) * (Number(it.unitCost) || 0);
    const gst = (taxable * (Number(it.gstPercent) || 0)) / 100;
    return { taxable, gst, total: taxable + gst };
  };
  const grandTotal = items.reduce((s, it) => s + lineTotal(it).total, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      await addPurchase({ ...form, items: items.map((it) => ({ ...it, qty: Number(it.qty), unitCost: Number(it.unitCost), gstPercent: Number(it.gstPercent) })) });
      setMessage("Purchase recorded — asset codes generated in Store Room.");
      setItems([{ ...emptyLine }]);
      setForm({ purchaseDate: new Date().toISOString().slice(0, 10), invoiceNumber: "", vendor: "", notes: "" });
      load();
    } catch (err) {
      setMessage(err.response?.data?.error || "Error recording purchase");
    }
  };

  return (
    <>
      <div className="panel">
        <h2>Record New Purchase</h2>
        <p className="msg">Purchased items automatically go to Store Room and get asset codes.</p>
        <form onSubmit={handleSubmit}>
          <div className="stock-form">
            <input type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} required />
            <input placeholder="Invoice Number" value={form.invoiceNumber} onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })} />
            <select value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })}>
              <option value="">Select vendor</option>
              {vendors.map((v) => <option key={v._id} value={v._id}>{v.companyName}</option>)}
            </select>
          </div>

          <table>
            <thead><tr><th>Equipment</th><th>Qty</th><th>Unit Cost</th><th>GST%</th><th>Line Total</th><th></th></tr></thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i}>
                  <td>
                    <select value={it.equipment} onChange={(e) => updateLine(i, "equipment", e.target.value)} required style={{ minWidth: 160 }}>
                      <option value="">Select</option>
                      {equipmentList.map((eq) => <option key={eq._id} value={eq._id}>{eq.name}</option>)}
                    </select>
                  </td>
                  <td><input type="number" min="1" value={it.qty} onChange={(e) => updateLine(i, "qty", e.target.value)} style={{ width: 70 }} /></td>
                  <td><input type="number" min="0" value={it.unitCost} onChange={(e) => updateLine(i, "unitCost", e.target.value)} style={{ width: 100 }} /></td>
                  <td>
                    <select value={it.gstPercent} onChange={(e) => updateLine(i, "gstPercent", e.target.value)}>
                      <option value="0">0%</option><option value="5">5%</option><option value="12">12%</option><option value="18">18%</option><option value="28">28%</option>
                    </select>
                  </td>
                  <td>₹{lineTotal(it).total.toLocaleString("en-IN")}</td>
                  <td>{items.length > 1 && <button type="button" className="danger" onClick={() => removeLine(i)}>✕</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" onClick={addLine}>+ Add Another Equipment</button>
          <p style={{ textAlign: "right", fontWeight: 700, margin: "10px 0" }}>Invoice Total: ₹{grandTotal.toLocaleString("en-IN")}</p>
          <button type="submit">Save Purchase</button>
          {message && <p className="msg">{message}</p>}
        </form>
      </div>

      <div className="panel">
        <h2>Purchase Records</h2>
        <table>
          <thead><tr><th>Date</th><th>Equipment</th><th>Qty</th><th>Total (Incl. GST)</th><th>Vendor</th><th>Invoice</th><th></th></tr></thead>
          <tbody>
            {list.map((p) => (
              <tr key={p._id}>
                <td>{new Date(p.purchaseDate).toLocaleDateString()}</td>
                <td>{p.items.map((it) => it.equipment?.name).join(", ")}</td>
                <td>{p.items.reduce((s, it) => s + it.qty, 0)}</td>
                <td>₹{p.grandTotal?.toLocaleString("en-IN")}</td>
                <td>{p.vendor?.companyName || "-"}</td>
                <td>{p.invoiceNumber || "-"}</td>
                <td><button className="danger" onClick={async () => { await deletePurchase(p._id); load(); }}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
