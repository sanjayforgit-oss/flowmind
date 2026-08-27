import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { WorkflowProvider } from './context/WorkflowContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AdminRoute } from './components/auth/AdminRoute';
import { PublicRoute } from './components/auth/PublicRoute';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { CopilotPage } from './pages/CopilotPage';
import { WorkflowsPage } from './pages/WorkflowsPage';
import { SimulationPage } from './pages/SimulationPage';
import { ConflictsPage } from './pages/ConflictsPage';
import { ExecutionsPage } from './pages/ExecutionsPage';
import { AuditTrailPage } from './pages/AuditTrailPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <WorkflowProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Authentication Routes (Guarded for Logged-in users) */}
              <Route element={<PublicRoute />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/auth" element={<Navigate to="/login" replace />} />
                <Route path="/signup" element={<SignUpPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
              </Route>

              {/* Protected Administrator Routes (Requires Auth + Admin Role) */}
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminDashboardPage />} />
                <Route path="/admin/users" element={<AdminDashboardPage />} />
                <Route path="/admin/workflows" element={<AdminDashboardPage />} />
                <Route path="/admin/audit" element={<AdminDashboardPage />} />
              </Route>

              {/* Protected User Application Routes (Requires Active Auth Session) */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/dashboard" element={<Navigate to="/" replace />} />
                  <Route path="/copilot" element={<CopilotPage />} />
                  <Route path="/workflows" element={<WorkflowsPage />} />
                  <Route path="/validation" element={<ConflictsPage />} />
                  <Route path="/conflicts" element={<ConflictsPage />} />
                  <Route path="/simulation" element={<SimulationPage />} />
                  <Route path="/simulator" element={<Navigate to="/simulation" replace />} />
                  <Route path="/executions" element={<ExecutionsPage />} />
                  <Route path="/audit" element={<AuditTrailPage />} />
                  <Route path="/history" element={<Navigate to="/audit" replace />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </WorkflowProvider>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
