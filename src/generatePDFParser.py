from src.classes.quoteClass import Quote
from src.classes.serviceClass import Service
from src.utils.imports import *

def generate_pdf(data: dict):
    service = Service(service_type="Rejunte", service=data.get("servico"))
    quout = Quote(tittle=data.get("titulo"), client=data.get("cliente"), location=data.get("endereco"),
                  service=service, service_value=data.get("valor_total"), init_deposit=data.get("sinal"),
                  quote_date=data.get("emissao"), validation_date=data.get("validade"), obs=data.get("observacoes"))
    contact = ContactPaymentClass(name=data.get("nome"), tel=data.get("tel"),
                                  email=data.get("email"), pix=data.get("pix"))
    orcamento_data = {"titulo": quout.tittle, "endereco": quout.location, "cliente": quout.client,
                      "servico": quout.service.service, "valor_total": quout.service_value, "sinal": quout.init_deposit,
                      "emissao": quout.init_deposit, "validade": quout.validation_date, "observacoes": quout.obs,
                      "contato": {"nome": contact.name, "telefone": contact.tel, "email": contact.email,
                                  "pix": contact.pix}}

    filename = f"orcamento_{data.get('cliente', 'orcamento').replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.pdf"
    doc = SimpleDocTemplate(filename, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    elements = quouteStyle(orcamento_data)
    doc.build(elements)
