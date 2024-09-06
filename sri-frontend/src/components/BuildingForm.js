import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button, Form, Container } from "semantic-ui-react";
import { Icon } from "semantic-ui-react";

import './styling/Mybuilding.css'; // Import the CSS file

const BuildingForm = () => {
  const [userInfo, setUserInfo] = useState({});
  const [showUserInfo, setShowUserInfo] = useState(false); // State to control user info popup
  
  const [formData, setFormData] = useState({
    building_name: "",
    building_type: "",
    zone: "",
    country: "",
    city: "",
    year: "",
  });
  const navigate = useNavigate();

  const [countries, setCountries] = useState([]);

  

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

    const fetchEuropeanCountries = async () => {
      try {
        const response = await axios.get("https://restcountries.com/v3.1/region/europe");
        const countryNames = response.data.map(country => country.name.common);
        setCountries(countryNames);
      } catch (error) {
        console.error("Error fetching countries", error);
      }
    };

    fetchEuropeanCountries();
    fetchUserInfo();
  }, []);



  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post("http://localhost:8000/add_building/", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      localStorage.setItem('currentBuilding', JSON.stringify(response.data));
      navigate("/present_domains");
    } catch (error) {
      console.error("Error submitting form", error);
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
          <h1 className="building-welcome-title">Add a new Building</h1>
          <div className="building-divider"></div>
          <Container className="building-form-container">
            <h2 className="building-form-title" textAlign="center">Building Information</h2>
            <Form className="building-form" onSubmit={handleSubmit}>
            <Form.Field>
                <label>Building Name</label>
                <input
                  type="text"
                  name="building_name"
                  value={formData.building_name}
                  onChange={handleChange}
                />
              </Form.Field>
              <Form.Field>
                <label>Building Type</label>
                <select name="building_type" value={formData.building_type} onChange={handleChange}>
                  <option value="">Select Building Type</option>
                  <option value="Residential">Residential</option>
                  <option value="Non-Residential">Non-Residential</option>
                </select>
              </Form.Field>
              <Form.Field>
                <label>Zone</label>
                <select name="zone" value={formData.zone} onChange={handleChange}>
                  <option value="">Select Zone</option>
                  <option value="North Europe">North Europe</option>
                  <option value="South Europe">South Europe</option>
                  <option value="West Europe">West Europe</option>
                  <option value="South-East Europe">South-East Europe</option>
                  <option value="North-East Europe">North-East Europe</option>
                </select>
              </Form.Field>
              <Form.Field>
                <label>Country</label>
                <select name="country" value={formData.country} onChange={handleChange}>
                  <option value="">Select Country</option>
                  {countries.map((country, index) => (
                    <option key={index} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </Form.Field>
              <Form.Field>
                <label>City</label>
                <input type="text" name="city" value={formData.city} onChange={handleChange} />
              </Form.Field>
              <Form.Field>
                <label>Building Year</label>
                <select  name="year" value={formData.year} onChange={handleChange}>
                <option value="">Select Year</option>
                  <option value="< 1960">`{'<'}` 1960</option>
                  <option value="1960 - 1990">1960 - 1990</option>
                  <option value="1990 - 2010">1990 - 2010</option>
                  <option value="> 2010">`{'>'}` 2010</option>
                  <option value="Not yet constructed">Not yet constructed</option>
                </select>

              </Form.Field>
              <Button className="building-view-sri-button" type="submit" primary>Confirm</Button>
            </Form>
          </Container>
        </div>
      </div>
    </div>
  );
};

export default BuildingForm;
