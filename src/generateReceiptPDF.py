from reportlab.platypus import SimpleDocTemplate
from reportlab.lib.pagesizes import A4
from src.asssets.receiptStyle import receiptStyle
from src.utils.config_utils import get_save_paths
from src.utils.pdf_paths import build_pdf_path

def generate_receipt_pdf(data: dict, doc_id) -> str:
    save_paths = get_save_paths()
    output_dir = save_paths.get('recibos', r'D:\general_data\recibos')
    file_path = build_pdf_path(output_dir, 'recibo', data.get('cliente'), data.get('data_recibo'), doc_id)

    # Criar PDF usando o mesmo estilo do orcamento
    doc = SimpleDocTemplate(file_path, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    elements = receiptStyle(data)
    doc.build(elements)

    return file_path
