import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { SocketProvider } from '@/sockets/SocketProvider';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import WorkspacePage from '@/pages/WorkspacePage';
import BoardPage from '@/pages/BoardPage';
import NotFoundPage from '@/pages/NotFoundPage';
import 'react-toastify/dist/ReactToastify.css';

export default function App() {
  return (
    <BrowserRouter basename="/Real-Time-Collaborative-Project-Management-Tool">
      <SocketProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/workspaces/:workspaceId" element={<WorkspacePage />} />
            <Route path="/workspaces/:workspaceId/boards/:boardId" element={<BoardPage />} />
          </Route>

          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </SocketProvider>

      <ToastContainer
        position="bottom-right"
        autoClose={3500}
        newestOnTop
        toastClassName="!font-sans !text-sm !rounded-md"
      />
    </BrowserRouter>
  );
}
