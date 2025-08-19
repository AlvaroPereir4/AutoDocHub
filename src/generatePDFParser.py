from src.utils.imports import *

def parser(data: dict) -> (dict, str):
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

    file_path = file_adjustments(quout)
    return orc_data, file_path

def file_adjustments(quot: Quote) -> str:
    ano, mes, _ = quot.quote_date.split('-')
    output_dir = r'D:\general_data\orcamentos'
    target_dir = os.path.join(output_dir, ano, mes)

    if not os.path.exists(target_dir):
        os.makedirs(target_dir)

    filename = f"orc_{quot.client}_{quot.quote_date}.pdf"
    file_path = os.path.join(target_dir, filename)
    return file_path

def generate_pdf(data: dict) -> str:
    orc_data, file_path = parser(data)
    doc = SimpleDocTemplate(file_path, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    elements = quouteStyle(orc_data)
    doc.build(elements)

    return file_path
