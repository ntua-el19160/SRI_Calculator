# SRI_Calculator
An online Calculator for the SRI metric of a building.
Home page is running in localhost:3000 and backend with FASTApi is running in localhost:8000.

Frameworks and Languages Used:
    Backend: FASTApi(Python)
    Frontend: ReactJS(Javascript)
    Database: Postgres

To run the application first copy the https://github.com/ntua-el19160/SRI_Calculator.git and run in bash the command:

    **git clone https://github.com/ntua-el19160/SRI_Calculator.git**

Then all the files will be saved into the preferred path. 

Next, open a terminal in the C:\path\to\file\ where the files are saved and run the command:

    **uvicorn main:app --reload**

In this way the backend and all the endpoints are running in localhost:8000

Then open a new terminal (let the FASTApi running) and run the commands:

**    cd sri-frontend
    npm start**
    
The frontend will be running in localhost:3000.

To check the app open a new tab in the preferred browser and go to http://localhost:3000/. This will lead to Home page.