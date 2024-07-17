import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Container, Header, Grid, Segment } from "semantic-ui-react";
import axios from 'axios';

const domains = [ "Cooling", "Dynamic building envelope", "Domestic hot water", "Electricity", "Electric vehicle charging",
                "Heating", "Lighting", "Monitoring and control", "Ventilation"];

const PresentDomains = () => {
  const [selectedDomains, setSelectedDomains] = useState({});
  const navigate = useNavigate();

  const handleToggle = (domain) => {
    setSelectedDomains((prevSelectedDomains) => ({
      ...prevSelectedDomains,
      [domain]: !prevSelectedDomains[domain],
    }));
  };

  const handleSubmit = async () => {
    const building = JSON.parse(localStorage.getItem("currentBuilding"));
    if (building && building.id) {
      const selectedDomainsArray = Object.keys(selectedDomains).filter(domain => selectedDomains[domain]);

      try {
        const response = await axios.put(`http://localhost:8000/buildings/${building.id}/domains`, {
          domains: selectedDomainsArray
        });

        // Ensure the response.data includes the ID from building
        const updatedBuilding = { ...response.data, id: building.id };
        
        localStorage.setItem('currentBuilding', JSON.stringify(updatedBuilding));
        navigate('/services_applications');
      } catch (error) {
        console.error('Failed to update building domains', error);
      }
    }
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
      <div style={{ position: "fixed", bottom: 20, right: 20 }}>
        <button onClick={() => navigate("/profile")}>Profile</button>
      </div>
    </Container>
  );
};

export default PresentDomains;


