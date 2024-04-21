from typing import List, Optional
from sqlmodel import SQLModel, create_engine, Session
import pandas as pd




# Define the SQLAlchemy database URL. For SQLite, we'll use a file-based database.
DATABASE_URL = "postgresql://el19160:pr5td!z386@host:5432/SRI_DB"

# Create a SQLAlchemy database engine.
engine = create_engine(DATABASE_URL, echo=True)


# Define the model for buildings
class Building(SQLModel, table=True):
    id: Optional[int] = None
    name: str
    address: str
    year_built: int
    area: float  # Total floor area of the building in square meters
    energy_efficiency_measures: List["EnergyEfficiencyMeasure"] = []

    def calculate_sri_score(self):
        # Placeholder for SRI score calculation logic
        return 0  # Placeholder value


# Define the model for energy efficiency measures
class EnergyEfficiencyMeasure(SQLModel, table=True):
    id: Optional[int] = None
    name: str
    description: str
    category: str
    improvement: float


# Define the classes for SRI calculation
class SRICalculator:
    def __init__(self):
        self.buildings = []
        self.energy_efficiency_measures = []

    def add_building(self, building):
        self.buildings.append(building)

    def add_energy_efficiency_measure(self, measure):
        self.energy_efficiency_measures.append(measure)

    def calculate_sri_scores(self):
        for building in self.buildings:
            sri_score = building.calculate_sri_score()
            print(f"SRI score for {building.name}: {sri_score}")

    def get_building_sri_score(self, building):
        return building.calculate_sri_score()


# Create the database tables
def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


# Function to get a database session
def get_session():
    with Session(engine) as session:
        yield session
