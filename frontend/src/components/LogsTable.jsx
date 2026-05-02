export default function LogsTable({ logs }) {
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
        {logs.map((log, i) => (
          <tr key={i}>
            <td>{new Date(log.time).toLocaleString()}</td>
            <td>{log.ip}</td>
            <td>{log.type}</td>
            <td>{log.url}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}