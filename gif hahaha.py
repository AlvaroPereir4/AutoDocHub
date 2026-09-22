import base64

caminho_gif = r"G:\Meu Drive\Obsidian\dHTV2jC.gif"

with open(caminho_gif, "rb") as image_file:
    encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
    css_url = f"url('data:image/gif;base64,{encoded_string}')"

    with open("resultado_css.txt", "w") as out_file:
        out_file.write(css_url)
        print(out_file.write(css_url))