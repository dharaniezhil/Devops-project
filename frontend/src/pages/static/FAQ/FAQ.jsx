import React, { useState } from 'react';
import './FAQ.css';

const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  // FAQ data in English
  const faqData = [
    {
      question: "How do I register for FixItFast?",
      answer: "Simply click the 'Register' button and fill out the form with your name, email, phone, and location. You'll be ready to start reporting issues immediately!"
    },
    {
      question: "Is FixItFast free to use?",
      answer: "Yes! FixItFast is completely free for all citizens. Our mission is to make civic engagement accessible to everyone."
    },
    {
      question: "How do I report a civic issue?",
      answer: "After logging in, click 'Lodge Complaint', select the issue category, add location details, describe the problem, and optionally attach a photo."
    },
    {
      question: "How long does it take to resolve complaints?",
      answer: "Resolution time varies by issue type. Street lights typically take 2-3 days, while larger infrastructure issues may take longer. You can track progress in real-time."
    },
    {
      question: "Can I track my complaint status?",
      answer: "Absolutely! Go to 'Track Status' to see all your complaints and their current progress: Pending, Inprogress, or Resolved."
    },
    {
      question: "What is the Community Feed?",
      answer: "The Community Feed shows issues reported by others in your neighborhood. You can like complaints to show support and help prioritize community concerns."
    }
  ];

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="faq-container">
      <div className="faq-hero">
        <h1>Frequently Asked Questions</h1>
        <p>Everything you need to know about FixItFast</p>
      </div>

      <div className="faq-content">
        <div className="faq-list">
          {faqData.map((item, index) => (
            <div key={index} className="faq-item">
              <button
                className={`faq-question ${activeIndex === index ? 'active' : ''}`}
                onClick={() => toggleFAQ(index)}
              >
                <span>{item.question}</span>
                <span className="faq-icon">{activeIndex === index ? '−' : '+'}</span>
              </button>
              {activeIndex === index && (
                <div className="faq-answer">
                  <p>{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="help-section">
          <h2>Still Need Help?</h2>
          <p>Can't find the answer you're looking for? We're here to help!</p>
          <div className="help-buttons">
            <button className="btn btn-primary">Contact Support</button>
            <button className="btn btn-secondary">Live Chat</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
