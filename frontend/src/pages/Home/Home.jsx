import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import './Home.css'

const Home = () => {
  const [openFaq, setOpenFaq] = useState(null)

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  // FAQ data in English
  const faqs = [
    {
      question: "How do I report a civic issue?",
      answer: "Simply click on 'Get Started' or 'Lodge Complaint', create an account, and fill out the complaint form with details, photos, and location. It takes less than 5 minutes!"
    },
    {
      question: "Is it really free to use?",
      answer: "Yes! FixItFast is completely free for citizens. Our mission is to make civic reporting accessible to everyone in the community."
    },
    {
      question: "How long does it take for issues to get resolved?",
      answer: "Resolution times vary depending on the type of issue and local authorities. Most issues are acknowledged within 48 hours, and you'll receive real-time updates on progress."
    },
    {
      question: "Can I report issues anonymously?",
      answer: "Yes, you have the option to submit complaints anonymously. However, providing contact information helps authorities reach out for additional details if needed."
    },
    {
      question: "What types of issues can I report?",
      answer: "You can report various civic issues including street lighting, water supply problems, road damage, sanitation issues, noise pollution, and more. If it affects your community, you can report it!"
    },
    {
      question: "How do I track my complaint status?",
      answer: "After logging in, visit the 'Track Status' page to see real-time updates on all your submitted complaints. You'll also receive notifications when status changes occur."
    },
    {
      question: "Can I support other community complaints?",
      answer: "Absolutely! Visit the 'Community Feed' to see issues reported by your neighbors and show support for important problems affecting your area."
    },
    {
      question: "Who handles the reported complaints?",
      answer: "Complaints are forwarded to the relevant local authorities and government departments based on the type and location of the issue reported."
    }
  ]

  return (
    <div className="home-page">
      {/* Header - ONLY FixItFast logo here */}
      <header className="header">
        <div className="header-container">
          <Link to="/" className="logo">
            <span className="logo-icon">🔧</span>
            <span className="logo-text">FixItFast</span>
          </Link>

          <nav className="nav-buttons">
            <Link to="/signin" className="nav-btn signin-btn">
              <span className="btn-icon">🔑</span>
              Sign In
            </Link>
            <Link to="/register" className="nav-btn register-btn">
              <span className="btn-icon">👤</span>
              Register
            </Link>
            <Link to="/about" className="nav-btn about-btn">
              <span className="btn-icon">ℹ️</span>
              About
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section - NO logo here, just content */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">            
            <h1 className="hero-title">
              Report Civic Issues in Your Community
            </h1>
            
            <p className="hero-subtitle">
              Your voice matters. Report, track, and resolve civic issues with the power of community collaboration.
            </p>

            <div className="hero-buttons">
              <Link to="/register" className="cta-primary">
                Get Started
                <span className="cta-arrow">→</span>
              </Link>
              <Link to="/about" className="cta-secondary">
                Learn More
              </Link>
            </div>

            <div className="hero-features">
              <div className="feature-item">
                <span className="feature-icon">📝</span>
                <span>Easy Reporting</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📊</span>
                <span>Real-time Tracking</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">👥</span>
                <span>Community Driven</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-number">500+</div>
            <div className="stat-label">Issues Resolved</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">1,200+</div>
            <div className="stat-label">Active Citizens</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">50+</div>
            <div className="stat-label">Communities</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">98%</div>
            <div className="stat-label">Satisfaction Rate</div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="process-section">
        <div className="process-container">
          <h2 className="section-title">How It Works</h2>
          <div className="process-steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Report</h3>
              <p>Spot an issue? Report it with photos and location details.</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Track</h3>
              <p>Monitor progress and get real-time updates on resolution.</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Resolve</h3>
              <p>See your community improve as issues get fixed.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="faq-container">
          <h2 className="section-title">Frequently Asked Questions</h2>
          <p className="faq-subtitle">Got questions? We've got answers to help you get started.</p>
          
          <div className="faq-list">
            {faqs && faqs.map((faq, index) => (
              <div key={index} className={`faq-item ${openFaq === index ? 'active' : ''}`}>
                <button
                  className="faq-question"
                  onClick={() => toggleFaq(index)}
                  aria-expanded={openFaq === index}
                >
                  <span>{faq.question}</span>
                  <span className={`faq-icon ${openFaq === index ? 'rotated' : ''}`}>
                    ▼
                  </span>
                </button>
                <div className={`faq-answer ${openFaq === index ? 'open' : ''}`}>
                  <div className="faq-answer-content">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="faq-cta">
            <p>Still have questions?</p>
            <Link to="/contact" className="faq-contact-btn">
              Contact Support
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="final-cta">
        <div className="cta-container">
          <h2>Ready to Make Your Community Better?</h2>
          <p>Join thousands of citizens creating positive change</p>
          <Link to="/register" className="cta-button">
            Join Now - It's Free
            <span className="cta-arrow">→</span>
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Home
