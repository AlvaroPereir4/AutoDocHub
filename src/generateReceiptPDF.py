import os
from reportlab.platypus import SimpleDocTemplate
from reportlab.lib.pagesizes import A4
from src.asssets.receiptStyle import receiptStyle

def generate_receipt_pdf(data: dict) -> str:
    # Criar diretório se não existir
    ano, mes, _ = data['data_recibo'].split('-')
    output_dir = r'D:\general_data\recibos'
    target_dir = os.path.join(output_dir, ano, mes)
    
    if not os.path.exists(target_dir):
        os.makedirs(target_dir)
    
    filename = f"recibo_{data['cliente']}_{data['data_recibo']}.pdf"
    file_path = os.path.join(target_dir, filename)
    
    # Criar PDF usando o mesmo estilo do orçamento
    doc = SimpleDocTemplate(file_path, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    elements = receiptStyle(data)
    doc.build(elements)
    
    return file_path