from pymongo import MongoClient
from bson.objectid import ObjectId
from datetime import datetime

class DatabaseManager:
    def __init__(self, db_name="autodochub_db"):
        self.client = MongoClient("mongodb://localhost:27017/")
        self.db = self.client[db_name]
        self.orcamentos = self.db["orcamentos"]
        self.recibos = self.db["receipt_docs"]

    # Orçamentos
    def salvar_orcamento(self, orcamento_data: dict):
        orcamento_data["created_at"] = datetime.now()
        result = self.orcamentos.insert_one(orcamento_data)
        return str(result.inserted_id)

    def listar_orcamentos(self, search=None):
        query = {}
        if search:
            query = {"cliente": {"$regex": search, "$options": "i"}}
        return list(self.orcamentos.find(query).sort("created_at", -1))

    def buscar_orcamento(self, orcamento_id: str):
        return self.orcamentos.find_one({"_id": ObjectId(orcamento_id)})

    # Recibos
    def salvar_recibo(self, recibo_data: dict):
        recibo_data["created_at"] = datetime.now()
        result = self.recibos.insert_one(recibo_data)
        return str(result.inserted_id)

    def listar_recibos(self):
        return list(self.recibos.find().sort("created_at", -1))
