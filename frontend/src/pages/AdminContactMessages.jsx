import { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import './AdminContactMessages.css';

function AdminContactMessages() {
  const { isAuthenticated, user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [replyContent, setReplyContent] = useState('');

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (user && user.role !== 'admin') {
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (!token) return;

      setLoading(true);
      setError(null);

      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      try {
        console.log('Fetching messages with token:', token);
        const res = await axios.get('/api/contact', config);
        console.log('Raw API response:', res);
        console.log('Response data:', res.data);

        // Handle both array and object responses
        const messagesArray = Array.isArray(res.data) ? res.data : res.data.messages;

        if (Array.isArray(messagesArray)) {
          console.log('Messages array:', messagesArray);
          setMessages(messagesArray);
        } else {
          console.error('Invalid messages data format:', res.data);
          setError('Invalid data format received from server');
          setMessages([]);
        }

        // If there's a message ID in the URL, select that message
        const messageId = searchParams.get('id');
        if (messageId) {
          const message = messagesArray.find(m => m._id === messageId);
          if (message) {
            setSelectedMessage(message);
          }
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError('Failed to fetch messages. Please try again.');
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [token, searchParams]);

  // Add a refresh button to manually fetch messages
  const handleRefresh = async () => {
    setLoading(true);
    setError(null);

    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };

    try {
      console.log('Refreshing messages...');
      const res = await axios.get('/api/contact', config);
      console.log('Refresh response:', res.data);

      // Handle both array and object responses
      const messagesArray = Array.isArray(res.data) ? res.data : res.data.messages;

      if (Array.isArray(messagesArray)) {
        setMessages(messagesArray);
        setSuccessMessage('Messages refreshed successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        console.error('Invalid messages data format:', res.data);
        setMessages([]);
        setError('Invalid data format received from server');
      }
    } catch (err) {
      console.error('Error refreshing messages:', err);
      setError('Failed to refresh messages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (messageId, newStatus) => {
    try {
      setError(null);
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      await axios.put(
        `http://localhost:5000/api/contact/${messageId}/status`,
        { status: newStatus },
        config
      );

      // Update the message status in the local state
      setMessages(messages.map(msg =>
        msg._id === messageId ? { ...msg, status: newStatus } : msg
      ));

      if (selectedMessage && selectedMessage._id === messageId) {
        setSelectedMessage({ ...selectedMessage, status: newStatus });
      }

      setSuccessMessage('Status updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status. Please try again.');
    }
  };

  const handleReply = async (messageId) => {
    if (!replyContent.trim()) {
      setError('Please enter a reply message.');
      return;
    }

    try {
      setError(null);
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      await axios.post(
        `/api/contact/${messageId}/reply`,
        { content: replyContent },
        config
      );

      // Update the message status to 'replied'
      handleStatusUpdate(messageId, 'replied');
      setReplyContent('');
      setSuccessMessage('Reply sent successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error sending reply:', err);
      setError('Failed to send reply. Please try again.');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
      return;
    }

    try {
      setError(null);
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      await axios.delete(`/api/contact/${messageId}`, config);

      setMessages(messages.filter(msg => msg._id !== messageId));
      
      if (selectedMessage && selectedMessage._id === messageId) {
        setSelectedMessage(null);
      }

      setSuccessMessage('Message deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error deleting message:', err);
      setError('Failed to delete message. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="admin-messages">
        <div className="loading">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="admin-messages">
      <div className="messages-header">
        <h1>Contact <span className="highlight">Messages</span></h1>
        <p>Manage and respond to contact form submissions</p>
        <button className="back-button" onClick={() => navigate('/admin')}>
          Back to Dashboard
        </button>
        <button className="refresh-button" onClick={handleRefresh}>
          Refresh Messages
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      <div className="messages-container">
        <div className="messages-list">
          <h2>All Messages ({messages.length})</h2>
          <div className="message-cards">
            {messages.length > 0 ? (
              messages.map(message => (
                <div
                  key={message._id}
                  className={`message-card ${selectedMessage?._id === message._id ? 'selected' : ''}`}
                  onClick={() => setSelectedMessage(message)}
                >
                  <div className="message-header">
                    <h3>{message.subject || 'No Subject'}</h3>
                    <span className={`status-badge ${message.status || 'unread'}`}>
                      {message.status || 'unread'}
                    </span>
                  </div>
                  <p className="message-preview">
                    {message.message ? message.message.substring(0, 100) + '...' : 'No message content'}
                  </p>
                  <div className="message-footer">
                    <span className="sender">
                      {message.name || 'Anonymous'} ({message.email || 'No email'})
                    </span>
                    <span className="date">
                      {message.createdAt ? new Date(message.createdAt).toLocaleDateString() : 'No date'}
                    </span>
                  </div>
                  <div className="message-actions-quick">
                    <button
                      className="delete-button-quick"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMessage(message._id);
                      }}
                      title="Delete message"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-messages">
                No messages found in the database
              </div>
            )}
          </div>
        </div>

        <div className="message-detail">
          {selectedMessage ? (
            <>
              <div className="message-header">
                <h2>{selectedMessage.subject}</h2>
                <div className="message-actions">
                  <button
                    className={`status-button ${selectedMessage.status === 'unread' ? 'active' : ''}`}
                    onClick={() => handleStatusUpdate(selectedMessage._id, 'unread')}
                  >
                    Mark Unread
                  </button>
                  <button
                    className={`status-button ${selectedMessage.status === 'read' ? 'active' : ''}`}
                    onClick={() => handleStatusUpdate(selectedMessage._id, 'read')}
                  >
                    Mark Read
                  </button>
                  <button
                    className={`status-button ${selectedMessage.status === 'replied' ? 'active' : ''}`}
                    onClick={() => handleStatusUpdate(selectedMessage._id, 'replied')}
                  >
                    Mark Replied
                  </button>
                  <button
                    className="delete-button"
                    onClick={() => handleDeleteMessage(selectedMessage._id)}
                  >
                    <i className="fas fa-trash"></i> Delete
                  </button>
                </div>
              </div>

              <div className="message-info">
                <p><strong>From:</strong> {selectedMessage.name} ({selectedMessage.email})</p>
                <p><strong>Date:</strong> {new Date(selectedMessage.createdAt).toLocaleString()}</p>
              </div>

              <div className="message-content">
                <p>{selectedMessage.message}</p>
              </div>

              <div className="reply-section">
                <h3>Reply to Message</h3>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Type your reply here..."
                  rows="5"
                />
                <button
                  className="reply-button"
                  onClick={() => handleReply(selectedMessage._id)}
                >
                  Send Reply
                </button>
              </div>
            </>
          ) : (
            <div className="no-message-selected">
              <h2>Select a message to view details</h2>
              <p>Click on any message from the list to view its contents and reply.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminContactMessages;