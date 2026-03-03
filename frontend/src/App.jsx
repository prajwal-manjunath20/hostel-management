import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import StayMate from './components/StayMate';
import MainLayout from './layout/MainLayout';
import AuthLayout from './layout/AuthLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import HomePage from './pages/HomePage';
import MarketplacePage from './pages/MarketplacePage';
import HostelDetailPage from './pages/HostelDetailPage';
import OwnerListingManager from './pages/owner/OwnerListingManager';
import SuperadminDashboard from './pages/superadmin/SuperadminDashboard';
import AnalyticsDashboard from './pages/superadmin/AnalyticsDashboard';
import OwnerDashboard from './pages/owner/OwnerDashboard';
import OwnerStaffManagement from './pages/owner/OwnerStaffManagement';
import AdminDashboard from './pages/admin/AdminDashboard';
import HostelManagement from './pages/admin/HostelManagement';
import RoomManagement from './pages/admin/RoomManagement';
import BookingRequests from './pages/admin/BookingRequests';
import BillingManagement from './pages/admin/BillingManagement';
import ResidentDashboard from './pages/resident/ResidentDashboard';
import BrowseHostels from './pages/resident/BrowseHostels';
import BookRoom from './pages/resident/BookRoom';
import MyBookings from './pages/resident/MyBookings';
import NewMaintenanceRequest from './pages/resident/NewMaintenanceRequest';
import MyMaintenanceRequests from './pages/resident/MyMaintenanceRequests';
import MyBills from './pages/resident/MyBills';
import ApplyForOwnership from './pages/resident/ApplyForOwnership';
import ApplicationStatus from './pages/resident/ApplicationStatus';
import StaffDashboard from './pages/staff/StaffDashboard';
import MaintenanceRequests from './pages/staff/MaintenanceRequests';
import MyAssignments from './pages/staff/MyAssignments';

/* ── NProgress config ───────────────────────────────────────── */
NProgress.configure({ showSpinner: false, speed: 360, trickleSpeed: 180 });

/* Route-change progress bar */
function RouteLoader() {
  const location = useLocation();
  useEffect(() => {
    NProgress.start();
    const t = setTimeout(() => NProgress.done(), 120);
    return () => clearTimeout(t);
  }, [location.pathname]);
  return null;
}

/* ── Framer Motion page transition variants ─────────────────── */
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.20 } },
};

