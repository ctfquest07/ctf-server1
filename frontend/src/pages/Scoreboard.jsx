import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import ScoreGraph from '../components/ScoreGraph';
import { useEventState } from '../hooks/useEventState';
import './Scoreboard.css';

function Scoreboard() {
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewType, setViewType] = useState('teams');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [progressionData, setProgressionData] = useState(null);
  const [eventEnded, setEventEnded] = useState(false);
  const [eventEndedAt, setEventEndedAt] = useState(null);
  const { token, isAuthenticated } = useContext(AuthContext);
  const { isEnded: isEventEnded } = useEventState();
  const navigate = useNavigate();

  const fetchScoreboard = async (isAutoRefresh = false) => {
    try {
      if (!isAuthenticated) {
        setError('You must be logged in to view the scoreboard');
        if (!isAutoRefresh) setLoading(false);
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      const [teamsRes, usersRes] = await Promise.all([
        axios.get('/api/auth/scoreboard?type=teams', config),
        axios.get('/api/auth/scoreboard?type=users', config)
      ]);

      setTeams(teamsRes.data.data || []);
      const filteredUsers = (usersRes.data.data || []).filter(user => user.role !== 'admin');
      setUsers(filteredUsers);
      setLastUpdated(new Date());
      
      // Check if event is ended from response
      const eventEndedFromResponse = teamsRes.data.eventEnded || usersRes.data.eventEnded;
      setEventEnded(eventEndedFromResponse || false);
      setEventEndedAt(teamsRes.data.eventEndedAt || usersRes.data.eventEndedAt || null);
      
      setError(null);
      if (!isAutoRefresh) setLoading(false);

      // Fetch score progression data asynchronously (non-blocking)
      if (!isAutoRefresh) {
        fetchProgressionData();
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Authentication required. Please log in.');
        navigate('/login');
      } else if (err.response?.status === 403 && err.response?.data?.scoreboardDisabled) {
        setError(err.response.data.message);
      } else if (!isAutoRefresh) {
        setError('Failed to fetch scoreboard data');
      }
      if (!isAutoRefresh) setLoading(false);
    }
  };

  const fetchProgressionData = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      const response = await axios.get(`/api/auth/scoreboard/progression?type=${viewType}&limit=10`, config);
      setProgressionData(response.data.data);
    } catch (err) {
      console.error('Error fetching progression data:', err);
      // Don't show error to user, just fail silently for graph
    }
  };

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchProgressionData();
    }
  }, [viewType, isAuthenticated, token]);

  useEffect(() => {
    fetchScoreboard();

    // Only auto-refresh if event is not ended (freeze leaderboard when ended)
    if (!isEventEnded && !eventEnded) {
      // Add random jitter (25-35s) to prevent thundering herd with 500 users
      const jitter = Math.floor(Math.random() * 10000) + 25000; // 25-35 seconds
      const interval = setInterval(() => {
        fetchScoreboard(true);
      }, jitter);

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, token, navigate, isEventEnded, eventEnded]);

  if (loading) {
    return (
      <div className="scoreboard-container">
        <div className="loading">Loading scoreboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="scoreboard-container">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="scoreboard-container">
      {(eventEnded || isEventEnded) && (
        <div style={{
          backgroundColor: 'rgba(139, 92, 246, 0.2)',
          border: '2px solid #8b5cf6',
          color: '#c4b5fd',
          padding: '15px',
          textAlign: 'center',
          marginBottom: '20px',
          borderRadius: '5px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          boxShadow: '0 0 15px rgba(139, 92, 246, 0.3)'
        }}>
          <span>🔒</span>
          <span>FROZEN - Event Ended</span>
          {eventEndedAt && (
            <span style={{ fontSize: '14px', opacity: 0.9, marginLeft: '10px' }}>
              (Ended: {new Date(eventEndedAt).toLocaleString()})
            </span>
          )}
        </div>
      )}
      <div className="scoreboard-header">
        <h1>Scoreboard</h1>
        {lastUpdated && (
          <p className="last-updated">
            Last updated: {lastUpdated.toLocaleTimeString()}
            {(eventEnded || isEventEnded) && ' (Frozen)'}
          </p>
        )}
      </div>

      <div className="scoreboard-tabs">
        <button
          className={`tab-button ${viewType === 'teams' ? 'active' : ''}`}
          onClick={() => setViewType('teams')}
        >
          Teams ({teams.length})
        </button>
        <button
          className={`tab-button ${viewType === 'users' ? 'active' : ''}`}
          onClick={() => setViewType('users')}
        >
          Users ({users.length})
        </button>
      </div>

      {/* Score Progression Graph - Only show for teams */}
      {progressionData && viewType === 'teams' && (
        <ScoreGraph data={progressionData} type={viewType} />
      )}

      <div className="scoreboard-table-container">
        <table className="scoreboard-table">
          <thead>
            <tr>
              <th className="rank-column">Rank</th>
              <th className="name-column">{viewType === 'teams' ? 'Team Name' : 'Username'}</th>
              <th className="points-column">Points</th>
            </tr>
          </thead>
          <tbody>
            {(viewType === 'teams' ? teams : users).map((item, index) => (
              <tr key={item._id} className={index < 3 ? `top-${index + 1}` : ''}>
                <td className="rank-column">
                  {index < 3 ? (
                    <div className={`rank-badge rank-${index + 1}`}>{index + 1}</div>
                  ) : (
                    <span className="rank-number">{index + 1}</span>
                  )}
                </td>
                <td className="name-column">
                  {viewType === 'teams' ? (
                    <button
                      className="team-name-link"
                      onClick={() => navigate(`/team/${item._id}`)}
                    >
                      {item.name}
                    </button>
                  ) : (
                    <button 
                      className="username-link"
                      onClick={() => navigate(`/user/${item._id}`)}
                    >
                      {item.username}
                    </button>
                  )}
                </td>
                <td className="points-column">
                  <span className="points-value">{item.points || 0}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Scoreboard;
