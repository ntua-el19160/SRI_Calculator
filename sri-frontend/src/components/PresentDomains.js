import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Container, Grid, Segment } from "semantic-ui-react";
import axios from 'axios';
import { Icon } from "semantic-ui-react";

import './styling/Mybuilding.css'; // Import the CSS file


const domains = [ "Cooling", "Dynamic building envelope", "Domestic hot water", "Electricity", "Electric vehicle charging",
                "Heating", "Lighting", "Monitoring and control", "Ventilation"];

const PresentDomains = () => {
  const [selectedDomains, setSelectedDomains] = useState({});
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({});
  const [showUserInfo, setShowUserInfo] = useState(false); // State to control user info popup
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:8000/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUserInfo(response.data);
      } catch (error) {
        console.error("Error fetching user info", error);
      }
    };
    fetchUserInfo();
  }, []);

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

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const toggleUserInfo = () => {
    setShowUserInfo(!showUserInfo);
  };

  return (
    <div className="building-container">
    {/* Left Side */}
    <div className="building-left">
      <div className="logo-title-container">
        <img src={require('./assets/logo_sri.png')} alt="SRI Logo" className="building-logo" />
        <div className="building-title-container">
          <h1 className="building-main-title">SRI TOOLKIT</h1>
          <p className="building-subtitle">Co-creating Tools and Services for Smart Readiness Indicator</p>
        </div>
      </div>
      <div className="sidebar-buttons">
        <button className="building-button my-account" title="View Profile" onClick={() => navigate('/profile')}>
          <Icon name="user" size="huge" />
        </button>
        <button className="building-button building-my-buildings" title="View your Buildings" onClick={() => navigate('/my_buildings')}>
        <Icon name="building" size="huge" />
        </button>
        <button className="building-button building-add-building" title="Add a new Building" onClick={() => navigate('/add_building')}>
            <Icon name="plus" size="huge" />
        </button>
      </div>
      <div className="building-vertical-line"></div>
    </div>

    {/* Right Side */}
    <div className="building-right">
      <div className="building-user-info">
        <div className="building-username"><span>{userInfo.username}</span></div>
        <button className="building-user-button" onClick={toggleUserInfo}>
          <Icon name="user" color="white" />
        </button>
        {showUserInfo && (
          <div className="building-user-details">
            <p className="building-user-email">{userInfo.email}</p>
            <button className="building-logout-button" onClick={handleLogout}>
              Log out
            </button>
          </div>
        )}
      </div>
      <div className="building-content">
        <h1 className="building-welcome-title">Present Domains</h1> 
        <p className="building-welcome-subtitle">Are the following building systems present in your building? Please check the ones that exist.</p>
          <Container textAlign="center">
            <Grid centered columns={1}>
              {domains.map((domain) => (
                <Grid.Row key={domain}>
                  <Grid.Column>
                    <Segment className="domain-grid">
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
                              className={`domain-button ${selectedDomains[domain] ? "green" : "red"}`}
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
                  <Button className="domain-view-sri-button" onClick={handleSubmit} primary>
                    Show Services
                  </Button>
                </Grid.Column>
              </Grid.Row>
            </Grid>
          </Container>
        </div>
      </div>
    </div>
  );
};

export default PresentDomains;


