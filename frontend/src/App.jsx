import React from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'



// Layout Components
import Navbar from './components/common/Navbar/Navbar'
import PublicNavbar from './components/common/PublicNavbar/PublicNavbar'
import Footer from './components/common/Footer/Footer'
import ThemeSwitcher from './components/common/ThemeSwitcher/ThemeSwitcher'

// Context Providers
import { AuthProvider } from './context/AuthContext'
import { AdminAuthProvider } from './context/AdminAuthContext'
import { UserProvider } from './context/UserContext'
import { ComplaintProvider } from './context/ComplaintContext'
import { ThemeProvider } from './context/ThemeContext'


// Route Protection
import ProtectedRoute from './routes/ProtectedRoute'
import AdminRoute from './routes/AdminRoute'
import SuperAdminRoute from './routes/SuperAdminRoute'
import ManageUsers from './pages/admin/ManageUsers/ManageUsers'

// Pages
import Home from './pages/Home/Home'
import Register from './pages/auth/Register/Register'
import SignIn from './pages/auth/SignIn/SignIn'
import Dashboard from './pages/user/Dashboard/Dashboard'
import LodgeComplaint from './pages/user/LodgeComplaint/LodgeComplaint'
import TrackStatus from './pages/user/TrackStatus/TrackStatus'
import CommunityFeed from './pages/user/CommunityFeed/CommunityFeed'
import Feedback from './pages/user/Feedback/Feedback'
import Profile from './pages/Profile/Profile'
import AdminDashboard from './pages/admin/AdminDashboard/AdminDashboard'
import MyComplaints from './pages/user/MyComplaints/MyComplaints'
import ManageComplaints from './pages/admin/ManageComplaints/ManageComplaints'
import ManageComplaintsNew from './pages/admin/ManageComplaintsNew/ManageComplaintsNew'
import Reports from './pages/admin/Reports/Reports'
import AdminLogin from './pages/admin/AdminLogin/AdminLogin'
import AdminRegister from './pages/admin/AdminRegister/AdminRegister'
import SuperDashboard from './pages/admin/SuperDashboard/SuperDashboard'
import AdminsList from './pages/admin/AdminsList/AdminsList'
import AssignComplaint from './pages/admin/AssignComplaint/AssignComplaint'
import ManageLabours from './pages/admin/ManageLabours/ManageLabours'
import AssignedStatus from './pages/admin/AssignedStatus/AssignedStatus'
import About from './pages/static/About/About'
import Contact from './pages/static/Contact/Contact'
import FAQ from './pages/static/FAQ/FAQ'
import NotFound from './pages/static/NotFound/NotFound'
import OAuthCallback from './pages/auth/Callback/OAuthCallback'
import LabourDashboard from './pages/labour/LabourDashboard/LabourDashboard'
import LabourLogin from './pages/labour/LabourLogin/LabourLogin'
import LabourProfile from './pages/labour/LabourProfile/LabourProfile'
import AssignedComplaints from './pages/labour/AssignedComplaints/AssignedComplaints'
import SimpleAttendance from './pages/labour/SimpleAttendance/SimpleAttendance'
// import LabourAttendance from './pages/labour/LabourAttendance/LabourAttendance'
import AdminProfile from './pages/admin/AdminProfile/AdminProfile'
import ManageAttendance from './pages/admin/ManageAttendance/ManageAttendance'
import FloatingAttendanceButton from './components/attendance/FloatingAttendanceButton'
import AuthDebug from './components/AuthDebug'
import StatusUpdateTest from './components/StatusUpdateTest'
import AdminChangePassword from './pages/admin/AdminChangePassword/AdminChangePassword'
import CreateLabour from './pages/admin/CreateLabour/CreateLabour';


