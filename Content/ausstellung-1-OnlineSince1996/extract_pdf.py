import fitz
import sys

doc = fitz.open('GSS_Olia_Lialina_Ausstellungsguide_Screen.pdf')
with open('pdf_text.txt', 'w', encoding='utf-8') as out:
    for i, page in enumerate(doc):
        text = page.get_text()
        if text.strip():
            out.write(f'=== PAGE {i+1} ===\n')
            out.write(text)
            out.write('\n')
print(f"Done. {len(doc)} pages extracted.")
