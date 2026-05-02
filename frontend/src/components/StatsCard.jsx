export default function StatsCard({ title, value }) {
  return (
    <div style={{
      background: "#fff",
      padding: "15px",
      borderRadius: "10px",
      width: "150px",
      textAlign: "center",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
    }}>
      <h3>{title}</h3>
      <p>{value}</p>
    </div>
  );
}