export const styles = {
  page: {
    minHeight: "100vh",
    background: "#0f172a",
    color: "#fff",
    fontFamily: "Arial, sans-serif",
  },

  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 25px",
    background: "#1e293b",
    borderBottom: "1px solid #334155",
  },

  topbarTitle: {
    margin: 0,
    fontSize: "20px",
  },

  topbarUser: {
    fontSize: "13px",
    color: "#94a3b8",
  },

  logoutButton: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    padding: "8px 14px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  backButton: {
    background: "#334155",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    padding: "8px 14px",
    cursor: "pointer",
    marginBottom: "20px",
  },

  dashboardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: "18px",
    padding: "30px",
    maxWidth: "900px",
    margin: "0 auto",
  },

  moduleButton: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "14px",
    padding: "25px 10px",
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
    fontSize: "14px",
    fontWeight: "600",
    transition: "transform 0.1s, border-color 0.1s",
  },

  moduleIcon: {
    fontSize: "34px",
  },

  moduleContent: {
    padding: "20px 30px",
    maxWidth: "700px",
    margin: "0 auto",
  },

  emptyState: {
    textAlign: "center",
    color: "#94a3b8",
    marginTop: "60px",
  },

  // Reutilizados por los componentes de módulo copiados de Control 360
  card: {
    background: "#1e293b",
    padding: "20px",
    borderRadius: "10px",
    marginBottom: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
  },

  input: {
    display: "block",
    width: "100%",
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "5px",
    border: "1px solid #475569",
    background: "#334155",
    color: "#fff",
    boxSizing: "border-box",
  },

  button: {
    padding: "10px 15px",
    background: "#22c55e",
    border: "none",
    borderRadius: "5px",
    color: "#fff",
    cursor: "pointer",
    marginRight: "5px",
  },

  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    marginBottom: "10px",
    padding: "10px",
    borderBottom: "1px solid #334155",
  },
};
