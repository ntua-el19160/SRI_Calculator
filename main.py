from fastapi import FastAPI, HTTPException, Depends, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, constr
from typing import Dict, List, Optional
from sqlmodel import Session, select
from sqlalchemy.exc import SQLAlchemyError
from models import get_session, Levels, Domain_W, Impact_W, Services, Building, person, pwd_context, create_db_and_tables, reset_and_load_data
from jose import JWTError, jwt
from datetime import datetime, timedelta
from fastapi.responses import JSONResponse
import logging




# Initialize the FastAPI application
app = FastAPI(debug=True)

# Configure CORS
origins = [
    "http://localhost:3000",  # React frontend
    "http://127.0.0.1:3000",  # Another possible localhost address
]

# Secret key for JWT token
SECRET_KEY = "your_secret_key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str | None = None

create_db_and_tables()


# Define a Pydantic model for the Building input
class BuildingInput(BaseModel):
    building_name: str
    building_type: str
    zone: str
    country: str
    city: str
    year_built: int
    domains: Optional[List[str]] = []  # Make domains optional and default to empty list

    class Config:
        orm_mode = True

class BuildingOutput(BaseModel):
    building_name: str
    building_type: str
    zone: str
    country: str
    city: str
    year_built: int
    domains: List[str]  # Add this line
    owner_id: int
    levels: Dict[str, Dict[int, int]]

    class Config:
        orm_mode = True

class UpdateBuildingDomains(BaseModel):
    domains: List[str]


# Define a Pydantic model for the SRI calculation input
class SRIInput(BaseModel):
    building_type: str
    zone: str
    dom: List[str] #list with the present domains
    lev: Dict[str, Dict[int, int]]  # Dictionary with service.code as key and another dictionary as value


# Define a Pydantic model for the SRI output
class SRIOutput(BaseModel):
    #domain_impact_scores: Dict[str, int]  # Domain-impact criteria scores (not necessary)
    #domain_max_scores: Dict[str, int] #not necessary
    smart_readiness_scores: Dict[str, float]  # The new percentage score, allowing float
    #weighted_impact_sums: Dict[str, float]  # Weighted sums for each impact criterion (not necessary)
    #weighted_max_sums: Dict[str, float]  # Weighted sums for each impact criterion using lmax(d, ic) (not necessary)
    sr_impact_criteria: Dict[str, float]  # New percentage score for each impact criterion
    sr_domains: Dict[str, float]  # Smart Readiness score for each domain
    srf_scores: Dict[str, float] # Percentage for the SRf score for 3 key functionalities
    total_sri: float  # New field for the total SRI score


# Validate data before inserting into the database
def validate_numeric_data(data):
    for key, value in data.items():
        # Check if the value is supposed to be a double precision
        if key.startswith("score_"):
            try:
                float(value)  # Ensure the value can be converted to float
            except ValueError:
                raise ValueError(f"Invalid numeric value for {key}: {value}")
            

