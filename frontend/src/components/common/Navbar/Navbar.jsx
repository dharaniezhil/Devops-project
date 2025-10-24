import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import ThemeSwitcher from '../ThemeSwitcher/ThemeSwitcher';

const Navbar = () => {
  const { user: regularUser, logout: regularLogout } = useAuth();
  const { admin, adminLogout } = useAdminAuth();
  const navigate = useNavigate();
  
  // Determine which user is logged in
  const user = admin || regularUser;
  const logout = admin ? adminLogout : regularLogout;
  const linkStyle = { color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: '500' };

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  // Google Translate script
  useEffect(() => {
    if (!document.getElementById("google-translate-script")) {
      window.googleTranslateElementInit = () => {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: "en,ta,hi,te,ml,kn,ur,gu",
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          },
          "google_translate_element"
        );
      };

      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src =
        "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      document.body.appendChild(script);
    }
  }, []);

  return (
    <nav style={{
      background: 'var(--navbar-bg, var(--background-white))',
      padding: '1rem 2rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid var(--border-color)'
    }}>
      <Link to="/" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-color)', textDecoration: 'none' }}>
        FixItFast
      </Link>

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        {user?.role === 'labour' ? (
          <>
            <Link to="/labour/dashboard" style={linkStyle}>Dashboard</Link>
            <Link to="/labour/assigned-complaints" style={linkStyle}>Assigned Complaints</Link>
            <Link to="/labour/attendance" style={linkStyle}>Attendance</Link>
            <Link to="/labour/profile" style={linkStyle}>Profile</Link>
          </>
        ) : (user?.role === 'admin' || user?.role === 'superadmin') ? (
          <>
            <Link to="/admin/dashboard" style={linkStyle}>Dashboard</Link>
            <Link to="/admin/manage-complaints" style={linkStyle}>Manage Complaints</Link>
            <Link to="/admin/assign-complaint" style={linkStyle}>Assign Complaints</Link>
            <Link to="/admin/assigned-status" style={linkStyle}>Assigned Status</Link>
            <Link to="/admin/labours" style={linkStyle}>Manage Labours</Link>
            <Link to="/admin/create-labour" style={linkStyle}>Create Labour</Link>
            <Link to="/admin/attendance" style={linkStyle}>Attendance</Link>
            <Link to="/admin/profile" style={linkStyle}>Profile</Link>
            {user?.role === 'superadmin' && (
              <>
                <Link to="/admin/super-dashboard" style={linkStyle}>Super Dashboard</Link>
                <Link to="/admin/users" style={linkStyle}>Manage Users</Link>
                <Link to="/admin/admins" style={linkStyle}>Manage Admins</Link>
              </>
            )}
          </>
        ) : (
          <>
            <Link to="/dashboard" style={linkStyle}>Dashboard</Link>
            <Link to="/lodge-complaint" style={linkStyle}>Lodge Complaint</Link>
            <Link to="/track-status" style={linkStyle}>Track Status</Link>
            <Link to="/my-complaints" style={linkStyle}>My Complaints</Link>
            <Link to="/community-feed" style={linkStyle}>Community</Link>
            <Link to="/citizen/profile" style={linkStyle}>Profile</Link>
          </>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <ThemeSwitcher />
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Welcome, {user?.name}
          </span>
          <button
            onClick={handleLogout}
            style={{
              background: 'var(--error-color)',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}
          >
            Logout
          </button>
          {/* Google Translate Dropdown */}
          <div id="google_translate_element"></div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
