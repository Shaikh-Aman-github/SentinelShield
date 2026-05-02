import { X } from "lucide-react";
import "./ToastAlert.css";

export default function ToastAlert({ alert, onClose }) {
  if (!alert) return null;

  // Severity based on attack type
  const getSeverityClass = (severity) => {
    switch (severity) {
      case "CRITICAL":
        return "critical-alert"; // Red

      case "HIGH":
        return "warning-alert"; // Orange

      case "MEDIUM":
        return "medium-alert"; // Yellow

      case "LOW":
        return "info-alert"; // Blue

      default:
        return "default-alert"; // Gray
    }
  };
  return (
    <div className={`toast-alert ${getSeverityClass(alert.severity)}`}>
      <div className="toast-header">
        <h3>🚨 Security Alert</h3>

        <button onClick={onClose} className="close-btn">
          <X size={16} />
        </button>
      </div>

      <p className="toast-message">
        <strong>{alert.type}</strong> detected from <strong>{alert.ip}</strong>
      </p>

      <p className="toast-time">
        {new Date(alert.time).toLocaleString()}
      </p>
    </div>
  );
}