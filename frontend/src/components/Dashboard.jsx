import { useEffect, useState } from "react";

import { getStats, getLogs } from "../services/api";
import { getAlerts, markAlertAsSent, getAlertHistory } from "../services/api";

import StatsCard from "./StatsCard";
import LogsTable from "./LogsTable";
import AttackChart from "./AttackChart";
import ToastAlert from "./ToastAlert";
import AlertHistory from "./AlertHistory";


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
        setToastAlert(latestAlerts[0]);

        // mark popup as already sent
        await markAlertAsSent();

        setTimeout(() => {
          setToastAlert(null);
        }, 3000);
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
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  
  return (
    <div style={{ padding: "20px" }}>
    
    <div className="p-6">
      <ToastAlert
        alert={toastAlert}
        onClose={() => setToastAlert(null)}
      />

      <h1 className="text-2xl font-bold">🛡️ SentinelShield Dashboard</h1>

      {/* <AlertHistory alerts={alerts} /> */}
    </div>


      <div style={{ display: "flex", gap: "20px" }}>
        <StatsCard title="Total" value={stats.total || 0} />
        <StatsCard title="SQLi" value={stats.sql || 0} />
        <StatsCard title="XSS" value={stats.xss || 0} />
        <StatsCard title="LFI" value={stats.lfi || 0} />
        <StatsCard title="CMD" value={stats.cmd || 0} />
        <StatsCard title="DIR" value={stats.dir || 0} />
        <StatsCard title="Rate Limit" value={stats.rate || 0} />
      </div>

      <h2>📊 Attack Chart</h2>
      <AttackChart stats={stats} />

      <h2>🔥 Top Attacker IPs</h2>
      <ul>
        {stats.topIPs?.length > 0 ? (
          stats.topIPs.map((ipData, i) => (
            <li key={i}>
              {ipData.ip === "::1" ? "Localhost" : ipData.ip} → {ipData.count} attacks
            </li>
          ))
        ) : (
          <li>No data</li>
        )}
      </ul>

      <h2>🕒 Recent Activity</h2>
      <ul>
        {stats.recent?.length > 0 ? (
          stats.recent.map((log, i) => (
            <li key={i}>
              {log.type} from {log.ip}
            </li>
          ))
        ) : (
          <li>No recent activity</li>
        )}
      </ul> 

      <h2>📜 Logs</h2>
      <LogsTable logs={logs} />
    </div>
  );
}