import os
from reportlab.platypus import SimpleDocTemplate
from reportlab.lib.pagesizes import A4
from src.asssets.visitChargeStyle import visitChargeStyle
from src.utils.config_utils import get_save_paths

def generate_visit_charge_pdf(data: dict) -> str:
    ano, mes, _ = data['data_cobranca'].split('-')
    save_paths = get_save_paths()
    output_dir = save_paths.get('cobrancas', r'D:\general_data\cobrancas')
    target_dir = os.path.join(output_dir, ano, mes)

    if not os.path.exists(target_dir):
        os.makedirs(target_dir)

    client_name = data.get('cliente', '').strip() or 'cliente'
    filename = f"cobranca_{client_name}_{data['data_cobranca']}.pdf"
    file_path = os.path.join(target_dir, filename)

    doc = SimpleDocTemplate(file_path, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    elements = visitChargeStyle(data)
    doc.build(elements)

    return file_path
