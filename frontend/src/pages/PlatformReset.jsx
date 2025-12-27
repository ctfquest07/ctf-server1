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
  const [resetType, setResetType] = useState('');

  const handleResetPoints = async () => {
    if (secretCode !== '97086') {
      setError('Invalid secret code');
      return;
    }

    if (!window.confirm('Are you sure you want to reset all points? This will:\n\n• Reset all user points to 0\n• Reset all team points to 0\n• Clear all solved challenges\n• Delete all submissions\n\nThis action cannot be undone!')) {
      return;
    }

    setIsResetting(true);
    setError('');
    setSuccess('');
    setResetType('points');

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      const response = await axios.post('/api/auth/admin/reset-points', {}, config);
      
      setSuccess(response.data.message || 'Points reset successfully!');
      setSecretCode('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset points');
    } finally {
      setIsResetting(false);
      setResetType('');
    }
  };

  const handleResetChallenges = async () => {
    if (secretCode !== '97086') {
      setError('Invalid secret code');
      return;
    }

    if (!window.confirm('Are you sure you want to reset challenge solved status? This will:\n\n• Clear all solved challenges from users/teams\n• Delete all submissions\n• Keep user points unchanged\n\nThis action cannot be undone!')) {
      return;
    }

    setIsResetting(true);
    setError('');
    setSuccess('');
    setResetType('challenges');

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      const response = await axios.post('/api/auth/admin/reset-challenges', {}, config);
      
      setSuccess(response.data.message || 'Challenge status reset successfully!');
      setSecretCode('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset challenges');
    } finally {
      setIsResetting(false);
      setResetType('');
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Platform <span className="highlight">Reset</span></h1>
        <p>Reset platform data - Choose your reset option</p>
      </div>

      <div className="dashboard-section">
        <div className="reset-warning">
          <h2>⚠️ DANGER ZONE</h2>
          <p>These actions will permanently modify platform data. Use with caution!</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="form-group">
          <label htmlFor="secretCode">Enter Secret Code to Enable Reset Actions:</label>
          <input
            type="password"
            id="secretCode"
            value={secretCode}
            onChange={(e) => {
              setSecretCode(e.target.value);
              setError('');
            }}
            placeholder="Enter secret code (97086)"
            disabled={isResetting}
            style={{ marginBottom: '2rem' }}
          />
        </div>

        <div className="reset-options">
          <div className="reset-option-card">
            <h3>🔄 Reset All Points</h3>
            <p>This will:</p>
            <ul>
              <li>Reset all user points to 0</li>
              <li>Reset all team points to 0</li>
              <li>Clear all solved challenges</li>
              <li>Delete all submissions</li>
              <li>Clear scoreboard data</li>
            </ul>
            <button
              onClick={handleResetPoints}
              className="btn-danger"
              disabled={isResetting || !secretCode}
              style={{ width: '100%', marginTop: '1rem' }}
            >
              {isResetting && resetType === 'points' ? 'Resetting Points...' : 'Reset All Points'}
            </button>
          </div>

          <div className="reset-option-card">
            <h3>🎯 Reset Challenge Status Only</h3>
            <p>This will:</p>
            <ul>
              <li>Clear all solved challenges from users/teams</li>
              <li>Delete all submissions</li>
              <li><strong>Keep user points unchanged</strong></li>
              <li>Users can re-solve challenges</li>
            </ul>
            <button
              onClick={handleResetChallenges}
              className="btn-warning"
              disabled={isResetting || !secretCode}
              style={{ width: '100%', marginTop: '1rem' }}
            >
              {isResetting && resetType === 'challenges' ? 'Resetting Challenges...' : 'Reset Challenge Status'}
            </button>
          </div>
        </div>

        <div className="form-actions" style={{ marginTop: '2rem' }}>
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="btn-secondary"
            disabled={isResetting}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default PlatformReset;