from reportlab.platypus import SimpleDocTemplate
from reportlab.lib.pagesizes import A4
from datetime import datetime
from src.asssets.quouteStyle import quouteStyle

orcamento_data = {
    "titulo": "ORÇAMENTO – REJUNTES",
    # "empresa": "Serviços Pereira",
    "endereco": "Rua Escobar Ortiz - SP",
    "cliente": "Wilsy",
    "servico": [
        "Rejuntar as paredes do box do banheiro.",
        "Impermeabilizar totalmente as pedras do piso do box.",
        "Fechar o buraco de gesso, que está no teto.",
        "Tratamento técnico completo do rejunte – Nos processos relacionados ao rejunte, remoção total do rejunte antigo e aplicação de novo material de alta performance: anti-infiltração, térmico, anti-trinca e impermeabilizante anti-mofo.",
    ],
    "valor_total": 2000.00,
    "sinal": 1000.00,
    "emissao": "04/08/2025",
    "validade": "25/08/2025",
    "observacoes": [
        "Sinal de 50% do total, para compra dos materiais e confirmação do serviço.",
        "Os outros 50% são pagos no fim do serviço.",
        "Incluso mão de obra e material.",
        "Serviço com garantia de 1 ano.",
    ],
    "contato": {
        "nome": "Álvaro Pereira",
        "telefone": "11 96042-0895",
        "email": "alvaropereirasantos9@gmail.com"
    }
}

def gerar_pdf_profissional(data: dict):
    filename = f"orcamento_{datetime.now().strftime('%Y%m%d')}.pdf"
    doc = SimpleDocTemplate(filename, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    elements = quouteStyle(data)
    doc.build(elements)
    print(f"PDF profissional gerado: {filename}")

# Gerar PDF
gerar_pdf_profissional(orcamento_data)
