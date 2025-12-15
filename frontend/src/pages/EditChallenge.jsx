import { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import './CreateChallenge.css'; // Reusing the same styles

function EditChallenge() {
  const { isAuthenticated, user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const challenge = location.state?.challenge;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'web',
    difficulty: 'Easy',
    points: 100,
    flag: ''
  });

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (user && user.role !== 'admin') {
      navigate('/challenges');
    }
  }, [isAuthenticated, user, navigate]);

  // Load challenge data
  useEffect(() => {
    const fetchChallenge = async () => {
      if (challenge) {
        setFormData({
          title: challenge.title,
          description: challenge.description,
          category: challenge.category,
          difficulty: challenge.difficulty,
          points: challenge.points,
          flag: ''
        });
      } else if (id && token) {
        try {
          const config = {
            headers: {
              Authorization: `Bearer ${token}`
            }
          };
          const res = await axios.get(`/api/challenges/${id}`, config);
          const challengeData = res.data.data;
          setFormData({
            title: challengeData.title,
            description: challengeData.description,
            category: challengeData.category,
            difficulty: challengeData.difficulty,
            points: challengeData.points,
            flag: ''
          });
        } catch (err) {
          setFormError('Failed to load challenge data');
        }
      }
    };
    
    fetchChallenge();
  }, [challenge, id, token]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'points' ? parseInt(value, 10) || '' : value
    });
    setFormError('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title || !formData.description || !formData.category || !formData.difficulty || !formData.points) {
      setFormError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };

      // Only include flag in the update if it was changed
      const updateData = { ...formData };
      if (!updateData.flag) {
        delete updateData.flag;
      }

      const res = await axios.put(
        `/api/challenges/${id}`,
        updateData,
        config
      );

      setSuccessMessage('Challenge updated successfully!');

      setTimeout(() => {
        navigate('/admin');
      }, 2000);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update challenge');
    } finally {
      setIsSubmitting(false);
    }
  };

  const { title, description, category, difficulty, points, flag } = formData;

  return (
    <div className="create-challenge-container">
      <div className="create-challenge-card">
        <div className="create-challenge-header">
          <h2>Edit <span className="highlight">Challenge</span></h2>
          <p>Update challenge details</p>
        </div>

        {formError && <div className="form-error">{formError}</div>}
        {successMessage && <div className="form-success">{successMessage}</div>}

        <form onSubmit={onSubmit} className="challenge-form">
          <div className="form-group">
            <label htmlFor="title">Challenge Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={title}
              onChange={onChange}
              placeholder="Enter a title for your challenge"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={description}
              onChange={onChange}
              placeholder="Describe the challenge and provide any necessary context"
              rows="4"
              required
            ></textarea>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={category}
                onChange={onChange}
                required
              >
                <option value="web">Web Exploitation</option>
                <option value="crypto">Cryptography</option>
                <option value="forensics">Forensics</option>
                <option value="reverse">Reverse Engineering</option>
                <option value="osint">OSINT</option>
                <option value="misc">Miscellaneous</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="difficulty">Difficulty</label>
              <select
                id="difficulty"
                name="difficulty"
                value={difficulty}
                onChange={onChange}
                required
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
                <option value="Expert">Expert</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="points">Points</label>
            <input
              type="number"
              id="points"
              name="points"
              value={points}
              onChange={onChange}
              min="50"
              max="1000"
              step="50"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="flag">Flag (leave empty to keep existing)</label>
            <input
              type="text"
              id="flag"
              name="flag"
              value={flag}
              onChange={onChange}
              placeholder="Enter new flag SECE{Flag_Here}"
            />
            <small className="form-hint">Only fill this if you want to change the flag.</small>
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Updating...' : 'Update Challenge'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditChallenge;