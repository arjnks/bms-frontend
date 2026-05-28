import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export function AppShell({ children, outstandingAmt, pendingPayments, pendingApprovals }) {
  return (
    <>
      <Navbar outstandingAmt={outstandingAmt} />
      <Sidebar pendingPayments={pendingPayments} pendingApprovals={pendingApprovals} />
      <main className="main-content">
        {children}
      </main>
    </>
  );
}
