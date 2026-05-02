import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:3000"
});

export const getStats = () => API.get("/stats");
export const getLogs = () => API.get("/logs");
export const getAlerts = () => API.get("/alerts");

export const markAlertAsSent = () =>
  API.put("/alerts/mark-sent");

export const getAlertHistory = () =>
  API.get("/alerts/history");