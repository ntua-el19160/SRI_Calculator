import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Button, Checkbox, Form, Header } from 'semantic-ui-react';

const ServicesApplications = () => {
    const [activeDomain, setActiveDomain] = useState('Heating');
    const [domainSelections, setDomainSelections] = useState({
        'Heating': {},
        'Domestic hot water': {},
        'Cooling': {},
        'Ventilation': {},
        'Lighting': {},
        'Dynamic building envelope': {},
        'Electricity': {},
        'Electric vehicle charging': {},
        'Monitoring and control': {}
    });

    const navigate = useNavigate();

    const domains = [
        'Heating', 'Domestic hot water', 'Cooling', 'Ventilation', 'Lighting',
        'Dynamic building envelope', 'Electricity', 'Electric vehicle charging', 'Monitoring and control'
    ];

    const services = [
        'Service 1', 'Service 2', 'Service 3', 'Service 4', 'Service 5'
    ];

    const levels = [
        'Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5'
    ];

    const handleDomainClick = (domain) => {
        setActiveDomain(domain);
    };

    const handleServiceToggle = (domain, service) => {
        setDomainSelections((prev) => {
            const updatedDomain = { ...prev[domain] };
            if (updatedDomain[service]) {
                updatedDomain[service] = { ...updatedDomain[service], active: !updatedDomain[service].active };
            } else {
                updatedDomain[service] = { active: true, level: null };
            }
            return { ...prev, [domain]: updatedDomain };
        });
    };

    const handleLevelChange = (domain, service, level) => {
        setDomainSelections((prev) => {
            const updatedService = { ...prev[domain][service], level };
            return {
                ...prev,
                [domain]: {
                    ...prev[domain],
                    [service]: updatedService
                }
            };
        });
    };

    const handleSubmit = () => {
        navigate('/next-page'); // Replace with the actual next page route
    };

    return (
        <div style={{ padding: '20px' }}>
            <Header as='h2'>Services & Applications</Header>
            <Menu vertical>
                {domains.map((domain) => (
                    <Menu.Item
                        key={domain}
                        name={domain}
                        active={activeDomain === domain}
                        onClick={() => handleDomainClick(domain)}
                    >
                        {domain}
                    </Menu.Item>
                ))}
            </Menu>
            <div style={{ marginTop: '20px' }}>
                {services.map((service) => (
                    <div key={service} style={{ border: '1px solid black', marginBottom: '10px', padding: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{service}</span>
                            <Checkbox
                                toggle
                                checked={domainSelections[activeDomain][service]?.active || false}
                                onChange={() => handleServiceToggle(activeDomain, service)}
                            />
                        </div>
                        {domainSelections[activeDomain][service]?.active && (
                            <Form>
                                {levels.map((level) => (
                                    <Form.Field key={level}>
                                        <Checkbox
                                            radio
                                            label={level}
                                            checked={domainSelections[activeDomain][service]?.level === level}
                                            onChange={() => handleLevelChange(activeDomain, service, level)}
                                        />
                                    </Form.Field>
                                ))}
                            </Form>
                        )}
                    </div>
                ))}
            </div>
            <Button primary onClick={handleSubmit}>Confirm</Button>
        </div>
    );
};

export default ServicesApplications;




