from dataclasses import dataclass

@dataclass
class VisitCharge:
    client: str
    location: str
    charge_date: str
    description: list
    total_value: float
    obs: list | None = None
