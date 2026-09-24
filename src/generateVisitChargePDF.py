from reportlab.platypus import SimpleDocTemplate
from reportlab.lib.pagesizes import A4
from src.asssets.visitChargeStyle import visitChargeStyle
from src.utils.config_utils import get_save_paths
from src.utils.pdf_paths import build_pdf_path

def generate_visit_charge_pdf(data: dict, doc_id) -> str:
    save_paths = get_save_paths()
    output_dir = save_paths.get('cobrancas', r'D:\general_data\cobrancas')
    file_path = build_pdf_path(output_dir, 'cobranca', data.get('cliente'), data.get('data_cobranca'), doc_id)

    doc = SimpleDocTemplate(file_path, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    elements = visitChargeStyle(data)
    doc.build(elements)

    return file_path
