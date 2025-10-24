import React, { useEffect } from 'react';

const TestEmailJS = () => {
  useEffect(() => {
    console.log('=== EmailJS Environment Test ===');
    console.log('SERVICE_ID:', import.meta.env.VITE_EMAILJS_SERVICE_ID);
    console.log('TEMPLATE_ID:', import.meta.env.VITE_EMAILJS_TEMPLATE_ID);
    console.log('PUBLIC_KEY:', import.meta.env.VITE_EMAILJS_PUBLIC_KEY);
    console.log('All env vars:', import.meta.env);
    console.log('=== End Test ===');
  }, []);

  return <div>Check console for EmailJS environment variables</div>;
};

export default TestEmailJS;
