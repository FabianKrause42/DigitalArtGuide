import re

# Read the file
with open('Content/ausstellung-1-OfOtherPlaces/artworks.json', 'r', encoding='utf-8') as f:
    content = f.read()

# Find all description fields that span multiple lines (literal newlines)
pattern = r'("description":\s*")([^"]*?)(",)'

def fix_description(match):
    prefix = match.group(1)  # "description": "
    text = match.group(2)     # the text
    suffix = match.group(3)   # ",
    
    # Check if this already has escaped newlines (skip if already fixed)
    if '\\n' in text:
        return match.group(0)  # already fixed
    
    # Split into paragraphs (sequences of lines without blank lines between them)
    lines = text.split('\n')
    paragraphs = []
    current_paragraph = []
    
    for line in lines:
        line = line.strip()
        if line:
            current_paragraph.append(line)
        else:
            if current_paragraph:
                paragraphs.append(' '.join(current_paragraph))
                current_paragraph = []
    
    if current_paragraph:
        paragraphs.append(' '.join(current_paragraph))
    
    # Join paragraphs with \n\n
    fixed_text = '\\n\\n'.join(paragraphs)
    
    return prefix + fixed_text + suffix

# Apply the fix
fixed_content = re.sub(pattern, fix_description, content, flags=re.DOTALL)

# Write back
with open('Content/ausstellung-1-OfOtherPlaces/artworks.json', 'w', encoding='utf-8') as f:
    f.write(fixed_content)

print("✅ Fixed all description fields with proper paragraph breaks!")
