import { Routes, Route, useParams, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { Landing } from './pages/Landing.jsx';
import { Auth } from './pages/Auth.jsx';
import { ExtensionPage } from './pages/ExtensionPage.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { UrlAnalytics } from './pages/UrlAnalytics.jsx';
import { Settings } from './pages/Settings.jsx';

function AnalyticsRoute() {
  const { urlId } = useParams();
  return <UrlAnalytics key={urlId} />;
}

function LegacyAnalyticsRedirect() {
  const { urlId } = useParams();
  return <Navigate to={`/dashboard/stats/${urlId}`} replace />;
}

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/extension" element={<ExtensionPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/stats/:urlId"
          element={
            <ProtectedRoute>
              <AnalyticsRoute />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/analytics/:urlId"
          element={
            <ProtectedRoute>
              <LegacyAnalyticsRedirect />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}
