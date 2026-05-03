import DOMPurify from "dompurify";

export default function LogsTable({ logs }) {
  const sanitize = (data) => DOMPurify.sanitize(data);

  return (
    <table border="1" width="100%">
      <thead>
        <tr>
          <th>Time</th>
          <th>IP</th>
          <th>Type</th>
          <th>URL</th>
        </tr>
      </thead>
      <tbody>
        {logs.slice(0, 50).map((log, i) => (
          <tr key={i}>
            <td>{new Date(log.time).toLocaleString()}</td>

            {/* sanitize all dynamic fields */}
            <td>{sanitize(log.ip)}</td>
            <td>{sanitize(log.type)}</td>
            <td>{sanitize(log.url)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}