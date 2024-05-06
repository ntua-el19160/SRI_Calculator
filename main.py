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
    #domain_impact_scores: Dict[str, int]  # Domain-impact criteria scores
    #domain_max_scores: Dict[str, int]
    smart_readiness_scores: Dict[str, float]  # The new percentage score, allowing float
    #weighted_impact_sums: Dict[str, float]  # Weighted sums for each impact criterion
    #weighted_max_sums: Dict[str, float]  # Weighted sums for each impact criterion using lmax(d, ic)
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

        domains = [
            "Heating", "Domestic hot water", "Cooling", "Ventilation", "Lighting",
            "Electricity", "Dynamic building envelope", "Electric vehicle charging", "Monitoring and control"
        ]

        impact_criteria = [
            "Energy efficiency", "Maintenance and fault prediction", "Comfort", "Convenience",
            "Health, wellbeing and accessibility", "Information to occupants", "Energy, flexibility and storage"
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


# Function to calculate the weighted sums for each impact criterion
def calculate_weighted_sums(user_input: SRIInput, impact_scores: Dict[str, int]):
    with get_session() as session:
        

        # Impact criteria
        impact_criteria = [
            "Energy efficiency", "Maintenance and fault prediction", "Comfort", "Convenience",
            "Health, wellbeing and accessibility", "Information to occupants", "Energy, flexibility and storage"
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
            weight_index = impact_criteria.index(impact_criterion) + 1  # dw_cr1, dw_cr2, etc.
            weight = getattr(domain_weights, f"dw_cr{weight_index}", 1)
            weighted_sums[impact_criterion] += weight * score

        return weighted_sums


# Adding fixed weights for the impact criteria
impact_weights = {
    "Energy efficiency": 0.166666667,
    "Maintenance and fault prediction": 0.333333333,
    "Comfort": 0.083333333,
    "Convenience": 0.083333333,
    "Health, wellbeing and accessibility": 0.083333333,
    "Information to occupants": 0.083333333,
    "Energy, flexibility and storage": 0.166666667
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


# Endpoint to calculate SRI
@app.post("/calculate-sri/", response_model=SRIOutput)
def calculate_sri(input_data: SRIInput):
    try:
        validate_numeric_data(input_data.lev)  # Validate numeric fields
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    try:
        # Calculate the domain-impact criteria scores and additional metrics
        calculated_scores = calculate_scores(input_data)
        
        # Ensure returned value is a dictionary
        if not isinstance(calculated_scores, dict):
            raise HTTPException(status_code=500, detail="Unexpected return value from calculate_scores()")

        domain_impact_scores = calculated_scores.get("domain_impact_scores", {})
        domain_max_scores = calculated_scores.get("domain_max_scores", {})
        smart_readiness_scores = calculated_scores.get("smart_readiness_scores", {})

        # Calculate the weighted sums for each impact criterion
        weighted_sums = calculate_weighted_sums(input_data, domain_impact_scores)
        weighted_max_sums = calculate_weighted_sums(input_data, domain_max_scores)
        
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
    return {
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