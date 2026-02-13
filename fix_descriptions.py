import re

# Read the file
with open('Content/ausstellung-1-OfOtherPlaces/artworks.json', 'r', encoding='utf-8') as f:
    content = f.read()

# Find all description fields that span multiple lines (literal newlines)
# Pattern: "description": "text with actual newlines in it"
pattern = r'("description":\s*")([^"]+(?:\n[^"]+)*?)(",)'

def fix_description(match):
    prefix = match.group(1)  # "description": "
    text = match.group(2)     # the multiline text
    suffix = match.group(3)   # ",
    
    # Replace literal newlines with escaped ones
    # First, handle paragraph breaks (double newlines become \n\n)
    text = text.replace('\n\n', '\\n\\n')
    # Then handle single newlines within paragraphs
    text = text.replace('\n', ' ')
    # Fix the double replacement
    text = text.replace('\\n\\n ', '\\n\\n')
    
    return prefix + text + suffix

# Apply the fix
fixed_content = re.sub(pattern, fix_description, content, flags=re.MULTILINE)

# Write back
with open('Content/ausstellung-1-OfOtherPlaces/artworks.json', 'w', encoding='utf-8') as f:
    f.write(fixed_content)

print("✅ Fixed all description fields!")
