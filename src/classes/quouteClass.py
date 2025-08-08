from dataclasses import dataclass
from serviceClass import Service

@dataclass
class Quote:
    tittle: str
    client: str
    location: str
    service = Service
    service_value: str | None = None
    init_deposit: str | None = None
    quote_date: str | None = None
    validation_date: str | None = None
