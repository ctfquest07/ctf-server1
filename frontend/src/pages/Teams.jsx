import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Teams.css';

function Teams() {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        pages: 1,
        total: 0
    });
    const navigate = useNavigate();

    const fetchTeams = async (page = 1) => {
        try {
            setLoading(true);
            const res = await axios.get(`/api/teams?page=${page}&limit=12`);
            setTeams(res.data.data || []);
            setPagination({
                page: res.data.page,
                pages: res.data.pages,
                total: res.data.total
            });
            setLoading(false);
            setError(null);
        } catch (err) {
            console.error('Error fetching teams:', err);
            setError('Failed to fetch teams. Please try again later.');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeams();
    }, []);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.pages) {
            fetchTeams(newPage);
        }
    };

    if (loading && teams.length === 0) {
        return (
            <div className="teams-page-container">
                <div className="loading">Loading teams...</div>
            </div>
        );
    }

    return (
        <div className="teams-page-container">
            <div className="teams-header">
                <h1 className="page-title">Participating Teams</h1>
                <p className="page-subtitle">Showing all {pagination.total} teams competing in CTFQuest</p>
            </div>

            <div className="teams-main">
                {error ? (
                    <div className="error">{error}</div>
                ) : teams.length === 0 ? (
                    <div className="no-teams">No teams have registered yet.</div>
                ) : (
                    <>
                        <div className="teams-grid">
                            {teams.map((team) => (
                                <div
                                    key={team._id}
                                    className="team-card"
                                    onClick={() => navigate(`/team/${team._id}`)}
                                >
                                    <div className="team-card-header">
                                        <div className="team-avatar">
                                            {team.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="team-info">
                                            <h3 className="team-name">{team.name}</h3>
                                            <span className="team-member-count">
                                                {team.members?.length || 0} Members
                                            </span>
                                        </div>
                                    </div>
                                    <div className="team-card-body">
                                        <p className="team-description">
                                            {team.description || "No description provided."}
                                        </p>
                                    </div>
                                    <div className="team-card-footer">
                                        <div className="team-stats">
                                            <div className="stat">
                                                <span className="stat-label">Points</span>
                                                <span className="stat-value">{team.points || 0}</span>
                                            </div>
                                        </div>
                                        <button className="view-team-btn">View Profile</button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {pagination.pages > 1 && (
                            <div className="pagination">
                                <button
                                    className="pagination-btn"
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                    disabled={pagination.page === 1}
                                >
                                    Previous
                                </button>
                                <div className="pagination-numbers">
                                    {[...Array(pagination.pages).keys()].map(num => (
                                        <button
                                            key={num + 1}
                                            className={`pagination-number ${pagination.page === num + 1 ? 'active' : ''}`}
                                            onClick={() => handlePageChange(num + 1)}
                                        >
                                            {num + 1}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    className="pagination-btn"
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                    disabled={pagination.page === pagination.pages}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default Teams;
