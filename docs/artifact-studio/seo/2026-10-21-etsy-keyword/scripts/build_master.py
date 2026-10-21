#!/usr/bin/env python3
"""build_master.py
Merges listings.json + per-listing stats + keyword research into data/master.json
and writes data/diagnosis.json with the tag-quality classification and roll-ups.

Usage: python3 scripts/build_master.py
"""
import json, csv, re, os, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = lambda *p: os.path.join(ROOT, 'data', *p)

PRODUCT_NOUNS = {
    'bracelet', 'bracelets', 'ring', 'rings', 'necklace', 'necklaces', 'anklet', 'anklets', 'earring', 'earrings',
    'stud', 'studs', 'hoop', 'hoops', 'huggie', 'huggies', 'band', 'bands', 'cuff', 'bangle', 'pendant', 'chain',
    'charm', 'charms', 'signet', 'eye', 'nazar', 'enamel', 'jewelry', 'jewellery', 'lariat', 'choker', 'present',
    'gift', 'stuffer', 'wedding', 'clasp', 'link', 'bar', 'coin', 'disc', 'figaro', 'curb', 'rope', 'wheat', 'box',
    'mariner', 'cable', 'paperclip', 'station', 'tile', 'ornament', 'bauble', 'bell', 'stocking', 'tree', 'snowflake',
    'cane', 'mistletoe', 'holly', 'poinsettia', 'gingerbread', 'cookie', 'acorn', 'domino', 'bow', 'ribbon', 'heart',
    'cherry', 'button', 'keyhole', 'ginkgo', 'leaf', 'shell', 'starfish', 'coral', 'pear', 'strawberry', 'watermelon',
    'lemon', 'fig', 'kumquat', 'orange', 'lollipop', 'popsicle', 'lips', 'kiss', 'frog', 'bee', 'ladybug', 'ladybird',
    'scarab', 'snail', 'fish', 'wave', 'drop', 'star', 'sun', 'moon', 'horseshoe', 'hamsa', 'clover', 'peony', 'flower',
    'pot', 'sprout', 'cowrie', 'amphora', 'olive', 'pod', 'umbrella', 'parasol', 'lifebuoy', 'moth', 'insect', 'twig',
    'pearl', 'infinity', 'lion', 'mountain', 'mobius', 'peaks', 'hexagon', 'octagon', 'pyramid', 'square', 'oval',
    'checker', 'checkerboard', 'lozenge', 'capsule', 'comma', 'arch', 'rectangle', 'petal', 'seed', 'crescent', 'knot',
    'cross', 'ankle', 'wrist', 'piercing', 'earlobe', 'back', 'monogram', 'initial', 'nameplate', 'pinky', 'stacking',
    'stackable', 'stacker', 'engraved', 'engraving', 'personalized', 'custom', 'mens', "men's", 'men', 'women', 'womens',
    'kids', 'tube', 'wire', 'profile', 'bypass', 'open', 'dome', 'knife', 'edge', 'hammered', 'brushed', 'matte',
    'polished', 'textured', 'ribbed', 'reeded', 'molten', 'sculptural', 'sculpted', 'tone', 'two', 'mixed', 'metal',
    'yellow', 'white', 'rose', 'gold', '14k', '10k', '18k', 'solid', 'enamel', 'vitreous', 'blue', 'red', 'green',
    'pink', 'purple', 'orange', 'black', 'cream', 'navy', 'teal', 'cobalt', 'turquoise', 'oxblood', 'sage', 'moss',
    'cocoa', 'brown', 'clay', 'terracotta', 'chartreuse', 'berry', 'emerald', 'cranberry', 'ottoman', 'iznik', 'turkish',
    'greek', 'mediterranean', 'ocean', 'beach', 'summer', 'winter', 'christmas', 'holiday', 'xmas', 'valentine',
    'valentines', 'mothers', 'mom', 'push', 'birthday', 'anniversary', 'graduation', 'bridesmaid', 'groomsman',
    'girlfriend', 'boyfriend', 'husband', 'wife', 'him', 'her', 'dad', 'friend', 'protection', 'protective', 'lucky',
    'luck', 'talisman', 'amulet', 'spiritual', 'botanical', 'nature', 'garden', 'fruit', 'food', 'woodland', 'autumn',
    'fall', 'nautical', 'celestial', 'zodiac', 'minimalist', 'dainty', 'tiny', 'small', 'thin', 'chunky', 'wide',
    'single', 'pair', 'set', 'made', 'order', 'length', 'size', 'mm', 'inch',
}
FILLERS = {
    'handcrafted', 'everyday', 'minimalist', 'statement', 'comfortable', 'occasion', 'accessory', 'sophisticated',
    'luxury', 'wearable', 'abstract', 'contemporary', 'special', 'modern', 'professional', 'elegant', 'masculine',
    'classic', 'durable', 'premium', 'artisan', 'designer', 'quality', 'versatile', 'polished', 'personalized',
    'rustic', 'alternative', 'investment', 'heirloom', 'hallmarked', 'authentic', 'certified', 'refined', 'understated',
    'subtle', 'sleek', 'neutral', 'compact', 'lightweight', 'delicate', 'inspired', 'meaningful', 'symbolic', 'cultural',
    'traditional', 'bohemian', 'boho', 'fashion', 'fashionable', 'trendy', 'stylish', 'chic', 'casual', 'formal',
    'appropriate', 'office', 'workplace', 'weekend', 'daily', 'simple', 'plain', 'basic', 'genuine', 'real', 'fine',
    'pure', 'solid', 'sustainable', 'friendly', 'aesthetic', 'artistic', 'creative', 'unique', 'whimsical', 'playful',
    'cute', 'romantic', 'feminine', 'colorful', 'vibrant', 'bold', 'strong', 'seasonal', 'festive', 'themed',
    'collection', 'design', 'detail', 'finish', 'texture', 'idea', 'ideas', 'present', 'treasure', 'keepsake',
    'collectible', 'signature', 'identity', 'wear', 'fit', 'option', 'thoughtful', 'affordable', 'boutique',
    'conversation', 'starter', 'cottage', 'core', 'cottagecore', 'resistant', 'tarnish', 'hypoallergenic', 'sensitive',
    'skin', 'nickel', 'free', 'waterproof', 'combination', 'dimensional', 'decorative', 'cheerful', 'celebration',
    'party', 'sweater', 'metallic', 'decoration', 'coating', 'painted', 'hand', 'forward', 'art', 'work', 'room',
    'student', 'couture', 'textile', 'quilter', 'dressmaker', 'closure', 'front', 'low', 'rounded', 'petite', 'retro',
    'wax', 'enthusiast', 'woman', 'man', 'male', 'unisex', 'adult', 'girl', 'best', 'new', 'a', 'and', 'for', 'the',
    'in', 'of', 'with', 'y', 'me', 'kis', 'bypas', 'vitreou', 'christma', 'jewelry', 'stacking', 'layering', 'everyday',
    'gift', 'her', 'him', '14k', '10k', '18k', '14', 'gold', 'yellow', 'white', 'rose', 'thin', 'small', 'tiny',
    'dainty', 'luxury', 'elegance', 'geometric', 'spiritual', 'protective', 'protection', 'mystical', 'eastern',
    'middle', 'symbol', 'ancient', 'mythology', 'classical', 'souvenir', 'folklore', 'tradition', 'heritage',
    'heraldic', 'bespoke', 'crest', 'badge', 'seal', 'family', 'promotion', 'milestone', 'relationship', 'commitment',
    'eternity', 'eternal', 'birthstone', 'gemstone', 'crystal', 'healing', 'kabbalah', 'warding', 'bad', 'good',
    'fortune', 'prosperity', 'luck', 'lucky', 'talisman', 'amulet', 'meditation', 'astrology', 'constellation',
    'sparkling', 'stunning', 'beautiful', 'majestic', 'wildlife', 'courage', 'leadership', 'confidence', 'strength',
    'icon', 'adventurer', 'traveler', 'outdoor', 'geology', 'dawn', 'horizon', 'landscape', 'topological',
    'mathematical', 'punctuation', 'scandinavian', 'architectural', 'linear', 'angular', 'sculpture', 'sculptural',
    'compatible', 'accessible', 'fitting', 'option', 'shape', 'face', 'top', 'flat', 'three', 'matte', 'solid',
    'molten', 'satin', 'brushed', 'grooved', 'textured', 'striped', 'chunky', 'wide', 'long', 'extended', 'open',
    'wrapped', 'beaded', 'bead', 'braided', 'spiga', 'italian', 'square', 'rectangular', 'rectangle', 'round', 'oval',
    'relief', 'tube', 'wire', 'profile', 'hole', 'second', 'single', 'pair', 'back', 'butterfly', 'screw', 'post',
    'piercing', 'lobe', 'engagement', 'wedding', 'anniversary', 'birthday', 'graduation', 'valentine', 'valentines',
    'bridesmaid', 'groomsman', 'girlfriend', 'boyfriend', 'husband', 'wife', 'mother', 'mom', 'baby', 'child', 'dad',
    'brother', 'coworker', 'friend', 'friendship', 'housewarming', 'corporate', 'promise', 'push', 'home', 'sky',
    'frozen', 'ice', 'weather', 'snow', 'december', 'yuletide', 'chocolate', 'harvest', 'forest', 'woodland',
    'nature', 'natural', 'organic', 'botanical', 'vegetable', 'garden', 'beetle', 'bug', 'sea', 'sailor', 'seafarer',
    'maritime', 'marine', 'boating', 'fisherman', 'anchor', 'tile', 'block', 'color', 'pattern', 'y2k', 'checker',
    'graphic', 'lime', 'green', 'blue', 'red', 'pink', 'purple', 'violet', 'orange', 'black', 'brown', 'cream',
    'navy', 'teal', 'cobalt', 'turquoise', 'clay', 'oxblood', 'sage', 'moss', 'cocoa', 'berry', 'emerald', 'cranberry',
    'midnight', 'bright', 'golden', 'gold', 'plated', 'vermeil', 'filled', 'sterling', 'silver', 'brass', 'glass',
    'ceramic', 'sapphire', 'diamond', 'moissanite', 'opal', 'onyx', 'ruby', 'pearl', 'lapis', 'tungsten',
}
# Words that make a tag a real product/intent tag. A tag is "salad" when it has no anchor noun
# (product type, motif, chain style, occasion noun) OR when it is a random jumble like "gift tube him luxury".
ANCHORS = {
    'bracelet', 'bracelets', 'ring', 'rings', 'necklace', 'necklaces', 'anklet', 'anklets', 'earring', 'earrings',
    'stud', 'studs', 'hoop', 'hoops', 'huggie', 'huggies', 'band', 'bands', 'cuff', 'bangle', 'pendant', 'chain',
    'charm', 'charms', 'signet', 'lariat', 'choker', 'nazar', 'enamel', 'jewelry', 'eye', 'present', 'gift', 'stuffer',
    'figaro', 'curb', 'rope', 'wheat', 'mariner', 'cable', 'paperclip', 'station', 'ornament', 'bauble', 'bell',
    'stocking', 'tree', 'snowflake', 'cane', 'mistletoe', 'holly', 'poinsettia', 'gingerbread', 'cookie', 'acorn',
    'domino', 'bow', 'ribbon', 'heart', 'cherry', 'button', 'keyhole', 'ginkgo', 'leaf', 'shell', 'starfish', 'coral',
    'pear', 'strawberry', 'watermelon', 'lemon', 'fig', 'kumquat', 'orange', 'lollipop', 'popsicle', 'lips', 'kiss',
    'frog', 'bee', 'honeybee', 'ladybug', 'ladybird', 'scarab', 'snail', 'fish', 'wave', 'horseshoe', 'hamsa',
    'clover', 'peony', 'flower', 'sprout', 'cowrie', 'amphora', 'olive', 'pod', 'umbrella', 'parasol', 'lifebuoy',
    'moth', 'insect', 'twig', 'pearl', 'infinity', 'lion', 'mountain', 'mobius', 'pyramid', 'checkerboard', 'lozenge',
    'capsule', 'comma', 'arch', 'petal', 'seed', 'crescent', 'knot', 'cross', 'monogram', 'initial', 'nameplate',
    'pinky', 'stacking', 'stackable', 'engraved', 'engraving', 'personalized', 'custom', 'mens', "men's", 'wedding',
    'hammered', 'dome', 'knife', 'edge', 'two tone', 'mixed metal', 'christmas', 'holiday', 'xmas', 'valentine',
    'valentines', 'mothers', 'push', 'birthday', 'anniversary', 'graduation', 'bridesmaid', 'groomsman', 'protection',
    'ottoman', 'iznik', 'turkish', 'greek', 'mediterranean', 'ocean', 'beach', 'summer', 'winter', 'fall', 'autumn',
    'nautical', 'celestial', 'zodiac', 'sun', 'star', 'moon', 'drop', 'teardrop', 'hexagon', 'octagon', 'square',
    'disc', 'coin', 'bar', 'link', 'clasp', 'made', 'order',
}

ABSTRACT = {
    'handcrafted', 'handmade', 'everyday', 'minimalist', 'statement', 'comfortable', 'comfort', 'occasion', 'accessory',
    'sophisticated', 'luxury', 'wearable', 'abstract', 'contemporary', 'special', 'modern', 'professional', 'elegant',
    'elegance', 'classic', 'durable', 'premium', 'artisan', 'designer', 'quality', 'versatile', 'alternative',
    'investment', 'heirloom', 'hallmarked', 'authentic', 'certified', 'refined', 'understated', 'subtle', 'sleek',
    'neutral', 'compact', 'lightweight', 'delicate', 'inspired', 'meaningful', 'symbolic', 'cultural', 'traditional',
    'bohemian', 'boho', 'fashion', 'fashionable', 'trendy', 'stylish', 'chic', 'casual', 'formal', 'appropriate',
    'office', 'workplace', 'weekend', 'daily', 'simple', 'genuine', 'fine', 'sustainable', 'aesthetic', 'artistic',
    'creative', 'unique', 'whimsical', 'playful', 'romantic', 'feminine', 'masculine', 'colorful', 'vibrant',
    'seasonal', 'festive', 'themed', 'collection', 'design', 'idea', 'keepsake', 'collectible', 'signature',
    'thoughtful', 'affordable', 'boutique', 'conversation', 'starter', 'resistant', 'tarnish', 'hypoallergenic',
    'sensitive', 'decorative', 'cheerful', 'celebration', 'metallic', 'coating', 'spiritual', 'protective', 'mystical',
    'eastern', 'symbol', 'ancient', 'classical', 'folklore', 'tradition', 'heritage', 'heraldic', 'bespoke',
    'eternity', 'gemstone', 'crystal', 'healing', 'warding', 'fortune', 'prosperity', 'sparkling', 'stunning',
    'beautiful', 'majestic', 'courage', 'leadership', 'confidence', 'strength', 'icon', 'adventurer', 'traveler',
    'geology', 'dawn', 'horizon', 'topological', 'mathematical', 'punctuation', 'scandinavian', 'architectural',
    'linear', 'angular', 'sculptural', 'compatible', 'accessible', 'fitting', 'enthusiast', 'rustic', 'treasure',
    'identity', 'wear', 'option', 'cottage', 'core', 'intricate', 'ornamental', 'distinctive', 'cocktail', 'vintage',
    'retro', 'petite', 'minimal', 'polished', 'quality', 'dimensional', 'forward', 'work', 'art', 'room', 'student',
    'couture', 'textile', 'quilter', 'dressmaker', 'closure', 'front', 'low', 'rounded', 'wax', 'woman', 'man', 'male',
    'unisex', 'adult', 'girl', 'best', 'new', 'me', 'y', 'a', 'and', 'the', 'in', 'of', 'with', 'kis', 'bypas',
    'vitreou', 'christma', 'investment', 'celestial', 'geometric', 'layering', 'stacking', 'sweater', 'party',
    'weather', 'frozen', 'ice', 'chocolate', 'harvest', 'souvenir', 'mythology', 'middle', 'protection', 'talisman',
    'amulet', 'meditation', 'astrology', 'constellation', 'relationship', 'commitment', 'milestone', 'promotion',
    'birthstone', 'kabbalah', 'bad', 'good', 'luck', 'lucky', 'friendship', 'housewarming', 'corporate', 'promise',
    'home', 'sky', 'nature', 'natural', 'organic', 'botanical', 'inspired', 'metal', 'mixed', 'three', 'flat', 'top',
    'face', 'shape', 'hole', 'second', 'back', 'tube', 'wire', 'profile', 'finish', 'texture', 'detail', 'satin',
    'brushed', 'grooved', 'textured', 'striped', 'chunky', 'wide', 'long', 'extended', 'open', 'wrapped', 'braided',
    'spiga', 'italian', 'square', 'rectangular', 'round', 'relief', 'plain', 'thin', 'small', 'tiny', 'dainty',
    'single', 'pair', 'set', 'piece', 'present',
}
STRONG = {
    'bracelet', 'bracelets', 'ring', 'rings', 'necklace', 'necklaces', 'anklet', 'anklets', 'earring', 'earrings',
    'stud', 'studs', 'hoop', 'hoops', 'huggie', 'huggies', 'band', 'bands', 'cuff', 'bangle', 'pendant', 'chain',
    'charm', 'charms', 'signet', 'lariat', 'choker', 'nazar', 'figaro', 'curb', 'rope', 'wheat', 'mariner', 'cable',
    'paperclip', 'station', 'ornament', 'bauble', 'bell', 'stocking', 'tree', 'snowflake', 'cane', 'mistletoe',
    'holly', 'poinsettia', 'gingerbread', 'cookie', 'acorn', 'domino', 'bow', 'ribbon', 'heart', 'cherry', 'button',
    'keyhole', 'ginkgo', 'leaf', 'shell', 'starfish', 'coral', 'pear', 'strawberry', 'watermelon', 'lemon', 'fig',
    'kumquat', 'orange', 'lollipop', 'popsicle', 'lips', 'kiss', 'frog', 'bee', 'honeybee', 'ladybug', 'ladybird',
    'scarab', 'snail', 'fish', 'wave', 'horseshoe', 'hamsa', 'clover', 'peony', 'flower', 'sprout', 'cowrie',
    'amphora', 'olive', 'pod', 'umbrella', 'parasol', 'lifebuoy', 'moth', 'insect', 'twig', 'pearl', 'infinity',
    'lion', 'mountain', 'mobius', 'pyramid', 'checkerboard', 'checker', 'lozenge', 'capsule', 'comma', 'arch', 'petal',
    'seed', 'crescent', 'knot', 'cross', 'monogram', 'initial', 'nameplate', 'pinky', 'engraved', 'engraving',
    'personalized', 'custom', 'mens', "men's", 'wedding', 'hammered', 'dome', 'knife', 'edge', 'christmas', 'holiday',
    'xmas', 'valentine', 'valentines', 'mothers', 'push', 'birthday', 'anniversary', 'graduation', 'bridesmaid',
    'groomsman', 'ottoman', 'iznik', 'turkish', 'greek', 'mediterranean', 'ocean', 'beach', 'summer', 'winter',
    'fall', 'autumn', 'nautical', 'zodiac', 'sun', 'star', 'moon', 'drop', 'teardrop', 'hexagon', 'octagon', 'disc',
    'coin', 'bar', 'link', 'clasp', 'order', 'enamel', 'eye', 'stuffer', 'mom', 'dad', 'husband', 'wife', 'boyfriend',
    'girlfriend', 'stackable', 'layering', 'minimalist', 'dainty', 'gold', 'solid', '14k', '10k', '18k', 'yellow',
    'white', 'rose', 'two', 'tone', 'hoops',
}
WEAK = {'gift', 'jewelry', 'present', 'for him', 'for her', 'her', 'him', 'men', 'women', 'womens'}
PRODUCT = {'bracelet', 'bracelets', 'ring', 'rings', 'necklace', 'necklaces', 'anklet', 'anklets', 'earring',
           'earrings', 'stud', 'studs', 'hoop', 'hoops', 'huggie', 'huggies', 'band', 'bands', 'cuff', 'bangle',
           'pendant', 'chain', 'charm', 'charms', 'signet', 'lariat', 'choker', 'nazar', 'eye', 'enamel'}

