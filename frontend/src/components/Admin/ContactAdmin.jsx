// frontend/src/components/Admin/ContactAdmin.jsx
import React, { useState, useEffect } from 'react';
import { getContactMessages, updateContactStatus, getContactStats } from '../../service/contactService';
import './ContactAdmin.css';

const ContactAdmin = () => {
    const [messages, setMessages] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [updating, setUpdating] = useState({});

    // Fetch contact messages
    const fetchMessages = async (page = 1) => {
        try {
            setLoading(true);
            const params = {
                page,
                limit: 10,
                status: filter !== 'all' ? filter : undefined,
                search: search.trim() || undefined
            };
            
            const response = await getContactMessages(params);
            setMessages(response.data);
            setPagination(response.pagination);
            setCurrentPage(page);
        } catch (error) {
            console.error('Failed to fetch messages:', error.message);
        } finally {
            setLoading(false);
        }
    };

    // Fetch statistics
    const fetchStats = async () => {
        try {
            const response = await getContactStats();
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch stats:', error.message);
        }
    };

    // Update message status
    const handleStatusUpdate = async (id, newStatus) => {
        try {
            setUpdating(prev => ({ ...prev, [id]: true }));
            await updateContactStatus(id, newStatus);
            
            // Update local state
            setMessages(prev => 
                prev.map(msg => 
                    msg._id === id 
                        ? { ...msg, status: newStatus }
                        : msg
                )
            );
            
            // Refresh stats
            fetchStats();
        } catch (error) {
            console.error('Failed to update status:', error.message);
        } finally {
            setUpdating(prev => ({ ...prev, [id]: false }));
        }
    };

    // Handle search
    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchMessages(1);
    };

    useEffect(() => {
        fetchMessages();
        fetchStats();
    }, [filter]);

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'new': return 'badge-new';
            case 'in-progress': return 'badge-progress';
            case 'resolved': return 'badge-resolved';
            default: return 'badge-new';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading && messages.length === 0) {
        return (
            <div className="contact-admin-loading">
                <div className="loading-spinner"></div>
                <p>Loading contact messages...</p>
            </div>
        );
    }

    return (
        <div className="contact-admin-container">
            <div className="admin-header">
                <h1>Contact Messages</h1>
                <div className="stats-row">
                    <div className="stat-card">
                        <h3>{stats.total || 0}</h3>
                        <p>Total Messages</p>
                    </div>
                    <div className="stat-card">
                        <h3>{stats.today || 0}</h3>
                        <p>Today</p>
                    </div>
                    <div className="stat-card">
                        <h3>{stats.byStatus?.new || 0}</h3>
                        <p>New</p>
                    </div>
                    <div className="stat-card">
                        <h3>{stats.byStatus?.['in-progress'] || 0}</h3>
                        <p>In Progress</p>
                    </div>
                    <div className="stat-card">
                        <h3>{stats.byStatus?.resolved || 0}</h3>
                        <p>Resolved</p>
                    </div>
                </div>
            </div>

            <div className="admin-controls">
                <form onSubmit={handleSearch} className="search-form">
                    <input
                        type="text"
                        placeholder="Search by name, email, or message..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="search-input"
                    />
                    <button type="submit" className="search-btn">Search</button>
                </form>

                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="filter-select"
                >
                    <option value="all">All Messages</option>
                    <option value="new">New</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                </select>
            </div>

            <div className="messages-container">
                {messages.length === 0 ? (
                    <div className="no-messages">
                        <p>No contact messages found.</p>
                    </div>
                ) : (
                    messages.map((message) => (
                        <div key={message._id} className="message-card">
                            <div className="message-header">
                                <div className="message-info">
                                    <h3>{message.name}</h3>
                                    <a href={`mailto:${message.email}`}>{message.email}</a>
                                    <span className="message-date">
                                        {formatDate(message.createdAt)}
                                    </span>
                                </div>
                                <div className="message-status">
                                    <span className={`status-badge ${getStatusBadgeClass(message.status)}`}>
                                        {message.status.replace('-', ' ')}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="message-content">
                                <p>{message.message}</p>
                            </div>

                            <div className="message-actions">
                                <div className="status-buttons">
                                    {['new', 'in-progress', 'resolved'].map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => handleStatusUpdate(message._id, status)}
                                            disabled={
                                                message.status === status || 
                                                updating[message._id]
                                            }
                                            className={`status-btn ${
                                                message.status === status ? 'active' : ''
                                            }`}
                                        >
                                            {updating[message._id] && message.status === status
                                                ? '...'
                                                : status.replace('-', ' ')
                                            }
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {pagination.pages > 1 && (
                <div className="pagination">
                    <button
                        onClick={() => fetchMessages(currentPage - 1)}
                        disabled={!pagination.hasPrev}
                        className="page-btn"
                    >
                        Previous
                    </button>
                    
                    <span className="page-info">
                        Page {pagination.page} of {pagination.pages}
                    </span>
                    
                    <button
                        onClick={() => fetchMessages(currentPage + 1)}
                        disabled={!pagination.hasNext}
                        className="page-btn"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default ContactAdmin;