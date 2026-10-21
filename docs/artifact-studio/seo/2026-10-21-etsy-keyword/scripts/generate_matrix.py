#!/usr/bin/env python3
"""generate_matrix.py
Builds data/optimization-matrix.json and .csv from data/master.json + data/keyword-bank.json.
Per listing: new title, 13 tags, attributes to fill, section fix, video gap, priority score.

Title pattern (decided from the evidence in data/shop-stats-30d.json, listing-stats and the keyword bank):
  <primary keyword in first 40 chars>, <design-specific descriptor>, <karat / size clause>, <occasion clause>
Primary keyword by collection:
  evil eye  -> "Evil Eye <Product> in Solid Gold"      (eRank: evil eye bracelet 2,146 avg searches KD57, evil eye anklet KD1)
  anklets   -> "Solid Gold <Motif> Anklet"              (Alura: solid gold anklet KD17, gold anklet 81.9k, charm motifs uncontested)
  christmas -> "<Motif> <Product>, Solid Gold ..."       (snowflake necklace 1,174 avg KD43; 'christmas jewelry' KD100 is unwinnable)
  men       -> "Mens <Chain|Signet|Wedding Band|...>"    (14k mens bracelet KD29, mens signet ring 1,533 avg KD54)
  women     -> "Solid Gold <Product>" / "Gold Enamel Ring" / "Gold Huggie Earrings" / "Gold Signet Ring"
Rules: title <= 140 chars, never cut mid-word (drop trailing clauses), tags <= 20 chars, lowercase, multi-word,
no fillers, no brand names, no materials the shop does not sell.
"""
import json, re, os, csv, collections, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_master import ABSTRACT

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = lambda *p: os.path.join(ROOT, 'data', *p)

BANNED_WORDS = {'silver', 'sterling', 'plated', 'vermeil', 'filled', 'brass', 'tungsten', 'moissanite', 'platinum',
                'titanium', 'steel', 'cz', 'zirconia', 'wood', 'wooden', 'meteorite', 'carbon', 'cobalt wedding',
                'onyx', 'ruby', 'opal', 'emerald ring', 'garnet', 'peridot', 'amethyst', 'citrine', 'lapis', 'tiger',
                '9k', '9ct', '22k', '24k', 'etsy', 'pandora', 'tiffany', 'cartier', 'mejuri', 'bulk', 'wholesale',
                'supplies', 'supply', 'findings', 'finding', 'diamond'}
XMAS_MOTIFS = ['stocking', 'gingerbread', 'poinsettia', 'bauble', 'bell', 'candy cane', 'snowflake', 'mistletoe',
               'holly', 'christmas tree', 'pine tree', 'ornament']

