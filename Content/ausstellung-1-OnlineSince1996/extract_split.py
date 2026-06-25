import fitz

doc = fitz.open('GSS_Olia_Lialina_Ausstellungsguide_Screen.pdf')

de_text = ''
en_text = ''
for i, page in enumerate(doc):
    t = page.get_text()
    if i < 10:
        de_text += f'=PAGE{i+1}=\n' + t + '\n'
    else:
        en_text += f'=PAGE{i+1}=\n' + t + '\n'

with open('pdf_de.txt', 'w', encoding='utf-8') as f:
    f.write(de_text)
with open('pdf_en.txt', 'w', encoding='utf-8') as f:
    f.write(en_text)
print(f'DE chars: {len(de_text)} / EN chars: {len(en_text)}')
