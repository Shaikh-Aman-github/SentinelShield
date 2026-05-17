import axios from "axios";

// Vite environment variable
const URL = import.meta.env.VITE_API_URL || "https://sentinelshield-adxf.onrender.com";
//const URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const API = axios.create({
  baseURL: URL
});

// use API instance
export const getStats = () => API.get("/stats");
export const getLogs = () => API.get("/logs");
export const getAlerts = () => API.get("/alerts");
export const getAlertHistory = () => API.get("/alerts/history");
export const markAlertAsSent = (id) => API.post(`/alerts/${id}/mark-sent`);