def calculate_scores(user_input: SRIInput):
    with get_session() as session:
        domain_impact_scores = {}
        domain_max_scores = {}  # To store Imax(d, ic)
        smart_readiness_scores = {} #to store SR(d, ic) percentage

        #domains = [ "Cooling", "Dynamic building envelope", "Domestic hot water", "Electricity", "Electric vehicle charging", "Heating", "Lighting", "Monitoring and control", "Ventilation"]

        domains = user_input.dom

        impact_criteria = [
            "Energy efficiency", "Energy, flexibility and storage", "Comfort", "Convenience", "Health, wellbeing and accessibility", 
            "Maintenance and fault prediction", "Information to occupants"
        ]

        # Loop over domains and impact criteria
        for domain in domains:
            # Initialize a dictionary to store the maximum scores for each impact criterion
            max_scores = {ic: 0 for ic in impact_criteria}

            # Get all levels in the current domain
            domain_levels = session.query(Levels).filter(Levels.domain == domain).all()

            # Create a dictionary to store the maximum level for each service code
            max_level_for_service = {}

            for level in domain_levels:
                # Determine the maximum level for each service code
                if level.code in user_input.lev:
                    if level.code not in max_level_for_service or max_level_for_service[level.code] < level.level:
                        max_level_for_service[level.code] = level.level
            
            #score_fields = [ "score_cr1", "score_cr2", "score_cr3", "score_cr4", "score_cr5", "score_cr6", "score_cr7"]

            # Calculate the maximum score for each impact criterion
            for ic in impact_criteria:

                if ic == "Energy efficiency":
                    score_field = "score_cr1"
                if ic == "Energy, flexibility and storage":
                    score_field = "score_cr2"
                if ic == "Comfort":
                    score_field = "score_cr3"
                if ic == "Convenience":
                    score_field = "score_cr4"
                if ic == "Health, wellbeing and accessibility":
                    score_field = "score_cr5"
                if ic == "Maintenance and fault prediction":
                    score_field = "score_cr6"
                if ic == "Information to occupants":
                    score_field = "score_cr7"

                for service_code, max_level in max_level_for_service.items():
                    # Find the level instance with the maximum level for this service
                    max_level_instance = session.query(Levels).filter(
                        Levels.code == service_code,
                        Levels.level == max_level
                    ).first()

                    if max_level_instance:
                        score = getattr(max_level_instance, score_field, 0)
                        max_scores[ic] += score

                # Store the calculated Imax(d, ic)
                domain_max_scores[f"{domain}-{ic}"] = max_scores[ic]

            # Now calculate the l(d, ic) score as before
            for ic in impact_criteria:
                total_score = 0

                # Calculate the score based on the user's input
                for level in domain_levels:
                    level_input = user_input.lev.get(level.code)  # Get the user input level
                    if level_input:  # Match the user input with the level


                        # Get the score for the corresponding impact criteria
                        if ic == "Energy efficiency":
                            score_field = "score_cr1"
                        if ic == "Energy, flexibility and storage":
                            score_field = "score_cr2"
                        if ic == "Comfort":
                            score_field = "score_cr3"
                        if ic == "Convenience":
                            score_field = "score_cr4"
                        if ic == "Health, wellbeing and accessibility":
                            score_field = "score_cr5"
                        if ic == "Maintenance and fault prediction":
                            score_field = "score_cr6"
                        if ic == "Information to occupants":
                            score_field = "score_cr7"

                        level_scores = []
                        for user_level, percentage in level_input.items():
                            if level.level == user_level:
                                score = getattr(level, score_field, 0) * (percentage / 100)
                                level_scores.append(score)
                        total_score += sum(level_scores)

                domain_impact_scores[f"{domain}-{ic}"] = total_score
        
        # Calculate SR(d, ic) as (l(d, ic) / lmax(d, ic)) * 100
        for key in domain_impact_scores:
            l_score = domain_impact_scores[key]
            lmax_score = domain_max_scores[key]
            if lmax_score != 0:  # Avoid division by zero
                smart_readiness_score = (l_score / lmax_score) * 100
            else:
                smart_readiness_score = 0  # If lmax_score is zero, SR is 0

            smart_readiness_scores[key] = round(smart_readiness_score, 2)  # Round to two decimal places


    return {
            "domain_impact_scores": domain_impact_scores,
            "domain_max_scores": domain_max_scores,
            "smart_readiness_scores": smart_readiness_scores,
        }


