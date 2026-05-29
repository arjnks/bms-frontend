import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ToastContainer } from './components/ui/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import PageLoader from './components/ui/PageLoader';

// ── Lazy-loaded pages ────────────────────────────────────────────────────────
// Each page is loaded only when first visited, keeping the initial bundle small.

// Public
const Login = lazy(() => import('./pages/Login'));

// Admin
const Overview            = lazy(() => import('./pages/admin/Overview'));
const Customers           = lazy(() => import('./pages/admin/Customers'));
const CustomerDetails     = lazy(() => import('./pages/admin/CustomerDetails'));
const BillUpload          = lazy(() => import('./pages/admin/BillUpload'));
const PaymentVerifications = lazy(() => import('./pages/admin/PaymentVerifications'));
const UserApprovals       = lazy(() => import('./pages/admin/UserApprovals'));
const Reminders           = lazy(() => import('./pages/admin/Reminders'));
const AddRule             = lazy(() => import('./pages/admin/AddRule'));
const Reports             = lazy(() => import('./pages/admin/Reports'));
const AdminBills          = lazy(() => import('./pages/admin/AdminBills'));
const CustomerLogins      = lazy(() => import('./pages/admin/CustomerLogins'));
const SecurityLogs        = lazy(() => import('./pages/admin/SecurityLogs'));

// Customer
const MyBills           = lazy(() => import('./pages/customer/MyBills'));
const BillDetail        = lazy(() => import('./pages/customer/BillDetail'));
const ExternalBillDetail = lazy(() => import('./pages/customer/ExternalBillDetail'));
const SubmitPayment     = lazy(() => import('./pages/customer/SubmitPayment'));
const Preferences       = lazy(() => import('./pages/customer/Preferences'));

// ── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public */}
                <Route path="/login"    element={<Login />} />
                <Route path="/register" element={<Login />} />
                <Route path="/"         element={<Navigate to="/login" replace />} />

                {/* Admin routes */}
                <Route element={<ProtectedRoute allowedRole="admin" />}>
                  <Route path="/dashboard"                  element={<Overview />} />
                  <Route path="/dashboard/customers"        element={<Customers />} />
                  <Route path="/dashboard/customers/:id"    element={<CustomerDetails />} />
                  <Route path="/dashboard/bills/upload"     element={<BillUpload />} />
                  <Route path="/dashboard/bills"            element={<AdminBills />} />
                  <Route path="/dashboard/logins"           element={<CustomerLogins />} />
                  <Route path="/dashboard/security-logs"    element={<SecurityLogs />} />
                  <Route path="/dashboard/payments"         element={<PaymentVerifications />} />
                  <Route path="/dashboard/approvals"        element={<UserApprovals />} />
                  <Route path="/dashboard/reminders"        element={<Reminders />} />
                  <Route path="/dashboard/reminders/add"    element={<AddRule />} />
                  <Route path="/dashboard/reports"          element={<Reports />} />
                </Route>

                {/* Customer routes */}
                <Route element={<ProtectedRoute allowedRole="customer" />}>
                  <Route path="/portal"                        element={<MyBills />} />
                  <Route path="/portal/bills/:id"              element={<BillDetail />} />
                  <Route path="/portal/bills/:id/pay"          element={<SubmitPayment />} />
                  <Route path="/portal/external-bills/:billno" element={<ExternalBillDetail />} />
                  <Route path="/portal/preferences"            element={<Preferences />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </Suspense>
            <ToastContainer />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
