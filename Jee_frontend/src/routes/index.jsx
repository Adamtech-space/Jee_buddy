import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import SubjectSelection from '../pages/SubjectSelection';
import DashboardLayout from '../components/layouts/DashboardLayout';
import BooksList from '../components/BooksList';
import TopicContent from '../components/TopicContent';
import FlashCards from '../components/FlashCards';
import SavedNotes from '../components/SavedNotes';
import StudyMaterials from '../components/StudyMaterials';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Demo from '../components/Demo';
import StudyResources from '../components/StudyResources';

const DashboardRoute = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<BooksList />} />
        <Route path="books" element={<BooksList />} />
        <Route path="books/:topicId" element={<TopicContent />} />
        <Route path="flashcards" element={<FlashCards />} />
        <Route path="notes" element={<SavedNotes />} />
        <Route path="materials" element={<StudyMaterials />} />
      </Routes>
    </DashboardLayout>
  );
};

const AppRoutes = ({ quote }) => {
  return (
    <Routes>
      {/* Landing Page Route */}
      <Route
        path="/"
        element={
          <>
            <Hero quote={quote} />
            <Features />
            <StudyResources />
            <Demo />
          </>
        }
      />

      {/* Auth and Dashboard Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/subject-selection" element={<SubjectSelection />} />
      <Route path="/dashboard/:subject/*" element={<DashboardRoute />} />
      <Route path="/dashboard" element={<Navigate to="/subject-selection" replace />} />
    </Routes>
  );
};

export default AppRoutes;