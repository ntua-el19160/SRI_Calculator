import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button, Form, Container } from 'semantic-ui-react';
import './styling/Login.css'; // Import the CSS file

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8000/token', new URLSearchParams({
        'username': formData.username,
        'password': formData.password
      }));
      // After successful login
      localStorage.setItem('token', response.data.access_token);
      navigate('/profile');
    } catch (error) {
      console.error('Error logging in', error);
      alert("Invalid Credentials");
    }
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <img src={require('./assets/logo_sri.png')} alt="SRI Logo" className="logo" />
        <div className="title-container">
          <h1 className="main-title">SRI TOOLKIT</h1>
          <p className="subtitle">Co-creating Tools and Services for Smart Readiness Indicator</p>
        </div>
      </div>
      <Container textAlign="center">
        <h1  className="login-title">Log In</h1>
        <Form onSubmit={handleSubmit} className="login-form">
          <Form.Field>
            <input 
              type="text" 
              name="username" 
              value={formData.username} 
              onChange={handleChange} 
              placeholder="Username" 
              className="login-input-field"
            />
          </Form.Field>
          <Form.Field>
            <input 
              type="password" 
              name="password" 
              value={formData.password} 
              onChange={handleChange} 
              placeholder="Password"
              className="login-input-field"
            />
          </Form.Field>
          <div className="login-signup-link">
            <span>If you are a new user : </span>
            <Button 
              type="button" 
              className="login-signup-button" 
              onClick={() => navigate('/signup')}
            >
              Sign Up
            </Button>
          </div>
          <Button type="submit" className="login-login-button">Log In</Button>
        </Form>
      </Container>
    </div>
  );
};

export default Login;
