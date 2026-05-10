import { useEffect, useState } from "react";
import { io } from "socket.io-client";

import {
  getStats,
  getLogs,
  getAlerts,
  markAlertAsSent,
  getAlertHistory
} from "../services/api";

import StatsCard from "./StatsCard";
import LogsTable from "./LogsTable";
import AttackChart from "./AttackChart";
import GeoPieChart from "./GeoChart";
import ToastAlert from "./ToastAlert";
import ThreatInsights from "./ThreatInsights";

export default function Dashboard() {
  const [stats, setStats] = useState({});
  const [logs, setLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const [toastAlert, setToastAlert] = useState(null);
  const [lastShownAlertTime, setLastShownAlertTime] = useState(null);

  const loadData = async () => {
    try {
      const statsRes = await getStats();
      const logsRes = await getLogs();
      const alertsRes = await getAlerts();
      const historyRes = await getAlertHistory();

      const latestAlerts = alertsRes.data;

      if (latestAlerts.length > 0) {
        const latest = latestAlerts[0];

        if (latest.time !== lastShownAlertTime) {
          setToastAlert(latest);
          setLastShownAlertTime(latest.time);

          await markAlertAsSent(latest.id);

          setTimeout(() => setToastAlert(null), 3000);
        }
      }

      setAlerts(historyRes.data);
      setStats(statsRes.data);
      setLogs(logsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();

    // const socket = io("http://localhost:3000");
    const socket = io(import.meta.env.VITE_API_URL || "http://192.168.31.203:3000");

    const typeMap = {
      "sql injection": "sql",
      "xss": "xss",
      "lfi": "lfi",
      "command injection": "cmd",
      "directory traversal": "dir",
      "rate limit": "rate",
      "suspicious header activity": "Other"
    };

    socket.on("newAttack", (attack) => {
      setLogs(prev => [attack, ...prev].slice(0, 100));

      const key = typeMap[attack.type?.toLowerCase()];

      if (key) {
        setStats(prev => ({
          ...prev,
          total: (prev.total || 0) + 1,
          [key]: (prev[key] || 0) + 1
        }));
      }
    });

    socket.on("newAlert", (alert) => {
      setToastAlert(alert);
      setTimeout(() => setToastAlert(null), 3000);
    });

    return () => socket.disconnect();
  }, []);

  return (
    <div className="dashboard-container">
      <ToastAlert alert={toastAlert} onClose={() => setToastAlert(null)} />

      <h1 className="dashboard-title">SentinelShield: Advanced Intrusion Detection & Web Protection System</h1>

      {/* STATS */}
      <div className="stats-grid">
        <StatsCard title="Total" value={stats.total || 0} />
        <StatsCard title="SQLi" value={stats.sql || 0} />
        <StatsCard title="XSS" value={stats.xss || 0} />
        <StatsCard title="LFI" value={stats.lfi || 0} />
        <StatsCard title="CMD" value={stats.cmd || 0} />
        <StatsCard title="DIR" value={stats.dir || 0} />
        <StatsCard title="Rate" value={stats.rate || 0} />
        <StatsCard title="Other" value={stats.Other || 0} />
      </div>

      {/* CHART */}
      <div className="card full">
        <AttackChart stats={stats} />
      </div>

      <div className="card full">
        <GeoPieChart logs={logs} />
      </div>

       {/* LOGS */}
      <div className="card full">
        <h2>Logs</h2>
        <LogsTable logs={logs} />
      </div>


      {/* ROW */}
      <div className="grid-2">
        <div className="card">
          <ThreatInsights stats={stats} />
        </div>

        <div className="card">
          <h2>Analysis Summary</h2>
          <hr style={{ border: "1px dashed #475569", margin: "20px 0" }}/>
          <p>Total Attacks: <b>{stats.total}</b></p>

          <p>
            Most Frequent:
            <b>
              {
                (() => {
                  const attacks = {
                    SQL: stats.sql,
                    XSS: stats.xss,
                    Rate: stats.rate,
                    LFI: stats.lfi,
                    CMD: stats.cmd,
                    DIR: stats.dir
                  };

                  const filtered = Object.entries(attacks).filter(
                    ([, value]) => value > 0
                  );

                  if (filtered.length === 0) return " None";

                  return filtered.sort((a, b) => b[1] - a[1])[0][0];
                })()
              }
            </b>
          </p>
        </div>
      </div>

      {/* SECOND ROW */}
      <div className="grid-2">
        <div className="card">
          <h2>Top Attacker IPs</h2>
          <hr style={{ border: "1px dashed #475569", margin: "20px 0" }}/>
          {stats.topIPs?.map((ip, i) => (
            <p key={i}>
              {ip.ip === "::1" ? "Localhost" : ip.ip} → {ip.count}
            </p>
          ))}
        </div>

        <div className="card">
          <h2>Recent Activity</h2>
          <hr style={{ border: "1px dashed #475569", margin: "20px 0" }}/>
          {stats.recent?.map((r, i) => (
            <p key={i}>{r.type} from {r.ip}</p>
          ))}
        </div>
      </div>

      {/* SECURITY */}
      <div className="security-box">
        <h2>🧾 Security Analysis</h2>
        <hr style={{ border: "1px dashed #475569", margin: "20px 0" }}/>
        <ul>
          <li>SQL Injection patterns detected (OR 1=1)</li>
          <li>Rate limiting → brute-force behavior</li>
          <li>Repeated IP activity detected</li>
          <li>Possible false positives</li>
        </ul>
      </div>
    </div>
  );
}