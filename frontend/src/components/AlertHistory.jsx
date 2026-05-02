import { useMemo, useState } from "react";

export default function AlertHistory({ alerts }) {
  const [filter, setFilter] = useState("30m");
  const [customDate, setCustomDate] = useState("");

  const filteredAlerts = useMemo(() => {
    const now = new Date();

    return alerts.filter((alert) => {
      const alertTime = new Date(alert.time);
      const diffMs = now - alertTime;

      if (filter === "30m") return diffMs <= 30 * 60 * 1000;
      if (filter === "1h") return diffMs <= 60 * 60 * 1000;
      if (filter === "10h") return diffMs <= 10 * 60 * 60 * 1000;
      if (filter === "24h") return diffMs <= 24 * 60 * 60 * 1000;

      if (filter === "custom" && customDate) {
        const selected = new Date(customDate).toDateString();
        return alertTime.toDateString() === selected;
      }

      return true;
    });
  }, [alerts, filter, customDate]);
  return (
    <div className="bg-white rounded-2xl shadow-md p-5 mt-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <h2 className="text-xl font-semibold">📜 Alert History</h2>

        <div className="flex flex-wrap gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="30m">Last 30 Min</option>
            <option value="1h">Last 1 Hour</option>
            <option value="10h">Last 10 Hours</option>
            <option value="24h">Last 24 Hours</option>
            <option value="custom">Select Date</option>
          </select>

          {filter === "custom" && (
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="border rounded-lg px-3 py-2"
            />
          )}
        </div>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {filteredAlerts.length === 0 ? (
          <p className="text-gray-500">No alerts found.</p>
        ) : (
          filteredAlerts.map((alert, index) => (
            <div
              key={index}
              className="border rounded-xl p-3 flex justify-between items-center"
            >
              <div>
                <p className="font-medium">{alert.type}</p>
                <p className="text-sm text-gray-600">
                  IP: {alert.ip} | URL: {alert.url}
                </p>
              </div>

              <p className="text-xs text-gray-500">
                {new Date(alert.time).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}