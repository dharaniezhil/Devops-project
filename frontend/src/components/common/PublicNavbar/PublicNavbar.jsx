import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ThemeSwitcher from '../ThemeSwitcher/ThemeSwitcher';

const PublicNavbar = () => {
  const location = useLocation();
  const linkStyle = { color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500 };

  useEffect(() => {
    if (window.google && window.google.translate) {
      // Re-render dropdown on route change
      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'en',
          includedLanguages: 'en,ta,hi,te,ml,kn,ur,gu',
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
        },
        'google_translate_element'
      );
    } else if (!document.getElementById('google-translate-script')) {
      window.googleTranslateElementInit = () => {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: 'en,ta,hi,te,ml,kn,ur,gu',
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          },
          'google_translate_element'
        );
      };

      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      document.body.appendChild(script);
    }
  }, [location.pathname]); // Re-run on route change

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

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Link to="/" style={linkStyle}>Home</Link>
        <Link to="/about" style={linkStyle}>About</Link>
        <Link to="/contact" style={linkStyle}>Contact</Link>
        <Link to="/faq" style={linkStyle}>FAQ</Link>
        <Link to="/signin" style={linkStyle}>Sign In</Link>
        <Link to="/register" style={linkStyle}>Register</Link>
        <ThemeSwitcher />
        {/* Google Translate Dropdown */}
        <div id="google_translate_element"></div>
      </div>
    </nav>
  );
};

export default PublicNavbar;
