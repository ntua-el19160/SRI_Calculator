import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Menu, Button, Checkbox, Form, Header } from 'semantic-ui-react';

const ServicesApplications = () => {
    const [currentUser, setCurrentUser] = useState(null);
    const [currentBuilding, setCurrentBuilding] = useState(null);
    const [activeDomain, setActiveDomain] = useState('');
    const [services, setServices] = useState([]);
    const [domainSelections, setDomainSelections] = useState({});
    const [servicesByDomain, setServicesByDomain] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCurrentUser = async () => {
            const token = localStorage.getItem("token");
            try {
              const response = await axios.get("http://localhost:8000/profile/", {
                headers: { Authorization: `Bearer ${token}` },
              });
              setCurrentUser(response.data);
            } catch (error) {
              console.error("Error fetching current user", error);
            }
        };

        const fetchCurrentBuilding = () => {
            const building = JSON.parse(localStorage.getItem("currentBuilding"));
            if (building) {
              setCurrentBuilding(building);
              setActiveDomain(building.domains[0] || '');
            }
        };

        fetchCurrentUser();
        fetchCurrentBuilding();
    }, []);

    useEffect(() => {
        const fetchServices = async (domain) => {
            try {
                const response = await axios.get(`http://localhost:8000/services/${domain}`);
                const serviceData = response.data;

                const filteredServiceData = serviceData.filter(service => !/User defined smart ready service \(\d+\)/.test(service.service_desc));
                setServices(filteredServiceData);

                setServicesByDomain(prev => ({
                    ...prev,
                    [domain]: filteredServiceData
                }));

                setDomainSelections(prev => {
                    const currentDomainSelections = prev[domain] || {};
                    filteredServiceData.forEach(service => {
                        if (!currentDomainSelections[service.service_desc]) {
                            currentDomainSelections[service.service_desc] = { active: false, levels: [], level: null };
                        }
                    });
                    return {
                        ...prev,
                        [domain]: currentDomainSelections
                    };
                });
            } catch (error) {
                console.error('Failed to fetch services', error);
            }
        };
        
        if (activeDomain) {
            fetchServices(activeDomain);
        }
    }, [activeDomain]);

    const handleServiceToggle = async (service) => {
        setDomainSelections(prev => {
            const currentDomainSelections = prev[activeDomain] || {};
            const currentServiceSelection = currentDomainSelections[service.service_desc] || { active: false, levels: [], level: null };
            const updatedServiceSelection = {
                ...currentServiceSelection,
                active: !currentServiceSelection.active
            };

            if (!currentServiceSelection.levels.length && !currentServiceSelection.active) {
                axios.get(`http://localhost:8000/levels/${service.code}`)
                    .then(response => {
                        const levelData = response.data.map(level => ({
                            desc: level.level_desc + ": " + level.description,
                            intLevel: level.level
                        }));
                        setDomainSelections(prev => {
                            const updatedSelections = { ...prev };
                            updatedSelections[activeDomain][service.service_desc].levels = levelData;
                            return updatedSelections;
                        });
                    })
                    .catch(error => console.error('Failed to fetch levels', error));
            }

            return {
                ...prev,
                [activeDomain]: {
                    ...currentDomainSelections,
                    [service.service_desc]: updatedServiceSelection
                }
            };
        });
    };

    const handleLevelChange = (service, level) => {
        setDomainSelections(prev => {
            const currentDomainSelections = prev[activeDomain] || {};
            return {
                ...prev,
                [activeDomain]: {
                    ...currentDomainSelections,
                    [service.service_desc]: {
                        ...currentDomainSelections[service.service_desc],
                        level
                    }
                }
            };
        });
    };

    const handleSubmit = () => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.error("No token found. Please log in.");
            return;
        }

        const sriInput = {
            building_type: currentBuilding.building_type,
            zone: currentBuilding.zone,
            lev: {}
        };

        for (const domain in domainSelections) {
            for (const serviceDesc in domainSelections[domain]) {
                const selection = domainSelections[domain][serviceDesc];
                if (selection.active && selection.level) {
                    const service = Object.values(servicesByDomain).flat().find(s => s.service_desc === serviceDesc);
                    if (service) {
                        sriInput.lev[service.code] = selection.level.intLevel;
                    }
                }
            }
        }

        axios.post(`http://localhost:8000/calculate-sri/${currentBuilding.id}/`, sriInput, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(response => {
            localStorage.setItem('sriData', JSON.stringify(response.data));
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            localStorage.setItem('currentBuilding', JSON.stringify(currentBuilding));
            navigate(`/sri_score/${currentBuilding.id}`);
        })
        .catch(error => {
            console.error('Failed to calculate SRI', error);
        });
    };

    if (!currentBuilding) {
        return <div>Loading...</div>;
    }

    return (
        <div style={{ padding: '20px' }}>
            <Header as='h2'>Services & Applications</Header>
            {currentUser && currentBuilding && (
                <div>
                    <p>Current User: {currentUser.username}</p>
                    <p>Current Building: {currentBuilding.building_name}</p>
                </div>
            )}
            <Menu vertical>
                {currentBuilding.domains.map(domain => (
                    <Menu.Item
                        key={domain}
                        name={domain}
                        active={activeDomain === domain}
                        onClick={() => setActiveDomain(domain)}
                    >
                        {domain}
                    </Menu.Item>
                ))}
            </Menu>
            <div style={{ marginTop: '20px' }}>
                {services.map(service => (
                    <div key={service.code} style={{ border: '1px solid black', marginBottom: '10px', padding: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{service.service_desc}</span>
                            <Checkbox
                                toggle
                                checked={domainSelections[activeDomain]?.[service.service_desc]?.active || false}
                                onChange={() => handleServiceToggle(service)}
                            />
                        </div>
                        {domainSelections[activeDomain]?.[service.service_desc]?.active && (
                            <Form>
                                {domainSelections[activeDomain]?.[service.service_desc]?.levels.map(level => (
                                    <Form.Field key={level.intLevel}>
                                        <Checkbox
                                            radio
                                            label={level.desc}
                                            checked={domainSelections[activeDomain]?.[service.service_desc]?.level?.intLevel === level.intLevel}
                                            onChange={() => handleLevelChange(service, level)}
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
}  

export default ServicesApplications;


// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { useNavigate } from 'react-router-dom';
// import { Menu, Button, Checkbox, Form, Header } from 'semantic-ui-react';

// const ServicesApplications = () => {
//     const [currentUser, setCurrentUser] = useState(null);
//     const [currentBuilding, setCurrentBuilding] = useState(null);

//     const [activeDomain, setActiveDomain] = useState('Heating');
//     const [domains] = useState([
//         'Heating', 'Domestic hot water', 'Cooling', 'Ventilation', 'Lighting',
//         'Dynamic building envelope', 'Electricity', 'Electric vehicle charging', 'Monitoring and control'
//     ]);
//     const [services, setServices] = useState([]);
//     const [domainSelections, setDomainSelections] = useState({});
//     const [servicesByDomain, setServicesByDomain] = useState({});
//     const navigate = useNavigate();

//     useEffect(() => {

//         const fetchCurrentUser = async () => {
//             const token = localStorage.getItem("token");
//             try {
//               const response = await axios.get("http://localhost:8000/profile/", {
//                 headers: { Authorization: `Bearer ${token}` },
//               });
//               setCurrentUser(response.data);
//             } catch (error) {
//               console.error("Error fetching current user", error);
//             }
//         };

//         const fetchCurrentBuilding = () => {
//             const building = JSON.parse(localStorage.getItem("currentBuilding"));
//             if (building) {
//               setCurrentBuilding(building);
//             }
//         };
      
//         const fetchServices = async () => {
//             try {
//                 const response = await axios.get(`http://localhost:8000/services/${activeDomain}`);
//                 const serviceData = response.data;
        
//                 // Filter out services with descriptions like 'User defined smart ready service (Number)'
//                 const filteredServiceData = serviceData.filter(service => !/User defined smart ready service \(\d+\)/.test(service.service_desc));
        
//                 setServices(filteredServiceData);
        
//                 // Update servicesByDomain state
//                 setServicesByDomain(prev => ({
//                     ...prev,
//                     [activeDomain]: filteredServiceData
//                 }));
        
//                 // Initialize selections for the current domain if not already present
//                 setDomainSelections(prev => {
//                     const currentDomainSelections = prev[activeDomain] || {};
//                     filteredServiceData.forEach(service => {
//                         if (!currentDomainSelections[service.service_desc]) {
//                             currentDomainSelections[service.service_desc] = { active: false, levels: [], level: null };
//                         }
//                     });
//                     return {
//                         ...prev,
//                         [activeDomain]: currentDomainSelections
//                     };
//                 });
//             } catch (error) {
//                 console.error('Failed to fetch services', error);
//             }
//         };

//         fetchCurrentUser();
//         fetchCurrentBuilding();

//         fetchServices();
//     }, [activeDomain]);

//     const handleServiceToggle = async (service) => {
//         setDomainSelections(prev => {
//             const currentDomainSelections = prev[activeDomain] || {};
//             const currentServiceSelection = currentDomainSelections[service.service_desc] || { active: false, levels: [], level: null };
//             const updatedServiceSelection = {
//                 ...currentServiceSelection,
//                 active: !currentServiceSelection.active
//             };
    
//             // Fetch levels if the service is being activated and levels are not already fetched
//             if (!currentServiceSelection.levels.length && !currentServiceSelection.active) {
//                 axios.get(`http://localhost:8000/levels/${service.code}`)
//                     .then(response => {
//                         const levelData = response.data.map(level => ({
//                             desc: level.level_desc + ": " + level.description,
//                             intLevel: level.level
//                         }));
//                         setDomainSelections(prev => {
//                             const updatedSelections = { ...prev };
//                             updatedSelections[activeDomain][service.service_desc].levels = levelData;
//                             return updatedSelections;
//                         });
//                     })
//                     .catch(error => console.error('Failed to fetch levels', error));
//             }
    
//             return {
//                 ...prev,
//                 [activeDomain]: {
//                     ...currentDomainSelections,
//                     [service.service_desc]: updatedServiceSelection
//                 }
//             };
//         });
//     };

//     const handleLevelChange = (service, level) => {
//         setDomainSelections(prev => {
//             const currentDomainSelections = prev[activeDomain] || {};
//             return {
//                 ...prev,
//                 [activeDomain]: {
//                     ...currentDomainSelections,
//                     [service.service_desc]: {
//                         ...currentDomainSelections[service.service_desc],
//                         level
//                     }
//                 }
//             };
//         });
//     };

//     const handleSubmit = () => {
//         const token = localStorage.getItem("token");
    
//         if (!token) {
//             console.error("No token found. Please log in.");
//             return;
//         }
    
//         const sriInput = {
//             building_type: currentBuilding.building_type,
//             zone: currentBuilding.zone,
//             lev: {}
//         };
    
//         // Iterate through domainSelections to construct the lev object
//         for (const domain in domainSelections) {
//             for (const serviceDesc in domainSelections[domain]) {
//                 const selection = domainSelections[domain][serviceDesc];
//                 if (selection.active && selection.level) {
//                     // Find the service code corresponding to the service description
//                     const service = Object.values(servicesByDomain).flat().find(s => s.service_desc === serviceDesc);
//                     if (service) {
//                         sriInput.lev[service.code] = selection.level.intLevel; // Use service.code here
//                     }
//                 }
//             }
//         }
    
//         console.log(sriInput);
    
//         axios.post('http://localhost:8000/calculate-sri/', sriInput, {
//             headers: { Authorization: `Bearer ${token}` }
//         })
//         .then(response => {
//             console.log('SRI calculation successful', response.data);
//             localStorage.setItem('sriData', JSON.stringify(response.data)); // Store the SRI data in localStorage
//             localStorage.setItem('currentUser', JSON.stringify(currentUser)); // Store the user data in localStorage
//             localStorage.setItem('currentBuilding', JSON.stringify(currentBuilding)); // Store the building data in localStorage
//             navigate('/sri-score'); // Navigate to the SRI score page with the calculated score
//         })
//         .catch(error => {
//             console.error('Failed to calculate SRI', error);
//         });
//     };

//     return (
//         <div style={{ padding: '20px' }}>
//             <Header as='h2'>Services & Applications</Header>
//             {currentUser && currentBuilding && (
//                 <div>
//                     <p>Current User: {currentUser.username}</p>
//                     <p>Current Building: {currentBuilding.building_name}</p>
//                 </div>
//             )}
//             <Menu vertical>
//                 {domains.map(domain => (
//                     <Menu.Item
//                         key={domain}
//                         name={domain}
//                         active={activeDomain === domain}
//                         onClick={() => setActiveDomain(domain)}
//                     >
//                         {domain}
//                     </Menu.Item>
//                 ))}
//             </Menu>
//             <div style={{ marginTop: '20px' }}>
//                 {services.map(service => (
//                     <div key={service.code} style={{ border: '1px solid black', marginBottom: '10px', padding: '10px' }}>
//                         <div style={{ display: 'flex', justifyContent: 'space-between' }}>
//                             <span>{service.service_desc}</span>
//                             <Checkbox
//                                 toggle
//                                 checked={domainSelections[activeDomain]?.[service.service_desc]?.active || false}
//                                 onChange={() => handleServiceToggle(service)}
//                             />
//                         </div>
//                         {domainSelections[activeDomain]?.[service.service_desc]?.active && (
//                             <Form>
//                                 {domainSelections[activeDomain]?.[service.service_desc]?.levels.map(level => (
//                                     <Form.Field key={level.intLevel}>
//                                         <Checkbox
//                                             radio
//                                             label={level.desc}
//                                             checked={domainSelections[activeDomain]?.[service.service_desc]?.level?.intLevel === level.intLevel}
//                                             onChange={() => handleLevelChange(service, level)}
//                                         />
//                                     </Form.Field>
//                                 ))}
//                             </Form>
//                         )}
//                     </div>
//                 ))}
//             </div>
//             <Button primary onClick={handleSubmit}>Confirm</Button>
//         </div>
//     );
// }  

// export default ServicesApplications;
