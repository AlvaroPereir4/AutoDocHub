from dataclasses import dataclass
from src.classes.serviceClass import Service

@dataclass
class Receipt:
    tittle: str
    service = Service
    client: str | None = None
    location: str | None = None
    service_value: str | None = None
    init_deposit: str | None = None
    final_deposit: str | None = None
    receipt_date: str | None = None
