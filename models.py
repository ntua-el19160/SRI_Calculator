from typing import List, Optional
from sqlmodel import SQLModel, create_engine, Session
import pandas as pd


csv_file_path1 = 'Classes_CSV/domain_w.csv'
csv_file_path2 = 'Classes_CSV/impact_w.csv'
csv_file_path3 = 'Classes_CSV/levels_new.csv'
csv_file_path4 = 'Classes_CSV/services.csv'

data1 = pd.read_csv(csv_file_path1)
data2 = pd.read_csv(csv_file_path2)
data3 = pd.read_csv(csv_file_path3)
#data4 = pd.read_csv(csv_file_path4)


# Define the SQLAlchemy database URL. For SQLite, we'll use a file-based database.
DATABASE_URL = "postgresql://el19160:pr5td!z386@host:5432/SRI_DB"

# Create a SQLAlchemy database engine.
engine = create_engine(DATABASE_URL, echo=True)


#Define the Domain Weights
class Domain_W(SQLModel, table=True):
    id: Optional[int] = None
    building_type: str
    zone: str
    dw_cr1: float
    dw_cr2: float
    dw_cr3: float
    dw_cr4: float
    dw_cr5: float
    dw_cr6: float
    dw_cr7: float

    def calculate_sri_score(self):
        #SRI score calculation 
        return 0  #Placeholder value


#Define the impact weights
class Impact_W(SQLModel, table=True):
    id: Optional[int] = None
    building_type: str
    zone: str
    imp_cr1: float
    imp_cr2: float
    imp_cr3: float
    imp_cr4: float
    imp_cr5: float
    imp_cr6: float
    imp_cr7: float

#Define the levels
class Levels(SQLModel, table=True):
    id: Optional[int] = None
    code:str
    level_desc:int
    desc:str
    score_cr1: int
    score_cr2: int
    score_cr3: int
    score_cr4: int
    score_cr5: int
    score_cr6: int
    score_cr7: int
    level:int
    mandatory:bool
    domain:str

class Services(SQLModel, table=True):
    id: Optional[int] = None
    domain:str
    code:str
    Service_group:str
    Service_desc:str


# Create the database tables
def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


# Function to get a database session
def get_session():
    with Session(engine) as session:
        for row in data1.iterrows():
            domain_w = Domain_W(
                building_type=row['building_type'],
                zone=row['zone'],
                dw_cr1=row['dw_cr1'],
                dw_cr2=row['dw_cr2'],
                dw_cr3=row['dw_cr3'],
                dw_cr4=row['dw_cr4'],
                dw_cr5=row['dw_cr5'],
                dw_cr6=row['dw_cr6'],
                dw_cr7=row['dw_cr7'],           
            )
            session.add(domain_w)
        for _, row in data2.iterrows():
            impact_w = Impact_W(
                building_type=row['building_type'],
                zone=row['zone'],
                imp_cr1=row['imp_cr1'],
                imp_cr2=row['imp_cr2'],
                imp_cr3=row['imp_cr3'],
                imp_cr4=row['imp_cr4'],
                imp_cr5=row['imp_cr5'],
                imp_cr6=row['imp_cr6'],
                imp_cr7=row['imp_cr7'],           
            )
            session.add(impact_w)
        #for _, row in data3.iterrows():
            #levels = Levels(
                #code=row['code'],
                #level_desc=row['level_desc'],
                #desc=row['desc'],
                #score_cr1=row['score_cr1'],
                #score_cr2=row['score_cr2'],
                #score_cr3=row['score_cr3'],
                #score_cr4=row['score_cr4'],
                #score_cr5=row['score_cr5'],
                #score_cr6=row['score_cr6'],
                #score_cr7=row['score_cr7'],
                           
            #)
            #session.add(levels)
        #for _, row in data4.iterrows():
            #services = Services(
                #domain=row['domain'],
                #code=row['code'],
                #Service_group=row['Service_group'],
                #Service_desc=row['Service_desc']                           
            #)
            #session.add(services)
        
        session.commit()