/* Inner router component (useLocation must be inside BrowserRouter) */
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ minHeight: '100vh' }}
      >
        <RouteLoader />
        <Routes location={location}>
          {/* ── Public ── */}
          <Route path="/" element={<MainLayout><HomePage /></MainLayout>} />
          <Route path="/hostels" element={<MainLayout><MarketplacePage /></MainLayout>} />
          <Route path="/hostels/:id" element={<MainLayout><HostelDetailPage /></MainLayout>} />

          {/* ── Auth (AuthLayout: no navbar, 2-col brand+form) ── */}
          <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />
          <Route path="/register" element={<AuthLayout><Register /></AuthLayout>} />
          <Route path="/forgot-password" element={<AuthLayout><ForgotPassword /></AuthLayout>} />
          <Route path="/reset-password/:token" element={<AuthLayout><ResetPassword /></AuthLayout>} />
          <Route path="/verify-email/:token" element={<AuthLayout><VerifyEmail /></AuthLayout>} />

          {/* ── Superadmin ── */}
          <Route path="/superadmin" element={<ProtectedRoute allowedRoles={['superadmin']}><SuperadminDashboard /></ProtectedRoute>} />
          <Route path="/superadmin/analytics" element={<ProtectedRoute allowedRoles={['superadmin']}><AnalyticsDashboard /></ProtectedRoute>} />

          {/* ── Owner ── */}
          <Route path="/owner" element={<ProtectedRoute allowedRoles={['owner']}><OwnerDashboard /></ProtectedRoute>} />
          <Route path="/owner/listings" element={<ProtectedRoute allowedRoles={['owner']}><OwnerListingManager /></ProtectedRoute>} />
          <Route path="/owner/listings/new" element={<ProtectedRoute allowedRoles={['owner']}><OwnerListingManager /></ProtectedRoute>} />
          <Route path="/owner/hostels" element={<ProtectedRoute allowedRoles={['owner']}><HostelManagement /></ProtectedRoute>} />
          <Route path="/owner/rooms" element={<ProtectedRoute allowedRoles={['owner']}><RoomManagement /></ProtectedRoute>} />
          <Route path="/owner/bookings" element={<ProtectedRoute allowedRoles={['owner']}><BookingRequests /></ProtectedRoute>} />
          <Route path="/owner/billing" element={<ProtectedRoute allowedRoles={['owner']}><BillingManagement /></ProtectedRoute>} />
          <Route path="/owner/staff" element={<ProtectedRoute allowedRoles={['owner']}><OwnerStaffManagement /></ProtectedRoute>} />

          {/* ── Admin (legacy → owner) ── */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['owner']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/hostels" element={<ProtectedRoute allowedRoles={['owner']}><HostelManagement /></ProtectedRoute>} />
          <Route path="/admin/rooms" element={<ProtectedRoute allowedRoles={['owner']}><RoomManagement /></ProtectedRoute>} />
          <Route path="/admin/bookings" element={<ProtectedRoute allowedRoles={['owner']}><BookingRequests /></ProtectedRoute>} />
          <Route path="/admin/billing" element={<ProtectedRoute allowedRoles={['owner']}><BillingManagement /></ProtectedRoute>} />

          {/* ── Resident ── */}
          <Route path="/resident" element={<ProtectedRoute allowedRoles={['resident']}><ResidentDashboard /></ProtectedRoute>} />
          <Route path="/resident/apply-owner" element={<ProtectedRoute allowedRoles={['resident']}><ApplyForOwnership /></ProtectedRoute>} />
          <Route path="/resident/application-status" element={<ProtectedRoute allowedRoles={['resident']}><ApplicationStatus /></ProtectedRoute>} />
          <Route path="/resident/hostels" element={<ProtectedRoute allowedRoles={['resident']}><BrowseHostels /></ProtectedRoute>} />
          <Route path="/resident/browse" element={<ProtectedRoute allowedRoles={['resident']}><BrowseHostels /></ProtectedRoute>} />
          <Route path="/resident/book/:hostelId" element={<ProtectedRoute allowedRoles={['resident']}><BookRoom /></ProtectedRoute>} />
          <Route path="/resident/bookings" element={<ProtectedRoute allowedRoles={['resident']}><MyBookings /></ProtectedRoute>} />
          <Route path="/resident/maintenance/new" element={<ProtectedRoute allowedRoles={['resident']}><NewMaintenanceRequest /></ProtectedRoute>} />
          <Route path="/resident/maintenance/my" element={<ProtectedRoute allowedRoles={['resident']}><MyMaintenanceRequests /></ProtectedRoute>} />
          <Route path="/resident/bills" element={<ProtectedRoute allowedRoles={['resident']}><MyBills /></ProtectedRoute>} />

          {/* ── Staff ── */}
          <Route path="/staff" element={<ProtectedRoute allowedRoles={['staff']}><StaffDashboard /></ProtectedRoute>} />
          <Route path="/staff/requests" element={<ProtectedRoute allowedRoles={['staff']}><MaintenanceRequests /></ProtectedRoute>} />
          <Route path="/staff/my-assignments" element={<ProtectedRoute allowedRoles={['staff']}><MyAssignments /></ProtectedRoute>} />

          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          <Route path="*" element={
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center' }}>
              <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>404</h1>
              <h2>Page Not Found</h2>
            </div>
          } />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AnimatedRoutes />
        <StayMate />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
