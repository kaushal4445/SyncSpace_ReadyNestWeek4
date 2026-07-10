import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import Skeleton from "./components/ui/Skeleton.jsx";

// Everything behind the authenticated shell is code-split so the initial
// bundle (login/register) stays small and each module is only downloaded
// when the user actually navigates to it.
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const Documents = lazy(() => import("./pages/Documents.jsx"));
const DocumentEditor = lazy(() => import("./pages/DocumentEditor.jsx"));
const Files = lazy(() => import("./pages/Files.jsx"));
const Chat = lazy(() => import("./pages/Chat.jsx"));
const Calendar = lazy(() => import("./pages/Calendar.jsx"));
const Analytics = lazy(() => import("./pages/Analytics.jsx"));
const Profile = lazy(() => import("./pages/Profile.jsx"));
const Settings = lazy(() => import("./pages/Settings.jsx"));

const PageFallback = () => (
  <div className="p-6 space-y-3">
    <Skeleton className="h-8 w-1/3" />
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-32 w-full" />
  </div>
);

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/dashboard"
          element={
            <Suspense fallback={<PageFallback />}>
              <Dashboard />
            </Suspense>
          }
        />
        <Route
          path="/documents"
          element={
            <Suspense fallback={<PageFallback />}>
              <Documents />
            </Suspense>
          }
        />
        <Route
          path="/documents/:id"
          element={
            <Suspense fallback={<PageFallback />}>
              <DocumentEditor />
            </Suspense>
          }
        />
        <Route
          path="/files"
          element={
            <Suspense fallback={<PageFallback />}>
              <Files />
            </Suspense>
          }
        />
        <Route
          path="/chat"
          element={
            <Suspense fallback={<PageFallback />}>
              <Chat />
            </Suspense>
          }
        />
        <Route
          path="/calendar"
          element={
            <Suspense fallback={<PageFallback />}>
              <Calendar />
            </Suspense>
          }
        />
        <Route
          path="/analytics"
          element={
            <Suspense fallback={<PageFallback />}>
              <Analytics />
            </Suspense>
          }
        />
        <Route
          path="/profile"
          element={
            <Suspense fallback={<PageFallback />}>
              <Profile />
            </Suspense>
          }
        />
        <Route
          path="/settings"
          element={
            <Suspense fallback={<PageFallback />}>
              <Settings />
            </Suspense>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
