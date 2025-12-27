import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import './AdminCreateTeam.css';

function AdminCreateTeam() {
  const { isAuthenticated, user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const DEFAULT_MAX_MEMBERS = 2;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    members: [],
    maxMembers: DEFAULT_MAX_MEMBERS
  });

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (user && user.role !== 'admin') {
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };

        const res = await axios.get('/api/auth/users?all=true', config);
        // Filter out admin users and users who already have a team
        const availableUsers = (res.data.users || []).filter(u => u.role !== 'admin' && !u.team);
        setUsers(availableUsers);
        setFilteredUsers(availableUsers);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to fetch users');
        setIsLoading(false);
      }
    };

    if (token) {
      fetchUsers();
    }
  }, [token]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setError('');
  };

  const handleMemberChange = (userId) => {
    setFormData(prev => {
      const isSelected = prev.members.includes(userId);
      if (isSelected) {
        // Remove member
        return {
          ...prev,
          members: prev.members.filter(id => id !== userId)
        };
      } else {
        // Add member only if under limit
        if (prev.members.length >= prev.maxMembers) {
          setError(`Maximum ${prev.maxMembers} members allowed per team`);
          return prev;
        }
        return {
          ...prev,
          members: [...prev.members, userId]
        };
      }
    });
    setError('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Team name is required');
      return false;
    }

    if (!formData.maxMembers || formData.maxMembers < 1) {
      setError('Max members must be at least 1');
      return false;
    }

    if (formData.members.length < 1) {
      setError('Please select at least 1 member for the team');
      return false;
    }

    if (formData.members.length > formData.maxMembers) {
      setError(`Teams can have maximum ${formData.maxMembers} members`);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      await axios.post(
        '/api/teams',
        {
          name: formData.name,
          description: formData.description,
          members: formData.members,
          maxMembers: formData.maxMembers
        },
        config
      );

      setSuccessMessage('Team created successfully!');
      setFormData({
        name: '',
        description: '',
        members: [],
        maxMembers: DEFAULT_MAX_MEMBERS
      });

      setTimeout(() => {
        navigate('/admin');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create team');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="admin-create-team">
        <div className="create-team-container">
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-create-team">
      <div className="create-team-container">
        <div className="create-team-header">
          <h1>Create New <span className="highlight">Team</span></h1>
          <p>Add a new team with configurable member limit</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        <form onSubmit={handleSubmit} className="create-team-form">
          <div className="form-group">
            <label htmlFor="name">Team Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter team name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description (Optional)</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter team description"
              rows="4"
            />
          </div>

          <div className="form-group">
            <label htmlFor="maxMembers">Maximum Members *</label>
            <input
              type="number"
              id="maxMembers"
              name="maxMembers"
              value={formData.maxMembers}
              onChange={handleChange}
              min="1"
              max="10"
              required
            />
            <span className="form-hint">
              Set the maximum number of members allowed in this team (1-10)
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="members">
              Select Members * ({formData.members.length}/{formData.maxMembers} selected)
            </label>
            <input
              type="text"
              placeholder="Search by email or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <div className="checkbox-list">
              {filteredUsers.length === 0 ? (
                <p className="no-users">No available users found</p>
              ) : (
                filteredUsers.map(u => {
                  const isSelected = formData.members.includes(u._id);
                  const isDisabled = !isSelected && formData.members.length >= formData.maxMembers;
                  
                  return (
                    <label
                      key={u._id}
                      className={`checkbox-item ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleMemberChange(u._id)}
                        disabled={isDisabled}
                      />
                      <div className="user-info">
                        <span className="username">{u.username}</span>
                        <span className="email">{u.email}</span>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
            <span className="form-hint">
              {filteredUsers.length} users available • Maximum {formData.maxMembers} members per team
            </span>
          </div>

          <div className="members-preview">
            <h3>Selected Members ({formData.members.length}):</h3>
            <div className="members-list">
              {formData.members.length === 0 ? (
                <p className="no-members">No members selected</p>
              ) : (
                formData.members.map(memberId => {
                  const memberUser = users.find(u => u._id === memberId);
                  return (
                    <div key={memberId} className="member-badge">
                      <span>{memberUser?.username}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            members: formData.members.filter(m => m !== memberId)
                          });
                        }}
                        className="remove-btn"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/admin')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminCreateTeam;
