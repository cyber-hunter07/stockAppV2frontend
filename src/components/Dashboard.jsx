import React, { useEffect, useState } from "react";
import { getDashboardOverview, getLegacyStock } from "../api";

const CATEGORY_COLUMNS = ["Computer", "Laptop", "Laser Printer", "Colour Printer", "Projector", "UPS"];
const COL_LABELS = { "Computer": "COMPUTER", "Laptop": "LAPTOP", "Laser Printer": "LASER PRN", "Colour Printer": "COL. PRINTER", "Projector": "PROJECTOR", "UPS": "UPS" };

function DashboardIcon({ name }) {
  const paths = {
    equipment: <><rect x="3" y="4" width="15" height="12" rx="2" /><path d="M8 20h5m-2.5-4v4M21 7h-2v10h2z" /></>,
    location: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    stock: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4.5 7.5 7.5 4 7.5-4M12 12v9" /><path d="M8 5.2 16 10" /></>,
    maintenance: <><path d="M14.5 6.5a5 5 0 0 0-6.8 6.8L3 18l3 3 4.7-4.7a5 5 0 0 0 6.8-6.8L14 13l-3-3 3.5-3.5Z" /><path d="m16 16 5 5" /></>,
    alert: <><path d="M12 3 2.8 20h18.4L12 3Z" /><path d="M12 9v5m0 3h.01" /></>,
    reports: <><path d="M4 19V5m0 14h17" /><path d="m7 15 4-4 3 2 5-6" /><path d="M16 7h3v3" /></>,
    investment: <><path d="M12 2v20m5-15H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>,
    scrap: <><path d="M3 9h18l-2-5H5L3 9Z" /><path d="M5 9v11h14V9m-10 0v5m6-5v5" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export default function Dashboard({ onNavigate }) {
  const [data, setData] = useState(null);
  const [locSearch, setLocSearch] = useState("");
  const [legacy, setLegacy] = useState({ items: [], transactions: [] });
  const [error, setError] = useState("");

  useEffect(() => { getDashboardOverview().then(setData).catch((reason) => setError(reason.response?.data?.error || "Could not load dashboard data.")); }, []);
  useEffect(() => { getLegacyStock().then(setLegacy).catch(() => {}); }, []);

  if (!data) return <div className="panel">{error ? <p className="error" role="alert">{error}</p> : "Loading dashboard..."}</div>;

  const inr = (n) => `₹${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const colTotal = (col) => data.deptSummary.reduce((s, d) => s + (d.byCategory[col] || 0), 0);
  const grandQty = data.deptSummary.reduce((s, d) => s + d.qty, 0);
  const grandValue = data.deptSummary.reduce((s, d) => s + d.value, 0);
  const filteredLocs = data.stockByLocation.filter((l) => l.location.toLowerCase().includes(locSearch.toLowerCase()));

  return (
    <>
      {/* Top stat cards */}
      <div className="dash-grid">
        <button type="button" className="dash-card dash-card-click" onClick={() => onNavigate?.("Equipment")}>
          <div className="dash-icon dash-icon-purple"><DashboardIcon name="equipment" /></div>
          <div><strong>{data.equipmentTypes}</strong><span>Equipment Types</span></div>
        </button>
        <button type="button" className="dash-card dash-card-click" onClick={() => onNavigate?.("Locations")}>
          <div className="dash-icon dash-icon-pink"><DashboardIcon name="location" /></div>
          <div><strong>{data.locations}</strong><span>Locations</span></div>
        </button>
        <button type="button" className="dash-card dash-card-click" onClick={() => onNavigate?.("Asset Codes")}>
          <div className="dash-icon dash-icon-green"><DashboardIcon name="stock" /></div>
          <div><strong>{data.totalStockItems}</strong><span>Total Stock Items</span></div>
        </button>
        <button type="button" className="dash-card dash-card-click" onClick={() => onNavigate?.("Maintenance")}>
          <div className="dash-icon dash-icon-cyan"><DashboardIcon name="maintenance" /></div>
          <div><strong>{data.maintenanceOpen}</strong><span>Maintenance</span></div>
        </button>
        <button type="button" className="dash-card dash-card-alert dash-card-click" onClick={() => onNavigate?.("Maintenance")}>
          <div className="dash-icon dash-icon-red"><DashboardIcon name="alert" /></div>
          <div><strong>{data.systemsNotWorking}</strong><span>Systems Not Working</span></div>
        </button>
        <button type="button" className="dash-card dash-card-link dash-card-click" onClick={() => onNavigate?.("Reports")}>
          <div className="dash-icon dash-icon-emerald"><DashboardIcon name="reports" /></div>
          <div><span className="dash-link">View<br />Reports</span></div>
        </button>
      </div>

      {legacy.items.length > 0 && <div className="panel legacy-dashboard-panel">
        <div className="list-header"><div><h2>📦 Previous Quantity Stock</h2><p className="msg">Legacy transaction totals show changes over time. Reconciliation is available when an opening quantity was recorded.</p></div><button type="button" className="btn-outline" onClick={() => onNavigate?.("Asset Codes")}>Open legacy ledger</button></div>
        {legacy.items.some((item) => item.reconciles === false) && <p className="error" role="alert">{legacy.items.filter((item) => item.reconciles === false).length} legacy item(s) do not match their recorded opening quantity plus transaction changes.</p>}
        <table><thead><tr><th>Item</th><th>Category</th><th>Location</th><th>Saved quantity</th><th>Transaction net change</th><th>Status</th></tr></thead><tbody>
          {legacy.items.map((item) => <tr key={item._id}><td>{item.itemName}</td><td>{item.categoryName}</td><td>{item.location}</td><td>{item.quantity} {item.unit}</td><td>{item.ledgerNet}</td><td>{item.reconciles === true ? "Matched" : item.reconciles === false ? "Review needed" : "Opening quantity not recorded"}</td></tr>)}
        </tbody></table>
      </div>}

      <div className="dash-grid-2">
        <div className="dash-card dash-wide">
          <div className="dash-icon dash-icon-amber"><DashboardIcon name="investment" /></div>
          <div><strong>{inr(data.totalInvestment)}</strong><span>Total Investment</span></div>
        </div>
        <div className="dash-card dash-wide">
          <div className="dash-icon dash-icon-slate"><DashboardIcon name="scrap" /></div>
          <div>
            <strong>{inr(data.scrapValue)}</strong>
            <span>Scrap Income</span>
            {data.scrapCount > 0 && <div className="dash-subnote">{data.scrapCount} awaiting approval</div>}
          </div>
        </div>
      </div>

      {/* Department-wise Equipment Summary */}
      <div className="panel">
        <div className="panel-header-row">
          <h2>👥 Department-wise Equipment Summary</h2>
        </div>
        <table className="dashboard-summary-table">
          <thead>
            <tr>
              <th>DEPARTMENT</th>
              {CATEGORY_COLUMNS.map((c) => <th key={c}>{COL_LABELS[c]}</th>)}
              <th>QTY</th><th style={{ background: "#0e7c5a", color: "#fff" }}>VALUE (₹)</th>
            </tr>
          </thead>
          <tbody>
            {data.deptSummary.map((d) => (
              <tr key={d.department}>
                <td><strong>{d.department}</strong><div className="dash-subtext">{d.description}</div></td>
                {CATEGORY_COLUMNS.map((c) => <td key={c}>{d.byCategory[c] || "–"}</td>)}
                <td>{d.qty}</td>
                <td style={{ color: "#0e7c5a", fontWeight: 700 }}>{inr(d.value)}</td>
              </tr>
            ))}
            <tr style={{ background: "#0f1b3d", color: "#fff" }}>
              <td style={{ color: "#fff" }}>TOTAL</td>
              {CATEGORY_COLUMNS.map((c) => <td key={c} style={{ color: "#fff" }}>{colTotal(c) || "–"}</td>)}
              <td style={{ color: "#fff" }}>{grandQty}</td>
              <td style={{ color: "#fff" }}>{inr(grandValue)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="dash-grid-2">
        {/* Stock Distribution by Location */}
        <div className="panel">
          <h2>Stock Distribution by Location</h2>
          <input placeholder="Find location..." value={locSearch} onChange={(e) => setLocSearch(e.target.value)} style={{ marginBottom: 10 }} />
          <table>
            <thead><tr><th>LOCATION</th><th>TOTAL RECEIVED</th><th>CURRENT STOCK</th></tr></thead>
            <tbody>
              {filteredLocs.slice(0, 8).map((l) => (
                <tr key={l._id}>
                  <td><strong>{l.location}</strong></td>
                  <td>{l.totalReceived}</td>
                  <td><span className="qty-badge">{l.currentStock}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="msg">{data.locations} locations · scroll inside the table to see more</p>
        </div>

        {/* Equipment Mix */}
        <div className="panel">
          <div className="panel-header-row">
            <h2>Equipment Mix</h2>
            <span className="qty-badge">{data.totalMixQty} items total</span>
          </div>
          {data.equipmentMix.slice(0, 7).map((m) => {
            const pct = data.totalMixQty ? ((m.qty / data.totalMixQty) * 100).toFixed(1) : 0;
            return (
              <div key={m.name} className="mix-row">
                <span className="mix-label">{m.name}</span>
                <div className="mix-bar-track">
                  <div className="mix-bar-fill" style={{ width: `${Math.max(pct, 4)}%` }}>{m.qty}</div>
                </div>
                <span className="mix-pct">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="dash-grid-2">
        {/* Recent Purchases */}
        <div className="panel">
          <h2>Recent Purchases</h2>
          {data.recentPurchases.map((p) => (
            <div key={p._id} className="purchase-row">
              <div>
                <strong>{p.items[0]?.equipment?.name || "Item"}</strong>
                <div className="dash-subtext">{p.items[0]?.specification}</div>
                <span className="qty-badge">Qty: {p.items.reduce((s, it) => s + it.qty, 0)}</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="dash-subtext">{new Date(p.purchaseDate).toLocaleDateString("en-GB")}</div>
                <strong style={{ color: "#c0283f" }}>{inr(p.grandTotal)}</strong>
              </div>
            </div>
          ))}
          {data.recentPurchases.length === 0 && <p className="msg">No purchases yet.</p>}
        </div>

        {/* Toner & Consumables */}
        <div className="panel">
          <div className="panel-header-row"><h2>🧴 Toner & Consumables</h2></div>
          <div className="stat-cards">
            <div className="stat-card alert"><span className="stat-value">{data.toner.needToner}</span><span className="stat-label">Need Toner</span></div>
            <div className="stat-card"><span className="stat-value">{data.toner.installed}</span><span className="stat-label">Installed</span></div>
            <div className="stat-card"><span className="stat-value">{data.toner.thisMonth}</span><span className="stat-label">This Month</span></div>
            <div className="stat-card"><span className="stat-value">{inr(data.toner.spentThisYear)}</span><span className="stat-label">Spent in {new Date().getFullYear()}</span></div>
          </div>
          <h3>Models we use — for reordering</h3>
          <table>
            <thead><tr><th>MODEL</th><th>USED</th><th>AVG ₹</th><th>LAST FITTED</th></tr></thead>
            <tbody>
              {data.toner.models.slice(0, 6).map((m) => (
                <tr key={m.model}>
                  <td>{m.model}</td><td><span className="qty-badge">{m.used}</span></td>
                  <td>₹{m.avgCost?.toLocaleString("en-IN")}</td>
                  <td>{m.lastFitted ? new Date(m.lastFitted).toLocaleDateString("en-GB") : "-"}</td>
                </tr>
              ))}
              {data.toner.models.length === 0 && <tr><td colSpan="4">No consumables tracked yet.</td></tr>}
            </tbody>
          </table>
          {data.toner.awaitingToner.length > 0 && (
            <>
              <h3>Awaiting toner — {data.toner.awaitingToner.length} units to order</h3>
              <table>
                <thead><tr><th>PRINTER</th><th>MODEL NEEDED</th></tr></thead>
                <tbody>
                  {data.toner.awaitingToner.map((a, i) => (
                    <tr key={i}><td>{a.printer}</td><td><span className="qty-badge">{a.modelNeeded}</span></td></tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </>
  );
}
