def parse_form_to_orcamento_dict(payload: dict) -> dict:
    def _to_list(val):
        if not val: return []
        if isinstance(val, list): return [s for s in val if str(s).strip()]
        return [s.strip() for s in str(val).splitlines() if s.strip()]

    def _to_float(val):
        try:
            return float(val)
        except Exception:
            return 0.0

    orcamento = {
        "titulo": payload.get("titulo") or "ORÇAMENTO",
        "endereco": payload.get("endereco") or "",
        "cliente": payload.get("cliente") or "",
        "servico": _to_list(payload.get("servico")),
        "valor_total": _to_float(payload.get("valor_total")),
        "sinal": _to_float(payload.get("sinal")),
        "emissao": payload.get("emissao") or "",
        "validade": payload.get("validade") or "",
        "observacoes": _to_list(payload.get("observacoes")),
        "contato": {
            "nome": payload.get("contato_nome") or "",
            "telefone": payload.get("contato_tel") or "",
            "email": payload.get("contato_email") or "",
            "pix": payload.get("contato_pix") or "",
        }
    }
    return orcamento
