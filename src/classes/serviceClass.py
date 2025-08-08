from dataclasses import dataclass

@dataclass
class Service:
    service_type: str | None = None
    service: list | None = None
    quote_date: str | None = None
    validation_date: str | None = None
