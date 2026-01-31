import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { ToastContainer } from '@/components/ui/Toast';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { AdminLayout } from '@/components/admin/AdminLayout';

// Public Pages
import { HomePage } from '@/pages/HomePage';
import { BlogPage, BlogPostPage } from '@/pages/BlogPages';

// Admin Pages
import { LoginPage } from '@/pages/admin/LoginPage';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { SiteContentPage } from '@/pages/admin/SiteContentPage';
import { GalleriesPage } from '@/pages/admin/GalleriesPage';
import { BlogPostsPage } from '@/pages/admin/BlogPostsPage';
import { BlogPostEditorPage } from '@/pages/admin/BlogPostEditorPage';
import { InquiriesPage } from '@/pages/admin/InquiriesPage';

import './index.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />

            {/* Admin Login */}
            <Route path="/admin/login" element={<LoginPage />} />

            {/* Protected Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="content" element={<SiteContentPage />} />
              <Route path="galleries" element={<GalleriesPage />} />
              <Route path="posts" element={<BlogPostsPage />} />
              <Route path="posts/:postId" element={<BlogPostEditorPage />} />
              <Route path="inquiries" element={<InquiriesPage />} />
            </Route>
          </Routes>
          <ToastContainer />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