# (regex on title, motif noun used in title, motif tag words)
MOTIFS = [
    (r'evil eye|nazar', 'Evil Eye', ['evil eye']),
    (r'v necklace|chevron', 'V', ['chevron', 'v shape']), (r'diamond pave', 'Diamond Pave', ['diamond pave', 'pave']),
    (r'candy cane', 'Candy Cane', ['candy cane']), (r'gingerbread heart', 'Gingerbread Heart', ['gingerbread']),
    (r'gingerbread', 'Gingerbread Man', ['gingerbread']), (r'poinsettia', 'Poinsettia', ['poinsettia']),
    (r'bauble', 'Bauble', ['bauble', 'ornament']), (r'christmas bell|\bbell\b', 'Christmas Bell', ['jingle bell']),
    (r'snowflake', 'Snowflake', ['snowflake']), (r'mistletoe', 'Mistletoe', ['mistletoe']),
    (r'holly', 'Holly', ['holly berry']), (r'christmas tree|pine green enamel|pine tree', 'Christmas Tree', ['christmas tree']),
    (r'stocking', 'Stocking', ['stocking']),
    (r'coral', 'Coral Branch', ['coral']), (r'\bpear\b', 'Pear', ['pear', 'fruit']), (r'strawberry', 'Strawberry', ['strawberry', 'fruit']),
    (r'lifebuoy|life ring', 'Lifebuoy', ['lifebuoy', 'nautical']), (r'sand dollar', 'Sand Dollar', ['sand dollar', 'beach']), (r'cowrie', 'Cowrie Shell', ['cowrie', 'shell']), (r'scallop', 'Scallop Shell', ['scallop', 'shell']), (r'spiral shell|seashell', 'Seashell', ['seashell', 'shell']),
    (r'watermelon', 'Watermelon', ['watermelon', 'fruit']), (r'beach umbrella|parasol', 'Beach Umbrella', ['parasol', 'beach']),
    (r'\bbee\b|honeybee', 'Bee', ['bee', 'honeybee']), (r'starfish', 'Starfish', ['starfish', 'beach']), (r'\bfig\b', 'Fig', ['fig', 'fruit']),
    (r'lemon', 'Lemon', ['lemon', 'citrus']), (r'ladybug|ladybird', 'Ladybug', ['ladybug', 'lucky']), (r'scarab', 'Scarab', ['scarab', 'egyptian']),
    (r'snail', 'Snail', ['snail', 'garden']), (r'shooting star', 'Shooting Star', ['shooting star', 'celestial']),
    (r'sun coin|sun charm|sunray|sun rays|\bsun\b', 'Sun', ['sun', 'celestial']), (r'horseshoe', 'Horseshoe', ['horseshoe', 'lucky']),
    (r'hamsa', 'Hamsa Hand', ['hamsa', 'hand of fatima']), (r'terracotta pot|sprout', 'Terracotta Pot', ['plant', 'sprout']),
    (r'amphora', 'Amphora', ['amphora', 'greek vase']),
    (r'frog', 'Frog', ['frog', 'nature']), (r'pea pod', 'Pea Pod', ['pea pod', 'garden']), (r'olive', 'Olive Branch', ['olive branch']),
    (r'clover', 'Four Leaf Clover', ['clover', 'lucky']), (r'peony', 'Peony', ['peony', 'flower']), (r'kiss|lips', 'Lips', ['lips', 'kiss']),
    (r'lollipop', 'Lollipop', ['lollipop', 'candy']), (r'popsicle', 'Popsicle', ['popsicle', 'ice pop']),
    (r'orange enamel flower|flower charm', 'Flower', ['flower', 'floral']), (r'kumquat', 'Kumquat', ['kumquat', 'citrus']),
    (r'orange slice', 'Orange Slice', ['orange slice', 'citrus']), (r'\bfish\b', 'Fish', ['fish', 'ocean']),
    (r'water drop|teardrop', 'Water Drop', ['teardrop', 'water drop']), (r'\bwave\b', 'Wave', ['wave', 'ocean']),
    (r'acorn', 'Acorn', ['acorn', 'autumn']), (r'domino', 'Domino', ['domino', 'graphic']), (r'\bbow\b', 'Bow', ['bow', 'ribbon']),
    (r'cherry', 'Cherry', ['cherry', 'fruit']), (r'button', 'Button', ['button', 'sewing']), (r'keyhole', 'Keyhole', ['keyhole']),
    (r'ginkgo', 'Ginkgo Leaf', ['ginkgo', 'leaf']), (r'checkerboard|checker', 'Checkerboard', ['checkerboard', 'checker']),
    (r'heart', 'Heart', ['heart', 'love']), (r'l shape', 'L Shape', ['geometric', 'letter']), (r'petal', 'Petal', ['petal', 'floral']),
    (r'half moon|crescent', 'Half Moon', ['crescent', 'moon']), (r'comma', 'Comma', ['comma', 'punctuation']),
    (r'rectangle|rectangular', 'Rectangle', ['rectangle', 'geometric']), (r'lozenge', 'Lozenge', ['lozenge', 'geometric']),
    (r'capsule', 'Capsule', ['capsule', 'geometric']), (r'dot disc|disc', 'Disc', ['disc', 'circle']), (r'arch', 'Arch', ['arch', 'geometric']),
    (r'seed', 'Seed', ['seed', 'botanical']), (r'circle', 'Circle', ['circle', 'geometric']), (r'moth', 'Moth', ['moth', 'insect']),
    (r'baroque pearl', 'Baroque Pearl', ['baroque pearl', 'pearl']), (r'twig', 'Twig', ['twig', 'branch']),
    (r'two peaks', 'Two Peaks', ['two peaks', 'mountain']), (r'sunrise mountain|mountain', 'Sunrise Mountain', ['mountain', 'sunrise']), (r'infinity', 'Infinity', ['infinity', 'eternity']),
    (r'lion', 'Lion', ['lion', 'leo']), (r'four point star|star drop', 'Star', ['star', 'celestial']), (r'mobius', 'Mobius', ['mobius', 'twist']),
    (r'five petal flower|rosette|flower ring', 'Flower', ['flower', 'floral']), (r'open rectangle', 'Rectangle', ['rectangle', 'geometric']),
    (r'red stone', 'Red Stone', ['red stone']), (r'blue stone', 'Blue Stone', ['blue stone']), (r'milgrain', 'Milgrain', ['milgrain', 'vintage style']),
    (r'knife edge', 'Knife Edge', ['knife edge']), (r'octagon', 'Octagon', ['octagon', 'faceted']), (r'hexagon', 'Hexagon', ['hexagon', 'geometric']),
    (r'pyramid', 'Pyramid', ['pyramid', 'geometric']), (r'open bar', 'Open Bar', ['open bar', 'geometric']), (r'square', 'Square', ['square', 'geometric']), (r'\bbar\b', 'Bar', ['bar', 'minimalist']),
    (r'hammered', 'Hammered', ['hammered']), (r'dome', 'Dome', ['dome', 'half round']), (r'signet', 'Signet', ['signet']),
    (r'huggie', 'Huggie', ['huggie']), (r'id bar', 'ID Bar', ['id bar', 'nameplate']), (r'station', 'Station', ['station']),
]
CHAINS = [('station', 'Station'), ('figaro', 'Figaro'), ('box chain', 'Box'), ('mariner', 'Mariner'), ('curb', 'Curb'), ('wheat', 'Wheat'), ('rope', 'Rope'),
          ('paperclip', 'Paperclip'), ('elongated cable', 'Elongated Cable'), ('cable', 'Cable')]
COLORS = ['cranberry', 'cobalt blue', 'cranberry red', 'berry pink', 'sage green', 'moss green', 'pine green', 'emerald green', 'cocoa brown',
          'oxblood', 'chartreuse', 'terracotta', 'turquoise', 'cobalt', 'navy', 'teal', 'purple', 'orange', 'yellow', 'green',
          'blue', 'pink', 'red', 'black', 'cream', 'brown', 'clay', 'white', 'emerald', 'sage', 'moss', 'cocoa', 'violet']

def find_motif(title):
    t = title.lower()
    for rx, noun, tags in MOTIFS:
        if re.search(rx, t):
            return noun, tags
    return None, []

def find_color(title):
    t = title.lower()
    for c in COLORS:
        if re.search(r'\b' + c + r'\b', t):
            return c
    return None

def find_chain(title):
    t = title.lower()
    for k, n in CHAINS:
        if k in t:
            return n
    return None

def find_size(title):
    m = re.search(r'(\d+(?:\.\d+)?)\s*(?:x\s*\d+\s*)?mm', title.lower())
    return (m.group(1) + 'mm') if m else None

def karat_phrase(L):
    return '14K Gold' if L['metal'] == '14K only' else '10K 14K 18K'

