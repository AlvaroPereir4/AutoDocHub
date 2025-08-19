from reportlab.platypus import Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def quouteStyle(data: dict):
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
    # elements.append(Paragraph(data["empresa"], ParagraphStyle(
    #     'CompanyName', fontName="Helvetica-Bold", fontSize=14, textColor=colors.black, alignment=1
    # )))
    elements.append(Spacer(1, 8))
    elements.append(Paragraph(data["titulo"], title_style))
    elements.append(Paragraph(data["endereco"], normal_text))
    elements.append(Paragraph(f"Aos cuidados do(a) Sr(a).: {data['cliente']}", normal_text))
    elements.append(Spacer(1, 15))

    # === Serviços ===
    elements.append(Paragraph("SERVIÇO QUE SERÁ FEITO", section_title))
    for item in data["servico"]:
        elements.append(Paragraph(f"• {item}", normal_text))
    elements.append(Spacer(1, 10))

    # === Observações ===
    elements.append(Paragraph("CONDIÇÕES E OBSERVAÇÕES", section_title))
    for obs in data["observacoes"]:
        elements.append(Paragraph(f"• {obs}", normal_text))
    elements.append(Spacer(1, 10))

    # === Quadro de Valores ===
    saldo_restante = data["valor_total"] - data["sinal"]
    tabela_valores = [
        ["Valor Total", f"R$ {data['valor_total']:,.2f}"],
        ["Sinal (50%)", f"R$ {data['sinal']:,.2f}"],
        ["Saldo Restante", f"R$ {saldo_restante:,.2f}"]
    ]
    tabela_estilo = TableStyle([
        ('FONT', (0, 0), (-1, -1), 'Helvetica', 11),
        ('FONT', (0, 0), (0, 0), 'Helvetica-Bold', 12),  # Valor total em negrito
        ('FONT', (0, 2), (-1, 2), 'Helvetica-Bold', 12),  # Saldo restante em negrito
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('LINEABOVE', (0, 2), (-1, 2), 1, colors.black),  # Linha antes do saldo restante
        ('LINEBELOW', (0, -1), (-1, -1), 1, colors.black),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ])
    elements.append(Paragraph("RESUMO DE VALORES", section_title))
    elements.append(Table(tabela_valores, colWidths=[300, 120], style=tabela_estilo))
    elements.append(Spacer(1, 15))

    # === Datas ===
    elements.append(Paragraph("DATA DE EMISSÃO E VALIDADE", section_title))
    elements.append(Paragraph(f"Data de emissão: {data['emissao']}", normal_text))
    elements.append(Paragraph(f"Orçamento válido até: {data['validade']}", normal_text))
    elements.append(Spacer(1, 15))

    # === Contato ===
    elements.append(Paragraph("CONTATO E INFORMACOES DE PAGAMENTO", section_title))
    contato = data["contato"]
    print(contato)
    elements.append(Paragraph(f"{contato['nome']} – {contato['telefone']}", normal_text))
    elements.append(Paragraph(f"E-mail: {contato['email']}", normal_text))

    # # === Rodapé ===
    # elements.append(Spacer(1, 40))
    # data_geracao = datetime.now().strftime("%d/%m/%Y %H:%M")
    # elements.append(Paragraph(f"Documento gerado automaticamente em {data_geracao}", footer_style))

    return elements