def tag_class(tag: str) -> str:
    """'ok' or 'salad'. Salad = no product/motif anchor, a truncated or dangling jumble, or an abstract-adjective
    bag with at most one weak anchor (e.g. 'gift tube him luxury', 'everyday jewelry 14k', 'handcrafted everyday')."""
    t = tag.lower().strip()
    words = re.findall(r"[a-z0-9']+", t)
    if not words:
        return 'salad'
    strong = [w for w in words if w in STRONG]
    product = [w for w in words if w in PRODUCT]
    weak = any(w in WEAK for w in words) or 'for him' in t or 'for her' in t
    abstract = sum(1 for w in words if w in ABSTRACT)
    if any(w in {'christma', 'vitreou', 'bypas', 'kis'} for w in words):
        return 'salad'
    if words[-1] in {'for', 'a', 'and', 'in', 'of', 'y', 'me', 'the', 'with'} or words[0] in {'for', 'and', 'in', 'of', 'a', 'the'}:
        return 'salad'
    if not strong and not weak:
        return 'salad'
    if t in {'gift for him', 'gift for her', 'gifts for him', 'gifts for her', 'minimalist jewelry', 'dainty jewelry',
             'mens jewelry', "men's jewelry", 'push present', 'new mom gift', 'christmas gift', 'made to order'}:
        return 'ok'
    OCCASION = {'anniversary', 'birthday', 'graduation', 'wedding', 'engagement', 'valentine', 'valentines',
                'christmas', 'holiday', 'bridesmaid', 'groomsman', 'promise', 'mothers'}
    if not product and len(words) == 2 and all(w in OCCASION for w in words):
        return 'salad'
    if not product and words[-1] in {'her', 'him'} and 'for' not in words:
        return 'salad'
    if not product and not any(w in STRONG and w not in {'gold', 'solid', '14k', '10k', '18k', 'yellow', 'white', 'rose', 'two', 'tone', 'minimalist', 'dainty', 'layering', 'stackable'} for w in words):
        # e.g. "minimalist statement", "everyday jewelry 14k", "gift 14k for him"
        if abstract >= 1 or len(words) >= 3:
            return 'salad'
    if len(words) >= 3 and abstract >= 2 and len(product) <= 1 and len(strong) <= 2:
        return 'salad'
    return 'ok'

