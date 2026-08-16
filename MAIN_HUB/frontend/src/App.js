import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PermissionProvider } from './context/PermissionContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import Projects from './pages/Projects';
import ProjectCompanies from './pages/ProjectCompanies'; 
import Companies from './pages/Companies';
import CompanyForm from './pages/CompanyForm';
import Users from './pages/Users';
import UsersForm from './pages/UsersForm';
import Roles from './pages/Roles';
import Plans from './pages/Plans';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import StaffDashboard from './pages/StaffDashboard';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <PermissionProvider>
          <div className="App">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Navigate to="/login" />} />
              
              {/* ============================================ */}
              {/* PROFILE ROUTE - Accessible by All Authenticated Users */}
              {/* ============================================ */}
              <Route path="/profile" element={
                <PrivateRoute allowedRoles={['super_admin', 'admin', 'manager', 'staff', 'guest']}>
                  <Profile />
                </PrivateRoute>
              } />
              
              {/* ============================================ */}
              {/* NOTIFICATIONS ROUTE - Accessible by All Authenticated Users */}
              {/* ============================================ */}
              <Route path="/notifications" element={
                <PrivateRoute allowedRoles={['super_admin', 'admin', 'manager', 'staff', 'guest']}>
                  <Notifications />
                </PrivateRoute>
              } />
              
              {/* ============================================ */}
              {/* SUPER ADMIN ROUTES - Full System Access */}
              {/* ============================================ */}
              <Route path="/super-admin" element={
                <PrivateRoute allowedRoles={['super_admin']}>
                  <SuperAdminDashboard />
                </PrivateRoute>
              } />
              <Route path="/super-admin/dashboard" element={
                <PrivateRoute allowedRoles={['super_admin']}>
                  <SuperAdminDashboard />
                </PrivateRoute>
              } />
              <Route path="/super-admin/projects" element={
                <PrivateRoute allowedRoles={['super_admin']}>
                  <Projects />
                </PrivateRoute>
              } />
              <Route path="/super-admin/companies" element={
                <PrivateRoute allowedRoles={['super_admin']}>
                  <Companies />
                </PrivateRoute>
              } />
              <Route path="/super-admin/companies/create" element={
                <PrivateRoute allowedRoles={['super_admin']}>
                  <CompanyForm />
                </PrivateRoute>
              } />
              <Route path="/super-admin/companies/edit/:id" element={
                <PrivateRoute allowedRoles={['super_admin']}>
                  <CompanyForm />
                </PrivateRoute>
              } />
              <Route path="/super-admin/companies/project/:projectId" element={
                <PrivateRoute allowedRoles={['super_admin']}>
                  <ProjectCompanies />
                </PrivateRoute>
              } />
              <Route path="/super-admin/users" element={
                <PrivateRoute allowedRoles={['super_admin']}>
                  <Users />
                </PrivateRoute>
              } />
              <Route path="/super-admin/users/create" element={
                <PrivateRoute allowedRoles={['super_admin']}>
                  <UsersForm />
                </PrivateRoute>
              } />
              <Route path="/super-admin/users/edit/:id" element={
                <PrivateRoute allowedRoles={['super_admin']}>
                  <UsersForm />
                </PrivateRoute>
              } />
              <Route path="/super-admin/roles" element={
                <PrivateRoute allowedRoles={['super_admin']}>
                  <Roles />
                </PrivateRoute>
              } />
              <Route path="/super-admin/plans" element={
                <PrivateRoute allowedRoles={['super_admin']}>
                  <Plans />
                </PrivateRoute>
              } />
              <Route path="/super-admin/reports" element={
                <PrivateRoute allowedRoles={['super_admin']}>
                  <Reports />
                </PrivateRoute>
              } />
              <Route path="/super-admin/settings" element={
                <PrivateRoute allowedRoles={['super_admin']}>
                  <Settings />
                </PrivateRoute>
              } />
              
              {/* ============================================ */}
              {/* ADMIN ROUTES - Manage Companies and Users */}
              {/* ============================================ */}
              <Route path="/admin" element={
                <PrivateRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </PrivateRoute>
              } />
              <Route path="/admin/dashboard" element={
                <PrivateRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </PrivateRoute>
              } />
              <Route path="/admin/projects" element={
                <PrivateRoute allowedRoles={['admin']}>
                  <Projects />
                </PrivateRoute>
              } />
              <Route path="/admin/companies" element={
                <PrivateRoute allowedRoles={['admin']}>
                  <Companies />
                </PrivateRoute>
              } />
              <Route path="/admin/companies/create" element={
                <PrivateRoute allowedRoles={['admin']}>
                  <CompanyForm />
                </PrivateRoute>
              } />
              <Route path="/admin/companies/edit/:id" element={
                <PrivateRoute allowedRoles={['admin']}>
                  <CompanyForm />
                </PrivateRoute>
              } />
              <Route path="/admin/companies/project/:projectId" element={
                <PrivateRoute allowedRoles={['admin']}>
                  <ProjectCompanies />
                </PrivateRoute>
              } />
              <Route path="/admin/users" element={
                <PrivateRoute allowedRoles={['admin']}>
                  <Users />
                </PrivateRoute>
              } />
              <Route path="/admin/users/create" element={
                <PrivateRoute allowedRoles={['admin']}>
                  <UsersForm />
                </PrivateRoute>
              } />
              <Route path="/admin/users/edit/:id" element={
                <PrivateRoute allowedRoles={['admin']}>
                  <UsersForm />
                </PrivateRoute>
              } />
              <Route path="/admin/plans" element={
                <PrivateRoute allowedRoles={['admin']}>
                  <Plans />
                </PrivateRoute>
              } />
              <Route path="/admin/reports" element={
                <PrivateRoute allowedRoles={['admin']}>
                  <Reports />
                </PrivateRoute>
              } />
              
              {/* ============================================ */}
              {/* MANAGER ROUTES - Manage Operations */}
              {/* ============================================ */}
              <Route path="/manager" element={
                <PrivateRoute allowedRoles={['manager']}>
                  <ManagerDashboard />
                </PrivateRoute>
              } />
              <Route path="/manager/dashboard" element={
                <PrivateRoute allowedRoles={['manager']}>
                  <ManagerDashboard />
                </PrivateRoute>
              } />
              <Route path="/manager/projects" element={
                <PrivateRoute allowedRoles={['manager']}>
                  <Projects />
                </PrivateRoute>
              } />
              <Route path="/manager/companies" element={
                <PrivateRoute allowedRoles={['manager']}>
                  <Companies />
                </PrivateRoute>
              } />
              <Route path="/manager/companies/project/:projectId" element={
                <PrivateRoute allowedRoles={['manager']}>
                  <ProjectCompanies />
                </PrivateRoute>
              } />
              <Route path="/manager/reports" element={
                <PrivateRoute allowedRoles={['manager']}>
                  <Reports />
                </PrivateRoute>
              } />
              
              {/* ============================================ */}
              {/* STAFF ROUTES - Basic Operations */}
              {/* ============================================ */}
              <Route path="/staff" element={
                <PrivateRoute allowedRoles={['staff']}>
                  <StaffDashboard />
                </PrivateRoute>
              } />
              <Route path="/staff/dashboard" element={
                <PrivateRoute allowedRoles={['staff']}>
                  <StaffDashboard />
                </PrivateRoute>
              } />
              <Route path="/staff/projects" element={
                <PrivateRoute allowedRoles={['staff']}>
                  <Projects />
                </PrivateRoute>
              } />
              
              {/* ============================================ */}
              {/* PUBLIC ROUTES - Accessible by All Authenticated Users */}
              {/* ============================================ */}
              <Route path="/projects" element={
                <PrivateRoute allowedRoles={['super_admin', 'admin', 'manager', 'staff']}>
                  <Projects />
                </PrivateRoute>
              } />
              <Route path="/companies" element={
                <PrivateRoute allowedRoles={['super_admin', 'admin', 'manager']}>
                  <Companies />
                </PrivateRoute>
              } />
              <Route path="/companies/create" element={
                <PrivateRoute allowedRoles={['super_admin', 'admin']}>
                  <CompanyForm />
                </PrivateRoute>
              } />
              <Route path="/companies/edit/:id" element={
                <PrivateRoute allowedRoles={['super_admin', 'admin']}>
                  <CompanyForm />
                </PrivateRoute>
              } />
              <Route path="/companies/project/:projectId" element={
                <PrivateRoute allowedRoles={['super_admin', 'admin', 'manager']}>
                  <ProjectCompanies />
                </PrivateRoute>
              } />
              <Route path="/users" element={
                <PrivateRoute allowedRoles={['super_admin', 'admin']}>
                  <Users />
                </PrivateRoute>
              } />
              <Route path="/users/create" element={
                <PrivateRoute allowedRoles={['super_admin', 'admin']}>
                  <UsersForm />
                </PrivateRoute>
              } />
              <Route path="/users/edit/:id" element={
                <PrivateRoute allowedRoles={['super_admin', 'admin']}>
                  <UsersForm />
                </PrivateRoute>
              } />
              <Route path="/reports" element={
                <PrivateRoute allowedRoles={['super_admin', 'admin', 'manager']}>
                  <Reports />
                </PrivateRoute>
              } />
              <Route path="/plans" element={
                <PrivateRoute allowedRoles={['super_admin', 'admin']}>
                  <Plans />
                </PrivateRoute>
              } />
              
              {/* ============================================ */}
              {/* CATCH ALL - Redirect to Login */}
              {/* ============================================ */}
              <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
          </div>
        </PermissionProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;