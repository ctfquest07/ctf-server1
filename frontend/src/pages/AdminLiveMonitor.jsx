import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import './AdminLiveMonitor.css';

const AdminLiveMonitor = () => {
    const [submissions, setSubmissions] = useState([]);
    const [connectionStatus, setConnectionStatus] = useState('connecting'); // connecting, connected, error
    const { user, token } = useAuth();
    const eventSourceRef = useRef(null);

    useEffect(() => {
        // Wait for token to be available
        if (!token) {
            console.log('Waiting for auth token...');
            setConnectionStatus('error');
            return;
        }

        // Determine API URL (handle both dev and prod relative/absolute paths)
        const apiUrl = import.meta.env.VITE_API_URL || '';
        // Build SSE URL - ensure it goes through /api/ for nginx proxy
        const baseUrl = apiUrl || '';
        const sseUrl = `${baseUrl}/api/r-submission?token=${token}`;

        console.log('Token available, connecting to SSE:', sseUrl);
        console.log('Token length:', token?.length);

        // Close existing connection if any
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        const eventSource = new EventSource(sseUrl);
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
            console.log('SSE Connected');
            setConnectionStatus('connected');
        };

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('SSE Message:', data);

                if (data.type === 'connected') {
                    return;
                }

                setSubmissions(prev => {
                    // Keep only last 50 submissions
                    const newSubmissions = [data, ...prev];
                    if (newSubmissions.length > 50) {
                        return newSubmissions.slice(0, 50);
                    }
                    return newSubmissions;
                });
            } catch (err) {
                console.error('Error parsing SSE message:', err);
            }
        };

        eventSource.onerror = (err) => {
            console.error('SSE Error:', err);
            setConnectionStatus('error');
            // EventSource automatically reconnects, but we can show status
        };

        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, [token]);

    return (
        <div className="admin-live-monitor">
            <div className="monitor-header">
                <h2>Live Flag Submissions</h2>
                <div className={`status-badge status-${connectionStatus}`}>
                    {connectionStatus === 'connected' ? '● LIVE' : '○ ' + connectionStatus.toUpperCase()}
                </div>
            </div>

            {!token && (
                <div style={{padding: '20px', color: '#f39c12', background: '#2d1f0f', borderRadius: '8px', margin: '20px 0'}}>
                    ⚠️ Authentication token not available. Please refresh the page or log in again.
                </div>
            )}

            <div className="table-container">{connectionStatus === 'error' && token && (
                    <div style={{padding: '10px', color: '#e74c3c', marginBottom: '10px'}}>
                        Connection failed. Check console for details.
                    </div>
                )}
                <table className="submissions-table">
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>User</th>
                            <th>Email</th>
                            <th>Challenge</th>
                            <th>Points</th>
                            <th>IP</th>
                        </tr>
                    </thead>
                    <tbody>
                        {submissions.length === 0 ? (
                            <tr className="empty-row">
                                <td colSpan="6">Waiting for submissions...</td>
                            </tr>
                        ) : (
                            submissions.map((sub, index) => (
                                <tr key={index} className="submission-row fade-in">
                                    <td>{new Date(sub.submittedAt).toLocaleTimeString()}</td>
                                    <td className="font-bold">{sub.user}</td>
                                    <td className="text-dim">{sub.email}</td>
                                    <td className="text-highlight">{sub.challenge}</td>
                                    <td className="text-success">+{sub.points}</td>
                                    <td className="text-dim">{sub.ip}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminLiveMonitor;