def listing_class(tags):
    n_salad = sum(1 for t in tags if tag_class(t) == 'salad')
    if n_salad >= 7:
        return 'SALAD', n_salad
    if n_salad >= 3:
        return 'MIXED', n_salad
    return 'OK', n_salad

def load_stats(path):
    out = {}
    with open(path) as f:
        for r in csv.DictReader(f, delimiter='\t'):
            out[r['listing_id']] = {'views': int(r['views']), 'orders': int(r['orders']),
                                    'revenue_usd': float(r['revenue_usd'] or 0), 'favorites': int(r['favorites']),
                                    'status': r['status']}
    return out

def price_band(p):
    if p < 500: return 'under 500'
    if p < 750: return '500 to 749'
    if p < 1000: return '750 to 999'
    return '1000 plus'

def metal_of(L):
    m = ' '.join(L['materials']).lower()
    if '14k yellow' in m and '10k' not in m: return '14K only'
    if '14k' in m and '10k' in m and '18k' in m: return '10K 14K 18K options'
    return 'solid gold (karat options)'

def main():
    d = json.load(open(D('listings.json')))
    s30 = load_stats(D('listing-stats-30d.tsv'))
    s90 = load_stats(D('listing-stats-90d.tsv'))
    sections = {s['id']: s['title'] for s in d['sections']}
    sections[None] = 'No Section'
    for L in d['listings']:
        L['section'] = sections.get(L['sectionId'], 'No Section')
        L['stats30'] = s30.get(L['id'], {'views': 0, 'orders': 0, 'revenue_usd': 0, 'favorites': 0, 'status': 'Active'})
        L['stats90'] = s90.get(L['id'], L['stats30'])
        cls, n = listing_class(L['tags'])
        L['tag_class'] = cls
        L['salad_tags'] = n
        L['tag_flags'] = {t: tag_class(t) for t in L['tags']}
        L['attr_filled'] = len(L['attributes'])
        L['price_band'] = price_band(L['price_usd'])
        L['metal'] = metal_of(L)
        L['non_english_title'] = bool(re.search(r'[çğıöşü]', L['title'].lower()))
        L['wrong_section'] = (L['section'] == 'No Section')
        L['has_video'] = bool(L['video'])
    json.dump(d, open(D('master.json'), 'w'), indent=1, ensure_ascii=False)

    Ls = d['listings']
    def rollup(key):
        g = collections.defaultdict(lambda: {'listings': 0, 'views': 0, 'orders': 0, 'revenue': 0.0, 'favorites': 0})
        for L in Ls:
            k = key(L); r = g[k]
            r['listings'] += 1; r['views'] += L['stats30']['views']; r['orders'] += L['stats30']['orders']
            r['revenue'] += L['stats30']['revenue_usd']; r['favorites'] += L['stats30']['favorites']
        return dict(g)
    diag = {
        'listings_active': len(Ls),
        'by_tag_class': rollup(lambda L: L['tag_class']),
        'by_price_band': rollup(lambda L: L['price_band']),
        'by_metal': rollup(lambda L: L['metal']),
        'by_video': rollup(lambda L: 'with video' if L['has_video'] else 'no video'),
        'by_section': rollup(lambda L: L['section']),
        'by_category': rollup(lambda L: L['category']),
        'zero_attribute_listings': sum(1 for L in Ls if L['attr_filled'] == 0),
        'low_attribute_listings_lt4': sum(1 for L in Ls if L['attr_filled'] < 4),
        'no_section_listings': sum(1 for L in Ls if L['wrong_section']),
        'no_video_listings': sum(1 for L in Ls if not L['has_video']),
        'non_english_titles': sum(1 for L in Ls if L['non_english_title']),
        'zero_view_listings_30d': sum(1 for L in Ls if L['stats30']['views'] == 0),
        'salad_tag_total': sum(L['salad_tags'] for L in Ls),
        'tag_total': sum(len(L['tags']) for L in Ls),
        'listings_with_duplicate_tag_sets': 0,
    }
    seen = collections.Counter(tuple(sorted(L['tags'])) for L in Ls)
    diag['listings_with_duplicate_tag_sets'] = sum(c for c in seen.values() if c > 1)
    json.dump(diag, open(D('diagnosis.json'), 'w'), indent=1)
    print(json.dumps({k: v for k, v in diag.items() if not isinstance(v, dict)}, indent=1))
    for k in ['by_tag_class', 'by_video', 'by_price_band', 'by_metal']:
        print(k)
        for g, r in diag[k].items():
            print(f"  {g:28s} listings {r['listings']:4d} views {r['views']:4d} orders {r['orders']} fav {r['favorites']}")

if __name__ == '__main__':
    main()
