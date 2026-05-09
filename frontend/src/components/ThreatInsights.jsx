export default function ThreatInsights({ stats }) {
  const total = stats.total || 0;
  const rate = stats.rate || 0;
  const sql = stats.sql || 0;

  let threatLevel = "SAFE";

  if (total > 0) {
    threatLevel = "LOW";

    if (rate > 20 || sql > 5) threatLevel = "MEDIUM";
    if (rate > 40 || sql > 10) threatLevel = "HIGH";
  }

  return (
    <div>
      <h2>Threat Insights</h2>

      <p><strong>Threat Level:</strong> {threatLevel}</p>

      {rate > 0 && (
        <p>Repeated requests detected (brute-force)</p>
      )}

      {sql > 0 && (
        <p>SQL Injection attempts detected</p>
      )}

      {stats.Other > 0 && (
        <p>Suspicious User-Agent activity</p>
      )}

      {total === 0 && <p>No threats detected</p>}
    </div>
  );
}