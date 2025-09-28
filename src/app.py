from flask import Flask, request, jsonify, render_template
from pymongo import MongoClient
from datetime import datetime
from src.generatePDFParser import generate_pdf
from src.generateReceiptPDF import generate_receipt_pdf
from src.classes.configClass import Config
import re

app = Flask(__name__)
MONGO_URI = "mongodb://localhost:27017/"
DB_NAME = "autodochub_db"

try:
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    orcamentos_collection = db.quote_docs
    recibos_collection = db.receipt_docs
    config_collection = db.config
except Exception as e:
    print(f"connect error to MongoDB: {e}")
    exit()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/orcamentos', methods=['POST'])
def salvar_orcamento():
    data = request.json
    data['criado_em'] = datetime.now()
    # Sanitize client name for file
    data['cliente_sanitized'] = sanitize_filename(data.get('cliente', 'cliente'))
    data['pdf_location'] = generate_pdf(data)

    try:
        result = orcamentos_collection.insert_one(data)
        return jsonify({
            "success": True, 
            "id": str(result.inserted_id),
            "pdf_path": data['pdf_location'],
            "cliente": data.get('cliente', '').strip() or 'Cliente não informado'
        }), 201

    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 500


@app.route('/api/orcamentos', methods=['GET'])
def buscar_orcamentos():
    try:
        orcamentos = list(orcamentos_collection.find({}).sort([('_id', -1)]))
        for orc in orcamentos:
            orc['_id'] = str(orc['_id'])
        return jsonify(orcamentos), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/recibos', methods=['POST'])
def salvar_recibo():
    data = request.json
    data['criado_em'] = datetime.now()
    data['cliente_sanitized'] = sanitize_filename(data.get('cliente', 'cliente'))
    
    try:
        pdf_path = generate_receipt_pdf(data)
        data['pdf_location'] = pdf_path
        
        result = recibos_collection.insert_one(data)
        return jsonify({
            "success": True, 
            "id": str(result.inserted_id), 
            "pdf_path": pdf_path,
            "cliente": data.get('cliente', '').strip() or 'Cliente não informado'
        }), 201
    except Exception as e:
        print(f"Erro ao salvar recibo: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/config', methods=['GET'])
def get_config():
    try:
        print("🔍 Buscando configurações no banco...")
        config = config_collection.find_one({}, sort=[('_id', -1)])
        if config:
            print(f"✅ Configuração encontrada: {config['_id']}")
            config['_id'] = str(config['_id'])
            return jsonify(config), 200
        print("⚠️ Nenhuma configuração encontrada, retornando padrão")
        return jsonify(get_default_config()), 200
    except Exception as e:
        print(f"❌ Erro ao buscar config: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/config', methods=['POST'])
def save_config():
    data = request.json
    
    try:
        config_obj = Config.from_dict(data)
        validation_errors = config_obj.validate()
        
        if validation_errors:
            return jsonify({"error": "Dados inválidos: " + ", ".join(validation_errors)}), 400

        data['updated_at'] = datetime.now()
        print(f"💾 Salvando configurações: {data}")

        deleted_count = config_collection.delete_many({})
        print(f"🗑️ Removidas {deleted_count.deleted_count} configurações antigas")
        
        result = config_collection.insert_one(data)
        print(f"✅ Nova configuração salva com ID: {result.inserted_id}")
        
        return jsonify({"success": True, "id": str(result.inserted_id)}), 201
        
    except Exception as e:
        print(f"❌ Erro ao salvar config: {e}")
        return jsonify({"error": str(e)}), 500

def sanitize_filename(filename):
    if not filename or filename.strip() == '':
        return 'cliente'
    filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
    filename = re.sub(r'\s+', '_', filename)
    filename = re.sub(r'_+', '_', filename)
    filename = filename.strip('_')
    return filename[:50] if filename else 'cliente'

def get_default_config():
    return Config.get_default().to_dict()

if __name__ == "__main__":
    app.run(debug=True)
