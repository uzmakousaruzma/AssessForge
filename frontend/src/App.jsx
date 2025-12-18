import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
import AdminDashboard from './pages/admin/AdminDashboard';
import AddLecturer from './pages/admin/AddLecturer';
import ViewPapers from './pages/admin/ViewPapers';
import CollegeDetails from './pages/admin/CollegeDetails';
import LecturerDashboard from './pages/lecturer/LecturerDashboard';
import GenerateQuestions from './pages/lecturer/GenerateQuestions';
import CreatePaper from './pages/lecturer/CreatePaper';
import UnusedQuestions from './pages/lecturer/UnusedQuestions';
import MyPapers from './pages/lecturer/MyPapers';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/add-lecturer"
            element={
              <ProtectedRoute role="admin">
                <AddLecturer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/view-papers"
            element={
              <ProtectedRoute role="admin">
                <ViewPapers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/college-details"
            element={
              <ProtectedRoute role="admin">
                <CollegeDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lecturer/dashboard"
            element={
              <ProtectedRoute role="lecturer">
                <LecturerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lecturer/generate-questions"
            element={
              <ProtectedRoute role="lecturer">
                <GenerateQuestions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lecturer/create-paper"
            element={
              <ProtectedRoute role="lecturer">
                <CreatePaper />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lecturer/unused-questions"
            element={
              <ProtectedRoute role="lecturer">
                <UnusedQuestions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lecturer/my-papers"
            element={
              <ProtectedRoute role="lecturer">
                <MyPapers />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;









