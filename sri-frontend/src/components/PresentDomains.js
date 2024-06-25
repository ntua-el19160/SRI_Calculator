import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Container, Header, Grid, Segment } from "semantic-ui-react";
import 'semantic-ui-css/semantic.min.css';

const domains = [
  "Heating", "Domestic hot water", "Cooling", "Ventilation", "Lighting",
  "Electricity", "Dynamic building envelope", "Electric vehicle charging", "Monitoring and control"
];

const PresentDomains = () => {
  const [selectedDomains, setSelectedDomains] = useState({});
  const navigate = useNavigate();

  const handleToggle = (domain) => {
    setSelectedDomains((prevSelectedDomains) => ({
      ...prevSelectedDomains,
      [domain]: !prevSelectedDomains[domain],
    }));
  };

  const handleSubmit = () => {
    navigate('/services_applications');
};

  return (
    <Container textAlign="center">
      <Header as="h2">Present Domains</Header>
      <Grid centered columns={1}>
        {domains.map((domain) => (
          <Grid.Row key={domain}>
            <Grid.Column>
              <Segment style={{ border: "1px solid black" }}>
                <Grid>
                  <Grid.Row>
                    <Grid.Column width={8} textAlign="right">
                      {domain}
                    </Grid.Column>
                    <Grid.Column width={8} textAlign="left">
                      <Button
                        toggle
                        active={!!selectedDomains[domain]}
                        onClick={() => handleToggle(domain)}
                        color={selectedDomains[domain] ? "green" : "red"}
                      >
                        {selectedDomains[domain] ? "Yes" : "No"}
                      </Button>
                    </Grid.Column>
                  </Grid.Row>
                </Grid>
              </Segment>
            </Grid.Column>
          </Grid.Row>
        ))}
        <Grid.Row>
          <Grid.Column>
            <Button onClick={handleSubmit} primary>Show Services</Button>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </Container>
  );
};

export default PresentDomains;

