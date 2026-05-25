from flask import Flask, request, jsonify, render_template
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
from src.generatePDFParser import generate_pdf
from src.generateReceiptPDF import generate_receipt_pdf
from src.generateVisitChargePDF import generate_visit_charge_pdf
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
    cobrancas_collection = db.visit_charge_docs
    config_collection = db.config
except Exception as e:
    print(f"connect error to MongoDB: {e}")
    exit()

@app.route('/')
def index():
    return render_template('index.html')

# ==========================================================
# ORCAMENTOS
# ==========================================================

@app.route('/api/orcamentos', methods=['POST'])
def salvar_orcamento():
    data = request.json
    data['criado_em'] = datetime.now()
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


@app.route('/api/orcamentos/<id>', methods=['GET'])
def buscar_orcamento(id):
    try:
        orc = orcamentos_collection.find_one({"_id": ObjectId(id)})
        if not orc:
            return jsonify({"error": "Orçamento não encontrado"}), 404
        orc['_id'] = str(orc['_id'])
        return jsonify(orc), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/orcamentos/<id>', methods=['PUT'])
def editar_orcamento(id):
    data = request.json
    data['atualizado_em'] = datetime.now()
    data['cliente_sanitized'] = sanitize_filename(data.get('cliente', 'cliente'))

    try:
        data['pdf_location'] = generate_pdf(data)
        data.pop('_id', None)
        orcamentos_collection.update_one({"_id": ObjectId(id)}, {"$set": data})
        return jsonify({
            "success": True,
            "id": id,
            "pdf_path": data['pdf_location'],
            "cliente": data.get('cliente', '').strip() or 'Cliente não informado'
        }), 200
    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 500

# ==========================================================
# RECIBOS
# ==========================================================

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


@app.route('/api/recibos/<id>', methods=['GET'])
def buscar_recibo(id):
    try:
        recibo = recibos_collection.find_one({"_id": ObjectId(id)})
        if not recibo:
            return jsonify({"error": "Recibo não encontrado"}), 404
        recibo['_id'] = str(recibo['_id'])
        return jsonify(recibo), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/recibos/<id>', methods=['PUT'])
def editar_recibo(id):
    data = request.json
    data['atualizado_em'] = datetime.now()
    data['cliente_sanitized'] = sanitize_filename(data.get('cliente', 'cliente'))

    try:
        data['pdf_location'] = generate_receipt_pdf(data)
        data.pop('_id', None)
        recibos_collection.update_one({"_id": ObjectId(id)}, {"$set": data})
        return jsonify({
            "success": True,
            "id": id,
            "pdf_path": data['pdf_location'],
            "cliente": data.get('cliente', '').strip() or 'Cliente não informado'
        }), 200
    except Exception as e:
        print(f"Erro ao editar recibo: {e}")
        return jsonify({"error": str(e)}), 500

# ==========================================================
# COBRANCAS DE VISITA
# ==========================================================

@app.route('/api/cobrancas', methods=['POST'])
def salvar_cobranca():
    data = request.json
    data['criado_em'] = datetime.now()
    data['cliente_sanitized'] = sanitize_filename(data.get('cliente', 'cliente'))

    try:
        data['pdf_location'] = generate_visit_charge_pdf(data)
        result = cobrancas_collection.insert_one(data)
        return jsonify({
            "success": True,
            "id": str(result.inserted_id),
            "pdf_path": data['pdf_location'],
            "cliente": data.get('cliente', '').strip() or 'Cliente não informado'
        }), 201
    except Exception as e:
        print(f"Erro ao salvar cobrança: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/cobrancas', methods=['GET'])
def buscar_cobrancas():
    try:
        cobrancas = list(cobrancas_collection.find({}).sort([('_id', -1)]))
        for c in cobrancas:
            c['_id'] = str(c['_id'])
        return jsonify(cobrancas), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/cobrancas/<id>', methods=['GET'])
def buscar_cobranca(id):
    try:
        cobranca = cobrancas_collection.find_one({"_id": ObjectId(id)})
        if not cobranca:
            return jsonify({"error": "Cobrança não encontrada"}), 404
        cobranca['_id'] = str(cobranca['_id'])
        return jsonify(cobranca), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/cobrancas/<id>', methods=['PUT'])
def editar_cobranca(id):
    data = request.json
    data['atualizado_em'] = datetime.now()
    data['cliente_sanitized'] = sanitize_filename(data.get('cliente', 'cliente'))

    try:
        data['pdf_location'] = generate_visit_charge_pdf(data)
        data.pop('_id', None)
        cobrancas_collection.update_one({"_id": ObjectId(id)}, {"$set": data})
        return jsonify({
            "success": True,
            "id": id,
            "pdf_path": data['pdf_location'],
            "cliente": data.get('cliente', '').strip() or 'Cliente não informado'
        }), 200
    except Exception as e:
        print(f"Erro ao editar cobrança: {e}")
        return jsonify({"error": str(e)}), 500

# ==========================================================
# CONFIG
# ==========================================================

@app.route('/api/config', methods=['GET'])
def get_config():
    try:
        config = config_collection.find_one({}, sort=[('_id', -1)])
        if config:
            config['_id'] = str(config['_id'])
            return jsonify(config), 200
        return jsonify(get_default_config()), 200
    except Exception as e:
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
        config_collection.delete_many({})
        result = config_collection.insert_one(data)
        return jsonify({"success": True, "id": str(result.inserted_id)}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==========================================================
# HELPERS
# ==========================================================

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
