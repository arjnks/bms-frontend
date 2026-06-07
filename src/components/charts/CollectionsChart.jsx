import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const fmt = (v) => `Rs. ${(v / 100000).toFixed(1)}L`;

export function CollectionsChart({ data = [] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--blue)" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="var(--blue)" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-2)' }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: 'var(--text-2)' }} axisLine={false} tickLine={false} domain={[0, max => Math.max(max, 100000)]} />
        <Tooltip
          formatter={(v) => [`Rs. ${v.toLocaleString('en-IN')}`, 'Collected']}
          contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
        />
        <Area type="monotone" dataKey="amount" stroke="var(--blue)" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