def product_of(L):
    c = L['category']
    t = L['title'].lower()
    if re.search(r'\bring\b', t) and not any(k in t for k in ['anklet', 'bracelet', 'necklace', 'earring', 'charm']) and 'Rings' not in c:
        return 'ring'
    if 'Anklet' in c: return 'anklet'
    if 'Hoop' in c: return 'hoops'
    if 'Stud' in c: return 'studs'
    if 'Dangle' in c: return 'drops'
    if 'Wedding Bands' in c: return 'wedding band'
    if 'Signet' in c: return 'signet'
    if 'Rings' in c: return 'ring'
    if 'Cuff' in c: return 'cuff'
    if 'Bracelet' in c: return 'bracelet'
    if 'Necklace' in c: return 'necklace'
    return 'jewelry'

def collection_of(L, motif):
    t = L['title'].lower()
    if 'evil eye' in t or 'nazar' in t: return 'evil eye'
    if L['section'] == 'Christmas Collection' or any(m in t for m in XMAS_MOTIFS) or motif in ('Snowflake',):
        if product_of(L) != 'anklet' and 'diamond' not in t and 'lariat' not in t and 'v necklace' not in t:
            return 'christmas'
    if L['section'] == 'For Him' or re.search(r"\bmen'?s?\b|for him|\bmens\b", t): return 'men'
    if product_of(L) == 'anklet': return 'anklet'
    return 'women'

def cap(s):
    return ' '.join(w if w.isupper() or w[:1].isdigit() else w[:1].upper() + w[1:] for w in s.split())

def clean_tag(t):
    t = re.sub(r'[^a-z0-9 ]', '', t.lower()).strip()
    t = re.sub(r'\s+', ' ', t)
    return t

CURRENT_TITLE = ''
def valid_tag(t):
    if not t or len(t) > 20 or ' ' not in t: return False
    allowed = {'diamond'} if 'diamond' in CURRENT_TITLE else set()
    if any(b in t for b in BANNED_WORDS if b not in allowed): return False
    return True

