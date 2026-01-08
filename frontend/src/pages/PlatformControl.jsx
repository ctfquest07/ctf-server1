import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import './AdminDashboard.css';

function PlatformControl() {
  const { isAuthenticated, user, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [globalBlockSubmissions, setGlobalBlockSubmissions] = useState(false);
  const [scoreboardEnabled, setScoreboardEnabled] = useState(true);
  const [maxConnections, setMaxConnections] = useState(100);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const itemsPerPage = 10;

  // Competition Timer States
  const [timer, setTimer] = useState(null);
  const [timerLoading, setTimerLoading] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [remainingTime, setRemainingTime] = useState(null);

  // CTF Event Control States
  const [eventState, setEventState] = useState(null);
  const [eventStateLoading, setEventStateLoading] = useState(false);
  const [eventStateError, setEventStateError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (user && user.role !== 'admin') {
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  // Fetch timer status
  useEffect(() => {
    const fetchTimer = async () => {
      try {
        const res = await axios.get('/api/timer');
        setTimer(res.data.data);
      } catch (err) {
        console.error('Error fetching timer:', err);
      }
    };
    fetchTimer();
    const interval = setInterval(fetchTimer, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Fetch event state
  useEffect(() => {
    const fetchEventState = async () => {
      try {
        const res = await axios.get('/api/event-control/status');
        setEventState(res.data.data);
        setEventStateError(null);
      } catch (err) {
        console.error('Error fetching event state:', err);
        setEventStateError('Failed to fetch event state');
      }
    };
    fetchEventState();
    const interval = setInterval(fetchEventState, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Calculate remaining time
  useEffect(() => {
    if (timer && timer.isActive && timer.endTime) {
      const calculateRemaining = () => {
        const now = new Date();
        const end = new Date(timer.endTime);
        const diff = end - now;
        
        if (diff <= 0) {
          setRemainingTime('ENDED');
          return;
        }
        
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        
        setRemainingTime(`${hours}h ${minutes}m ${seconds}s`);
      };
      
      calculateRemaining();
      const interval = setInterval(calculateRemaining, 1000);
      return () => clearInterval(interval);
    } else {
      setRemainingTime(null);
    }
  }, [timer]);

  useEffect(() => {
    const loadData = async () => {
      if (!token) return;

      setLoading(true);
      setError(null);

      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      try {
        // Load users
        const res = await axios.get(`/api/auth/users?page=${currentPage}&limit=${itemsPerPage}`, config);
        setUsers(res.data.users || []);
        setTotalUsers(res.data.total || 0);

        // Load platform settings
        const settingsRes = await axios.get('/api/auth/platform-control/settings', config);
        if (settingsRes.data.success) {
          setScoreboardEnabled(settingsRes.data.data.scoreboardEnabled);
          setMaxConnections(settingsRes.data.data.maxConnections);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch data. Please try again.');
        setLoading(false);
      }
    };

    loadData();
  }, [token, currentPage]);

  const handleBlockUser = async (userId, isCurrentlyBlocked) => {
    try {
      let reason = null;
      
      if (!isCurrentlyBlocked) {
        // If user is not blocked, ask for reason to block
        reason = prompt('Reason for blocking (optional):');
        if (reason === null) return; // User cancelled
      } else {
        // If user is blocked, confirm unblock
        if (!window.confirm('Are you sure you want to unblock this user?')) return;
      }

      await axios.put(
        `/api/auth/users/${userId}/block`,
        { 
          isBlocked: !isCurrentlyBlocked, 
          reason: reason || 'No reason provided'
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setUsers(users.map(u =>
        u._id === userId ? { 
          ...u, 
          isBlocked: !isCurrentlyBlocked, 
          blockedReason: !isCurrentlyBlocked ? reason : null 
        } : u
      ));
      
      setSuccessMessage(`User ${!isCurrentlyBlocked ? 'blocked' : 'unblocked'} successfully`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to update user status';
      setError(errorMsg);
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleSubmissionPermission = async (userId, currentPermission) => {
    try {
      await axios.put(
        `/api/auth/users/${userId}/submission-permission`,
        { canSubmitFlags: !currentPermission },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setUsers(users.map(u =>
        u._id === userId ? { ...u, canSubmitFlags: !currentPermission } : u
      ));
      setSuccessMessage(`Submission permission ${!currentPermission ? 'allowed' : 'blocked'}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to update permission';
      setError(errorMsg);
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleScoreboardVisibility = async (userId, currentVisibility) => {
    try {
      await axios.put(
        `/api/auth/users/${userId}/scoreboard-visibility`,
        { showInScoreboard: !currentVisibility },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setUsers(users.map(u =>
        u._id === userId ? { ...u, showInScoreboard: !currentVisibility } : u
      ));
      setSuccessMessage(`Scoreboard visibility ${!currentVisibility ? 'shown' : 'hidden'}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to update visibility';
      setError(errorMsg);
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleGlobalBlockSubmissions = async () => {
    try {
      await axios.put(
        '/api/auth/platform-control/block-submissions',
        { submissionsAllowed: globalBlockSubmissions },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setGlobalBlockSubmissions(!globalBlockSubmissions);
      setSuccessMessage(`All submissions ${globalBlockSubmissions ? 'blocked' : 'allowed'}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to update global setting';
      setError(errorMsg);
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleScoreboardToggle = async () => {
    try {
      await axios.put(
        '/api/auth/platform-control/scoreboard-toggle',
        { scoreboardEnabled: !scoreboardEnabled },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setScoreboardEnabled(!scoreboardEnabled);
      setSuccessMessage(`Scoreboard ${!scoreboardEnabled ? 'enabled' : 'disabled'}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to update scoreboard setting';
      setError(errorMsg);
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleConnectionLimitChange = async (newLimit) => {
    try {
      await axios.put(
        '/api/auth/platform-control/connection-limit',
        { maxConnections: newLimit },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setMaxConnections(newLimit);
      setSuccessMessage(`Connection limit updated to ${newLimit}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to update connection limit';
      setError(errorMsg);
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUnblockAllUsers = async () => {
    if (!window.confirm('Are you sure you want to unblock all users? This action cannot be undone.')) return;

    try {
      const res = await axios.put(
        '/api/auth/platform-control/unblock-all-users',
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const unblockedCount = res.data.data?.unblockedCount || 0;
      setUsers(users.map(u => ({ ...u, isBlocked: false, blockedReason: null, blockedAt: null })));
      setSuccessMessage(`${unblockedCount} user(s) unblocked successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to unblock users';
      setError(errorMsg);
      setTimeout(() => setError(null), 3000);
    }
  };

  // Timer Control Functions
  const handleStartTimer = async () => {
    if (!window.confirm(`Start competition for ${durationMinutes} minutes?`)) return;
    
    setTimerLoading(true);
    try {
      const res = await axios.post('/api/timer/start', { durationMinutes }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTimer(res.data.data);
      setSuccessMessage(res.data.message);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start timer');
      setTimeout(() => setError(null), 3000);
    } finally {
      setTimerLoading(false);
    }
  };

  const handleStopTimer = async () => {
    if (!window.confirm('Stop the competition timer?')) return;
    
    setTimerLoading(true);
    try {
      const res = await axios.post('/api/timer/stop', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTimer(res.data.data);
      setSuccessMessage(res.data.message);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to stop timer');
      setTimeout(() => setError(null), 3000);
    } finally {
      setTimerLoading(false);
    }
  };

  const handleExtendTimer = async () => {
    const minutes = prompt('Enter additional minutes to extend:', '30');
    if (!minutes) return;
    
    const additionalMinutes = parseInt(minutes);
    if (isNaN(additionalMinutes) || additionalMinutes <= 0) {
      setError('Invalid minutes');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    setTimerLoading(true);
    try {
      const res = await axios.post('/api/timer/extend', { additionalMinutes }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTimer(res.data.data);
      setSuccessMessage(res.data.message);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to extend timer');
      setTimeout(() => setError(null), 3000);
    } finally {
      setTimerLoading(false);
    }
  };

  // CTF Event Control Functions
  const handleStartEvent = async () => {
    if (!window.confirm('Are you sure you want to START the CTF event? This will allow all flag submissions.')) return;
    
    setEventStateLoading(true);
    setEventStateError(null);
    try {
      const res = await axios.post('/api/event-control/start', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEventState(res.data.data);
      setSuccessMessage(res.data.message);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to start event';
      setEventStateError(errorMsg);
      setError(errorMsg);
      setTimeout(() => setError(null), 5000);
    } finally {
      setEventStateLoading(false);
    }
  };

  const handleEndEvent = async () => {
    if (!window.confirm('Are you sure you want to END the CTF event? This will BLOCK all flag submissions and FREEZE the leaderboard. This action cannot be easily undone.')) return;
    
    setEventStateLoading(true);
    setEventStateError(null);
    try {
      const res = await axios.post('/api/event-control/end', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEventState(res.data.data);
      setSuccessMessage(res.data.message);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to end event';
      setEventStateError(errorMsg);
      setError(errorMsg);
      setTimeout(() => setError(null), 5000);
    } finally {
      setEventStateLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = (
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (filterStatus === 'blocked') {
      return matchesSearch && u.isBlocked;
    } else if (filterStatus === 'active') {
      return matchesSearch && !u.isBlocked;
    }
    return matchesSearch;
  });

  const totalPages = Math.ceil(totalUsers / itemsPerPage);

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <button 
          onClick={() => navigate('/admin')} 
          className="back-button"
          title="Go back to Admin Dashboard"
        >
          ← Back to Dashboard
        </button>
        <div className="dashboard-header-content">
          <h1>Platform <span className="highlight">Control</span></h1>
          <p>Manage user permissions and platform settings</p>
        </div>
      </div>

      {successMessage && <div className="success-message">{successMessage}</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="platform-controls-section">
        <div className="global-controls">
          {/* CTF Event Control */}
          <div className="control-card" style={{ border: eventState?.status === 'ended' ? '2px solid #8b5cf6' : '1px solid #ddd', boxShadow: eventState?.status === 'ended' ? '0 0 15px rgba(139, 92, 246, 0.3)' : 'none' }}>
            <h3>CTF Event Control</h3>
            <p>Manually START or END the CTF event. When ended, all submissions are blocked and leaderboard is frozen.</p>
            
            {eventState && (
              <div className="event-state-display" style={{ marginBottom: '15px', padding: '10px', backgroundColor: eventState.status === 'ended' ? 'rgba(139, 92, 246, 0.15)' : eventState.status === 'started' ? 'rgba(34, 197, 94, 0.15)' : '#f0f0f0', borderRadius: '5px', border: eventState.status === 'ended' ? '1px solid #8b5cf6' : eventState.status === 'started' ? '1px solid #22c55e' : '1px solid #ddd' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ 
                    fontSize: '20px', 
                    fontWeight: 'bold',
                    color: eventState.status === 'ended' ? '#8b5cf6' : eventState.status === 'started' ? '#22c55e' : '#888',
                    textShadow: eventState.status === 'ended' ? '0 0 10px rgba(139, 92, 246, 0.5)' : eventState.status === 'started' ? '0 0 10px rgba(34, 197, 94, 0.5)' : 'none'
                  }}>
                    {eventState.status === 'ended' ? '●' : eventState.status === 'started' ? '●' : '○'}
                  </span>
                  <span style={{ fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase', color: eventState.status === 'ended' ? '#c4b5fd' : eventState.status === 'started' ? '#86efac' : '#888' }}>
                    {eventState.status === 'not_started' ? 'Not Started' : eventState.status === 'started' ? 'Started' : 'Ended'}
                  </span>
                </div>
                {eventState.startedAt && (
                  <p style={{ margin: '5px 0', fontSize: '14px' }}>
                    Started: {new Date(eventState.startedAt).toLocaleString()}
                  </p>
                )}
                {eventState.endedAt && (
                  <p style={{ margin: '5px 0', fontSize: '14px', color: '#c4b5fd', fontWeight: 'bold' }}>
                    Ended: {new Date(eventState.endedAt).toLocaleString()}
                  </p>
                )}
                {eventState.status === 'ended' && (
                  <div style={{ marginTop: '10px', padding: '10px', backgroundColor: 'rgba(139, 92, 246, 0.1)', borderRadius: '5px', border: '1px solid #8b5cf6' }}>
                    <strong style={{ color: '#c4b5fd' }}>⚠️ Event Ended</strong>
                    <p style={{ margin: '5px 0', fontSize: '13px', color: '#c4b5fd' }}>All flag submissions are blocked. Leaderboard is frozen.</p>
                  </div>
                )}
              </div>
            )}

            {eventStateError && (
              <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: 'rgba(139, 92, 246, 0.15)', borderRadius: '5px', color: '#c4b5fd', border: '1px solid #8b5cf6' }}>
                {eventStateError}
              </div>
            )}

            <div className="event-controls">
              {(!eventState || eventState.status === 'not_started' || eventState.status === 'ended') && (
                <button
                  className="btn-start"
                  onClick={handleStartEvent}
                  disabled={eventStateLoading}
                  style={{ marginRight: '10px' }}
                >
                  {eventStateLoading ? 'Starting...' : 'START EVENT'}
                </button>
              )}
              {eventState && eventState.status === 'started' && (
                <button
                  className="btn-stop"
                  onClick={handleEndEvent}
                  disabled={eventStateLoading}
                >
                  {eventStateLoading ? 'Ending...' : 'END EVENT'}
                </button>
              )}
            </div>
          </div>

          {/* Competition Timer Control */}
          <div className="control-card">
            <h3>Competition Timer</h3>
            <p>Control the live competition countdown timer</p>
            
            {timer && timer.isActive && remainingTime && (
              <div className="timer-display">
                <div className="timer-status active">
                  <span className="status-indicator">● LIVE</span>
                  <span className="remaining-time">{remainingTime}</span>
                </div>
                <div className="timer-info">
                  <p>Started: {new Date(timer.startTime).toLocaleString()}</p>
                  <p>Ends: {new Date(timer.endTime).toLocaleString()}</p>
                </div>
              </div>
            )}
            
            {timer && !timer.isActive && (
              <div className="timer-display">
                <div className="timer-status inactive">
                  <span className="status-indicator">○ INACTIVE</span>
                </div>
              </div>
            )}
            
            <div className="timer-controls">
              {!timer || !timer.isActive ? (
                <>
                  <div className="duration-input">
                    <label>Duration (minutes):</label>
                    <input
                      type="number"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 120)}
                      min="1"
                      max="1440"
                    />
                  </div>
                  <button
                    className="btn-start"
                    onClick={handleStartTimer}
                    disabled={timerLoading}
                  >
                    {timerLoading ? 'Starting...' : 'Start Competition'}
                  </button>
                </>
              ) : (
                <div className="active-timer-controls">
                  <button
                    className="btn-extend"
                    onClick={handleExtendTimer}
                    disabled={timerLoading}
                  >
                    {timerLoading ? 'Extending...' : 'Extend Time'}
                  </button>
                  <button
                    className="btn-stop"
                    onClick={handleStopTimer}
                    disabled={timerLoading}
                  >
                    {timerLoading ? 'Stopping...' : 'Stop Competition'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="control-card">
            <h3>Global Submission Control</h3>
            <p>Block all users from submitting flags across all challenges</p>
            <div className="control-toggle">
              <button
                className={`toggle-btn ${globalBlockSubmissions ? 'blocked' : 'allowed'}`}
                onClick={handleGlobalBlockSubmissions}
              >
                {globalBlockSubmissions ? 'Submissions Blocked' : 'Submissions Allowed'}
              </button>
            </div>
          </div>

          <div className="control-card">
            <h3>Scoreboard Control</h3>
            <p>Enable or disable scoreboard access for all users</p>
            <div className="control-toggle">
              <button
                className={`toggle-btn ${scoreboardEnabled ? 'allowed' : 'blocked'}`}
                onClick={handleScoreboardToggle}
              >
                {scoreboardEnabled ? 'Scoreboard Enabled' : 'Scoreboard Disabled'}
              </button>
            </div>
          </div>

          <div className="control-card">
            <h3>Connection Limit</h3>
            <p>Control maximum concurrent connections to the platform</p>
            <div className="connection-controls">
              <div className="connection-display">
                <span>Current Limit: <strong>{maxConnections}</strong></span>
              </div>
              <div className="connection-buttons">
                <button
                  className="connection-btn decrease"
                  onClick={() => handleConnectionLimitChange(Math.max(10, maxConnections - 10))}
                  disabled={maxConnections <= 10}
                >
                  -10
                </button>
                <button
                  className="connection-btn increase"
                  onClick={() => handleConnectionLimitChange(maxConnections + 10)}
                >
                  +10
                </button>
                <button
                  className="connection-btn increase"
                  onClick={() => handleConnectionLimitChange(maxConnections + 50)}
                >
                  +50
                </button>
              </div>
            </div>
          </div>

          <div className="control-card">
            <h3>Unblock All Users</h3>
            <p>Instantly unblock all blocked users on the platform</p>
            <div className="control-toggle">
              <button
                className="toggle-btn allowed"
                onClick={handleUnblockAllUsers}
              >
                🔓 Unblock All Users
              </button>
            </div>
          </div>
        </div>

        <div className="user-controls-section">
          <h2>User-Level Controls</h2>
          
          <div className="control-filters">
            <input
              type="text"
              placeholder="Search users by username or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Users</option>
              <option value="active">Active Users</option>
              <option value="blocked">Blocked Users</option>
            </select>
          </div>

          <div className="table-container">
            <table className="platform-control-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Block User</th>
                  <th>Allow Submissions</th>
                  <th>Show in Scoreboard</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u._id} className={u.isBlocked ? 'blocked-user' : ''}>
                    <td><strong>{u.username}</strong></td>
                    <td>{u.email}</td>
                    <td><span className={`role-badge ${u.role}`}>{u.role}</span></td>
                    <td>
                      <button
                        className={`control-btn ${u.isBlocked ? 'blocked' : 'active'}`}
                        onClick={() => handleBlockUser(u._id, u.isBlocked)}
                        title={u.isBlocked ? `Blocked: ${u.blockedReason || 'No reason'} - Click to unblock` : 'Click to block user'}
                      >
                        {u.isBlocked ? '🔓 Unblock' : '🔒 Block'}
                      </button>
                    </td>
                    <td>
                      <button
                        className={`control-btn ${u.canSubmitFlags ? 'allowed' : 'blocked'}`}
                        onClick={() => handleSubmissionPermission(u._id, u.canSubmitFlags)}
                        title={u.canSubmitFlags ? 'Submissions allowed' : 'Submissions blocked'}
                      >
                        {u.canSubmitFlags ? '✓ Allowed' : '✗ Blocked'}
                      </button>
                    </td>
                    <td>
                      <button
                        className={`control-btn ${u.showInScoreboard ? 'visible' : 'hidden'}`}
                        onClick={() => handleScoreboardVisibility(u._id, u.showInScoreboard)}
                        title={u.showInScoreboard ? 'Visible on scoreboard' : 'Hidden from scoreboard'}
                      >
                        {u.showInScoreboard ? '👁️ Visible' : '👁️‍🗨️ Hidden'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="no-users">
              <p>No users found matching your criteria.</p>
            </div>
          )}

          {filteredUsers.length > 0 && (
            <div className="pagination">
              <button 
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} 
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {currentPage} of {totalPages || 1}
              </span>
              <button 
                onClick={() => setCurrentPage(currentPage + 1)} 
                disabled={currentPage >= totalPages}
                className="pagination-btn"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PlatformControl;
