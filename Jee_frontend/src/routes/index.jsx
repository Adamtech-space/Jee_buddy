import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useLoading } from '../context/LoadingContext';
import { Analytics } from '@vercel/analytics/react';
import { useEffect, useState } from 'react';
import {
  getCurrentPlanName,
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
        await getCurrentPlanName();
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

// Subscription Protected Route Component
const SubscriptionProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useLoading();
  const [hasPlan, setHasPlan] = useState(false);
  const [checkingPlan, setCheckingPlan] = useState(true);

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        await updateProfileCache(); // Update profile data
        const planName = getCurrentPlanName();
        setHasPlan(planName !== 'Free');
      } catch (error) {
        console.error('Error checking subscription:', error);
        setHasPlan(false);
      } finally {
        setCheckingPlan(false);
      }
    };

    if (isAuthenticated) {
      checkSubscription();
    }
  }, [isAuthenticated]);

  // Don't render anything while checking auth or plan
  if (isLoading || checkingPlan) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasPlan) {
    return <Navigate to="/settings" replace />;
  }

  return <Outlet />;
};

const AppRoutes = () => {
  const { isAuthenticated, isLoading } = useLoading();
  const [hasPlan, setHasPlan] = useState(false);
  const [checkingPlan, setCheckingPlan] = useState(true);

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        if (isAuthenticated) {
          await updateProfileCache();
          const planName = getCurrentPlanName();
          setHasPlan(planName !== 'Free');
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
        setHasPlan(false);
      } finally {
        setCheckingPlan(false);
      }
    };

    checkSubscription();
  }, [isAuthenticated]);

  if (isLoading || checkingPlan) {
    return null;
  }

  return (
    <>
      <Routes>
        {/* Landing page as root route */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              hasPlan ? (
                <Navigate to="/subject-selection" replace />
              ) : (
                <Navigate to="/settings" replace />
              )
            ) : (
              <Jeebuddy />
            )
          }
        />

        {/* Auth Routes */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              hasPlan ? (
                <Navigate to="/subject-selection" replace />
              ) : (
                <Navigate to="/settings" replace />
              )
            ) : (
              <Login />
            )
          }
        />
        <Route
          path="/register"
          element={
            isAuthenticated ? (
              hasPlan ? (
                <Navigate to="/subject-selection" replace />
              ) : (
                <Navigate to="/settings" replace />
              )
            ) : (
              <Register />
            )
          }
        />
        <Route
          path="/forgot-password"
          element={
            isAuthenticated ? (
              hasPlan ? (
                <Navigate to="/subject-selection" replace />
              ) : (
                <Navigate to="/settings" replace />
              )
            ) : (
              <ForgotPassword />
            )
          }
        />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Protected Routes - Only accessible when logged in */}
        <Route element={<ProtectedRoute />}>
          {/* Settings is accessible to all logged in users */}
          <Route
            path="/settings"
            element={
              <DefaultLayout>
                <Settings />
              </DefaultLayout>
            }
          />

          {/* All other routes require a subscription */}
          <Route element={<SubscriptionProtectedRoute />}>
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
              <Route path="books/:topicId" element={<TopicContent />} />
              <Route path="flashcards" element={<FlashCards />} />
              <Route path="materials" element={<StudyMaterials />} />
              <Route path="question-bank" element={<QuestionBank />} />
              <Route path="pdf/:pdfUrl" element={<PdfViewer />} />
              <Route path="topic/:topicId" element={<TopicContent />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>
        </Route>

        {/* Redirects */}
        <Route
          path="/dashboard"
          element={
            hasPlan ? (
              <Navigate to="/subject-selection" replace />
            ) : (
              <Navigate to="/settings" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Analytics />
    </>
  );
};

export default AppRoutes;
