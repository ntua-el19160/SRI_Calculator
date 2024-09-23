import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Icon } from 'semantic-ui-react'; // Import Icon from semantic-ui-react

import './styling/Profile.css'; // Import the CSS file
import './styling/Mybuilding.css';

const Profile = () => {
    const [user, setUser] = useState(null);
    const [showUserInfo, setShowUserInfo] = useState(false); // State to control user info popup
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }

                const response = await axios.get('http://localhost:8000/profile/', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                setUser(response.data);
            } catch (error) {
                console.error('Error fetching user data:', error);
                alert('Failed to fetch user data. Please login again.');
                navigate('/login');
            }
        };

        fetchUser();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/'); // Navigate to home page after logout
    };

    const toggleUserInfo = () => {
        setShowUserInfo(!showUserInfo);
    };

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="profile-container">
            {/* Left Side */}
            <div className="profile-left">
                <div className="logo-title-container">
                    <img src={require('./assets/logo_sri.png')} alt="SRI Logo" className="profile-logo" />
                    <div className="profile-title-container">
                        <h1 className="main-title">SRI TOOLKIT</h1>
                        <p className="subtitle">Co-creating Tools and Services for Smart Readiness Indicator</p>
                    </div>  
                </div>
                {/* Add your text here */}
                <div className="vertical-line">
                </div>
                 
            </div>
            
    
            {/* Right Side */}
            <div className="profile-right">
                <div className="profile-user-info">
                    <div className="profile-username"><span>{user.username}</span></div>
                    <button className="profile-user-button" onClick={toggleUserInfo}>
                        <Icon name="user" color="white" />
                    </button>
                    {showUserInfo && (
                        <div className="profile-user-details">
                            <p>{user.email}</p>
                            <button className="profile-logout-button" onClick={handleLogout}>
                                Log out
                            </button>
                        </div>
                    )}
                </div>
                <div className="profile-content">
                    <h1 className="profile-welcome-title">Welcome to SRI Toolkit!</h1>
                    <div className="profile-info-text">
                    <h3>About the SRI Toolkit</h3>
                    <p>This app provides tools and services to help evaluate the smart readiness of buildings in accordance with the Smart Readiness Indicator (SRI) framework. Use the toolkit to manage your buildings, evaluate their performance, and improve energy efficiency.</p>
                    
                </div> 
                    <div className="profile-divider"></div>
                    <div className="profile-buttons">
                        <div className="profile-button-container">
                            <button className="profile-button my-buildings" onClick={() => navigate('/my_buildings')}>
                                <Icon name="building" size="huge" />
                            </button>
                            <span className="profile-button-text green-text">My Buildings</span>
                        </div>
                        <div className="profile-button-container">
                            <button className="profile-button my-account" onClick={() => navigate('/profile')}>
                                <Icon name="user" size="huge" />
                            </button>
                            <span className="profile-button-text orange-text">My Account</span>
                        </div>
                        <div className="profile-button-container">
                            <button className="profile-button add-building" onClick={() => navigate('/add_building')}>
                                <Icon name="plus" size="huge" />
                            </button>
                            <span className="profile-button-text purple-text">Add Building</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default Profile;