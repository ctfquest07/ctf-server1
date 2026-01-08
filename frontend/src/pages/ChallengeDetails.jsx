import { useState, useEffect, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import AuthContext from '../context/AuthContext'
import './ChallengeDetails.css'

const FlagSubmissionModal = ({ challenge, onClose, onSubmit }) => {
  const [flag, setFlag] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!flag.trim()) {
      setError('Please enter a flag');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await onSubmit(flag);
      setSuccess('Flag submitted successfully!');
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setError(err.message || 'Failed to submit flag');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Submit Flag: {challenge.title}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && <div className="modal-error">{error}</div>}
        {success && <div className="modal-success">{success}</div>}

        <form onSubmit={handleSubmit} className="flag-form">
          <div className="form-group">
            <label htmlFor="flag">Flag</label>
            <input
              type="text"
              id="flag"
              value={flag}
              onChange={(e) => setFlag(e.target.value)}
              placeholder="Enter the flag SECE{flag_here}"
              autoComplete="off"
              disabled={isSubmitting || success}
            />
          </div>

          <button
            type="submit"
            className="submit-flag-button"
            disabled={isSubmitting || success}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Flag'}
          </button>
        </form>
      </div>
    </div>
  );
};

function ChallengeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [unlockedHints, setUnlockedHints] = useState([]);
  const [unlockingHint, setUnlockingHint] = useState(null);
  const { user, isAuthenticated, token, updateUserData } = useContext(AuthContext);

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        setLoading(true);
        const config = token ? {
          headers: { Authorization: `Bearer ${token}` }
        } : {};

        const res = await axios.get(`/api/challenges/${id}`, config);
        setChallenge(res.data.data);
        setUnlockedHints(res.data.unlockedHints || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching challenge:', err);
        setError('Challenge not found');
        setLoading(false);
      }
    };

    fetchChallenge();
  }, [id, token]);

  const openModal = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const submitFlag = async (flag) => {
    if (!challenge || !isAuthenticated) {
      throw new Error('Challenge not found or user not authenticated');
    }

    try {
      const res = await axios.post(
        `/api/challenges/${challenge._id}/submit`,
        { flag },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await updateUserData();
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to submit flag');
    }
  };

  const unlockHint = async (hintIndex) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const hint = challenge.hints[hintIndex];
    const teamPoints = user.team?.points || 0;
    const confirmMessage = `Are you sure you want to unlock this hint for ${hint.cost} points?\n\nTeam points: ${teamPoints}\nAfter unlock: ${teamPoints - hint.cost} points`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setUnlockingHint(hintIndex);
      const res = await axios.post(
        `/api/challenges/${challenge._id}/unlock-hint`,
        { hintIndex },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update unlocked hints
      setUnlockedHints([...unlockedHints, hintIndex]);
      
      // Update user data to reflect new points
      await updateUserData();

      alert(res.data.message);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to unlock hint');
    } finally {
      setUnlockingHint(null);
    }
  };

  if (loading) {
    return (
      <div className="challenge-details-container">
        <div className="loading">Loading challenge...</div>
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="challenge-details-container">
        <div className="error">{error || 'Challenge not found'}</div>
        <button onClick={() => navigate('/challenges')} className="back-button">
          ← Back to Challenges
        </button>
      </div>
    );
  }

  const isSolved = user?.solvedChallenges?.includes(challenge._id);

  return (
    <div className="challenge-details-container">
      <div className="challenge-details-header">
        <div className="header-content">
          <button onClick={() => navigate('/challenges')} className="back-button">
            ← Back to Challenges
          </button>
          <h1>{challenge.title}</h1>
        </div>
      </div>

      <div className="challenges-main">
        <div className="challenge-details-content">
        <div className="challenge-meta">
          <span className={`difficulty-badge ${challenge.difficulty.toLowerCase()}`}>
            {challenge.difficulty}
          </span>
          <span className="points-badge">{challenge.points} pts</span>
          <span className="category-badge">{challenge.category}</span>
          <span className="solved-count">{challenge.solvedBy?.length || 0} solves</span>
        </div>

        <div className="description">
          <h3>Description</h3>
          <p>{challenge.description}</p>
        </div>

        {challenge.hints && challenge.hints.length > 0 && (
          <div className="hints">
            <h3>Hints</h3>
            {challenge.hints.map((hint, index) => {
              const isUnlocked = unlockedHints.includes(index);
              const isFree = hint.cost === 0;
              const showContent = isFree || isUnlocked;

              return (
                <div key={index} className={`hint-item ${showContent ? 'unlocked' : 'locked'}`}>
                  {showContent ? (
                    <p>{hint.content}</p>
                  ) : (
                    <div className="locked-hint">
                      <button
                        className="unlock-hint-button"
                        onClick={() => unlockHint(index)}
                        disabled={!isAuthenticated || unlockingHint === index}
                      >
                        {unlockingHint === index ? 'Unlocking...' : `Unlock Hint for ${hint.cost} points`}
                      </button>
                      {!isAuthenticated && (
                        <p className="login-hint">Login to unlock this hint</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="challenge-actions">
          <button
            className={`solve-challenge-button ${!isAuthenticated ? 'login-required' : ''}`}
            onClick={openModal}
            disabled={isSolved}
          >
            {isSolved ? 'Solved ✓' : isAuthenticated ? 'Submit Flag' : 'Login to Solve'}
          </button>
        </div>
        </div>
      </div>

      {showModal && challenge && (
        <FlagSubmissionModal
          challenge={challenge}
          onClose={closeModal}
          onSubmit={submitFlag}
        />
      )}
    </div>
  );
}

export default ChallengeDetails;