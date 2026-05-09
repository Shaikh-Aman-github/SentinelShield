import DOMPurify from "dompurify";

export default function LogsTable({ logs }) {
  const sanitize = (data) => DOMPurify.sanitize(data);

  return (
  <div className="table-container">
    <table className="log-table">
      <thead>
        <tr>
          <th>Time</th>
          <th>IP</th>
          <th>Type</th>
          <th>URL</th>
          <th>Status</th>
        </tr>
      </thead>

      <tbody>
        {logs.slice(0, 50).map((log, i) => (
          <tr key={i}>
            <td>{new Date(log.time).toLocaleString()}</td>
            <td>{sanitize(log.ip)}</td>
            <td>{sanitize(log.type)}</td>
            <td>{sanitize(log.url)}</td>
            <td>
              {log.falsePositive ? "False Positive" : "Valid Attack"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
}