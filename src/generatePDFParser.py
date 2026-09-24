from src.utils.imports import *
from src.utils.config_utils import get_save_paths
from src.utils.pdf_paths import build_pdf_path

def parser(data: dict, doc_id) -> (dict, str):
    service = Service(service_type="Rejunte", service=data.get("servico"))
    quout = Quote(tittle=data.get("titulo"), client=data.get("cliente"), location=data.get("endereco"),
                  service=service, service_value=data.get("valor_total"), init_deposit=data.get("sinal"),
                  quote_date=data.get("emissao"), validation_date=data.get("validade"), obs=data.get("observacoes"))
    contact = ContactPaymentClass(name=data['contato'].get("nome"), tel=data['contato'].get("tel"),
                                  email=data['contato'].get("email"), pix=data['contato'].get("pix"))
    orc_data = {"titulo": quout.tittle, "endereco": quout.location, "cliente": quout.client,
                      "servico": quout.service.service, "valor_total": quout.service_value, "sinal": quout.init_deposit,
                      "emissao": quout.quote_date, "validade": quout.validation_date, "observacoes": quout.obs,
                      "contato": {"nome": contact.name, "telefone": contact.tel, "email": contact.email,
                                  "pix": contact.pix}}

    file_path = file_adjustments(quout, doc_id)
    return orc_data, file_path

def file_adjustments(quot: Quote, doc_id) -> str:
    save_paths = get_save_paths()
    output_dir = save_paths.get('orcamentos', r'D:\general_data\orcamentos')
    return build_pdf_path(output_dir, 'orc', quot.client, quot.quote_date, doc_id)

def generate_pdf(data: dict, doc_id) -> str:
    orc_data, file_path = parser(data, doc_id)
    doc = SimpleDocTemplate(file_path, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    elements = quouteStyle(orc_data)
    doc.build(elements)

    return file_path
