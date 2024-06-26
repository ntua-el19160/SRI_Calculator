import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import Signup from './components/Signup';
import BuildingForm from './components/BuildingForm';
import PresentDomains from './components/PresentDomains';
import ServicesApplications from './components/ServicesApplications';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/add_building" element={<BuildingForm />} />
                <Route path="/present_domains" element={<PresentDomains />} />
                <Route path="/services_applications" element={<ServicesApplications />} />
            </Routes>
        </Router>
    );
}

export default App;
