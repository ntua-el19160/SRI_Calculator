import React from 'react';
import { Button, Container, Header } from 'semantic-ui-react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();

    return (
        <Container textAlign="center">
            <Header as="h1">SRI Calculator</Header>
            <Button primary onClick={() => navigate('/login')}>Log In (Existing user)</Button>
            <Button secondary onClick={() => navigate('/signup')}>Sign In (New user)</Button>
        </Container>
    );
};

export default Home;