def build(L, bank, pools):
    global CURRENT_TITLE
    title = L['title']; t = title.lower(); CURRENT_TITLE = t
    motif, motif_tags = find_motif(title)
    color = find_color(title)
    chain = find_chain(title)
    size = find_size(title)
    prod = product_of(L)
    coll = collection_of(L, motif)
    kar = karat_phrase(L)
    enamel = 'enamel' in t or any('enamel' in m.lower() for m in L['materials'])
    engr = bool(L['personalizable']) or 'engrav' in t
    ColorEn = (cap(color) + ' Enamel') if (color and enamel) else ('Enamel' if enamel else '')
    own_good = [clean_tag(x) for x, c in L['tag_flags'].items() if c == 'ok']
    PN = {'bracelet', 'ring', 'necklace', 'anklet', 'earrings', 'earring', 'studs', 'stud', 'hoops', 'huggies', 'band', 'cuff', 'pendant',
          'chain', 'charm', 'signet', 'nazar', 'enamel', 'bangle', 'lariat', 'present', 'stuffer'}
    def good_enough(x):
        if x in bank: return True
        ws = x.split()
        return any(w in PN for w in ws) and not any(w in ABSTRACT for w in ws)
    own_good = [x for x in own_good if valid_tag(x) and good_enough(x)]

    # ---------- TITLE ----------
    clauses = []
    tags = []
    if coll == 'evil eye':
        pname = {'anklet': 'Anklet', 'bracelet': 'Bracelet', 'cuff': 'Cuff Bracelet', 'necklace': 'Necklace', 'ring': 'Ring', 'signet': 'Ring'}.get(prod, 'Jewelry')
        clauses = [f'Evil Eye {pname} in Solid Gold']
        detail = ' '.join(x for x in [ColorEn or '', 'Nazar'] if x)
        if 'two-tone' in t or 'two tone' in t: detail = 'Two Tone ' + detail
        if 'heart' in t: detail += ' Heart'
        if 'hexagon' in t: detail += ' Hexagon'
        if 'almond' in t: detail = 'Almond ' + detail
        if 'double' in t or 'mother and child' in t: detail = 'Double ' + detail
        if 'coin' in t: detail += ' Coin'
        if 'bead' in t: detail += ' Beaded'
        if 'lariat' in t: detail += ' Lariat'
        if 'paperclip' in t: detail += ' on Paperclip Chain'
        if 'blue stone' in t or 'red stone' in t: detail = ('Blue' if 'blue' in t else 'Red') + ' Stone Nazar'
        clauses.append(detail.strip())
        third = {'anklet': f'{kar} Ankle Bracelet', 'bracelet': f'{kar} Chain Bracelet', 'cuff': f'{kar} Open Bangle',
                 'necklace': f'{kar} Pendant Necklace', 'ring': f'{kar} Stacking Ring', 'signet': f'{kar} Ring'}[prod]
        clauses.append(third)
        occ = 'Protection Gift for Her' if 'new mom' not in ' '.join(L['tags']).lower() and 'push present' not in ' '.join(L['tags']).lower() else 'New Mom Push Present'
        clauses.append(occ)
        head = {'anklet': ['evil eye anklet', 'gold evil eye anklet', 'solid gold anklet'],
                'bracelet': ['evil eye bracelet', 'nazar bracelet gold', 'solid gold bracelet'],
                'cuff': ['evil eye bracelet', 'solid gold cuff', 'gold cuff bracelet'],
                'necklace': ['evil eye necklace', 'nazar necklace gold', '14k evil eye pendant'],
                'ring': ['evil eye ring', 'gold enamel ring', '14k enamel ring'], 'signet': ['evil eye ring', 'gold enamel ring', '14k enamel ring']}[prod]
        tags += head + ['14k gold evil eye', 'turkish evil eye']
        if color: tags.append(f'{color.split()[-1]} evil eye')
        if enamel: tags.append('enamel evil eye')
        tags += ['protection jewelry', 'dainty evil eye']
        if 'two tone' in t or 'two-tone' in t: tags.append('two tone ' + ('ring' if prod in ('ring', 'signet') else prod if prod != 'cuff' else 'bracelet'))
        tags += [x for x in own_good if x not in tags][:3]
        tags += ['gift for her', 'push present' if 'push present' in ' '.join(L['tags']).lower() else 'protection gift', 'good luck gift']
    elif coll == 'anklet':
        mnoun = motif or 'Charm'
        clauses = [f'Solid Gold {mnoun} Anklet']
        if enamel:
            clauses.append(f'{ColorEn} {mnoun if mnoun != "Charm" else ""} Charm'.replace('  ', ' ').strip())
        else:
            clauses.append(f'Textured {mnoun} Charm' if 'textured' in t else f'Dainty {mnoun} Charm')
        clauses.append(f'{kar} Ankle Bracelet')
        theme = 'Beach' if any(k in t for k in ['ocean', 'sea', 'shell', 'starfish', 'coral', 'wave', 'fish', 'beach', 'sand', 'lifebuoy', 'umbrella']) else ('Garden' if any(k in t for k in ['garden', 'bee', 'snail', 'frog', 'clover', 'plant', 'olive', 'pea', 'peony', 'flower', 'ladybug']) else 'Summer')
        clauses.append(f'{theme} Gift for Her')
        tags += ['solid gold anklet', '14k gold anklet', 'gold charm anklet', 'dainty gold anklet', 'gold ankle bracelet']
        if motif_tags: tags += [f'{motif_tags[0]} anklet', f'{motif_tags[0]} charm']
        if enamel: tags.append('enamel anklet')
        tags += ['beach anklet' if theme == 'Beach' else 'summer anklet', 'anklet for women', 'gift for her', 'layering anklet', 'minimalist anklet']
        tags += [x for x in own_good if x not in tags][:2]
    elif coll == 'christmas':
        mnoun = motif or 'Christmas'
        pname = {'necklace': 'Necklace', 'bracelet': 'Bracelet', 'ring': 'Ring', 'signet': 'Ring', 'cuff': 'Cuff', 'studs': 'Earrings', 'hoops': 'Earrings', 'drops': 'Earrings'}.get(prod, 'Jewelry')
        clauses = [f'{mnoun} {pname}']
        part = {'necklace': 'Pendant', 'bracelet': 'Charm Bracelet', 'ring': 'Band', 'signet': 'Band', 'studs': 'Studs'}.get(prod, 'Charm')
        if 'three' in t or 'three' in t: part = 'Station Bracelet' if prod == 'bracelet' else part
        clauses.append(f'Solid Gold {ColorEn + " " if ColorEn else ""}Christmas {part}'.replace('  ', ' '))
        clauses.append(f'{kar} Holiday Jewelry')
        clauses.append('Stocking Stuffer Gift for Her')
        ptag = {'necklace': 'necklace', 'bracelet': 'bracelet', 'ring': 'ring', 'signet': 'ring', 'cuff': 'bracelet', 'studs': 'earrings', 'hoops': 'earrings', 'drops': 'earrings'}.get(prod, 'jewelry')
        if motif_tags: tags += [f'{motif_tags[0]} {ptag}', f'{motif_tags[0]} charm' if prod != 'ring' else f'{motif_tags[0]} ring']
        tags += [f'christmas {ptag}', f'solid gold {ptag}', f'14k gold {ptag}', 'christmas jewelry', 'holiday jewelry', 'christmas gift', 'stocking stuffer']
        if enamel: tags.append(f'enamel {ptag}' if len(f'enamel {ptag}') <= 20 else 'enamel jewelry')
        tags += ['festive jewelry', 'winter jewelry', 'gift for her', 'dainty ' + ptag]
        tags += [x for x in own_good if x not in tags][:2]
    elif coll == 'men':
        if prod == 'bracelet':
            cn = chain or 'Chain'
            clauses = [f'Mens {cn} Bracelet', f'Solid Gold {size + " " if size else ""}{"Brushed " if "brushed" in t else ""}{"ID Bar " if "id bar" in t else "Bars on Box " if "station" in t and "box" in t else ""}Chain'.replace('  ', ' ')]
            clauses += [f'{kar} Bracelet for Men', 'Gift for Him']
            tags += ['mens gold bracelet', '14k mens bracelet', 'solid gold bracelet', f'{cn.lower()} bracelet', f'mens {cn.lower()} bracelet' if len(f'mens {cn.lower()} bracelet') <= 20 else f'{cn.lower()} chain bracelet', f'gold {cn.lower()} bracelet', 'gold chain bracelet', 'bracelet for men', 'gift for him', 'mens jewelry', 'anniversary gift him', 'groomsman gift', 'boyfriend gift']
            if size: tags.append(f'{size} gold chain')
        elif prod == 'cuff':
            clauses = ['Mens Gold Cuff Bracelet', f'Solid {"Slim " if "slim" in t else ""}{size + " " if size else ""}Open Bangle', f'{kar} Cuff for Men', 'Gift for Him']
            tags += ['mens gold cuff', 'mens cuff bracelet', 'solid gold cuff', 'gold cuff bracelet', '14k cuff bracelet', 'open cuff bracelet', 'thin gold cuff', 'mens bangle', 'bracelet for men', 'gift for him', 'mens jewelry', 'anniversary gift him', 'groomsman gift']
        elif prod in ('ring', 'wedding band', 'signet'):
            if 'wedding' in t or 'band' in t and prod != 'signet' and ('wedding' in t or 'dome' in t or 'brushed' in t or 'hammered' in t):
                desc = ' '.join(x for x in [size, ('Hammered' if 'hammered' in t else 'Brushed' if 'brushed' in t else 'Dome' if 'dome' in t else 'Polished'), 'Ring'] if x)
                clauses = ['Mens Wedding Band', f'Solid Gold {desc}', f'{kar} Band for Him', 'Anniversary Gift']
                tags += ['mens wedding band', 'gold wedding band', 'solid gold band', 'mens gold ring', '14k gold band mens', 'brushed wedding band' if 'brushed' in t else 'hammered gold band' if 'hammered' in t else 'plain gold band', f'{size} wedding band' if size else 'thin mens band', 'male wedding bands', 'groom wedding band', 'ring for him', 'anniversary gift him', 'wedding ring men', 'minimalist band']
            elif 'signet' in t or prod == 'signet':
                shape = 'Square' if 'square' in t else 'Bar' if 'bar' in t else 'Oval'
                # Engraving only when the listing offers personalization (2026-10-21: the square and
                # bar signets have a face left blank on purpose and no personalization field).
                clauses = ['Mens Signet Ring', f'Solid Gold {shape} Pinky Ring', f'{kar} Signet for Him' if engr else f'{kar} Plain Face Signet', 'Engravable Gift for Him' if engr else 'Gift for Him']
                tags += ['mens signet ring', 'gold signet ring', 'solid gold signet', 'pinky signet ring', '14k signet ring', f'{shape.lower()} signet ring', 'mens pinky ring'] + (['custom signet ring', 'engraved signet ring'] if engr else ['plain signet ring', 'gold pinky ring']) + ['mens gold ring', 'gift for him', 'ring for him', 'minimalist signet']
            else:
                desc = ' '.join(x for x in [(motif if motif in ('Knife Edge', 'Octagon', 'Square', 'Bar', 'Hexagon', 'Open Bar') else ''), size, 'Band'] if x)
                clauses = ['Mens Gold Ring', f'Solid {desc}', f'{kar} Minimalist Ring', 'Gift for Him']
                tags += ['mens gold ring', 'solid gold ring men', 'mens minimalist ring', 'thin mens band', 'mens stacking ring', f'{size} gold ring' if size else 'thin gold ring', 'geometric ring men', 'mens gold band', 'ring for him', 'gift for him', 'mens jewelry', 'anniversary gift him', 'boyfriend gift']
        elif prod == 'studs':
            shape = motif if motif in ('Hexagon', 'Square', 'Pyramid', 'Bar', 'Disc', 'Signet') else 'Minimalist'
            clauses = ['Mens Gold Stud Earrings', f'Solid {size + " " if size else ""}{shape} Studs', f'{kar} Single or Pair', 'Gift for Him']
            tags += ['mens gold studs', 'mens stud earring', 'gold stud earrings', 'solid gold studs', '14k gold studs', f'{shape.lower()} stud' if len(f'{shape.lower()} stud') <= 20 else 'geometric stud', 'single stud earring', 'small gold studs', 'earrings for men', 'mens earrings', 'gift for him', 'minimalist studs', 'tiny gold studs']
        elif prod == 'hoops':
            clauses = ['Mens Huggie Earrings', f'Solid Gold {size + " " if size else ""}{"Ribbed " if "ribbed" in t else "Square " if "square" in t else ""}Hoops'.replace('  ', ' '), f'{kar} Huggies for Men', 'Gift for Him']
            tags += ['mens huggie earrings', 'mens hoop earrings', 'gold huggie hoops', 'solid gold huggies', '14k huggie hoops', 'small gold huggies', 'mens gold earrings', 'earrings for men', 'huggie hoop earrings', 'gift for him', 'mens earrings', 'minimalist hoops', 'chunky gold huggies']
        else:
            clauses = ['Mens Gold Drop Earrings', f'Solid Gold Bar Dangle {size or ""}'.strip(), f'{kar} Drop Earrings for Men', 'Gift for Him']
            tags += ['mens drop earrings', 'mens gold earrings', 'gold bar earrings', 'solid gold earrings', 'dangle earrings men', 'bar drop earrings', 'minimalist earrings', 'earrings for men', 'mens dangle earring', 'gift for him', 'mens earrings', 'linear earrings', 'tiny gold dangle']
    else:  # women core / enamel colour collection
        mnoun = motif
        if prod == 'ring' or prod == 'signet' or prod == 'wedding band':
            if prod == 'wedding band':
                clauses = ['Gold Wedding Band', f'Solid 14K Milgrain Comfort Fit Ring {size or ""}'.strip(), 'Satin Center Band', 'Anniversary Gift']
                tags += ['gold wedding band', 'milgrain wedding band', '14k wedding band', 'solid gold band', 'womens wedding band', 'comfort fit band', f'{size} wedding band' if size else 'wide wedding band', 'vintage style band', 'satin finish ring', 'wedding ring', 'anniversary gift', 'stacking band', 'unisex wedding band']
            elif prod == 'signet' or 'signet' in t:
                shape = mnoun if mnoun in ('Capsule', 'Lozenge', 'Keyhole', 'Checkerboard', 'Half Moon', 'Square', 'Seed') else ('Oval' if 'oval' in t else 'Square' if 'square' in t else 'Round')
                clauses = ['Gold Signet Ring', f'Solid Gold {ColorEn + " " if ColorEn else ""}{shape} Signet'.replace('  ', ' '), 'Custom Engraved Pinky Ring' if engr else 'Dainty Pinky Ring', ('Gift for Her' if kar == '14K Gold' else f'{kar} Gift for Her')]
                tags += ['gold signet ring', 'womens signet ring', 'solid gold signet', '14k signet ring', 'pinky signet ring', f'{shape.lower()} signet ring', 'dainty signet ring', 'initial signet ring' if engr else 'minimalist signet']
                if enamel: tags.append('enamel signet ring')
                if engr: tags += ['custom signet ring', 'engraved signet ring']
                tags += ['gift for her', 'push present', 'graduation gift']
            elif enamel:
                clauses = ['Gold Enamel Ring', f'Solid 14K {ColorEn} {mnoun or ""} Band'.replace('  ', ' ').strip(), f'Stacking Ring {kar}' if kar != '14K Gold' else 'Dainty Stacking Ring', 'Gift for Her']
                tags += ['gold enamel ring', '14k enamel ring', 'enamel stacking ring', 'solid gold ring', 'womens enamel ring', 'colorful enamel ring']
                if color: tags.append(f'{color.split()[-1]} enamel ring')
                if motif_tags: tags += [f'{motif_tags[0]} ring', f'{motif_tags[0]} jewelry']
                tags += ['dainty gold ring', 'gift for her', 'stacking ring', 'push present', 'birthday gift']
            else:
                desc = f'14K {mnoun or "Minimalist"} Stacking Band'
                clauses = ['Solid Gold Ring', desc, 'Dainty Stackable Ring' if 'stack' in t else 'Sculptural Statement Ring', 'Gift for Her']
                tags += ['solid gold ring', '14k gold ring', 'gold stacking ring', 'dainty gold ring', 'solid gold thin ring', 'minimalist gold ring']
                if motif_tags: tags += [f'{motif_tags[0]} ring', f'gold {motif_tags[0]} ring']
                tags += ['stackable gold ring', 'gift for her', 'push present', 'anniversary gift', 'promise ring']
        elif prod == 'necklace':
            lar = 'lariat' in t
            clauses = [f'Solid Gold {mnoun + " " if mnoun else ""}{"Lariat " if lar else ""}Necklace'.replace('  ', ' ')]
            clauses.append(f'{ColorEn} Pendant' if ColorEn else (f'{cap(color)} Stone Pendant' if color and 'stone' in t else 'Lab Grown Diamond Pendant' if 'diamond' in t else 'Sculptural Pendant' if 'sculptural' in t or 'mobius' in t else 'Minimalist Pendant'))
            clauses.append(f'{kar} Charm Necklace' if kar != '14K Gold' else '14K Gold Pendant Necklace')
            clauses.append('Gift for Her')
            tags += ['solid gold necklace', '14k gold necklace', 'gold pendant necklace', 'solid gold pendant', 'dainty gold necklace']
            if enamel: tags += ['gold enamel necklace', 'enamel pendant gold']
            if motif_tags: tags += [f'{motif_tags[0]} necklace', f'{motif_tags[0]} pendant']
            if lar: tags.append('gold lariat necklace')
            tags += ['layering necklace', 'gift for her', 'push present', 'minimalist necklace', 'anniversary gift']
        elif prod == 'bracelet':
            if 'bar' in t and enamel:
                clauses = ['Solid Gold Bar Bracelet', f'{ColorEn} {mnoun or "Plaque"}'.strip(), f'{kar} Adjustable Cable Chain', 'Gift for Her']
            else:
                clauses = ['Solid Gold Bracelet', f'{ColorEn + " " if ColorEn else ""}{mnoun + " " if mnoun else ""}Charm on {chain or "Cable"} Chain'.replace('  ', ' ')]
                if 'pave' in t or 'diamond' in t: clauses[1] = 'Diamond Pave Open Circle'
                if 'infinity' in t: clauses[1] = 'Infinity Twist Cable Chain' if 'twist' in t else 'Infinity Charm Cable Chain'
                if 'sunray' in t: clauses[1] = 'Sunray Arc on Cable Chain'
                clauses += [f'{kar} Chain Bracelet', 'Gift for Her']
            tags += ['solid gold bracelet', '14k gold bracelet', 'gold chain bracelet', 'dainty gold bracelet', 'gold charm bracelet']
            if enamel: tags += ['enamel bracelet', 'gold enamel bracelet']
            if motif_tags: tags += [f'{motif_tags[0]} bracelet', f'{motif_tags[0]} charm']
            tags += ['station bracelet' if 'station' in t or 'three' in t else 'thin chain bracelet', 'layering bracelet', 'gift for her', 'push present', 'bridesmaid gift']
        elif prod == 'cuff':
            clauses = ['Solid Gold Cuff Bracelet', f'{ColorEn + " " if ColorEn else ""}{mnoun + " " if mnoun else ""}{"Reeded " if "reeded" in t else "Molten Two Tone " if "two-tone" in t else ""}{size + " " if size else ""}Open Bangle'.replace('  ', ' ')]
            clauses += ['Hidden Engraving' if engr else f'{kar} Stacking Cuff', 'Gift for Her']
            tags += ['solid gold cuff', 'gold cuff bracelet', '14k cuff bracelet', 'gold open cuff', 'solid gold bangle', 'gold cuff for women', 'thin gold cuff' if 'slim' in t or '1.6' in t else 'wide gold cuff', 'stacking cuff']
            if engr: tags += ['engraved gold cuff', 'custom gold cuff']
            if motif_tags: tags.append(f'{motif_tags[0]} bracelet')
            tags += ['gift for her', 'push present', 'anniversary gift', 'bridesmaid gift']
        elif prod == 'studs':
            head = '14K Gold Stud Earrings' if kar == '14K Gold' else 'Solid Gold Stud Earrings'
            clauses = [head, f'{ColorEn + " " if ColorEn else ""}{mnoun + " " if mnoun else ""}Studs {size or ""}'.replace('  ', ' ').strip(), 'Tiny Everyday Studs' if kar == '14K Gold' else f'{kar} Tiny Studs', 'Gift for Her']
            tags += ['14k gold studs', 'solid gold studs', 'gold stud earrings', 'tiny gold studs', 'everyday gold studs', 'small stud earrings']
            if enamel: tags += ['enamel stud earrings', 'enamel studs']
            if motif_tags: tags.append(f'{motif_tags[0]} earrings')
            if 'mismatched' in t: tags.append('mismatched studs')
            tags += ['second hole studs', 'minimalist studs', 'gift for her', 'push present', 'bridesmaid gift']
        elif prod == 'hoops':
            clauses = ['Gold Huggie Earrings', f'Solid Gold {size + " " if size else ""}{"Textured Two Tone " if "two-tone" in t else ""}{(mnoun + " Charm ") if mnoun and mnoun != "Huggie" else ""}Hoops'.replace('  ', ' '), f'{kar} Huggie Hoops', 'Gift for Her']
            tags += ['gold huggie earrings', 'gold huggie hoops', 'solid gold huggies', '14k huggie hoops', 'small gold huggies', 'huggie hoop earrings', 'dainty huggie hoops']
            if motif_tags: tags += [f'{motif_tags[0]} earrings', f'{motif_tags[0]} huggies']
            if enamel: tags.append('enamel huggies')
            tags += ['everyday hoops', 'gift for her', 'push present', 'minimalist hoops']
        else:
            clauses = ['Solid Gold Drop Earrings', f'{ColorEn + " " if ColorEn else ""}{mnoun + " " if mnoun else ""}Dangle {size or ""}'.replace('  ', ' ').strip(), f'{kar} Earrings', 'Gift for Her']
            tags += ['solid gold earrings', 'gold drop earrings', 'gold dangle earrings', '14k gold earrings', 'dainty gold earrings', 'small gold dangle']
            if enamel: tags += ['enamel earrings', 'enamel drop earrings']
            if motif_tags: tags += [f'{motif_tags[0]} earrings', f'{motif_tags[0]} dangle']
            tags += ['gift for her', 'push present', 'bridesmaid gift', 'minimalist earrings']

    # ---------- finalize title ----------
    clauses = [re.sub(r'\s+', ' ', c).strip(' ,') for c in clauses if c and c.strip(' ,')]
    new_title = ', '.join(clauses)
    while len(new_title) > 140 and len(clauses) > 1:
        clauses.pop()
        new_title = ', '.join(clauses)
    new_title = new_title.replace("Men's", 'Mens')

    # ---------- finalize tags ----------
    out = []
    for x in tags:
        x = clean_tag(x)
        if valid_tag(x) and x not in out:
            out.append(x)
    if engr and 'custom engraved ring' not in out and prod in ('ring', 'signet') and len(out) < 13:
        out.append('custom engraved ring')
    # two design-specific tags from this listing's own descriptors (keeps tag sets unique between siblings)
    pw = {'anklet': 'anklet', 'bracelet': 'bracelet', 'cuff': 'cuff', 'necklace': 'necklace', 'ring': 'ring', 'signet': 'signet ring',
          'wedding band': 'band', 'studs': 'studs', 'hoops': 'hoops', 'drops': 'earrings'}[prod]
    spec = []
    if size and '.' not in size: spec.append(f'{size} {pw}')
    if color: spec.append(f'{color.split()[-1]} {pw}')
    for fin in ['hexagon', 'almond', 'heart', 'coin', 'teardrop', 'double', 'paperclip', 'beaded', 'bead', 'lariat', 'cuff', 'brushed', 'ribbed', 'hammered', 'polished', 'textured', 'matte', 'two tone', 'two-tone', 'twisted', 'sculpted', 'openwork', 'bypass', 'lariat', 'id bar', 'station', 'blue stone', 'red stone', 'square profile', 'baroque pearl']:
        if fin in t: spec.append(f'{fin.replace("-", " ")} {pw}')
    if chain: spec.append(f'{chain.lower()} chain {pw}')
    if motif_tags: spec += [f'{motif_tags[0]} {pw}', f'{motif_tags[-1]} {pw}']
    spec2 = []
    for x in spec:
        x = clean_tag(x)
        ws = x.split()
        if len(ws) != len(set(ws)):
            continue
        if valid_tag(x) and x not in out and x not in spec2:
            spec2.append(x)
    keep = spec2[:3]
    while len(out) + len(keep) > 13:
        out.pop()
    out += keep
    # fill from the category pool (style words only when the title has them), then from own good tags
    STYLE = ['rope', 'cuban', 'figaro', 'curb', 'box', 'wheat', 'franco', 'herringbone', 'paperclip', 'tennis', 'nugget', 'opal', 'pearl', 'diamond',
             'pave', 'cz', 'tragus', 'conch', 'cartilage', 'nose', 'septum', 'helix', 'flat back', 'screw', 'ball', 'heart', 'star', 'moon', 'cross',
             'crucifix', 'rosary', 'name', 'initial', 'birthstone', 'toe', 'knot', 'twist', 'dome', 'engraved', 'custom', 'personalized', 'crest',
             'family', 'zodiac', 'skull', 'celtic', 'masonic', 'roman', 'wax', 'locket', 'choker', 'hand chain', 'arm', 'ear cuff', 'sleepers', 'cherry',
             'bow', 'flower', 'floral', 'rose', 'cat', 'fish', 'letters', 'wide', 'thick', 'chunky', 'bold', 'large', 'mini', 'tiny', 'thin', 'cuff',
             'bangle', 'beaded', 'bead', 'crystal', 'turquoise', 'emerald', 'sapphire', 'ruby', 'lab', 'enamel', 'eye', 'evil', 'nazar', 'lucky', 'luck']
    def pool_ok(k):
        for w in STYLE:
            if re.search(r'\b' + re.escape(w) + r'\b', k) and w not in t and w not in ' '.join(motif_tags):
                return False
        return True
    pool = [k for k in pools.get(('any', prod), []) if pool_ok(k)] + own_good
    for x in pool:
        if len(out) >= 13: break
        x = clean_tag(x)
        if valid_tag(x) and x not in out:
            out.append(x)
    out = out[:13]
    return new_title, out, {'collection': coll, 'product': prod, 'motif': motif, 'color': color, 'chain': chain, 'size': size}

