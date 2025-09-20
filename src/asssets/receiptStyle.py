from reportlab.platypus import Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def receiptStyle(data: dict):
    styles = getSampleStyleSheet()

    # === Estilos personalizados ===
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

    value_style = ParagraphStyle(
        'ValueStyle',
        parent=styles['Normal'],
        fontName="Helvetica-Bold",
        fontSize=12,
        textColor=colors.black,
        alignment=2,  # direita
        leading=16
    )

    footer_style = ParagraphStyle(
        'FooterStyle',
        parent=styles['Normal'],
        fontName="Helvetica-Oblique",
        fontSize=9,
        textColor=colors.HexColor("#555555"),
        alignment=1
    )

    elements = []

    # === Cabeçalho ===
    elements.append(Spacer(1, 8))
    elements.append(Paragraph("RECIBO DE PRESTAÇÃO DE SERVIÇO", title_style))
    elements.append(Paragraph(data["endereco"], normal_text))
    elements.append(Paragraph(f"Aos cuidados do(a) Sr(a).: {data['cliente']}", normal_text))
    elements.append(Spacer(1, 15))

    # === Serviços Realizados ===
    elements.append(Paragraph("SERVIÇO QUE FOI REALIZADO", section_title))
    for item in data["servicos"]:
        elements.append(Paragraph(f"• {item}", normal_text))
    elements.append(Spacer(1, 10))

    # === Quadro de Valores ===
    tabela_valores = [
        ["Sinal Recebido", f"R$ {data['sinal']:,.2f}"],
        ["Valor Restante Pago", f"R$ {data['valor_restante']:,.2f}"],
        ["VALOR TOTAL DO SERVIÇO", f"R$ {data['valor_total']:,.2f}"]
    ]
    tabela_estilo = TableStyle([
        ('FONT', (0, 0), (-1, -1), 'Helvetica', 11),
        ('FONT', (0, 2), (-1, 2), 'Helvetica-Bold', 12),  # Valor total em negrito
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('LINEABOVE', (0, 2), (-1, 2), 1, colors.black),  # Linha antes do valor total
        ('LINEBELOW', (0, -1), (-1, -1), 1, colors.black),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ])
    elements.append(Paragraph("VALORES E PAGAMENTO", section_title))
    elements.append(Table(tabela_valores, colWidths=[300, 120], style=tabela_estilo))
    elements.append(Spacer(1, 15))

    # === Data ===
    elements.append(Paragraph("DATA DE EMISSÃO", section_title))
    elements.append(Paragraph(f"Data de emissão do recibo: {data['data_recibo']}", normal_text))
    elements.append(Spacer(1, 15))

    # === Contato ===
    elements.append(Paragraph("DADOS BANCÁRIOS PARA PAGAMENTO", section_title))
    contato = data["contato"]
    elements.append(Paragraph(f"{contato['nome']}", normal_text))
    elements.append(Paragraph(f"Chave PIX: {contato['pix']}", normal_text))

    return elements