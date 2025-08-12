from pymongo import MongoClient
from bson.objectid import ObjectId
from datetime import datetime

class DatabaseManager:
    def __init__(self, db_name="autodochub_db", collection_name="quote_docs"):
        self.client = MongoClient("mongodb://localhost:27017/")
        self.db = self.client[db_name]
        self.collection = self.db[collection_name]

    def salvar_orcamento(self, orcamento_data: dict):
        """Salva um orçamento no banco"""
        orcamento_data["created_at"] = datetime.now()
        result = self.collection.insert_one(orcamento_data)
        return str(result.inserted_id)

    def buscar_orcamento(self, orcamento_id: str):
        """Busca um orçamento pelo ID"""
        return self.collection.find_one({"_id": ObjectId(orcamento_id)})

