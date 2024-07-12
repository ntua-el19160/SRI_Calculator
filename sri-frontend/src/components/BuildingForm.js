import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button, Form, Container, Header } from "semantic-ui-react";

const BuildingForm = () => {
  const [formData, setFormData] = useState({
    building_type: "",
    zone: "",
    country: "",
    city: "",
    year_built: "",
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post("http://localhost:8000/add_building/", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      navigate("/services_applications");
    } catch (error) {
      console.error("Error submitting form", error);
    }
  };

  return (
    <Container>
      <Header as="h2" textAlign="center">Building Information</Header>
      <Form onSubmit={handleSubmit}>
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
          <input type="text" name="country" value={formData.country} onChange={handleChange} />
        </Form.Field>
        <Form.Field>
          <label>City</label>
          <input type="text" name="city" value={formData.city} onChange={handleChange} />
        </Form.Field>
        <Form.Field>
          <label>Year Built</label>
          <input type="number" name="year_built" value={formData.year_built} onChange={handleChange} />
        </Form.Field>
        <Button type="submit" primary>Submit</Button>
      </Form>
      <div style={{ position: "fixed", bottom: 20, right: 20 }}>
        <button onClick={() => navigate("/profile")}>Profile</button>
      </div>
    </Container>
  );
};

export default BuildingForm;
