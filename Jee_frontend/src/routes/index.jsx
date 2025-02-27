import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useLoading } from '../context/LoadingContext';
import { Analytics } from '@vercel/analytics/react';
import { useEffect, useState } from 'react';
import {
  updateProfileCache,
} from '../interceptors/services';

// Layout
import DefaultLayout from '../components/layouts/DefaultLayout';
// Uncomment and import landing page
import Jeebuddy from '../landingPage/JeeBuddy';

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

// Protected Route Component with subscription check
const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useLoading();
  const [checkingPlan, setCheckingPlan] = useState(true);

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        await updateProfileCache();
      } catch (error) {
        console.error('Error checking subscription:', error);
      } finally {
        setCheckingPlan(false);
      }
    };

    if (isAuthenticated) {
      checkSubscription();
    }
  }, [isAuthenticated]);

  if (isLoading || checkingPlan) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

const AppRoutes = () => {
  const { isAuthenticated, isLoading } = useLoading();
  const [checkingPlan, setCheckingPlan] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        if (token && isAuthenticated) {
          await updateProfileCache();
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
      } finally {
        setCheckingPlan(false);
      }
    };

    checkSubscription();
  }, [isAuthenticated, token]);

  if (isLoading || checkingPlan) {
    return null;
  }

  return (
    <>
      <Routes>
        {/* Root route - Show landing page or redirect to subject selection */}
        <Route
          path="/"
          element={
            token && isAuthenticated ? (
              <Navigate to="/subject-selection" replace />
            ) : (
              <Jeebuddy />
            )
          }
        />

        {/* Auth routes - accessible only when not authenticated */}
        <Route
          path="/login"
          element={
            token && isAuthenticated ? (
              <Navigate to="/subject-selection" replace />
            ) : (
              <Login />
            )
          }
        />
        <Route
          path="/register"
          element={
            token && isAuthenticated ? (
              <Navigate to="/subject-selection" replace />
            ) : (
              <Register />
            )
          }
        />
        <Route
          path="/forgot-password"
          element={
            token && isAuthenticated ? (
              <Navigate to="/subject-selection" replace />
            ) : (
              <ForgotPassword />
            )
          }
        />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Protected routes - require authentication */}
        <Route
          element={
            token && isAuthenticated ? (
              <ProtectedRoute />
            ) : (
              <Navigate to="/" replace />
            )
          }
        >
          {/* Settings is accessible to all logged in users */}
          <Route
            path="/settings"
            element={
              <DefaultLayout>
                <Settings />
              </DefaultLayout>
            }
          />

          {/* All other routes */}
          <Route
            path="/subject-selection"
            element={
              <DefaultLayout>
                <SubjectSelection />
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
            <Route path="register" element={<Register />} />
            <Route path="books/:topicId" element={<TopicContent />} />
            <Route path="flashcards" element={<FlashCards />} />
            <Route path="materials" element={<StudyMaterials />} />
            <Route path="question-bank" element={<QuestionBank />} />
            <Route path="pdf/:pdfUrl" element={<PdfViewer />} />
            <Route path="topic/:topicId" element={<TopicContent />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>

        {/* Catch all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Analytics />
    </>
  );
};

export default AppRoutes;
