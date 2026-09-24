from flask import Flask, request, jsonify, render_template, send_file
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
from src.generatePDFParser import generate_pdf
from src.generateReceiptPDF import generate_receipt_pdf
from src.generateVisitChargePDF import generate_visit_charge_pdf
from src.classes.configClass import Config
from src.utils.pdf_paths import sanitize_filename, remove_stale_pdf
import os

app = Flask(__name__)
# Evita que o navegador sirva script.js/translations.js de cache apos uma alteracao
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
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

    # O documento e inserido primeiro para que o _id exista e possa entrar no
    # nome do PDF. Se a geracao falhar, o insert e desfeito.
    doc_id = None
    try:
        doc_id = orcamentos_collection.insert_one(data).inserted_id
        pdf_path = generate_pdf(data, doc_id)
        orcamentos_collection.update_one({"_id": doc_id}, {"$set": {"pdf_location": pdf_path}})

        return jsonify({
            "success": True,
            "id": str(doc_id),
            "pdf_path": pdf_path,
            "cliente": data.get('cliente', '').strip() or 'Cliente não informado'
        }), 201
    except Exception as e:
        if doc_id is not None:
            orcamentos_collection.delete_one({"_id": doc_id})
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
        anterior = orcamentos_collection.find_one({"_id": ObjectId(id)}, {"pdf_location": 1})
        if not anterior:
            return jsonify({"error": "Orçamento não encontrado"}), 404

        data['pdf_location'] = generate_pdf(data, id)
        remove_stale_pdf(anterior.get('pdf_location'), data['pdf_location'])
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

    doc_id = None
    try:
        doc_id = recibos_collection.insert_one(data).inserted_id
        pdf_path = generate_receipt_pdf(data, doc_id)
        recibos_collection.update_one({"_id": doc_id}, {"$set": {"pdf_location": pdf_path}})

        return jsonify({
            "success": True,
            "id": str(doc_id),
            "pdf_path": pdf_path,
            "cliente": data.get('cliente', '').strip() or 'Cliente não informado'
        }), 201
    except Exception as e:
        if doc_id is not None:
            recibos_collection.delete_one({"_id": doc_id})
        print(f"Erro ao salvar recibo: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/recibos', methods=['GET'])
def buscar_recibos():
    try:
        recibos = list(recibos_collection.find({}).sort([('_id', -1)]))
        for recibo in recibos:
            recibo['_id'] = str(recibo['_id'])
        return jsonify(recibos), 200
    except Exception as e:
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
        anterior = recibos_collection.find_one({"_id": ObjectId(id)}, {"pdf_location": 1})
        if not anterior:
            return jsonify({"error": "Recibo não encontrado"}), 404

        data['pdf_location'] = generate_receipt_pdf(data, id)
        remove_stale_pdf(anterior.get('pdf_location'), data['pdf_location'])
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

    doc_id = None
    try:
        doc_id = cobrancas_collection.insert_one(data).inserted_id
        pdf_path = generate_visit_charge_pdf(data, doc_id)
        cobrancas_collection.update_one({"_id": doc_id}, {"$set": {"pdf_location": pdf_path}})

        return jsonify({
            "success": True,
            "id": str(doc_id),
            "pdf_path": pdf_path,
            "cliente": data.get('cliente', '').strip() or 'Cliente não informado'
        }), 201
    except Exception as e:
        if doc_id is not None:
            cobrancas_collection.delete_one({"_id": doc_id})
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
        anterior = cobrancas_collection.find_one({"_id": ObjectId(id)}, {"pdf_location": 1})
        if not anterior:
            return jsonify({"error": "Cobrança não encontrada"}), 404

        data['pdf_location'] = generate_visit_charge_pdf(data, id)
        remove_stale_pdf(anterior.get('pdf_location'), data['pdf_location'])
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
# PDF
# ==========================================================

DOC_COLLECTIONS = {
    'orcamentos': 'quote_docs',
    'recibos': 'receipt_docs',
    'cobrancas': 'visit_charge_docs',
}

@app.route('/api/<doc_type>/<id>/pdf', methods=['GET'])
def abrir_pdf(doc_type, id):
    """Serve o PDF ja gerado de um documento, para abrir direto no navegador."""
    collection_name = DOC_COLLECTIONS.get(doc_type)
    if collection_name is None:
        return jsonify({"error": "Tipo de documento inválido"}), 404

    try:
        object_id = ObjectId(id)
    except Exception:
        return jsonify({"error": "ID inválido"}), 400

    try:
        doc = db[collection_name].find_one({"_id": object_id}, {"pdf_location": 1})
        if not doc:
            return jsonify({"error": "Documento não encontrado"}), 404

        pdf_path = doc.get('pdf_location')
        if not pdf_path or not os.path.isfile(pdf_path):
            return jsonify({
                "error": "PDF não encontrado no disco. Abra o documento em modo edição e salve novamente para regerá-lo."
            }), 404

        return send_file(
            pdf_path,
            mimetype='application/pdf',
            as_attachment=False,
            download_name=os.path.basename(pdf_path)
        )
    except Exception as e:
        print(f"Erro ao abrir PDF: {e}")
        return jsonify({"error": str(e)}), 500

# ==========================================================
# HELPERS
# ==========================================================

def get_default_config():
    return Config.get_default().to_dict()

if __name__ == "__main__":
    app.run(debug=True)
