import os
import re
from datetime import datetime


def sanitize_filename(name, fallback='cliente'):
    """Remove caracteres que o Windows nao aceita em nomes de arquivo."""
    if not name or not str(name).strip():
        return fallback

    name = re.sub(r'[<>:"/\\|?*]', '_', str(name))
    name = re.sub(r'\s+', '_', name)
    name = re.sub(r'_+', '_', name)
    name = name.strip('_')

    return name[:50] if name else fallback


def build_pdf_path(base_dir, prefix, client, date_str, doc_id):
    """Monta o caminho canonico do PDF de um documento.

    O nome continua legivel (cliente + data), mas recebe no final os 6 ultimos
    caracteres do _id. Isso garante que dois documentos do mesmo cliente na
    mesma data nunca sobrescrevam o arquivo um do outro, e da um identificador
    estavel para localizar o PDF de um documento especifico.
    """
    if not date_str or not isinstance(date_str, str) or '-' not in date_str:
        date_str = datetime.now().strftime('%Y-%m-%d')

    parts = str(date_str).split('-')
    if len(parts) < 2 or not parts[0] or not parts[1]:
        date_str = datetime.now().strftime('%Y-%m-%d')
        parts = date_str.split('-')

    ano, mes = parts[0], parts[1]
    target_dir = os.path.join(base_dir, ano, mes)
    os.makedirs(target_dir, exist_ok=True)

    short_id = str(doc_id)[-6:]
    filename = f"{prefix}_{sanitize_filename(client)}_{date_str}_{short_id}.pdf"

    return os.path.join(target_dir, filename)


def remove_stale_pdf(old_path, new_path):
    """Apaga o PDF anterior quando uma edicao muda o caminho do arquivo.

    Sem isso, editar o nome do cliente ou a data de emissao deixa o PDF antigo
    orfao no disco (as vezes em outra pasta ano/mes), e nao ha como saber qual
    dos dois arquivos e o vigente.
    """
    if not old_path or old_path == new_path:
        return False

    if not os.path.isfile(old_path):
        return False

    try:
        os.remove(old_path)
        return True
    except OSError as e:
        print(f"Nao foi possivel remover o PDF antigo '{old_path}': {e}")
        return False
