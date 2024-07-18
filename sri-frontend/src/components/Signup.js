import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button, Form, Container, Message } from 'semantic-ui-react';
import './styling/Login.css'; // Import the same CSS file

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
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
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:8000/signup/', formData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      localStorage.setItem('token', response.data.access_token);
      navigate('/login');
    } catch (error) {
      if (error.response) {
        setError(error.response.data.detail || 'An error occurred during signup');
      } else {
        setError('Error signing up');
      }
    } finally {
      setLoading(false);
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
        <h1  className="login-title">Sign Up</h1>
        <Form onSubmit={handleSubmit} loading={loading} error={!!error} className="login-form">
          <Form.Field>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Username"
              className="login-input-field"
              required
            />
          </Form.Field>
          <Form.Field>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              className="login-input-field"
              required
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
              required
            />
          </Form.Field>
          {error && (
            <Message
              error
              header="Signup Failed"
              content={error}
            />
          )}
          <div className="login-signup-link">
            <span>If you already have an account : </span>
            <Button 
              type="button" 
              className="login-signup-button" 
              onClick={() => navigate('/login')}
            >
              Log In
            </Button>
          </div>
          <Button type="submit" className="login-login-button" disabled={loading}>
            Sign Up
          </Button>
        </Form>
      </Container>
    </div>
  );
};

export default Signup;


// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import { Button, Form, Container, Header, Message } from 'semantic-ui-react';

// const Signup = () => {
//   const [formData, setFormData] = useState({
//     username: '',
//     email: '',
//     password: '',
//   });
//   const [error, setError] = useState(null);

//   const navigate = useNavigate();

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prevData) => ({
//       ...prevData,
//       [name]: value,
//     }));
//   };


//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     //const error = validateForm();
//     if (error) {
//       setError(error);
//       return;
//     }
//     setError(null);
//     console.log('Sending data:', formData); // Log form data
//     try {
//       const response = await axios.post('http://localhost:8000/signup/', formData);
//       console.log('Response:', response.data); // Log server response
//       localStorage.setItem('token', response.data.access_token);
//       navigate('/login');
//     } catch (error) {
//       if (error.response) {
//         console.error('Server responded with:', error.response.data); // Log server error response
//         alert(`Error: ${error.response.data.detail}`);
//       } else {
//         console.error('Error signing up', error); // Log other errors
//         alert("Error signing up");
//       }
//     }
//   };

//   return (
//     <Container>
//       <Header as="h2" textAlign="center">Sign Up</Header>
//       {error && <Message error>{error}</Message>}
//       <Form onSubmit={handleSubmit}>
//         <Form.Field>
//           <label>Username</label>
//           <input type="text" name="username" value={formData.username} onChange={handleChange} />
//         </Form.Field>
//         <Form.Field>
//           <label>Email</label>
//           <input type="email" name="email" value={formData.email} onChange={handleChange} />
//         </Form.Field>
//         <Form.Field>
//           <label>Password</label>
//           <input type="password" name="password" value={formData.password} onChange={handleChange} />
//         </Form.Field>
//         <Button type="submit" primary>Sign Up</Button>
//       </Form>
//     </Container>
//   );
// };

// export default Signup;