# Function to calculate the weighted sums for each impact criterion
def calculate_weighted_sums(user_input: SRIInput, impact_scores: Dict[str, int]):
    with get_session() as session:
        

        impact_criteria = [
            "Energy efficiency", "Energy, flexibility and storage", "Comfort", "Convenience", "Health, wellbeing and accessibility", 
            "Maintenance and fault prediction", "Information to occupants"
        ]

        # Initialize the weighted sums dictionary
        weighted_sums = {ic: 0 for ic in impact_criteria}

        # Loop through the domain-impact scores and calculate the weighted sums
        for key, score in impact_scores.items():
            try:
                domain, impact_criterion = key.split("-")  # Split the key into domain and impact criterion
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid key structure: '{key}'. Expected format 'Domain-ImpactCriterion'"
                )
            
                # Get the correct weights based on the building type and zone
            domain_weights = session.query(Domain_W).filter(
                Domain_W.building_type == user_input.building_type,
                Domain_W.zone == user_input.zone,
                Domain_W.domain == domain
            ).first()

            if not domain_weights:
                raise HTTPException(status_code=400, detail="No weights found for the given zone and building type")

            # Ensure the impact_criterion is valid
            if impact_criterion not in impact_criteria:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unknown impact criterion: '{impact_criterion}'."
                )

            # Get the correct weight for the given impact criterion
            if impact_criterion == "Energy efficiency":
                    weight_field = "dw_cr1"
            if impact_criterion == "Energy, flexibility and storage":
                    weight_field = "dw_cr2"
            if impact_criterion == "Comfort":
                    weight_field = "dw_cr3"
            if impact_criterion == "Convenience":
                    weight_field = "dw_cr4"
            if impact_criterion == "Health, wellbeing and accessibility":
                    weight_field = "dw_cr5"
            if impact_criterion == "Maintenance and fault prediction":
                    weight_field = "dw_cr6"
            if impact_criterion == "Information to occupants":
                    weight_field = "dw_cr7"
            #weight_index = impact_criteria.index(impact_criterion) + 1  # dw_cr1, dw_cr2, etc.
            weight = getattr(domain_weights, weight_field, 1)
            weighted_sums[impact_criterion] += weight * score

        return weighted_sums


# Adding fixed weights for the impact criteria
impact_weights = {
    "Energy efficiency": 0.5,
    "Energy, flexibility and storage": 1,
    "Comfort": 0.25,
    "Convenience": 0.25,
    "Health, wellbeing and accessibility": 0.25,
    "Maintenance and fault prediction": 0.5,
    "Information to occupants": 0.25
}

# Define the key functionalities and their associated impact criteria
key_functionalities = {
    "Energy Performance and Operation": ["Energy efficiency", "Maintenance and fault prediction"],
    "Response to User Needs": ["Comfort", "Convenience", "Information to occupants", "Health, wellbeing and accessibility"],
    "Energy Flexibility": ["Energy, flexibility and storage"]
}

# Function to calculate weighted domain sums
def calculate_weighted_domain_sums(domain_impact_scores):
    weighted_domain_sums = {}  # Initialize the weighted sums for each domain
    
    # Loop through the domain-impact scores
    for key, score in domain_impact_scores.items():
        domain, impact_criterion = key.split("-")
        
        if domain not in weighted_domain_sums:
            weighted_domain_sums[domain] = 0
        
        # Add weighted score to the domain's total
        weighted_domain_sums[domain] += impact_weights[impact_criterion] * score

    return weighted_domain_sums


# Function to calculate SR for each domain
def calculate_sr_domains(weighted_domain_sums, weighted_max_domain_sums):
    sr_domains = {}  # Initialize SR for each domain
    
    for domain in weighted_domain_sums:
        domain_sum = weighted_domain_sums[domain]
        max_domain_sum = weighted_max_domain_sums.get(domain, 0)
        
        if max_domain_sum != 0:
            sr_domain = (domain_sum / max_domain_sum) * 100  # Calculate SR(d)
        else:
            sr_domain = 0
        
        sr_domains[domain] = round(sr_domain, 2)  # Round to two decimal places

    return sr_domains


# Function to calculate SRf scores for each key functionality
def calculate_srf_scores(sr_impact_criteria):
    srf_scores = {}  # Initialize the SRf scores dictionary
    
    # Calculate the weighted SRf score for each key functionality
    for key_func, impact_criteria in key_functionalities.items():
        srf_score = 0
        
        # Sum the weighted SR(ic) for each impact criterion within the key functionality
        for impact_criterion in impact_criteria:
            if impact_criterion in sr_impact_criteria:  # Corrected key reference
                srf_score += impact_weights[impact_criterion] * sr_impact_criteria[impact_criterion]
        
        # Convert to percentage and round to two decimal places
        srf_scores[key_func] = round(srf_score, 2)

    return srf_scores


