import axios from "axios";

const URL = process.env.URL || "http://localhost:3000";

const API = axios.create({
  baseURL: URL
});

export const getStats = () => axios.get(`${API}/stats`);
export const getLogs = () => axios.get(`${API}/logs`);
export const getAlerts = () => axios.get(`${API}/alerts`);
export const getAlertHistory = () => axios.get(`${API}/alerts/history`);
export const markAlertAsSent = () => axios.post(`${API}/alerts/mark-sent`);