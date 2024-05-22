import React from "react";
import 'semantic-ui-css/semantic.min.css';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import BuildingForm from "./components/BuildingForm";
import PresentDomains from "./components/PresentDomains";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/present_domains" element={<PresentDomains />} />
        <Route path="/" element={<BuildingForm />} />
      </Routes>
    </Router>
  );
}

export default App;

