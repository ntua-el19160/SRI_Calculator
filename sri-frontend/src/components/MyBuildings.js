import React, { useEffect, useState } from "react";
import axios from "axios";
import { Container, Table, Header, Segment } from "semantic-ui-react";
import { useNavigate } from "react-router-dom";

const MyBuildings = () => {
  const [buildings, setBuildings] = useState([]);
  const [userInfo, setUserInfo] = useState({});
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
        const response = await axios.get("http://localhost:8000/user_info", {
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

  return (
    <Container>
      <Header as="h1" textAlign="center">SRI Calculator</Header>
      <Segment textAlign="right">
        <div>
          <strong>{userInfo.username}</strong>
          <br />
          <span>{userInfo.email}</span>
        </div>
      </Segment>
      <Table celled>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Building Name</Table.HeaderCell>
            <Table.HeaderCell>Building Type</Table.HeaderCell>
            <Table.HeaderCell>Zone</Table.HeaderCell>
            <Table.HeaderCell>Country</Table.HeaderCell>
            <Table.HeaderCell>City</Table.HeaderCell>
            <Table.HeaderCell>Year Built</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {buildings.map((building) => (
            <Table.Row key={building.id}>
              <Table.Cell>{building.building_name}</Table.Cell>
              <Table.Cell>{building.building_type}</Table.Cell>
              <Table.Cell>{building.zone}</Table.Cell>
              <Table.Cell>{building.country}</Table.Cell>
              <Table.Cell>{building.city}</Table.Cell>
              <Table.Cell>{building.year_built}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      <div style={{ position: "fixed", bottom: 20, right: 20 }}>
        <button onClick={() => navigate("/profile")}>Profile</button>
      </div>
    </Container>
  );
};

export default MyBuildings;
