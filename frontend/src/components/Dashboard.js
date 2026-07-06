import { getVisibleModules } from "../moduleRegistry";

function Dashboard({ permissions, onSelect, styles }) {
  const visibleModules = getVisibleModules(permissions);

  if (visibleModules.length === 0) {
    return (
      <div style={styles.emptyState}>
        <p>Tu usuario no tiene módulos asignados.</p>
        <p>Contacta a un administrador.</p>
      </div>
    );
  }

  return (
    <div style={styles.dashboardGrid}>
      {visibleModules.map((m) => (
        <button
          key={m.key}
          style={styles.moduleButton}
          onClick={() => onSelect(m.key)}
        >
          <span style={styles.moduleIcon}>{m.icon}</span>
          <span>{m.label}</span>
        </button>
      ))}
    </div>
  );
}

export default Dashboard;
