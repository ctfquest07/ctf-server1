import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import './CreateChallenge.css';

function CreateChallenge() {
  const { isAuthenticated, user, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'web',
    difficulty: 'Easy',
    points: 100,
    flag: '',
    hints: [{ content: '', cost: 0 }],
    isVisible: true
  });

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const { title, description, category, difficulty, points, flag } = formData;

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (user && user.role !== 'admin') {
      navigate('/challenges');
    }
  }, [isAuthenticated, user, navigate]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'points' ? parseInt(value, 10) || '' : value
    });
    setFormError('');
  };

  const handleHintChange = (index, field, value) => {
    const newHints = [...formData.hints];
    newHints[index] = { ...newHints[index], [field]: value };
    setFormData({ ...formData, hints: newHints });
  };

  const addHint = () => {
    setFormData({
      ...formData,
      hints: [...formData.hints, { content: '', cost: 0 }]
    });
  };

  const removeHint = (index) => {
    const newHints = formData.hints.filter((_, i) => i !== index);
    setFormData({ ...formData, hints: newHints });
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!title || !description || !category || !difficulty || !points || !flag) {
      setFormError('Please fill in all fields');
      return;
    }

    // Filter out empty hints
    const validHints = formData.hints.filter(hint => hint.content.trim() !== '');

    setIsSubmitting(true);

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };

      const challengeData = {
        ...formData,
        hints: validHints
      };

      const res = await axios.post(
        '/api/challenges',
        challengeData,
        config
      );

      setSuccessMessage('Challenge created successfully!');
      setFormData({
        title: '',
        description: '',
        category: 'web',
        difficulty: 'Easy',
        points: 100,
        flag: '',
        hints: [{ content: '', cost: 0 }],
        isVisible: true
      });

      setTimeout(() => {
        navigate('/challenges');
      }, 2000);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create challenge');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-challenge-container">
      <div className="create-challenge-card">
        <div className="create-challenge-header">
          <h2>Create New <span className="highlight">Challenge</span></h2>
          <p>Add a new challenge to the platform</p>
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
            <label htmlFor="flag">Flag</label>
            <input
              type="text"
              id="flag"
              name="flag"
              value={flag}
              onChange={onChange}
              placeholder="Enter the flag SECE{Flag_Here}"
              required
            />
            <small className="form-hint">This will be hidden from users until they solve the challenge.</small>
          </div>

          <div className="hints-section">
            <h3>Hints</h3>
            <div className="hints-container">
              {formData.hints.map((hint, index) => (
                <div key={index} className="hint-item">
                  <div className="hint-content">
                    <textarea
                      value={hint.content}
                      onChange={(e) => handleHintChange(index, 'content', e.target.value)}
                      placeholder="Enter hint content"
                      rows="3"
                    />
                  </div>
                  <div className="hint-cost">
                    <input
                      type="number"
                      value={hint.cost}
                      onChange={(e) => handleHintChange(index, 'cost', parseInt(e.target.value) || 0)}
                      min="0"
                      placeholder="Cost"
                    />
                    <span className="hint-cost-label">points</span>
                  </div>
                  <button
                    type="button"
                    className="remove-hint-btn"
                    onClick={() => removeHint(index)}
                    disabled={formData.hints.length === 1}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button type="button" className="add-hint-btn" onClick={addHint}>
              Add Hint
            </button>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isVisible"
                checked={formData.isVisible}
                onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
              />
              <span>Make challenge visible to users</span>
            </label>
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Challenge'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateChallenge;
