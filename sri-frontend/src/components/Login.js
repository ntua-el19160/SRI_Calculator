import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button, Form, Container, Header } from 'semantic-ui-react';

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
      await axios.post('http://localhost:8000/token', new URLSearchParams({
        'username': formData.username,
        'password': formData.password
      }));
      navigate('/add_building');
    } catch (error) {
      console.error('Error logging in', error);
      alert("Invalid Credentials");
    }
  };

  return (
    <Container>
      <Header as="h2" textAlign="center">Log In</Header>
      <Form onSubmit={handleSubmit}>
        <Form.Field>
          <label>Username</label>
          <input type="text" name="username" value={formData.username} onChange={handleChange} />
        </Form.Field>
        <Form.Field>
          <label>Password</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} />
        </Form.Field>
        <Button type="submit" primary>Log In</Button>
      </Form>
    </Container>
  );
};

export default Login;

