from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from models import Domain_W, Impact_W, Levels, Services, get_session

app = FastAPI()


class BuildingCreate(BaseModel):
    name: str
    address: str
    year_built: int
    area: float


class EnergyEfficiencyMeasureCreate(BaseModel):
    name: str
    description: str
    category: str
    improvement: float


@app.post("/buildings/", response_model=Building)
def create_building(building_data: BuildingCreate):
    with get_session() as session:
        building = Building(building_data.model_dump())
        session.add(building)
        session.commit()
        session.refresh(building)
        return building


@app.post("/energy-efficiency-measures/", response_model=EnergyEfficiencyMeasure)
def create_energy_efficiency_measure(measure_data: EnergyEfficiencyMeasureCreate):
    with get_session() as session:
        measure = EnergyEfficiencyMeasure(measure_data.model_dump())
        session.add(measure)
        session.commit()
        session.refresh(measure)
        return measure


@app.post("/buildings/{building_id}/energy-efficiency-measures/", response_model=EnergyEfficiencyMeasure)
def add_energy_efficiency_measure_to_building(building_id: int, measure_data: EnergyEfficiencyMeasureCreate):
    with get_session() as session:
        building = session.get(Building, building_id)
        if not building:
            raise HTTPException(status_code=404, detail="Building not found")
        measure = EnergyEfficiencyMeasure(measure_data.model_dump(), building_id=building_id)
        session.add(measure)
        session.commit()
        session.refresh(measure)
        return measure


@app.get("/buildings/{building_id}/sri-score/")
def calculate_sri_score_for_building(building_id: int):
    with get_session() as session:
        building = session.get(Building, building_id)
        if not building:
            raise HTTPException(status_code=404, detail="Building not found")
        #TODO:Calculate SRI score for the building
        sri_score = building.calculate_sri_score()
        return {"building_id": building_id, "sri_score": sri_score}
