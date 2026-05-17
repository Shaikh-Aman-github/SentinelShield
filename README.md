# SentinelShield – Advanced Intrusion Detection & Web Protection System

SentinelShield is a full-stack cybersecurity project designed to simulate a real-world Intrusion Detection & Web Protection System.

The application detects and monitors malicious web activities such as:

* SQL Injection
* Cross-Site Scripting (XSS)
* Command Injection
* Directory Traversal
* Local File Inclusion (LFI)
* Brute-force / Rate-limit attacks
* Suspicious Header Activities

It provides a modern security dashboard with live analytics, attack monitoring, threat visualization, and alert notifications.

---

# Live Deployment

## 🔹 Main Endpoint URLs

### Local Backend Test Endpoint

```bash
http://localhost:3000/test
```

### Production Frontend

```bash
https://sentinel-shield-nu.vercel.app/
```

### Production Backend Test Endpoint

```bash
https://sentinelshield-adxf.onrender.com/test
```

---

# Tech Stack

## Frontend

* React.js
* Vite
* Axios
* Chart.js / Recharts
* CSS
* Lucide React Icons

## Backend

* Node.js
* Express.js
* Middleware-based Security Detection
* JSON-based Logging System

## Deployment

* Frontend → Vercel
* Backend → Render

## Version Control

* Git
* GitHub

---

# Project Structure

```bash
sentinelshield/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │
│   ├── public/
│   ├── package.json
│
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── data/
│   │   ├── logs.json
│   │   ├── alerts.json
│   │
│   ├── server.js
│   ├── package.json
│
├── .gitignore
├── README.md
```
---

## Step 3: Install Frontend Dependencies

```bash
cd frontend
npm install
```

---

## Step 4: Run Frontend

```bash
npm run dev
```

Frontend will start on:

```bash
http://localhost:5173
```

---

# Backend Setup (Local)

## Step 1: Open Backend Folder

```bash
cd backend
```

---

## Step 2: Install Backend Dependencies

```bash
npm install
```

---

## Step 3: Start Backend Server

```bash
npm run dev
```
Backend will start on:

```bash
http://localhost:3000
```

---

# API Endpoints

## Test Endpoint

```bash
GET /test
```

## Logs Endpoint

```bash
GET /logs
```

## Stats Endpoint

```bash
GET /stats
```

## Alerts Endpoint

```bash
GET /alerts
```

## Alert History Endpoint

```bash
GET /alerts/history
```

---

# Security Middleware

The backend uses custom middleware to detect suspicious request patterns.

## Middleware Included

* detector.js
* rateLimiter.js

These middleware modules:

* Analyze incoming requests
* Detect attack payloads
* Log suspicious activities
* Trigger alerts
* Block malicious requests

---

# Alert System

SentinelShield includes a real-time styled toast notification system.

Alert severities:

* LOW
* MEDIUM
* HIGH
* CRITICAL

The alert popup displays:

* Attack Type
* Attacker IP
* Timestamp
* Severity Level

---

# Environment Variables

## IMPORTANT

The `.env` file is NOT uploaded to GitHub
VITE_API_URL_Dev=http://localhost:3000
---

# Sample Attack Payloads

## SQL Injection

```bash
' OR 1=1 --
```

## XSS

```html
<script>alert('xss')</script>
```

## Command Injection

```bash
; ls
```

## Directory Traversal

```bash
../../etc/passwd
```

---

# Author

Aman Shaikh

Cybersecurity Enthusiast | Full Stack Developer | SOC & Web Security Learner

---

# License

This project is developed for educational and learning purposes.
