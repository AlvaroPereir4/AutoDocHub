from src.classes.quoteClass import Quote
from src.classes.serviceClass import Service
from src.utils.imports import *

service = Service(service_type="Rejunte", service=[
        "Rejuntar as paredes do box do banheiro.",
        "Impermeabilizar totalmente as pedras do piso do box.",
        "Fechar o buraco de gesso, que está no teto.",
        "Tratamento técnico completo do rejunte – Nos processos relacionados ao rejunte, remoção total do rejunte antigo e aplicação de novo material de alta performance: anti-infiltração, térmico, anti-trinca e impermeabilizante anti-mofo.",
    ])
quout = Quote(tittle="ORÇAMENTO – REJUNTES", client="Wilsy", location="Rua Escobar Ortiz - SP",
              service=service, service_value=2000.00, init_deposit=1000.00, quote_date="04/08/2025",
              validation_date="25/08/2025", obs=[
        "Sinal de 50% do total, para compra dos materiais e confirmação do serviço.",
        "Os outros 50% são pagos no fim do serviço.",
        "Incluso mão de obra e material.",
        "Serviço com garantia de 1 ano.",
    ])
contact = ContactPaymentClass(name="Álvaro Pereira", tel="11 96042-0895", email="alvaropereirasantos9@gmail.com",
                              pix="11 96042-0895")

orcamento_data = {
    "titulo": quout.tittle, "endereco": quout.location, "cliente": quout.client, "servico": quout.service.service,
    "valor_total": quout.service_value, "sinal": quout.init_deposit, "emissao": quout.init_deposit,
    "validade": quout.validation_date, "observacoes": quout.obs,
    "contato": {"nome": contact.name, "telefone": contact.tel, "email": contact.email, "pix": contact.pix}
# "empresa": "Serviços Pereira",
}

def gerar_pdf_profissional(data: dict):
    filename = f"orcamento_{datetime.now().strftime('%Y%m%d')}.pdf"
    doc = SimpleDocTemplate(filename, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    elements = quouteStyle(data)
    doc.build(elements)
    print(f"PDF profissional gerado: {filename}")

db_manager = DatabaseManager()
orcamento_id = db_manager.salvar_orcamento(orcamento_data)

gerar_pdf_profissional(orcamento_data)
