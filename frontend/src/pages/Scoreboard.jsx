import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import ScoreGraph from '../components/ScoreGraph';
import './Scoreboard.css';

function Scoreboard() {
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewType, setViewType] = useState('teams');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [progressionData, setProgressionData] = useState(null);
  const { token, isAuthenticated } = useContext(AuthContext);
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

    const interval = setInterval(() => {
      fetchScoreboard(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, token, navigate]);

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
      <div className="scoreboard-header">
        <h1>Scoreboard</h1>
        <p className="scoreboard-subtitle">Top performers ranked by points</p>
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

      {/* Score Progression Graph */}
      {progressionData && (
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
