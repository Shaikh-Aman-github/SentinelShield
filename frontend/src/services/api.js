import axios from "axios";

const URL = process.env.URL || "http://localhost:3000";

const API = axios.create({
  baseURL: URL
});

export const getStats = () => API.get("/stats");
export const getLogs = () => API.get("/logs");
export const getAlerts = () => API.get("/alerts");

export const markAlertAsSent = () =>
  API.put("/alerts/mark-sent");

export const getAlertHistory = () =>
  API.get("/alerts/history");