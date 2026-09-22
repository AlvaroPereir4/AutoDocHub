from reportlab.platypus import Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def visitChargeStyle(data: dict):
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'TitleCustom',
        parent=styles['Title'],
        fontName="Helvetica-Bold",
        fontSize=26,
        alignment=1,
        textColor=colors.black,
        spaceAfter=20,
        spaceBefore=10
    )

    section_title = ParagraphStyle(
        'SectionTitle',
        parent=styles['Heading2'],
        fontName="Helvetica-Bold",
        fontSize=14,
        textColor=colors.black,
        backColor=colors.HexColor("#e6e6e6"),
        spaceBefore=15,
        spaceAfter=8,
        leftIndent=5,
        leading=18
    )

    normal_text = ParagraphStyle(
        'NormalCustom',
        parent=styles['Normal'],
        fontName="Helvetica",
        fontSize=11,
        textColor=colors.black,
        spaceAfter=6,
        leading=16
    )

    elements = []

    elements.append(Spacer(1, 8))
    elements.append(Paragraph("COBRANÇA DE VISITA", title_style))
    elements.append(Paragraph(data["endereco"], normal_text))

    if data.get('cliente') and data['cliente'].strip():
        elements.append(Paragraph(f"Aos cuidados do(a) Sr(a).: {data['cliente']}", normal_text))

    elements.append(Spacer(1, 15))

    elements.append(Paragraph("SERVIÇO REALIZADO", section_title))
    for item in data["descricao"]:
        elements.append(Paragraph(f"• {item}", normal_text))
    elements.append(Spacer(1, 10))

    if data.get("obs"):
        elements.append(Paragraph("OBSERVAÇÕES", section_title))
        for item in data["obs"]:
            elements.append(Paragraph(f"• {item}", normal_text))
        elements.append(Spacer(1, 10))

    tabela_valores = [
        ["VALOR TOTAL DO SERVIÇO", f"R$ {data['valor_total']:,.2f}"]
    ]
    tabela_estilo = TableStyle([
        ('FONT', (0, 0), (-1, -1), 'Helvetica-Bold', 13),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('LINEABOVE', (0, 0), (-1, 0), 1, colors.black),
        ('LINEBELOW', (0, -1), (-1, -1), 1, colors.black),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
    ])
    elements.append(Paragraph("VALOR", section_title))
    elements.append(Table(tabela_valores, colWidths=[300, 160], style=tabela_estilo))
    elements.append(Spacer(1, 15))

    elements.append(Paragraph("DATA DE EMISSÃO", section_title))
    elements.append(Paragraph(f"Data de emissão: {data['data_cobranca']}", normal_text))
    elements.append(Spacer(1, 15))

    elements.append(Paragraph("DADOS BANCÁRIOS PARA PAGAMENTO", section_title))
    contato = data["contato"]
    elements.append(Paragraph(f"{contato['nome']}", normal_text))
    elements.append(Paragraph(f"Chave PIX: {contato['pix']}", normal_text))

    return elements
