import React from 'react';
import { useLocation } from 'react-router-dom';
import { Header, Container } from 'semantic-ui-react';

const SRIScore = () => {
    const location = useLocation();
    const { sriScore } = location.state || { sriScore: 'No score calculated' };

    return (
        <Container text style={{ marginTop: '20px' }}>
            <Header as='h2'>Smart Readiness Indicator (SRI) Score</Header>
            <p>Your SRI score is: {sriScore}</p>
        </Container>
    );
};

export default SRIScore;
