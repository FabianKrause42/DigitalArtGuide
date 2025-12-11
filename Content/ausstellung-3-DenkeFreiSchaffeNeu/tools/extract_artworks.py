import json
import re
from pathlib import Path
from PIL import Image

BASE = Path(__file__).resolve().parents[1]
SRC_DIR = BASE / "Thumpnails_und_Text"
OUT_IMG_DIR = BASE / "media" / "images"
ARTWORKS_JSON = BASE / "artworks.json"
INFO_JSON = BASE / "info.json"

OUT_IMG_DIR.mkdir(parents=True, exist_ok=True)

TITLE_YEAR_RE = re.compile(r"^\s*(?P<title>.*?)[,\s]+(?P<year>\d{3,4})\s*$")
BORN_DIED_RE = re.compile(r"\((?:\*?\s*(?P<born>\d{3,4}))?\s*[—\-–]\s*(?P<died>\d{3,4})?\)")
TRAILING_DIGITS_RE = re.compile(r"(\d+)(?:_Text)?$")


def _normalize_text(lines):
    # Merge hyphenated line breaks like "son-\nnenn" -> "sonnenn"
    merged = []
    it = iter(range(len(lines)))
    i = 0
    while i < len(lines):
        line = lines[i].rstrip("\n").rstrip("\r")
        if line.endswith("-") and i + 1 < len(lines):
            next_line = lines[i + 1].lstrip()
            merged.append(line[:-1] + next_line)
            i += 2
        else:
            merged.append(line)
            i += 1
    # Collapse multiple empty lines to max 2 newlines
    para = []
    empty = 0
    for l in merged:
        if l.strip() == "":
            empty += 1
        else:
            empty = 0
        if empty <= 1:
            para.append(l)
    return "\n".join(para).strip()


def _extract_number(stem: str) -> int:
    # Prefer trailing digits (handles 10, 11, 12 correctly), allow optional _Text suffix
    m = TRAILING_DIGITS_RE.search(stem)
    if not m:
        raise ValueError(f"Keine Nummer im Dateinamen: {stem}")
    return int(m.group(1))


def _parse_meta(text_lines):
    # Best-effort parse: artist, born/died, title/year, materials
    artist = None
    born = None
    died = None
    title = None
    year = None
    materials = None

    lines = [l.strip("\ufeff").rstrip() for l in text_lines]
    non_empty = [l for l in lines if l.strip() != ""]

    if non_empty:
        artist = non_empty[0].strip()

    if len(non_empty) >= 2:
        m = BORN_DIED_RE.search(non_empty[1])
        if m:
            try:
                born = int(m.group("born")) if m.group("born") else None
            except Exception:
                born = None
            try:
                died = int(m.group("died")) if m.group("died") else None
            except Exception:
                died = None

    # Find a line containing title and year
    for l in lines:
        m = TITLE_YEAR_RE.match(l)
        if m and not title:
            title = m.group("title").strip()
            try:
                year = int(m.group("year"))
            except Exception:
                year = None
            continue
        # First materials line after title
        if title and materials is None and l and not TITLE_YEAR_RE.match(l):
            materials = l.strip()
            break

    return artist, born, died, title, year, materials


def _save_resized(img_path: Path, out_full: Path, out_thumb: Path, max_full_w=1200, thumb_w=300):
    with Image.open(img_path) as im:
        im = im.convert("RGB")
        w, h = im.size

        # Full size (do not upscale beyond original)
        if w > max_full_w:
            ratio = max_full_w / float(w)
            full_size = (max_full_w, int(h * ratio))
            full_img = im.resize(full_size, Image.LANCZOS)
        else:
            full_img = im
        out_full.parent.mkdir(parents=True, exist_ok=True)
        full_img.save(out_full, format="JPEG", quality=85, optimize=True, progressive=True)

        # Thumbnail
        thumb_img = im.copy()
        ratio = thumb_w / float(w)
        th_size = (thumb_w, int(h * ratio))
        thumb_img = thumb_img.resize(th_size, Image.LANCZOS)
        out_thumb.parent.mkdir(parents=True, exist_ok=True)
        thumb_img.save(out_thumb, format="JPEG", quality=75, optimize=True, progressive=True)


def main():
    items = []

    # Try to load exhibition info (optional)
    exhibition_meta = None
    if INFO_JSON.exists():
        try:
            exhibition_meta = json.loads(INFO_JSON.read_text(encoding="utf-8"))
        except Exception:
            exhibition_meta = None

    # Pair images with text files by trailing number
    img_files = sorted([p for p in SRC_DIR.glob("Artwork*.*") if p.suffix.lower() in {".jpg", ".jpeg"}], key=lambda p: _extract_number(p.stem))
    txt_files = { _extract_number(p.stem): p for p in SRC_DIR.glob("Artwork*_Text.txt") }

    for img_path in img_files:
        n = _extract_number(img_path.stem)
        txt_path = txt_files.get(n)

        # Read text
        title = None
        year = None
        materials = None
        artist = None
        born = None
        died = None
        description = None

        if txt_path and txt_path.exists():
            raw = txt_path.read_text(encoding="utf-8", errors="ignore")
            lines = raw.splitlines()
            artist, born, died, title, year, materials = _parse_meta(lines)
            description = _normalize_text(lines)
        else:
            description = ""

        # Output paths
        out_full = OUT_IMG_DIR / f"artwork-{n}-full.jpg"
        out_thumb = OUT_IMG_DIR / f"thumb-{n}.jpg"

        # Save resized images
        _save_resized(img_path, out_full, out_thumb)

        item = {
            "id": f"artwork-{n}",
            "number": str(n),
            "title": title,
            "artist": artist,
            "artistBorn": born,
            "artistDied": died,
            "year": year,
            "materials": materials,
            "description": description,
            "images": [str(out_full.relative_to(BASE)).replace('\\', '/')],
            "thumbnail": str(out_thumb.relative_to(BASE)).replace('\\', '/'),
            "audio": {"de": None, "en": None}
        }
        items.append((n, item))

    # Sort by number
    items.sort(key=lambda x: x[0])
    artworks = [it for _, it in items]

    payload = {"artworks": artworks}

    # Add exhibition meta if present
    if exhibition_meta:
        payload["exhibition"] = {
            "id": BASE.name,
            "title": exhibition_meta.get("title"),
            "date": exhibition_meta.get("date"),
            "description": exhibition_meta.get("description"),
        }

    ARTWORKS_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(artworks)} artworks to {ARTWORKS_JSON}")


if __name__ == "__main__":
    main()
