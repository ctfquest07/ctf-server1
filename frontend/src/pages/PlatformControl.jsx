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
  const [leaderboardEnabled, setLeaderboardEnabled] = useState(true);
  const [maxConnections, setMaxConnections] = useState(100);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (user && user.role !== 'admin') {
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

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
        const res = await axios.get(`/api/auth/users?page=${currentPage}&limit=${itemsPerPage}`, config);
        setUsers(res.data.users || []);
        setTotalUsers(res.data.total || 0);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to fetch users. Please try again.');
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

  const handleLeaderboardVisibility = async (userId, currentVisibility) => {
    try {
      await axios.put(
        `/api/auth/users/${userId}/leaderboard-visibility`,
        { showInLeaderboard: !currentVisibility },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setUsers(users.map(u =>
        u._id === userId ? { ...u, showInLeaderboard: !currentVisibility } : u
      ));
      setSuccessMessage(`Leaderboard visibility ${!currentVisibility ? 'shown' : 'hidden'}`);
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

  const handleLeaderboardToggle = async () => {
    try {
      await axios.put(
        '/api/auth/platform-control/leaderboard-toggle',
        { leaderboardEnabled: !leaderboardEnabled },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setLeaderboardEnabled(!leaderboardEnabled);
      setSuccessMessage(`Leaderboard ${!leaderboardEnabled ? 'enabled' : 'disabled'}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to update leaderboard setting';
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
            <h3>Leaderboard Control</h3>
            <p>Enable or disable leaderboard access for all users</p>
            <div className="control-toggle">
              <button
                className={`toggle-btn ${leaderboardEnabled ? 'allowed' : 'blocked'}`}
                onClick={handleLeaderboardToggle}
              >
                {leaderboardEnabled ? 'Leaderboard Enabled' : 'Leaderboard Disabled'}
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
                  <th>Show in Leaderboard</th>
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
                        className={`control-btn ${u.showInLeaderboard ? 'visible' : 'hidden'}`}
                        onClick={() => handleLeaderboardVisibility(u._id, u.showInLeaderboard)}
                        title={u.showInLeaderboard ? 'Visible on leaderboard' : 'Hidden from leaderboard'}
                      >
                        {u.showInLeaderboard ? '👁️ Visible' : '👁️‍🗨️ Hidden'}
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
