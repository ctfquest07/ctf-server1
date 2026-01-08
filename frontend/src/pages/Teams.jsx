import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Teams.css';

function Teams() {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [pagination, setPagination] = useState({
        page: 1,
        pages: 1,
        total: 0
    });
    const navigate = useNavigate();

    const fetchTeams = async (page = 1, q = '') => {
        try {
            setLoading(true);
            const res = await axios.get(`/api/teams?page=${page}&limit=20&q=${q}`);
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
        fetchTeams(1, searchQuery);
    }, [searchQuery]);

    const handleSearch = (e) => {
        e.preventDefault();
        setSearchQuery(searchTerm);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.pages) {
            fetchTeams(newPage, searchQuery);
        }
    };

    return (
        <div className="teams-page-container">
            <div className="teams-header">
                <h1 className="minimal-title">Teams</h1>
            </div>

            <div className="teams-main">
                <div className="search-container">
                    <form className="search-form" onSubmit={handleSearch}>
                        <div className="search-group">
                            <select className="search-select">
                                <option>Name</option>
                            </select>
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search for matching teams"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <button type="submit" className="search-btn">
                                <i className="fas fa-search"></i>
                            </button>
                        </div>
                    </form>
                </div>

                <hr className="minimal-divider" />

                {loading ? (
                    <div className="loading">Loading...</div>
                ) : error ? (
                    <div className="error">{error}</div>
                ) : teams.length === 0 ? (
                    <div className="no-teams">No teams found.</div>
                ) : (
                    <>
                        <div className="table-responsive">
                            <table className="minimal-table">
                                <thead>
                                    <tr>
                                        <th className="team-col">Team</th>
                                        <th className="website-col">Website</th>
                                        <th className="affiliation-col">Affiliation</th>
                                        <th className="country-col">Country</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {teams.map((team) => (
                                        <tr
                                            key={team._id}
                                            className="clickable-row"
                                            onClick={() => navigate(`/team/${team._id}`)}
                                        >
                                            <td className="team-col">
                                                <span className="team-link">{team.name}</span>
                                            </td>
                                            <td className="website-col">
                                                {team.website ? (
                                                    <a href={team.website} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                                        <i className="fas fa-external-link-alt"></i>
                                                    </a>
                                                ) : '-'}
                                            </td>
                                            <td className="affiliation-col">{team.affiliation || '-'}</td>
                                            <td className="country-col">{team.country || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
