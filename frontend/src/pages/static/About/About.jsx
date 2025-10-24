import React from 'react'
import './About.css'

const About = () => {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-container">
          <h1>About <span className="gradient-text">FixItFast</span></h1>
          <p>Transforming communities through transparent, responsive civic engagement.</p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="about-section">
        <div className="about-container">
          <div className="mission-card">
            <h2>Our Mission</h2>
            <p>
              FixItFast bridges the gap between citizens and local authorities. We make reporting issues effortless,
              bring real-time transparency to resolutions, and empower communities to participate in building better
              neighborhoods.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="about-section values-section">
        <div className="about-container">
          <h2 className="section-title">Our Values</h2>
          <div className="values-grid">
            <div className="value-card">
              <div className="value-icon">🏛️</div>
              <h3>Transparency</h3>
              <p>Every complaint is tracked openly, creating accountability between citizens and authorities.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">⚡</div>
              <h3>Efficiency</h3>
              <p>Streamlined reporting process that gets issues to the right authorities quickly.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">👥</div>
              <h3>Community</h3>
              <p>Building stronger neighborhoods through collective action and shared responsibility.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">📱</div>
              <h3>Accessibility</h3>
              <p>User-friendly platform accessible to everyone, regardless of technical expertise.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="about-section">
        <div className="about-container">
          <h2 className="section-title">How FixItFast Works</h2>
          <div className="process-steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Report Issues</h3>
                <p>Citizens can easily report civic problems like broken streetlights, water leaks, or road damage through our platform.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Track Progress</h3>
                <p>Real-time updates keep everyone informed about the status of reported issues from submission to resolution.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Build Community</h3>
                <p>Neighbors can support each other's complaints, creating a stronger voice for community improvements.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="about-section impact-section">
        <div className="about-container">
          <h2 className="section-title">Our Impact</h2>
          <div className="impact-stats">
            <div className="stat">
              <div className="stat-number">500+</div>
              <div className="stat-label">Issues Resolved</div>
            </div>
            <div className="stat">
              <div className="stat-number">1,200+</div>
              <div className="stat-label">Active Citizens</div>
            </div>
            <div className="stat">
              <div className="stat-number">50+</div>
              <div className="stat-label">Communities Served</div>
            </div>
            <div className="stat">
              <div className="stat-number">98%</div>
              <div className="stat-label">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="about-cta">
        <div className="about-container">
          <h2>Ready to Make a Difference?</h2>
          <p>Join our community of engaged citizens working to improve their neighborhoods.</p>
          <div className="cta-buttons">
            <a href="/register" className="cta-btn primary">Get Started</a>
            <a href="/contact" className="cta-btn secondary">Contact Us</a>
          </div>
        </div>
      </section>
    </div>
  )
}

export default About