SECTION_FOR = {'evil eye': 'Evil Eye', 'christmas': 'Christmas Collection', 'men': 'For Him', 'anklet': 'Anklets'}
PROD_SECTION = {'bracelet': 'Bracelets', 'cuff': 'Bracelets', 'necklace': 'Necklaces', 'ring': 'Rings', 'signet': 'Rings',
                'wedding band': 'Rings', 'studs': 'Earrings', 'hoops': 'Earrings', 'drops': 'Earrings', 'anklet': 'Anklets'}

def attributes_to_fill(L, info):
    names = L.get('attr_names') or []
    filled = set(L['attributes'].keys())
    sugg = {}
    t = L['title'].lower()
    for n in names:
        if n in filled: continue
        if n == 'Materials': sugg[n] = 'Gold' + ('; Enamel' if 'enamel' in t else '')
        elif n == 'Gold solidity': sugg[n] = 'Solid gold'
        elif n == 'Gold purity': sugg[n] = '14k' if L['metal'] == '14K only' else '14k; 18k; 10k'
        elif n == 'Primary color': sugg[n] = 'Gold'
        elif n == 'Secondary color' and info['color']: sugg[n] = info['color'].split()[-1].capitalize()
        elif n == 'Gem color' and info['color'] and 'enamel' in t: sugg[n] = info['color'].split()[-1].capitalize()
        elif n == 'Recipient': sugg[n] = 'Men' if info['collection'] == 'men' else 'Women; Girls'
        elif n == 'Holiday' and info['collection'] == 'christmas': sugg[n] = 'Christmas'
        elif n == 'Theme' and info['collection'] == 'evil eye': sugg[n] = 'Evil eye'
        elif n == 'Theme' and info['collection'] == 'christmas': sugg[n] = 'Christmas'
        elif n == 'Occasion' and info['collection'] in ('women', 'anklet'): sugg[n] = 'Anniversary; Birthday'
        elif n == 'Style': sugg[n] = 'Minimalist'
        elif n in ('Adjustable', 'Spinner', 'Raw stone'): sugg[n] = 'No'
        elif n == 'Can be personalized' and L['personalizable']: sugg[n] = 'Yes'
        elif n == 'Location' and 'earring' in L['category'].lower(): sugg[n] = 'Earlobe'
        elif n == 'Closure' and info['product'] in ('bracelet', 'anklet', 'necklace'): sugg[n] = 'Lobster claw'
        elif n == 'Chain style' and info['chain']: sugg[n] = info['chain']
        elif n == 'Band width' and info['size']: sugg[n] = info['size']
    return sugg

