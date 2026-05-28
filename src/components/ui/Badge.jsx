export function Badge({ variant = 'blue', children }) {
  return <span className={`badge b-${variant}`}>{children}</span>;
}

export function StatusBadge({ status }) {
  const map = {
    paid: { variant: 'green', label: 'Paid' },
    unpaid: { variant: 'amber', label: 'Unpaid' },
    overdue: { variant: 'red', label: 'Overdue' },
    due_soon: { variant: 'amber', label: 'Due soon' },
    payment_submitted: { variant: 'blue', label: 'Proof submitted' },
    proof_rejected: { variant: 'red', label: 'Proof rejected' },
    active: { variant: 'green', label: 'Active' },
    inactive: { variant: 'red', label: 'Suspended' },
    pending: { variant: 'amber', label: 'Pending' },
    rejected: { variant: 'red', label: 'Rejected' },
  };
  const entry = map[status] || { variant: 'blue', label: status };
  return <Badge variant={entry.variant}>{entry.label}</Badge>;
}
