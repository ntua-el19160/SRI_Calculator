import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button, Form, Container, Header, Message } from 'semantic-ui-react';

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    //const error = validateForm();
    if (error) {
      setError(error);
      return;
    }
    setError(null);
    console.log('Sending data:', formData); // Log form data
    try {
      const response = await axios.post('http://localhost:8000/signup/', formData);
      console.log('Response:', response.data); // Log server response
      localStorage.setItem('token', response.data.access_token);
      navigate('/login');
    } catch (error) {
      if (error.response) {
        console.error('Server responded with:', error.response.data); // Log server error response
        alert(`Error: ${error.response.data.detail}`);
      } else {
        console.error('Error signing up', error); // Log other errors
        alert("Error signing up");
      }
    }
  };

  return (
    <Container>
      <Header as="h2" textAlign="center">Sign Up</Header>
      {error && <Message error>{error}</Message>}
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
