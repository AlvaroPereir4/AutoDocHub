# src/app.py
from flask import Flask, request, jsonify, render_template
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
import os
from src.generatePDFParser import generate_pdf

# --- Configuração ---
app = Flask(__name__)
MONGO_URI = "mongodb://localhost:27017/"
DB_NAME = "autodochub_db"

# --- Conexão com o Banco ---
try:
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    orcamentos_collection = db.quote_docs
    recibos_collection = db.receipt_docs
    print("✅ Conectado ao MongoDB com sucesso!")
except Exception as e:
    print(f"❌ Erro ao conectar ao MongoDB: {e}")
    exit()

# --- Rota para servir a página principal ---
@app.route('/')
def index():
    # Agora o Flask vai procurar 'index.html' na pasta 'templates'
    return render_template('index.html')


# --- As rotas para API a seguir não precisam de alteração ---
# --- API para ORÇAMENTOS ---
@app.route('/api/orcamentos', methods=['POST'])
def salvar_orcamento():
    """ Salva um novo orçamento no banco de dados """
    data = request.json
    data['criado_em'] = datetime.now()
    # print(data)
    if isinstance(data, dict):
        print(data)
        generate_pdf(data)

    try:
        result = orcamentos_collection.insert_one(data)

        return jsonify({"success": True, "id": str(result.inserted_id)}), 201
    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 500


@app.route('/api/orcamentos', methods=['GET'])
def buscar_orcamentos():
    """ Retorna todos os orçamentos, dos mais novos para os mais antigos """
    try:
        orcamentos = list(orcamentos_collection.find({}).sort([('_id', -1)]))
        for orc in orcamentos:
            orc['_id'] = str(orc['_id'])
        return jsonify(orcamentos), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --- API para RECIBOS ---
@app.route('/api/recibos', methods=['POST'])
def salvar_recibo():
    """ Salva um novo recibo no banco de dados """
    data = request.json
    data['criado_em'] = datetime.now()
    data['orcamento_id'] = data.get('orcamento_id')

    try:
        result = recibos_collection.insert_one(data)
        return jsonify({"success": True, "id": str(result.inserted_id)}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --- Rodar o App ---
if __name__ == "__main__":
    app.run(debug=True)