"""Migra os PDFs existentes para o novo padrao de nome e aponta arquivos orfaos.

O novo padrao inclui os 6 ultimos caracteres do _id no fim do nome, o que torna
o caminho de cada documento unico e permite que uma edicao substitua sempre o
mesmo arquivo em vez de criar um novo.

Uso (a partir da raiz do projeto):

    python -m tools.migrate_pdf_names              # simulacao, nao altera nada
    python -m tools.migrate_pdf_names --apply      # renomeia e atualiza o banco
    python -m tools.migrate_pdf_names --apply --delete-orphans

Um arquivo e considerado orfao quando esta nas pastas configuradas mas nenhum
documento do banco aponta para ele -- tipicamente sobras de edicoes antigas,
quando o nome do cliente ou a data mudou e o PDF anterior ficou para tras.
"""

import argparse
import os
import sys

from pymongo import MongoClient

from src.utils.config_utils import get_save_paths
from src.utils.pdf_paths import build_pdf_path

MONGO_URI = "mongodb://localhost:27017/"
DB_NAME = "autodochub_db"

# doc_type -> (colecao, prefixo do arquivo, campo de data, chave em savePaths)
DOC_TYPES = {
    'orcamentos': ('quote_docs', 'orc', 'emissao', 'orcamentos'),
    'recibos': ('receipt_docs', 'recibo', 'data_recibo', 'recibos'),
    'cobrancas': ('visit_charge_docs', 'cobranca', 'data_cobranca', 'cobrancas'),
}


def migrate(apply_changes, delete_orphans):
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    client.admin.command('ping')
    db = client[DB_NAME]
    save_paths = get_save_paths()

    referenced = set()
    renamed = missing = unchanged = failed = 0

    for doc_type, (collection_name, prefix, date_field, path_key) in DOC_TYPES.items():
        collection = db[collection_name]
        base_dir = save_paths.get(path_key)
        if not base_dir:
            print(f"[{doc_type}] sem caminho configurado, ignorando")
            continue

        print(f"\n=== {doc_type} ({collection_name}) ===")

        for doc in collection.find({}):
            doc_id = doc['_id']
            old_path = doc.get('pdf_location')
            date_value = doc.get(date_field)

            if not date_value:
                print(f"  ! {doc_id}: sem '{date_field}', ignorado")
                failed += 1
                continue

            try:
                new_path = build_pdf_path(base_dir, prefix, doc.get('cliente'), date_value, doc_id)
            except ValueError as e:
                print(f"  ! {doc_id}: {e}")
                failed += 1
                continue

            referenced.add(os.path.normcase(os.path.abspath(new_path)))
            if old_path:
                referenced.add(os.path.normcase(os.path.abspath(old_path)))

            if old_path == new_path:
                unchanged += 1
                continue

            if not old_path or not os.path.isfile(old_path):
                print(f"  - {doc_id}: PDF anterior nao existe no disco, so atualizo o banco")
                print(f"      -> {new_path}")
                missing += 1
                if apply_changes:
                    collection.update_one({"_id": doc_id}, {"$set": {"pdf_location": new_path}})
                continue

            print(f"  * {os.path.basename(old_path)}")
            print(f"      -> {os.path.basename(new_path)}")

            if apply_changes:
                try:
                    os.makedirs(os.path.dirname(new_path), exist_ok=True)
                    os.replace(old_path, new_path)
                    collection.update_one({"_id": doc_id}, {"$set": {"pdf_location": new_path}})
                    renamed += 1
                except OSError as e:
                    print(f"      ! falhou: {e}")
                    failed += 1
            else:
                renamed += 1

    # --- Arquivos nao referenciados por nenhum documento ---
    print("\n=== Arquivos orfaos ===")
    orphans = []
    for path_key in ('orcamentos', 'recibos', 'cobrancas'):
        base_dir = save_paths.get(path_key)
        if not base_dir or not os.path.isdir(base_dir):
            continue
        for root, _dirs, files in os.walk(base_dir):
            for name in files:
                if not name.lower().endswith('.pdf'):
                    continue
                full = os.path.join(root, name)
                if os.path.normcase(os.path.abspath(full)) not in referenced:
                    orphans.append(full)

    if not orphans:
        print("  nenhum")
    for path in orphans:
        print(f"  ? {path}")
        if apply_changes and delete_orphans:
            try:
                os.remove(path)
                print("      removido")
            except OSError as e:
                print(f"      ! falhou: {e}")

    print("\n--- Resumo ---")
    print(f"  renomeados:            {renamed}")
    print(f"  ja no padrao novo:     {unchanged}")
    print(f"  sem arquivo no disco:  {missing}")
    print(f"  com problema:          {failed}")
    print(f"  orfaos encontrados:    {len(orphans)}")
    if not apply_changes:
        print("\n  SIMULACAO -- nada foi alterado. Rode com --apply para valer.")
    elif orphans and not delete_orphans:
        print("\n  Os orfaos foram apenas listados. Use --delete-orphans para remove-los.")


def main():
    ap = argparse.ArgumentParser(description="Migra nomes de PDF e lista arquivos orfaos.")
    ap.add_argument('--apply', action='store_true', help='aplica as mudancas (padrao: simulacao)')
    ap.add_argument('--delete-orphans', action='store_true', help='apaga os PDFs orfaos (exige --apply)')
    args = ap.parse_args()

    try:
        migrate(args.apply, args.delete_orphans)
    except Exception as e:
        print(f"Erro: {e}", file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
