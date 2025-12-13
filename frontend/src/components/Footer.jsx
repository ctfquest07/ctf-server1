import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Footer.css';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await axios.post('/api/newsletter/subscribe', { email });
      setMessage(response.data.message);
      setEmail('');
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      if (error.response) {
        setError(error.response.data.message || 'Failed to subscribe. Please try again.');
      } else if (error.request) {
        setError('Network error. Please check your connection.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-main">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <span className="logo-text">CTF<span className="logo-highlight">Quest</span></span>
            </Link>
            <p className="footer-description">
              Empowering the next generation of cybersecurity professionals through hands-on challenges and competitions.
            </p>
            {/* <div className="social-links">
              <a href="#" className="social-link" aria-label="Twitter">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="social-link" aria-label="Discord">
                <i className="fab fa-discord"></i>
              </a>
              <a href="#" className="social-link" aria-label="GitHub">
                <i className="fab fa-github"></i>
              </a>
              <a href="#" className="social-link" aria-label="LinkedIn">
                <i className="fab fa-linkedin"></i>
              </a>
            </div> */}
          </div>

          <div className="footer-nav">
            <div className="footer-nav-column">
              <h3>Platform</h3>
              <Link to="/" className="footer-link">Home</Link>
              <Link to="/challenges" className="footer-link">Challenges</Link>
              <Link to="/documentation" className="footer-link">Documentation</Link>
              <Link to="/leaderboard" className="footer-link">Leaderboard</Link>
            </div>

            <div className="footer-nav-column">
              <h3>Company</h3>
              {/* <Link to="/about" className="footer-link">About Us</Link> */}
              <Link to="/privacy-policy" className="footer-link">Privacy Policy</Link>
              <Link to="/terms-of-service" className="footer-link">Terms of Service</Link>
              <Link to="/contact" className="footer-link">Contact Us</Link>
            </div>

            {/* <div className="footer-nav-column">
              <h3>Resources</h3>
              <Link to="/blog" className="footer-link">Blog</Link>
              <Link to="/tutorials" className="footer-link">Tutorials</Link>
              <Link to="/documentation" className="footer-link">API Documentation</Link>
              <Link to="/about" className="footer-link">About Us</Link>
            </div> */}
          </div>
        </div>

        <div className="newsletter-section">
          <div className="newsletter-content">
            <h3 className="newsletter-title">Join Our Newsletter</h3>
            <p className="newsletter-description">
              Stay ahead in cybersecurity! Subscribe to receive exclusive challenges, security tips, and platform updates directly in your inbox.
            </p>
            <form className="newsletter-form" onSubmit={handleSubscribe}>
              <div className="newsletter-input-group">
                <input
                  type="email"
                  className="newsletter-input"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="newsletter-button" disabled={isLoading}>
                {isLoading ? (
                  
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Subscribing...
                  </>
                ) : (
                  <>
                    <span>Subscribe</span>
                    <i className="fas fa-arrow-right"></i>
                  </>
                )}
              </button>
            </form>
            {message && (
              <div className="newsletter-success">
                <i className="fas fa-check-circle"></i>
                {message}
              </div>
            )}
            {error && (
              <div className="newsletter-error">
                <i className="fas fa-exclamation-circle"></i>
                {error}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-content">
          <p>&copy; {new Date().getFullYear()} CTFQuest. All Rights Reserved.</p>
          {/* <div className="footer-links">
            <Link to="/privacy-policy" className="footer-bottom-link">Privacy Policy</Link>
            <Link to="/terms-of-service" className="footer-bottom-link">Terms of Service</Link>
            <Link to="/contact" className="footer-bottom-link">Contact</Link>
          </div> */}
        </div>
        <p className="footer-disclaimer">CTFQuest is designed for educational purposes only. Always practice ethical hacking.</p>
      </div>
    </footer>
  );
};

export default Footer;