# Function to calculate the total SRI score
def calculate_total_sri(srf_scores: Dict[str, float]):
    # Weights for each key functionality
    weight = 1 / 3  # Equal weight for each key functionality
    
    total_sri = 0

    # Sum weighted SRf scores
    for key in srf_scores:
        total_sri += srf_scores[key] * weight
    
    return round(total_sri, 2)  # Round to two decimal places


# Dependency to get the current user
async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    with get_session() as session:
        user = session.query(person).filter(person.username == token_data.username).first()
        if user is None:
            raise credentials_exception
    return user

# Endpoint to add a new building
@app.post("/add_building/")
def add_building(input_data: BuildingInput, request: Request, response: Response, current_user: person = Depends(get_current_user)):
    try:
        with get_session() as session:
            building = Building(
                building_name = input_data.building_name,
                building_type=input_data.building_type,
                zone=input_data.zone,
                country=input_data.country,
                city=input_data.city,
                year_built=input_data.year_built,
                #domains=input_data.domains,  # Add domains to the building creation
                owner_id=current_user.id
            )
            session.add(building)
            session.commit()
            session.refresh(building)  # Ensure the building object is refreshed to get the ID
            response.set_cookie(key="current_building", value=building.building_name)
            return building
            #return {"message": "Building added successfully", "building": building}
    except SQLAlchemyError as e:
            session.rollback()
            logging.error(f"Database error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
            session.rollback()
            logging.error(f"An unexpected error occurred: {str(e)}")
            raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

# Get current building endpoint
@app.get("/current_building/", response_model=BuildingOutput)
def get_current_building(request: Request, current_user: person = Depends(get_current_user)):
    current_building_name = request.cookies.get("current_building")
    if not current_building_name:
        raise HTTPException(status_code=404, detail="No current building set")
    
    with get_session() as session:
        building = session.query(Building).filter(Building.building_name == current_building_name, Building.owner_id == current_user.id).first()
        if not building:
            raise HTTPException(status_code=404, detail="Building not found")
    
    return building


def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def authenticate_user(username: str, password: str, session: Session):
    user = session.query(person).filter(person.username == username).first()
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

# Sign-up endpoint
@app.post("/signup/")
async def sign_up(user: UserCreate):
    with get_session() as session:
        try:
            print(f"Received signup request: {user}")
            hashed_password = get_password_hash(user.password)
            db_user = person(username=user.username, email=user.email, hashed_password=hashed_password)
            session.add(db_user)
            session.commit()
            return {"message": "User created successfully"}
        except SQLAlchemyError as e:
            session.rollback()
            print(f"Database error: {e}")
            raise HTTPException(status_code=400, detail="Username or email already exists")
        except Exception as e:
            session.rollback()
            print(f"Unexpected error: {e}")
            raise HTTPException(status_code=500, detail="An unexpected error occurred")

# Token endpoint
@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    with get_session() as session:
        user = authenticate_user(form_data.username, form_data.password, session)
        if not user:
            raise HTTPException(
                status_code=401,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}


# Example protected route
@app.get("/users/me/")
async def read_users_me(current_user: person = Depends(get_current_user)):
    return current_user

@app.get("/users/{username}")
async def read_user(username: str):
    with get_session() as session:
        user = session.query(person).filter(person.username == username).first()
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")
        return user

@app.get("/profile/", response_model=person)
def read_profile(current_user: person = Depends(get_current_user)):
    return current_user

# Endpoint to retrieve buildings for the logged-in user
@app.get("/my_buildings/")
def get_user_buildings(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    with get_session() as session:
        user = session.query(person).filter(person.username == username).first()
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")

        buildings = session.query(Building).filter(Building.owner_id == user.id).all()
        return buildings

@app.get("/services/{domain_name}")
def get_services(domain_name: str):
    with get_session() as session:
        statement = select(Services).distinct(Services.code, Services.service_desc).where(
            Services.domain == domain_name,
            ~Services.service_desc.like('User defined smart ready service%'))
        results = session.exec(statement).all()
        return JSONResponse(content=[result.dict() for result in results])

@app.get("/levels/{service_code}")
def get_levels(service_code: str):
    with get_session() as session:
        statement = select(Levels).distinct(Levels.level_desc, Levels.description, Levels.code, Levels.level).where(Levels.code == service_code)
        results = session.exec(statement).all()
        return JSONResponse(content=[result.dict() for result in results])


@app.post("/save_sri_levels/")
def save_sri_levels(sri_levels: SRIInput):    
    with get_session() as session:
        # Create the JSON structure
        sri_json = {
            "building_type": sri_levels.building_type,
            "zone": sri_levels.zone,
            "lev": sri_levels.lev
        }
    return JSONResponse(sri_json)
    #return {"message": "SRI levels saved successfully", "sri_json": sri_json}
    

@app.post("/calculate-sri/{building_id}/", response_model=SRIOutput)
def calculate_sri(building_id: int, user_input: SRIInput):

    try:
        validate_numeric_data(user_input.lev)  # Validate numeric fields
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    try:
        # Calculate the domain-impact criteria scores and additional metrics
        calculated_scores = calculate_scores(user_input)
        
        # Ensure returned value is a dictionary
        if not isinstance(calculated_scores, dict):
            raise HTTPException(status_code=500, detail="Unexpected return value from calculate_scores()")

        domain_impact_scores = calculated_scores.get("domain_impact_scores", {})
        domain_max_scores = calculated_scores.get("domain_max_scores", {})
        smart_readiness_scores = calculated_scores.get("smart_readiness_scores", {})

        # Calculate the weighted sums for each impact criterion
        weighted_sums = calculate_weighted_sums(user_input, domain_impact_scores)
        weighted_max_sums = calculate_weighted_sums(user_input, domain_max_scores)
        
        sr_impact_criteria = {}  # New dictionary for SR(ic) percentages

        # Calculate SR(ic) as (weighted_sums[ic] / weighted_max_sums[ic]) * 100
        for ic in weighted_sums:
            weighted_sum = weighted_sums[ic]
            weighted_max_sum = weighted_max_sums[ic]

            if weighted_max_sum != 0:
                sr_percentage = (weighted_sum / weighted_max_sum) * 100
            else:
                sr_percentage = 0  # Default to zero if division by zero risk

            sr_impact_criteria[ic] = round(sr_percentage, 2)  # Round to two decimal places

        # Calculate SRf scores for each key functionality
        srf_scores = calculate_srf_scores(sr_impact_criteria)

        # Calculate the total SRI score
        total_sri = calculate_total_sri(srf_scores)

        # Calculate the weighted sums for each domain
        weighted_domain_sums = calculate_weighted_domain_sums(domain_impact_scores)
        weighted_max_domain_sums = calculate_weighted_domain_sums(domain_max_scores)
        
        # Calculate SR(d) for each domain
        sr_domains = calculate_sr_domains(weighted_domain_sums, weighted_max_domain_sums)


    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

    # Return all expected results
    sri_result = {
        #"domain_impact_scores": domain_impact_scores,
        #"domain_max_scores": domain_max_scores,
        "smart_readiness_scores": smart_readiness_scores,
        #"weighted_impact_sums": weighted_sums,
        #"weighted_max_sums": weighted_max_sums,
        "sr_impact_criteria": sr_impact_criteria,  
        "sr_domains": sr_domains,
        "srf_scores": srf_scores,
        "total_sri": total_sri
    }
    # Save the results to the building
    with get_session() as session:
        building = session.get(Building, building_id)
        if building:
            building.sri_scores = sri_result
            building.total_sri = total_sri
            building.levels = user_input.lev
            session.add(building)
            session.commit()
    
    return sri_result

@app.put("/buildings/{building_id}/domains", response_model=BuildingOutput)
def update_building_domains(building_id: int, response: Response, domains_data: UpdateBuildingDomains):
    with get_session() as session:
        statement = select(Building).where(Building.id == building_id)
        results = session.exec(statement)
        building = results.one_or_none()

        if not building:
            raise HTTPException(status_code=404, detail="Building not found")

        building.domains = domains_data.domains
        session.add(building)
        session.commit()
        session.refresh(building)

    return building

@app.get("/building/{building_id}/sri_scores/", response_model=SRIOutput)
def get_sri_scores(building_id: int):
    with get_session() as session:
        building = session.get(Building, building_id)
        if not building or not building.sri_scores:
            raise HTTPException(status_code=404, detail="SRI scores not found for this building")
        
        return building.sri_scores

   
@app.get("/building/{building_id}/", response_model=BuildingOutput)
def get_curr_building(building_id: int, response: Response):
    with get_session() as session:
        statement = select(Building).where(Building.id == building_id)
        building = session.exec(statement).first()
        if not building:
            raise HTTPException(status_code=404, detail="Building not found")
    print(building)
    return building

def calculate_sri_help(building_id: int, user_input: SRIInput):

    try:
        validate_numeric_data(user_input.lev)  # Validate numeric fields
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    try:
        # Calculate the domain-impact criteria scores and additional metrics
        calculated_scores = calculate_scores(user_input)
        
        # Ensure returned value is a dictionary
        if not isinstance(calculated_scores, dict):
            raise HTTPException(status_code=500, detail="Unexpected return value from calculate_scores()")

        domain_impact_scores = calculated_scores.get("domain_impact_scores", {})
        domain_max_scores = calculated_scores.get("domain_max_scores", {})
        smart_readiness_scores = calculated_scores.get("smart_readiness_scores", {})

        # Calculate the weighted sums for each impact criterion
        weighted_sums = calculate_weighted_sums(user_input, domain_impact_scores)
        weighted_max_sums = calculate_weighted_sums(user_input, domain_max_scores)
        
        sr_impact_criteria = {}  # New dictionary for SR(ic) percentages

        # Calculate SR(ic) as (weighted_sums[ic] / weighted_max_sums[ic]) * 100
        for ic in weighted_sums:
            weighted_sum = weighted_sums[ic]
            weighted_max_sum = weighted_max_sums[ic]

            if weighted_max_sum != 0:
                sr_percentage = (weighted_sum / weighted_max_sum) * 100
            else:
                sr_percentage = 0  # Default to zero if division by zero risk

            sr_impact_criteria[ic] = round(sr_percentage, 2)  # Round to two decimal places

        # Calculate SRf scores for each key functionality
        srf_scores = calculate_srf_scores(sr_impact_criteria)

        # Calculate the total SRI score
        total_sri = calculate_total_sri(srf_scores)

        # Calculate the weighted sums for each domain
        #weighted_domain_sums = calculate_weighted_domain_sums(domain_impact_scores)
        #weighted_max_domain_sums = calculate_weighted_domain_sums(domain_max_scores)
        
        # Calculate SR(d) for each domain
        #sr_domains = calculate_sr_domains(weighted_domain_sums, weighted_max_domain_sums)


    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

    # Return all expected results
    sri_result = {
        "smart_readiness_scores": smart_readiness_scores,
        "sr_impact_criteria": sr_impact_criteria,  
        "srf_scores": srf_scores,
        "total_sri": total_sri
    }
    
    return sri_result


class SRIUpgradeRequest(BaseModel):
    target_sri: float

def get_next_level(service_code: str, current_level: int, session: Session) -> Optional[int]:
    next_level = session.query(Levels).filter_by(code=service_code, level=current_level + 1).first()
    return next_level.level if next_level else None

def apply_level_change(service_code: str, new_level: int, levels: dict) -> dict:
    new_levels = {k: v.copy() for k, v in levels.items()}
    if service_code in new_levels:
        new_levels[service_code] = {new_level: 100}
    return new_levels

def explore_configurations(session: Session, current_config: dict, target_sri: float, 
                           all_possible_upgrades: list, building_id: int) -> None:
    
    building = session.get(Building, building_id)
    if not building:
        raise HTTPException(status_code=404, detail="Building not found")
    
    for service_code, levels in current_config.items():
        current_level = max(levels.keys(), key=int)
        next_level = get_next_level(service_code, int(current_level), session)
        
        if next_level is None:
            continue  # Skip if there's no higher level
        
        # Apply the change
        new_config = apply_level_change(service_code, next_level, current_config)
        
        # Recalculate SRI
        new_input = SRIInput(building_type=building.building_type,
                             zone=building.zone, dom=building.domains, lev=new_config)
        sri_scores = calculate_sri_help(building_id, new_input)
        total_sri = sri_scores.get("total_sri", 0)
        
        if total_sri >= target_sri:
            all_possible_upgrades.append({
                "config": new_config,
                "achieved_sri": total_sri
            })
        # Explore further changes
        elif total_sri < target_sri:
            explore_configurations(session, new_config, target_sri, all_possible_upgrades, building_id)
            break
            
        
def calculate_individual_sri_increase(service_code, original_level, upgraded_levels, original_sri, building, session):
    """
    Calculate the individual SRI increase for a specific service upgrade.
    """
    # Revert the service to its original level
    temp_config = upgraded_levels.copy()
    temp_config[service_code] = {original_level: 100}

    # Recalculate SRI for the configuration with only this service not upgraded
    new_input = SRIInput(building_type=building.building_type,
                         zone=building.zone, dom=building.domains, lev=temp_config)
    sri_scores = calculate_sri_help(building.id, new_input)
    sri_with_reverted_service = sri_scores.get("total_sri", 0)

    # The contribution is the difference
    return round(original_sri - sri_with_reverted_service, 2)

@app.post("/upgrade_sri/{building_id}/")
def upgrade_sri(building_id: int, request: SRIUpgradeRequest):
    with get_session() as session:
        target_sri = request.target_sri
        building = session.get(Building, building_id)
        if not building:
            raise HTTPException(status_code=404, detail="Building not found")

        current_sri = building.total_sri
        if target_sri <= current_sri:
            raise HTTPException(status_code=400, detail="Target SRI must be greater than the current SRI.")

        user_input = {
            "building_type": building.building_type,
            "zone": building.zone,
            "dom": building.domains,
            "lev": building.levels  # Assuming this is stored with the building
        }

        all_possible_upgrades = []

        # Start exploration from the current configuration
        explore_configurations(session, user_input['lev'], target_sri, all_possible_upgrades, building_id)

        if not all_possible_upgrades:
            return {"message": "No valid upgrades found"}

        # Sort and return the best upgrade (minimal score above target)
        best_upgrade = min(all_possible_upgrades, key=lambda x: x['achieved_sri'])

        original_levels = user_input['lev']
        upgrades = best_upgrade['config']
        new_sri = best_upgrade['achieved_sri']

        # Calculate the individual increases
        individual_increases = {}
        for service_code, original_level in original_levels.items():
            original_level_key = max(original_level.keys(), key=int)
            upgraded_level_key = max(upgrades.get(service_code, {}).keys(), key=int)

            if original_level_key != upgraded_level_key:
                individual_increase = calculate_individual_sri_increase(
                    service_code, original_level_key, upgrades, new_sri, building, session)
            else:
                individual_increase = 0.0

            individual_increases[service_code] = individual_increase

        response = {
            "Upgrades": upgrades,
            "New_Score": new_sri,
            "Original_Levels": original_levels,  # Include the original levels here
            "Individual_Increases": individual_increases  # New field for individual contributions
        }

        return response


@app.on_event("startup")
async def startup_event():
    reset_and_load_data()