def main():
    m = json.load(open(D('master.json')))
    bank = json.load(open(D('keyword-bank.json')))
    attr_names = m['attrNamesByCategory']
    # category tag pools from the bank: tag-valid, opportunity ranked, product word match
    pools = collections.defaultdict(list)
    ranked = sorted([v for v in bank.values() if v['tag_valid'] and (v.get('alura_volume') or 0) >= 3000], key=lambda v: -v['opportunity'])
    PRODWORDS = {'anklet': ['anklet'], 'bracelet': ['bracelet'], 'cuff': ['cuff', 'bangle'], 'necklace': ['necklace', 'pendant'],
                 'ring': ['ring'], 'signet': ['signet'], 'wedding band': ['wedding band', 'band'], 'studs': ['stud'], 'hoops': ['huggie', 'hoop'], 'drops': ['earring']}
    for v in ranked:
        k = v['keyword']
        if any(b in k for b in BANNED_WORDS) or 'christmas' in k or 'evil' in k or 'mens' in k or "men's" in k or 'push' in k: continue
        for prod, words in PRODWORDS.items():
            if any(w in k for w in words):
                pools[('any', prod)].append(k)
    rows = []
    for L in m['listings']:
        L['attr_names'] = attr_names.get(L['category'], [])
        title, tags, info = build(L, bank, pools)
        sugg = attributes_to_fill(L, info)
        target_section = SECTION_FOR.get(info['collection']) or PROD_SECTION.get(info['product'], L['section'])
        v = L['stats30']['views']
        priority = (L['salad_tags'] * 3 + min(v, 60) + (10 if L['attr_filled'] == 0 else 0) + (5 if not L['has_video'] else 0)
                    + (10 if L['non_english_title'] else 0) + (5 if v == 0 else 0) + (5 if L['wrong_section'] else 0))
        cat_fix = (info['product'] == 'ring' and 'Rings' not in L['category'])
        rows.append({
            'listing_id': L['id'], 'category_fix': 'Jewelry > Rings > Stackable Rings' if cat_fix else '', 'priority': priority, 'tag_class': L['tag_class'], 'salad_tags': L['salad_tags'],
            'views_30d': v, 'orders_30d': L['stats30']['orders'], 'favorites_30d': L['stats30']['favorites'],
            'price_usd': L['price_usd'], 'category': L['category'], 'collection': info['collection'], 'product': info['product'],
            'motif': info['motif'], 'current_title': L['title'], 'new_title': title, 'current_tags': L['tags'], 'new_tags': tags,
            'current_section': L['section'], 'target_section': target_section, 'section_fix': target_section != L['section'],
            'attributes_filled': L['attr_filled'], 'attributes_to_fill': sugg, 'video_gap': not L['has_video'],
            'images': L['images'], 'personalizable': bool(L['personalizable']),
        })
    rows.sort(key=lambda r: -r['priority'])
    json.dump(rows, open(D('optimization-matrix.json'), 'w'), indent=1, ensure_ascii=False)
    with open(D('optimization-matrix.csv'), 'w', newline='') as f:
        w = csv.writer(f)
        w.writerow(['listing_id', 'priority', 'tag_class', 'salad_tags', 'views_30d', 'orders_30d', 'price_usd', 'collection', 'product',
                    'motif', 'current_title', 'new_title', 'new_tags', 'current_section', 'target_section', 'section_fix',
                    'attributes_filled', 'attributes_to_fill', 'video_gap', 'images', 'category_fix'])
        for r in rows:
            w.writerow([r['listing_id'], r['priority'], r['tag_class'], r['salad_tags'], r['views_30d'], r['orders_30d'], r['price_usd'],
                        r['collection'], r['product'], r['motif'] or '', r['current_title'], r['new_title'], ' | '.join(r['new_tags']),
                        r['current_section'], r['target_section'], 'yes' if r['section_fix'] else '', r['attributes_filled'],
                        '; '.join(f'{k}: {v}' for k, v in r['attributes_to_fill'].items()), 'needs video' if r['video_gap'] else '', r['images'], r.get('category_fix', '')])
    print(len(rows), 'rows written')

if __name__ == '__main__':
    main()
