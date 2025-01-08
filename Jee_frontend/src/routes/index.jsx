import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import PropTypes from 'prop-types';

// Layout
import DefaultLayout from '../components/layouts/DefaultLayout';

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
import SavedNotes from '../components/SavedNotes';
import StudyMaterials from '../components/StudyMaterials';

// Landing Page Components
import Hero from '../components/Hero';
import Features from '../components/Features';
import Demo from '../components/Demo';
import StudyResources from '../components/StudyResources';

// Protected Route Component
const ProtectedRoute = () => {
  // Add your auth check logic here
  const isAuthenticated = true; // Replace with actual auth check
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

const AppRoutes = ({ quote }) => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={
        <DefaultLayout>
          <Hero quote={quote} />
          <Features />
          <StudyResources />
          <Demo />
        </DefaultLayout>
      } />

      {/* Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/subject-selection" element={
          <DefaultLayout>
            <SubjectSelection />
          </DefaultLayout>
        } />

        <Route path="/dashboard/:subject" element={<DefaultLayout>
          <Outlet />
        </DefaultLayout>}>
          <Route index element={<BooksList />} />
          <Route path="books" element={<BooksList />} />
          <Route path="books/:topicId" element={<TopicContent />} />
          <Route path="flashcards" element={<FlashCards />} />
          <Route path="notes" element={<SavedNotes />} />
          <Route path="materials" element={<StudyMaterials />} />
        </Route>
      </Route>

      {/* Redirects */}
      <Route path="/dashboard" element={<Navigate to="/subject-selection" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

AppRoutes.propTypes = {
  quote: PropTypes.shape({
    text: PropTypes.string.isRequired,
    author: PropTypes.string.isRequired
  }).isRequired
};

export default AppRoutes;