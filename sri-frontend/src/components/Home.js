import React from 'react';
import { Button, Container } from 'semantic-ui-react';
import { useNavigate } from 'react-router-dom';
import './styling/Home.css'; // Import the CSS file

const Home = () => {
    const navigate = useNavigate();

    return (
        <div className="home-container">
            <div className="header">
                <img src={require('./assets/logo_sri.png')} alt="SRI Logo" className="logo" />
                <div className="title-container">
                    <h1 className="main-title">SRI TOOLKIT</h1>
                    <p className="subtitle">Co-creating Tools and Services for Smart Readiness Indicator</p>
                </div>
            </div>
            <Container className="main-content" textAlign="center">
                <h1 className="welcome-title">Welcome to SRI Toolkit</h1>
                <p className="welcome-subtitle">Log in for Residents and Assessors</p>
                <Button className="login-button" onClick={() => navigate('/login')}>Log In</Button>
                <Button className="signup-button" onClick={() => navigate('/signup')}>Sign Up</Button>
            </Container>
        </div>
    );
};

export default Home;

