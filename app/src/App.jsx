import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function App() {
  const [data, setData] = useState(null);
  const [health, setHealth] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [messageRes, healthRes] = await Promise.all([
          fetch(`${API_URL}/api/message`),
          fetch(`${API_URL}/api/health`)
        ]);

        const messageData = await messageRes.json();
        const healthData = await healthRes.json();

        setData(messageData);
        setHealth(healthData);
      } catch (err) {
        setError("Cannot connect to backend API");
      }
    }

    loadData();
  }, []);

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <p style={styles.badge}>W8-W9 DevOps Lab</p>
        <h1 style={styles.title}>GitOps CI/CD Demo Ap -E2E Test</h1>

        {error && <p style={styles.error}>{error}</p>}

        {data ? (
          <div>
            <h2>{data.title}</h2>
            <p style={styles.message}>{data.message}</p>
            <p><strong>Backend version:</strong> {data.version}</p>
            <p><strong>Timestamp:</strong> {data.timestamp}</p>
          </div>
        ) : (
          <p>Loading backend data...</p>
        )}

        <hr style={styles.divider} />

        {health && (
          <p>
            Backend health: <strong style={styles.ok}>{health.status}</strong>
          </p>
        )}
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f172a, #1e293b)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "#e5e7eb",
    fontFamily: "Arial, sans-serif"
  },
  card: {
    width: "90%",
    maxWidth: "720px",
    background: "#111827",
    border: "1px solid #334155",
    borderRadius: "20px",
    padding: "32px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.35)"
  },
  badge: {
    display: "inline-block",
    padding: "6px 12px",
    background: "#2563eb",
    borderRadius: "999px",
    fontSize: "14px"
  },
  title: {
    fontSize: "36px",
    marginBottom: "16px"
  },
  message: {
    fontSize: "20px"
  },
  divider: {
    borderColor: "#334155",
    margin: "24px 0"
  },
  ok: {
    color: "#22c55e"
  },
  error: {
    color: "#f87171"
  }
};

export default App;