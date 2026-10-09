import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { getCompanyProfile, getLowStockAlerts } from "./api";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Departments from "./components/Departments";
import Categories from "./components/Categories";
import Equipment from "./components/Equipment";
import Locations from "./components/Locations";
import Vendors from "./components/Vendors";
import Purchases from "./components/Purchases";
import BackupPanel from "./components/BackupPanel";
import { AuditLogPage, CompanyProfilePage, UsersPage } from "./components/AdminPages";
import {
  AssetCodesPage, ConsumablesPage, DistributionPage, ExportDataPage,
  MaintenancePage, QuotationsPage, ScrapPage, StockMovePage, TransfersPage,
  UpsPowerPage, UserGuidePage, ReportsPage,
} from "./components/OperationsPages";
import ChatWidget from "./components/ChatWidget";
import LowStockModal from "./components/LowStockModal";
import "./App.css";

// Sidebar structure: top-level Dashboard, then grouped sections (matches reference layout)
const NAV_GROUPS = [
  { items: [["Dashboard", "📊", Dashboard]] },
  {
    title: "INVENTORY",
    items: [
      ["Departments", "🏛️", Departments],
      ["Categories", "🏷️", Categories],
      ["Equipment", "💻", Equipment],
      ["Locations", "📍", Locations],
      ["Vendors", "🚚", Vendors],
      ["Quotation Requests", "📝", QuotationsPage],
      ["Purchases", "🛒", Purchases],
      ["Asset Codes", "🏷️", AssetCodesPage],
      ["UPS / Power", "🔋", UpsPowerPage],
      ["Maintenance", "🛠️", MaintenancePage],
      ["Consumables", "🧴", ConsumablesPage],
      ["Scrap / Dead Stock", "🗑️", ScrapPage],
      ["Distribution", "📤", DistributionPage],
      ["Stock Transfers", "🔄", TransfersPage],
      ["Stock Move", "🚶", StockMovePage],
    ],
  },
  {
    title: "REPORTS",
    items: [
      ["Reports", "📈", ReportsPage],
      ["Export Data", "📄", ExportDataPage],
    ],
  },
  {
    title: "HELP",
    items: [["User Guide", "❔", UserGuidePage]],
  },
  {
    title: "ADMIN",
    items: [
      ["Company Profile", "🏢", CompanyProfilePage],
      ["Users", "👥", UsersPage],
      ["Audit Log", "🕘", AuditLogPage],
      ["Backup & Restore", "💾", BackupPanel],
    ],
  },
];

const ALL_PAGES = NAV_GROUPS.flatMap((g) => g.items).reduce((acc, [name, , Comp]) => { acc[name] = Comp; return acc; }, {});

const BellIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.7 21a2 2 0 01-3.4 0" />
  </svg>
);

function MainApp() {
  const { user, logout } = useAuth();
  const [page, setPage] = useState("Dashboard");
  const [company, setCompany] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    getCompanyProfile().then(setCompany).catch(() => {});
    let first = true;
    const load = async () => {
      try {
        const data = await getLowStockAlerts();
        setLowStock(data);
        if (first && data.length > 0) setShowModal(true);
      } catch (e) { /* ignore */ }
      first = false;
    };
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [user]);

  if (!user) return <Login />;

  const ActivePage = ALL_PAGES[page] || Dashboard;
  const initial = user.name?.charAt(0).toUpperCase() || "U";
  const pageIcon = NAV_GROUPS.flatMap((group) => group.items).find(([name]) => name === page)?.[1] || "▣";

  const selectPage = (name) => { setPage(name); setSidebarOpen(false); };

  return (
    <div className="app-layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <header className="institution-navbar">
        <div className="institution-brand">
          <img className="institution-logo" src="/mvit-emblem.jpeg" alt="Manakula Vinayagar Institute of Technology emblem" />
          <div className="institution-copy">
            <div className="institution-title-row">
              <strong>MANAKULA VINAYAGAR INSTITUTE OF TECHNOLOGY</strong>
              <span className="system-status">AUTOMATED</span>
            </div>
            <span className="institution-subtitle">Stock Management System</span>
          </div>
        </div>
        <div className="institution-account">
          <div className="institution-user-copy">
            <strong>MVIT {user.role}</strong>
            <span>All Departments Access</span>
          </div>
          <span className="account-role-badge">{user.role === "Administrator" ? "ADMIN" : "USER"}</span>
          <button className="institution-logout" onClick={logout}><span aria-hidden="true">↪</span> Logout</button>
        </div>
      </header>

      <nav className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <div className="sidebar-logo" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 3h7v7H4zM13 3h7v7h-7zM4 12h7v8H4zM13 12h7v8h-7z" /></svg></div>
          <strong>Stock Management<br />System</strong>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu">✕</button>
        </div>

        <div className="sidebar-scroll">
          {NAV_GROUPS.filter((group) => group.title !== "ADMIN" || user.role === "Administrator").map((group, gi) => (
            <div key={gi} className="nav-group">
              {group.title && <div className="nav-section-title">{group.title}</div>}
              {group.items.map(([name, icon]) => (
                <button
                  key={name}
                  className={name === page ? "nav-btn active" : "nav-btn"}
                  onClick={() => selectPage(name)}
                >
                  <span className="nav-icon">{icon}</span> {name}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div className="user-info">
          <div className="sidebar-user-row">
            <div className="sidebar-user-avatar">{initial}</div>
            <div><strong>{user.role}</strong><span>{user.name}</span></div>
          </div>
          <button className="sidebar-logout" onClick={logout}><span aria-hidden="true">↪</span> Logout</button>
          <small className="sidebar-version">Stock Management System · v2.0</small>
        </div>
      </nav>

      <div className="main-col">
        <header className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className="hamburger-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">☰</button>
            <h2><span className="page-title-icon" aria-hidden="true">{pageIcon}</span>{page}</h2>
          </div>
          <div className="topbar-right">
            <span className="organization-badge" title="Asset code prefix"><span aria-hidden="true">▥</span>{company?.orgCode || "MIT"}</span>
            <span className="topbar-date"><span aria-hidden="true">▦</span>{new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
            {lowStock.length > 0 && <button className="bell-btn topbar-bell" onClick={() => setShowModal(true)} aria-label="Low stock notifications"><BellIcon /><span className="bell-badge">{lowStock.length}</span></button>}
          </div>
        </header>
        <main className="content">
          {page === "Dashboard" ? <ActivePage onNavigate={selectPage} /> : <ActivePage />}
        </main>
      </div>

      {showModal && <LowStockModal items={lowStock} onClose={() => setShowModal(false)} />}
      <ChatWidget />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
