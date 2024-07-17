import React, { useEffect, useState } from 'react';
import { Header, Card, Table, Container } from 'semantic-ui-react';

const SRIScore = () => {
    const [sriData, setSriData] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [currentBuilding, setCurrentBuilding] = useState(null);

    useEffect(() => {
        const storedSriData = localStorage.getItem('sriData');
        const storedCurrentUser = localStorage.getItem('currentUser');
        const storedCurrentBuilding = localStorage.getItem('currentBuilding');

        if (storedSriData) {
            setSriData(JSON.parse(storedSriData));
        }
        if (storedCurrentUser) {
            setCurrentUser(JSON.parse(storedCurrentUser));
        }
        if (storedCurrentBuilding) {
            setCurrentBuilding(JSON.parse(storedCurrentBuilding));
        }
    }, []);

    console.log('Received SRI Data:', sriData);
    console.log('Received User Data:', currentUser);
    console.log('Received Building Data:', currentBuilding);

    if (!sriData) {
        return <p>No SRI data available.</p>;
    }

    const { 
        smart_readiness_scores, 
        sr_impact_criteria, 
        srf_scores, 
        total_sri 
    } = sriData;
    const impactCriteria = [
        "Comfort", "Convenience", "Energy efficiency", "Energy, flexibility and storage", "Health, wellbeing and accessibility",
        "Information to occupants", "Maintenance and fault prediction"
    ];

    const domains = [ "Cooling", "Dynamic building envelope", "Domestic hot water", "Electricity", "Electric vehicle charging",
    "Heating", "Lighting", "Monitoring and control", "Ventilation"];

    const getScore = (domain, impactCriterion) => {
        return smart_readiness_scores[`${domain}-${impactCriterion}`] || 0;
    };

    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <Header as='h2' textAlign='center'>SRI Score</Header>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                <Card>
                    <Card.Content>
                        <Card.Header>User Information</Card.Header>
                        <Card.Meta>Username: {currentUser.username}</Card.Meta>
                        <Card.Meta>Email: {currentUser.email}</Card.Meta>
                    </Card.Content>
                </Card>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                    Total SRI Score: {total_sri}%
                </div>
                <Card>
                    <Card.Content>
                        <Card.Header>Building Information</Card.Header>
                        <Card.Meta>Building Name: {currentBuilding.building_name}</Card.Meta>
                        <Card.Meta>Building Type: {currentBuilding.building_type}</Card.Meta>
                        <Card.Meta>Zone: {currentBuilding.zone}</Card.Meta>
                    </Card.Content>
                </Card>
            </div>
            <Header as='h3' style={{ marginTop: '40px' }}>Detailed Scores</Header>
            <Table celled>
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell>Impact Criteria \ Domains</Table.HeaderCell>
                        {impactCriteria.map(ic => (
                            <Table.HeaderCell key={ic}>{ic}</Table.HeaderCell>
                        ))}
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {domains.map(domain => (
                        <Table.Row key={domain}>
                            <Table.Cell>{domain}</Table.Cell>
                            {impactCriteria.map(ic => (
                                <Table.Cell key={`${domain}-${ic}`}>{getScore(domain, ic)}%</Table.Cell>
                            ))}
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table>
            <Container style={{ display: 'flex', justifyContent: 'space-around', marginTop: '20px' }}>
                <div style={{ border: '1px solid black', padding: '10px' }}>
                    <Header as='h4'>Impact Criteria Scores</Header>
                    {Object.entries(sr_impact_criteria).map(([key, value]) => (
                        <p key={key}>{key}: {value}%</p>
                    ))}
                </div>
                <div style={{ border: '1px solid black', padding: '10px' }}>
                    <Header as='h4'>Key Functionality Scores</Header>
                    {Object.entries(srf_scores).map(([key, value]) => (
                        <p key={key}>{key}: {value}%</p>
                    ))}
                </div>
            </Container>
        </div>
    );
};

export default SRIScore;

