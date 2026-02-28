import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import LandingPage from './views/LandingPage';
import LoginPage from './views/LoginPage';
import SignupPage from './views/SignupPage';
import ChatView from './views/ChatView';
import DashboardView from './views/DashboardView';
import AuditView from './views/AuditView';
import MetricsView from './views/MetricsView';
import SettingsView from './views/SettingsView';
import AdminView from './views/AdminView';
import UsersView from './views/UsersView';
import MyItemsView from './views/MyItemsView';
import ProtectedRoute from './components/ProtectedRoute';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Protected app routes */}
        <Route path="/app" element={<ProtectedRoute><App /></ProtectedRoute>}>
          <Route index element={<Navigate to="/app/chat" replace />} />
          <Route path="chat" element={<ChatView />} />
          <Route path="dashboard" element={<DashboardView />} />
          <Route path="audit" element={<AuditView />} />
          <Route path="metrics" element={<MetricsView />} />
          <Route path="settings" element={<SettingsView />} />
          <Route path="admin" element={<AdminView />} />
          <Route path="users" element={<UsersView />} />
          <Route path="my-items" element={<MyItemsView />} />
        </Route>

        {/* Legacy redirects */}
        <Route path="/chat" element={<Navigate to="/app/chat" replace />} />
        <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
        <Route path="/audit" element={<Navigate to="/app/audit" replace />} />
        <Route path="/metrics" element={<Navigate to="/app/metrics" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
