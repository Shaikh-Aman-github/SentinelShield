export default function AlertBox({ alerts }) {
  return (
    <div style={{ background: "#ffe6e6", padding: "10px", marginBottom: "20px" }}>
      <h2>Alerts</h2>

      {alerts.length === 0 ? (
        <p>No alerts</p>
      ) : (
        alerts.map((a, i) => (
          <div key={i} style={{ marginBottom: "5px" }}>
             {a.type} from {a.ip}
          </div>
        ))
      )}
    </div>
  );
}