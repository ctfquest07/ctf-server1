import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import './AdminDashboard.css';

function PlatformReset() {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [secretCode, setSecretCode] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    
    if (secretCode !== '97086') {
      setError('Invalid secret code');
      return;
    }

    if (!window.confirm('Are you sure you want to reset the entire platform? This will:\n\n• Reset all user points to 0\n• Mark all challenges as unsolved\n• Clear all scoreboard data\n\nThis action cannot be undone!')) {
      return;
    }

    setIsResetting(true);
    setError('');

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      await axios.post('/api/auth/reset-platform', {}, config);
      
      setSuccess('Platform reset successfully! All data has been cleared.');
      setSecretCode('');
      
      setTimeout(() => {
        navigate('/admin');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset platform');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Platform <span className="highlight">Reset</span></h1>
        <p>Reset the entire platform to fresh state</p>
      </div>

      <div className="dashboard-section">
        <div className="reset-warning">
          <h2>⚠️ DANGER ZONE</h2>
          <p>This action will completely reset the platform:</p>
          <ul>
            <li>All user points will be set to 0</li>
            <li>All challenges will be marked as unsolved</li>
            <li>Scoreboard will be cleared</li>
            <li>All progress will be lost permanently</li>
          </ul>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleReset} className="reset-form">
          <div className="form-group">
            <label htmlFor="secretCode">Enter Secret Code:</label>
            <input
              type="password"
              id="secretCode"
              value={secretCode}
              onChange={(e) => setSecretCode(e.target.value)}
              placeholder="Enter secret code to proceed"
              required
              disabled={isResetting}
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="btn-secondary"
              disabled={isResetting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-danger"
              disabled={isResetting || !secretCode}
            >
              {isResetting ? 'Resetting...' : 'Reset Platform'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PlatformReset;