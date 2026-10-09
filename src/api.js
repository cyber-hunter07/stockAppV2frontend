import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
export const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  if (process.env.NODE_ENV === "production" && (!process.env.REACT_APP_API_URL || !API_BASE.startsWith("https://"))) {
    return Promise.reject(new Error("Production API is not configured. Set REACT_APP_API_URL to the HTTPS API address."));
  }
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ---- Auth ----
export const login = (identifier, password) => api.post("/api/auth/login", { identifier, password }).then((r) => r.data);
export const register = (payload) => api.post("/api/auth/register", payload).then((r) => r.data);
export const getSetupStatus = () => api.get("/api/auth/setup-status").then((r) => r.data);

// ---- Departments ----
export const getDepartments = () => api.get("/api/departments").then((r) => r.data);
export const addDepartment = (p) => api.post("/api/departments", p).then((r) => r.data);
export const updateDepartment = (id, p) => api.put(`/api/departments/${id}`, p).then((r) => r.data);
export const deleteDepartment = (id) => api.delete(`/api/departments/${id}`).then((r) => r.data);

// ---- Disciplines ----
export const getDisciplines = () => api.get("/api/disciplines").then((r) => r.data);
export const addDiscipline = (p) => api.post("/api/disciplines", p).then((r) => r.data);
export const deleteDiscipline = (id) => api.delete(`/api/disciplines/${id}`).then((r) => r.data);

// ---- Categories ----
export const getCategories = () => api.get("/api/categories").then((r) => r.data);
export const addCategory = (p) => api.post("/api/categories", p).then((r) => r.data);
export const updateCategory = (id, p) => api.put(`/api/categories/${id}`, p).then((r) => r.data);
export const deleteCategory = (id) => api.delete(`/api/categories/${id}`).then((r) => r.data);

// ---- Equipment ----
export const getEquipment = () => api.get("/api/equipment").then((r) => r.data);
export const addEquipment = (p) => api.post("/api/equipment", p).then((r) => r.data);
export const updateEquipment = (id, p) => api.put(`/api/equipment/${id}`, p).then((r) => r.data);
export const deleteEquipment = (id) => api.delete(`/api/equipment/${id}`).then((r) => r.data);

// ---- Locations ----
export const getLocations = () => api.get("/api/locations").then((r) => r.data);
export const addLocation = (p) => api.post("/api/locations", p).then((r) => r.data);
export const updateLocation = (id, p) => api.put(`/api/locations/${id}`, p).then((r) => r.data);
export const deleteLocation = (id) => api.delete(`/api/locations/${id}`).then((r) => r.data);

// ---- Vendors ----
export const getVendors = () => api.get("/api/vendors").then((r) => r.data);
export const addVendor = (p) => api.post("/api/vendors", p).then((r) => r.data);
export const updateVendor = (id, p) => api.put(`/api/vendors/${id}`, p).then((r) => r.data);
export const deleteVendor = (id) => api.delete(`/api/vendors/${id}`).then((r) => r.data);

// ---- Purchases ----
export const getPurchases = () => api.get("/api/purchases").then((r) => r.data);
export const addPurchase = (p) => api.post("/api/purchases", p).then((r) => r.data);
export const deletePurchase = (id) => api.delete(`/api/purchases/${id}`).then((r) => r.data);

