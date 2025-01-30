import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useLoading } from '../context/LoadingContext';
import { Analytics } from '@vercel/analytics/react';

// Layout
import DefaultLayout from '../components/layouts/DefaultLayout';
// Ram landing page
// import Jeebuddy from '../landingPage/JeeBuddy'

// Auth Pages
import Login from '../pages/Login';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';
import SubjectSelection from '../pages/SubjectSelection';
import AuthCallback from '../pages/auth/callback';

// Dashboard Components
import BooksList from '../components/BooksList';
import TopicContent from '../components/TopicContent';
import FlashCards from '../components/FlashCards';
import StudyMaterials from '../components/StudyMaterials';
import QuestionBank from '../components/QuestionBank';

// settings with subscription components
import Settings from '../pages/Subscription';
import PdfViewer from '../components/PdfViewer';

// // Landing Page Components
// import Hero from '../components/Hero';
// import Features from '../components/Features';
// import Demo from '../components/Demo';
// import StudyResources from '../components/StudyResources';

// Protected Route Component
const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useLoading();

  // Don't render anything while checking auth
  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

const AppRoutes = () => {
  const { isAuthenticated, isLoading } = useLoading();

  // Don't render anything while checking auth
  if (isLoading) {
    return null;
  }

  return (
    <>
      <Routes>
        {/* Public Routes - Only accessible when not logged in */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/subject-selection" replace />
            ) : (
              <Navigate to="/register" replace />
            )
          }
        />

        {/* Auth Routes - Only accessible when not logged in */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/subject-selection" replace />
            ) : (
              <Login />
            )
          }
        />
        <Route
          path="/register"
          element={
            isAuthenticated ? (
              <Navigate to="/subject-selection" replace />
            ) : (
              <Register />
            )
          }
        />
        <Route
          path="/forgot-password"
          element={
            isAuthenticated ? (
              <Navigate to="/subject-selection" replace />
            ) : (
              <ForgotPassword />
            )
          }
        />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Protected Routes - Only accessible when logged in */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/subject-selection"
            element={
              <DefaultLayout>
                <SubjectSelection />
              </DefaultLayout>
            }
          />
          <Route
            path="/settings"
            element={
              <DefaultLayout>
                <Settings />
              </DefaultLayout>
            }
          />

          <Route
            path="/dashboard/:subject"
            element={
              <DefaultLayout>
                <Outlet />
              </DefaultLayout>
            }
          >
            <Route index element={<BooksList />} />
            <Route path="books" element={<BooksList />} />
            <Route path="books/:topicId" element={<TopicContent />} />
            <Route path="flashcards" element={<FlashCards />} />
            <Route path="materials" element={<StudyMaterials />} />
            <Route path="question-bank" element={<QuestionBank />} />
            <Route path="pdf/:pdfUrl" element={<PdfViewer />} />
            <Route path="topic/:topicId" element={<TopicContent />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>

        {/* Redirects */}
        <Route
          path="/dashboard"
          element={<Navigate to="/subject-selection" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Analytics />
    </>
  );
};

export default AppRoutes;