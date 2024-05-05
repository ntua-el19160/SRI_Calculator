from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict
from sqlmodel import Session
from sqlalchemy.exc import SQLAlchemyError
from models import get_session, Levels, Domain_W, Impact_W, Services


# Initialize the FastAPI application
app = FastAPI()


# Define a Pydantic model for the SRI calculation input
class SRIInput(BaseModel):
    building_type: str
    zone: str
    lev: Dict[str, int]  # Dictionary with service code and level as integer


# Define a Pydantic model for the SRI output
class SRIOutput(BaseModel):
    domain_impact_scores: Dict[str, int]  # Domain-impact criteria scores
    domain_max_scores: Dict[str, int]
    smart_readiness_scores: Dict[str, float]  # The new score, allowing float

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
        smart_readiness_scores = {}

        domains = [
            "Heating", "Cooling", "Domestic hot water", "Ventilation", "Lighting",
            "Dynamic building envelope", "Electricity", "Electric vehicle charging", "Monitoring and control"
        ]

        impact_criteria = [
            "Energy Efficiency", "Maintenance Fault Prediction", "Comfort", "Convenience",
            "Health Well-being and Accessibility", "Information to Occupants", "Energy Flexibility and Storage"
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
                if level.code not in max_level_for_service or max_level_for_service[level.code] < level.level:
                    max_level_for_service[level.code] = level.level

            # Calculate the maximum score for each impact criterion
            for ic_index, ic in enumerate(impact_criteria):
                score_field = f"score_cr{ic_index + 1}"

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
            for ic_index, ic in enumerate(impact_criteria):
                total_score = 0

                # Calculate the score based on the user's input
                for level in domain_levels:
                    level_input = user_input.lev.get(level.code)  # Get the user input level
                    if level_input == level.level:  # Match the user input with the level
                        # Get the score for the corresponding impact criteria
                        score_field = f"score_cr{ic_index + 1}"
                        score = getattr(level, score_field, 0)
                        total_score += score

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




# Endpoint to calculate SRI
@app.post("/calculate-sri/", response_model=SRIOutput)
def calculate_sri(input_data: SRIInput):
    try:
        validate_numeric_data(input_data.lev)  # Validate numeric fields
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    try:
        # Calculate the domain-impact criteria scores
        scores = calculate_scores(input_data)
    except SQLAlchemyError as e:
        # Rollback the transaction and raise an HTTP exception with a descriptive error message
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
    except Exception as e:
        # Handle other exceptions that might occur
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

   
    # Return the scores as the response
    return scores
