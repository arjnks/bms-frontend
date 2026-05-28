export function Card({ children, style }) {
  return <div className="card" style={style}>{children}</div>;
}

export function CardHeader({ title, subtitle, actions }) {
  return (
    <div className="card-hdr">
      <div>
        <div className="card-title">{title}</div>
        {subtitle && <div className="card-sub">{subtitle}</div>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{actions}</div>}
    </div>
  );
}