// ---- Asset Codes ----
export const getAssetCodes = (params = "") => api.get(`/api/asset-codes${params}`).then((r) => r.data);
export const getAssetCodeStats = () => api.get("/api/asset-codes/stats").then((r) => r.data);
export const getLegacyStock = () => api.get("/api/legacy-stock").then((r) => r.data);
export const getPowerUnits = () => api.get("/api/power-units").then((r) => r.data);
export const addPowerUnit = (payload) => api.post("/api/power-units", payload).then((r) => r.data);
export const updatePowerUnit = (id, payload) => api.put(`/api/power-units/${id}`, payload).then((r) => r.data);
export const deletePowerUnit = (id) => api.delete(`/api/power-units/${id}`).then((r) => r.data);
export const updateAssetCode = (id, p) => api.put(`/api/asset-codes/${id}`, p).then((r) => r.data);
export const deleteAssetCode = (id) => api.delete(`/api/asset-codes/${id}`).then((r) => r.data);
export const distributeAssets = (p) => api.post("/api/distribution", p).then((r) => r.data);
export const transferAssets = (p) => api.post("/api/stock-transfers", p).then((r) => r.data);
export const stockMoveAssets = (p) => api.post("/api/stock-move", p).then((r) => r.data);
export const scrapAssets = (p) => api.post("/api/scrap", p).then((r) => r.data);
export const getScrapList = () => api.get("/api/scrap").then((r) => r.data);
export const getScrapRequests = (params = {}) => api.get("/api/scrap/requests", { params }).then((r) => r.data);
export const submitScrapRequest = (p) => api.post("/api/scrap/requests", p).then((r) => r.data);
export const reviewScrapRequest = (id, p) => api.patch(`/api/scrap/requests/${id}`, p).then((r) => r.data);
export const getStockMovements = (params = {}) => api.get("/api/stock-movements", { params }).then((r) => r.data);

// ---- Maintenance ----
export const getMaintenance = () => api.get("/api/maintenance").then((r) => r.data);
export const addMaintenance = (p) => api.post("/api/maintenance", p).then((r) => r.data);
export const updateMaintenance = (id, p) => api.put(`/api/maintenance/${id}`, p).then((r) => r.data);

// ---- Consumables ----
export const getConsumables = () => api.get("/api/consumables").then((r) => r.data);
export const addConsumable = (p) => api.post("/api/consumables", p).then((r) => r.data);
export const updateConsumable = (id, p) => api.put(`/api/consumables/${id}`, p).then((r) => r.data);

// ---- Quotation Requests ----
export const getQuotations = () => api.get("/api/quotations").then((r) => r.data);
export const addQuotation = (p) => api.post("/api/quotations", p).then((r) => r.data);
export const updateQuotation = (id, p) => api.put(`/api/quotations/${id}`, p).then((r) => r.data);
export const deleteQuotation = (id) => api.delete(`/api/quotations/${id}`).then((r) => r.data);

// ---- Company Profile ----
export const getCompanyProfile = () => api.get("/api/company-profile").then((r) => r.data);
export const updateCompanyProfile = (p) => api.put("/api/company-profile", p).then((r) => r.data);

// ---- Users ----
export const getUsers = () => api.get("/api/users").then((r) => r.data);
export const addUser = (payload) => api.post("/api/users", payload).then((r) => r.data);
export const updateUser = (id, p) => api.put(`/api/users/${id}`, p).then((r) => r.data);
export const deleteUser = (id) => api.delete(`/api/users/${id}`).then((r) => r.data);

// ---- Alerts ----
export const getLowStockAlerts = () => api.get("/api/alerts/low-stock").then((r) => r.data);
export const runAlertCheck = () => api.post("/api/alerts/run-check").then((r) => r.data);

// ---- Dashboard / Audit ----
export const getDashboardOverview = () => api.get("/api/dashboard/overview").then((r) => r.data);
export const getAuditLogs = () => api.get("/api/audit-logs").then((r) => r.data);

// ---- Export ----
export const downloadCsv = (dataset) => api.get(`/api/export/${dataset}.csv`, { responseType: "blob" }).then((response) => response.data);

// ---- Backup ----
export const runBackupNow = () => api.post("/api/backup/run").then((r) => r.data);
export const listBackups = () => api.get("/api/backup/list").then((r) => r.data);
export const downloadBackup = (filename) => api.get(`/api/backup/download/${encodeURIComponent(filename)}`, { responseType: "blob" }).then((response) => response.data);
export const restoreBackup = (backup, confirmRestore) => api.post("/api/backup/restore", { backup, confirmRestore }).then((response) => response.data);

// ---- AI NL Query Bot ----
export const askNLQuery = (question, history = []) => api.post("/api/nl-query", { question, history }).then((r) => r.data);
