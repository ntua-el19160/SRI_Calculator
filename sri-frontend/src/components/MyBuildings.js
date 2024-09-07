import React, { useEffect, useState } from "react";
import axios from "axios";
import { Container, Table, Button } from "semantic-ui-react";
import { useNavigate } from "react-router-dom";
import { Icon } from "semantic-ui-react";
import './styling/Mybuilding.css'; // Import the CSS file

const MyBuildings = () => {
  const [buildings, setBuildings] = useState([]);
  const [userInfo, setUserInfo] = useState({});
  const [showUserInfo, setShowUserInfo] = useState(false); // State to control user info popup
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:8000/my_buildings/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setBuildings(response.data);
      } catch (error) {
        console.error("Error fetching buildings", error);
      }
    };

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

    fetchBuildings();
    fetchUserInfo();
  }, []);

  const handleViewScores = (buildingId) => {
    navigate(`/sri_score/${buildingId}`);
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
          <h1 className="building-welcome-title">My Buildings</h1>
          <Container>
            <Table celled className="building-table">
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Building Name</Table.HeaderCell>
                  <Table.HeaderCell>Building Type</Table.HeaderCell>
                  <Table.HeaderCell>Building Usage</Table.HeaderCell>
                  <Table.HeaderCell>Building State</Table.HeaderCell>
                  <Table.HeaderCell>Energy Class</Table.HeaderCell>
                  <Table.HeaderCell>Zone</Table.HeaderCell>
                  <Table.HeaderCell>Country</Table.HeaderCell>
                  <Table.HeaderCell>City</Table.HeaderCell>
                  <Table.HeaderCell>State/Province/Region</Table.HeaderCell>
                  <Table.HeaderCell>Street</Table.HeaderCell>
                  <Table.HeaderCell>Zip Code</Table.HeaderCell>
                  <Table.HeaderCell>Building Year</Table.HeaderCell>
                  <Table.HeaderCell>SRI Score</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {buildings.map((building) => (
                  <Table.Row key={building.id}>
                    <Table.Cell>{building.building_name}</Table.Cell>
                    <Table.Cell>{building.building_type}</Table.Cell>
                    <Table.Cell>{building.building_usage}</Table.Cell>
                    <Table.Cell>{building.building_state}</Table.Cell>
                    <Table.Cell>{building.energy_class}</Table.Cell>
                    <Table.Cell>{building.zone}</Table.Cell>
                    <Table.Cell>{building.country}</Table.Cell>
                    <Table.Cell>{building.city}</Table.Cell>
                    <Table.Cell>{building.region}</Table.Cell>
                    <Table.Cell>{building.street}</Table.Cell>
                    <Table.Cell>{building.zip}</Table.Cell>
                    <Table.Cell>{building.year}</Table.Cell>
                    <Table.Cell>
                      <Button className="view-sri-button" onClick={() => handleViewScores(building.id)}>View SRI Scores</Button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </Container>
        </div>
      </div>
    </div>
  );
};

export default MyBuildings;
