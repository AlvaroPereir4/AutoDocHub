class Config:
    VALID_THEMES = ["light", "intermediate", "dark"]
    VALID_PALETTES = ["default", "blue", "green", "purple", "orange", "red"]
    
    def __init__(self, theme="light", color_palette="default", font_size="14", preforms=None, user_info=None, language="ptbr"):
        self.theme = theme if theme in self.VALID_THEMES else "light"
        self.color_palette = color_palette if color_palette in self.VALID_PALETTES else "default"
        self.font_size = str(font_size)
        self.preforms = preforms or {"servicos": [], "observacoes": []}
        self.user_info = user_info or {"nome": "Álvaro Pereira", "telefone": "11 96042-0895", "email": "alvaropereirasantos9@gmail.com", "pix": "11 96042-0895"}
        self.language = language if language in ["ptbr", "en"] else "ptbr"
    
    def to_dict(self):
        return {
            "theme": self.theme,
            "colorPalette": self.color_palette,
            "fontSize": self.font_size,
            "preforms": self.preforms,
            "userInfo": self.user_info,
            "language": self.language,
            "validThemes": self.VALID_THEMES,
            "validPalettes": self.VALID_PALETTES
        }
    
    @classmethod
    def from_dict(cls, data):
        return cls(
            theme=data.get("theme", "light"),
            color_palette=data.get("colorPalette", "default"),
            font_size=data.get("fontSize", "14"),
            preforms=data.get("preforms", {"servicos": [], "observacoes": []}),
            user_info=data.get("userInfo", {"nome": "Álvaro Pereira", "telefone": "11 96042-0895", "email": "alvaropereirasantos9@gmail.com", "pix": "11 96042-0895"}),
            language=data.get("language", "ptbr")
        )
    
    def validate(self):
        """Validates if the settings are valid"""
        errors = []
        
        if self.theme not in self.VALID_THEMES:
            errors.append(f"Invalid theme: {self.theme}")
            
        if self.color_palette not in self.VALID_PALETTES:
            errors.append(f"Invalid palette: {self.color_palette}")
            
        try:
            font_size = int(self.font_size)
            if font_size < 10 or font_size > 24:
                errors.append("Font size must be between 10 and 24px")
        except ValueError:
            errors.append("Font size must be a number")
            
        return errors
    
    @classmethod
    def get_default(cls):
        return cls(
            theme="light",
            color_palette="default", 
            font_size="14",
            preforms={
                "servicos": [
                    "Remoção do rejunte antigo",
                    "Limpeza e preparação da superfície",
                    "Aplicação de novo rejunte",
                    "Limpeza final da obra",
                    "Instalação de revestimentos",
                    "Pintura das paredes"
                ],
                "observacoes": [
                    "Sinal de 50% para iniciar os trabalhos",
                    "Restante pago na conclusão do serviço",
                    "Materiais inclusos no orçamento",
                    "Prazo de execução: conforme acordado",
                    "Garantia de 6 meses para o serviço",
                    "Horário de trabalho: 8h às 17h"
                ]
            },
            user_info={
                "nome": "Álvaro Pereira",
                "telefone": "11 96042-0895",
                "email": "alvaropereirasantos9@gmail.com",
                "pix": "11 96042-0895"
            },
            language="ptbr"
        )
    
    def add_preform(self, category, text):
        """Adds a new preform to the specified category"""
        if category in self.preforms:
            if text not in self.preforms[category]:
                self.preforms[category].append(text)
                return True
        return False
    
    def remove_preform(self, category, index):
        """Removes a preform from the specified category"""
        if category in self.preforms and 0 <= index < len(self.preforms[category]):
            self.preforms[category].pop(index)
            return True
        return False