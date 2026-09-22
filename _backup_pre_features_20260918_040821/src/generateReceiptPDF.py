import os
from reportlab.platypus import SimpleDocTemplate
from reportlab.lib.pagesizes import A4
from src.asssets.receiptStyle import receiptStyle
from src.utils.config_utils import get_save_paths

def generate_receipt_pdf(data: dict) -> str:
    # Get save paths from database
    ano, mes, _ = data['data_recibo'].split('-')
    save_paths = get_save_paths()
    output_dir = save_paths.get('recibos', r'D:\general_data\recibos')
    target_dir = os.path.join(output_dir, ano, mes)
    
    if not os.path.exists(target_dir):
        os.makedirs(target_dir)
    
    client_name = data.get('cliente', '').strip() if data.get('cliente') else 'cliente'
    client_name = client_name if client_name else 'cliente'
    filename = f"recibo_{client_name}_{data['data_recibo']}.pdf"
    file_path = os.path.join(target_dir, filename)
    
    # Criar PDF usando o mesmo estilo do orçamento
    doc = SimpleDocTemplate(file_path, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    elements = receiptStyle(data)
    doc.build(elements)
    
    return file_path