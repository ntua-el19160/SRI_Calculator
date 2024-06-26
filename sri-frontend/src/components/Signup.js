import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button, Form, Container, Header } from 'semantic-ui-react';

const Signup = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8000/signup/', formData);
      navigate('/add_building');
    } catch (error) {
      console.error('Error signing up', error);
      alert("Error signing up");
    }
  };

  return (
    <Container>
      <Header as="h2" textAlign="center">Sign Up</Header>
      <Form onSubmit={handleSubmit}>
        <Form.Field>
          <label>Username</label>
          <input type="text" name="username" value={formData.username} onChange={handleChange} />
        </Form.Field>
        <Form.Field>
          <label>Email</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} />
        </Form.Field>
        <Form.Field>
          <label>Password</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} />
        </Form.Field>
        <Button type="submit" primary>Sign Up</Button>
      </Form>
    </Container>
  );
};

export default Signup;