const Layout = ({ children }) => {
  const location = useLocation()
  
  const pagesWithoutNavbar = ['/', '/signin', '/register']
  const publicPages = ['/about', '/contact', '/faq']
  const minimalHeaderPages = ['/admin/login', '/admin/change-password', '/labour/login']
  
  const isMinimalHeader = minimalHeaderPages.includes(location.pathname)
  const showPublicNavbar = !isMinimalHeader && publicPages.includes(location.pathname)
  const showAuthenticatedNavbar = !isMinimalHeader && !pagesWithoutNavbar.includes(location.pathname) && !publicPages.includes(location.pathname)
  
  const pagesWithoutFooter = ['/', '/signin', '/register', '/admin/login', '/admin/change-password', '/labour/login']
  const showFooter = !pagesWithoutFooter.includes(location.pathname)
  
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {isMinimalHeader ? (
        <div style={{
          background: 'var(--navbar-bg, var(--background-white))',
          padding: '1rem 2rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <a href="/" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-color)', textDecoration: 'none' }}>
            FixItFast
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <ThemeSwitcher />
          </div>
        </div>
      ) : (
        <>
          {showPublicNavbar && <PublicNavbar />}
          {showAuthenticatedNavbar && <Navbar />}
        </>
      )}
      
      <main style={{ flex: 1 }}>
        {children}
      </main>
      
      {/* Floating Attendance Button - temporarily disabled to fix hooks error */}
      {/* <FloatingAttendanceButton /> */}
      
      {showFooter && <Footer />}
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AdminAuthProvider>
          <UserProvider>
            <ComplaintProvider>
              <Router>
              <Layout>
                <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/faq" element={<FAQ />} />
                
                {/* Auth Routes */}
                <Route path="/register" element={<Register />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/labour/login" element={<LabourLogin />} />
                <Route path="/auth/callback" element={<OAuthCallback />} />
                
                {/* Protected User Routes */}
                <Route path="/dashboard" element={
                  <ProtectedRoute><Dashboard /></ProtectedRoute>
                } />
                {/* Labour Routes */}
                <Route path="/labour/dashboard" element={
                  <ProtectedRoute><LabourDashboard /></ProtectedRoute>
                } />
                <Route path="/labour/assigned-complaints" element={
                  <ProtectedRoute><AssignedComplaints /></ProtectedRoute>
                } />
                <Route path="/labour/attendance" element={
                  <ProtectedRoute><SimpleAttendance /></ProtectedRoute>
                } />
                <Route path="/labour/profile" element={
                  <ProtectedRoute><LabourProfile /></ProtectedRoute>
                } />
                <Route path="/lodge-complaint" element={
                  <ProtectedRoute><LodgeComplaint /></ProtectedRoute>
                } />
                <Route path="/track-status" element={
                  <ProtectedRoute><TrackStatus /></ProtectedRoute>
                } />
                <Route path="/community-feed" element={
                  <ProtectedRoute><CommunityFeed /></ProtectedRoute>
                } />
                <Route path="/feedback" element={
                  <ProtectedRoute><Feedback /></ProtectedRoute>
                } />
                <Route path="/my-complaints" element={
                  <ProtectedRoute><MyComplaints /></ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute><Profile /></ProtectedRoute>
                } />
                <Route path="/citizen/profile" element={
                  <ProtectedRoute><Profile /></ProtectedRoute>
                } />
                <Route path="/admin/profile" element={
                  <AdminRoute><AdminProfile /></AdminRoute>
                } />
                
                {/* Admin Auth Routes */}

                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/register" element={<AdminRegister />}/>
                <Route path="/admin/change-password" element={<AdminChangePassword />} />

                {/* Admin Routes */}

                <Route path="/admin/dashboard" element={
                  <AdminRoute><AdminDashboard /></AdminRoute>
                } />
                <Route path="/admin/super-dashboard" element={
                  <SuperAdminRoute><SuperDashboard /></SuperAdminRoute>
                } />
                <Route path="/admin/admins" element={
                  <SuperAdminRoute><AdminsList /></SuperAdminRoute>
                } />
                <Route path="/admin/complaints" element={
                  <AdminRoute><ManageComplaints /></AdminRoute>
                } />
                <Route path="/admin/manage-complaints" element={
                  <AdminRoute><ManageComplaintsNew /></AdminRoute>
                } />
                <Route path="/admin/reports" element={
                  <AdminRoute><Reports /></AdminRoute>
                } />
                <Route path="/admin/assign-complaint" element={
                  <AdminRoute><AssignComplaint /></AdminRoute>
                } />
                <Route path="/admin/assigned-status" element={
                  <AdminRoute><AssignedStatus /></AdminRoute>
                } />
                <Route path="/admin/labours" element={
                  <AdminRoute><ManageLabours /></AdminRoute>
                } />
                <Route path="/admin/create-labour" element={
                  <AdminRoute><CreateLabour /></AdminRoute>
                } />
                <Route path="/admin/attendance" element={
                  <AdminRoute><ManageAttendance /></AdminRoute>
                } />
                <Route path="/admin/users" element={
                     <AdminRoute><ManageUsers /></AdminRoute>
               } />
               
               {/* Debug Routes */}
               <Route path="/auth-debug" element={<AuthDebug />} />
               <Route path="/status-test" element={<StatusUpdateTest />} />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
              </Router>
            </ComplaintProvider>
          </UserProvider>
        </AdminAuthProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
