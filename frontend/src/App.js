import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense, useState, useEffect } from "react";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Toaster } from "sonner";
import { SearchProvider } from "./context/SearchContext";
import { SocketProvider } from "./context/SocketContext";

// Eager load critical pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Tasks from "./pages/Tasks";
import Dashboard from "./pages/Dashboard";
import MyTasks from "./pages/MyTasks";
import ActivityLog from "./pages/ActivityLog";
import NotificationsPage from "./pages/NotificationsPage";
import Settings from "./pages/Settings";
import FocusMode from "./pages/FocusMode";
import ProductivityReport from "./pages/ProductivityReport";
import Arcade from "./pages/Arcade";
import Kanban from "./pages/Kanban";
import CalendarView from "./pages/CalendarView";
import TimeTracking from "./pages/TimeTracking";
import InvoiceGenerator from "./pages/InvoiceGenerator";
import MainLayout from "./components/MainLayout";

// Lazy load heavy components for better initial load time
const Analytics = lazy(() => import("./pages/Analytics"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const KanbanBoard = lazy(() => import("./pages/KanbanBoard"));

// Loading fallback component
const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-red-600 text-white text-xs font-bold text-center py-2 z-[9999] animate-pulse">
      You are currently offline. ZenTask is running in offline mode.
    </div>
  );
};

const PageLoader = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <SearchProvider>
            <Toaster position="top-right" richColors closeButton />
            <OfflineBanner />

            <Router>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />

                {/* Protected Routes */}
                <Route element={<MainLayout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/tasks" element={<Tasks />} />
                  <Route path="/my-day" element={<Tasks filter="myday" />} />
                  <Route path="/important" element={<Tasks filter="important" />} />
                  <Route path="/planned" element={<Tasks filter="planned" />} />
                  <Route path="/completed" element={<Tasks filter="completed" />} />
                  <Route path="/my-tasks" element={<MyTasks />} />
                  <Route path="/activity-log" element={<ActivityLog />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/focus" element={<FocusMode />} />
                  <Route path="/report" element={<ProductivityReport />} />
                  <Route path="/arcade" element={<Arcade />} />
                  <Route path="/board" element={<Kanban />} />
                  <Route path="/calendar" element={<CalendarView />} />
                  <Route path="/time-tracking" element={<TimeTracking />} />
                  <Route path="/invoices" element={<InvoiceGenerator />} />
                  <Route path="/analytics" element={<Suspense fallback={<PageLoader />}><Analytics /></Suspense>} />
                  <Route path="/help" element={<Suspense fallback={<PageLoader />}><HelpCenter /></Suspense>} />
                </Route>

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Router>
          </SearchProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
