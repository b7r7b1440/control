
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Control from './pages/Control';
import Scanner from './pages/Scanner';
import Attendance from './pages/Attendance';
import Reports from './pages/Reports';
import PrintCenter from './pages/PrintCenter';
import SetupCenter from './pages/SetupCenter';
import Login from './pages/Login';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { AppData } from './types';

const AppRoutes = () => {
  // Fix: changed 'rooms' to 'committees' as 'rooms' is not defined in AppContext
  const { currentUser, envelopes, committees, teachers, school, updateSchool } = useApp();

  if (!currentUser) return <Login />;

  if (currentUser.role === 'TEACHER') {
    return (
      <Routes>
        <Route path="/" element={<TeacherDashboard />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    );
  }

  // Fix: mapped 'committees' correctly to match AppData structure
  const appData: AppData = {
    school,
    committees: committees.map(c => ({ id: c.id, name: c.name, location: c.location })),
    rawExams: envelopes,
    teachers: teachers
  };

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        {(currentUser.role === 'CONTROL' || currentUser.role === 'MANAGER') && (
          <>
            <Route path="/setup" element={<SetupCenter />} />
            <Route path="/control" element={<Control />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/print" element={<PrintCenter data={appData} onUpdateSchool={updateSchool} />} />
          </>
        )}
        {currentUser.role === 'CONTROL' && <Route path="/scanner" element={<Scanner />} />}
        {(currentUser.role === 'COUNSELOR' || currentUser.role === 'MANAGER') && (
          <Route path="/attendance" element={<Attendance />} />
        )}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AppProvider>
  );
};

export default App;
