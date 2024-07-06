import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const [user, setUser] = useState(null);
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

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h1>SRI Calculator</h1>
            <div style={{ textAlign: 'right' }}>
                <h2>{user.username}</h2>
                <p>{user.email}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
                <button onClick={() => navigate('/my-buildings')}>My Buildings</button>
                <button onClick={() => navigate('/add_building')}>New Building</button>
            </div>
        </div>
    );
};

export default Profile;