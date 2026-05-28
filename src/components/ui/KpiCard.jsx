export function KpiCard({ variant = 'blue', icon, value, label, change, changeType = 'neu' }) {
  return (
    <div className={`kpi-card kpi-${variant}`}>
      <div className={`kpi-icon ki-${variant}`}>
        {icon}
      </div>
      <div className="kpi-val">{value}</div>
      <div className="kpi-lbl">{label}</div>
      {change && <div className={`kpi-chg ${changeType}`}>{change}</div>}
    </div>
  );
}
