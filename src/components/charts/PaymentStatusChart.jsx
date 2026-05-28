import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function PaymentStatusChart({ data = [] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data} cx="50%" cy="45%"
          innerRadius={60} outerRadius={88}
          paddingAngle={3} dataKey="value"
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v, n) => [v + ' accounts', n]}
          contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
        />
        <Legend
          iconType="circle" iconSize={8}
          formatter={(v) => <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{v}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
