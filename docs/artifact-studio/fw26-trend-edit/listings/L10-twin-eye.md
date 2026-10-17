# L10 Twin Eye: Etsy listing sheet

Copy-paste sheet in the order of Etsy's listing form. Source: `listings/L10-twin-eye.json`.

## Photos (slots 1 to 10)

1. Hero: two wrists side by side so almond and iris complete the eye, soft daylight (Family Reimagined moment)
2. Each bracelet alone on a wrist, two frames in one image
3. Macro of the cobalt iris dome, raking light
4. Macro of the almond wire and the clasp tag with an initial
5. Stacked with an existing Evil Eye bracelet from the shop
6. Two friends at a Friendsmas table, hands on the tablecloth, candles
7. Metal color options on dark linen
8. Two gift boxes open side by side
9. Flat lay forming the eye on cream linen, overhead
10. Process: wet-packing cobalt enamel into the iris cell (Mark of the Maker)

Listing images are real photographs of real samples. Shoot spec: BRIEF.md section 5.

## Video

Video 8 to 12 s: two wrists move together until the eye closes

## Title

```text
Matching Evil Eye Bracelet Set of 2 in Solid Gold, Twin Eye Friendship Bracelets with Cobalt Enamel and Engraved Initials, Best Friend Gift
```
(139 characters)

## About this listing

- Who made it: A member of my shop
- What is it: A finished product
- When was it made: Made to order

## Category

Jewelry > Bracelets > Chain & Link Bracelets (resolved at push by the listing protocol)

## Renewal

Automatic

## Type

Physical item

## Description

```text
Two bracelets that make one eye. The first carries the almond outline in open solid gold wire; the second carries the iris, a 4 mm gold dome with a cobalt blue kiln-fired enamel center. Each is a quiet bracelet alone. Held wrist to wrist, they complete the eye that has watched over this part of the world for five thousand years. One for you, one for the friend, sister or partner you would call first.

- The almond measures 9 x 5 mm in 0.9 mm wire; the iris dome is 4 mm. Both sit as connectors in a 1.2 mm solid gold cable chain with spring ring clasp and a small gold tag at the clasp.
- Personalization: one initial engraved on each tag, written in the order almond, then iris. Leave the field blank if you prefer them plain.
- Choose solid 10K, 14K or 18K gold in yellow, white or rose, and a length of 6.5, 7 or 7.5 inches for the set. If you need two different lengths, write both in the personalization field.
- The enamel is fired by hand in a recessed cell with a polished gold rim, in the same cobalt as our Evil Eye collection, so the set stacks with it.
- Made to order at our bench in New Jersey in 5 to 7 business days, free US shipping. The two bracelets arrive in separate gift boxes.
- Please check the spelling at checkout; engraved pieces are made specifically for you.
- Enamel is glass fused to gold and can chip from a hard knock. Take it off for the gym, the pool and the sink, and wipe it with a soft cloth. A gift message can be added at checkout.
```

## Section

Bracelets (cross-link from Evil Eye via tags)

## Tags

```text
evil eye bracelets, matching bracelets, friendship bracelets, best friend bracelet, sister bracelet set, couples bracelet set, friend group gift, friendsmas gift, nazar bracelet gold, cobalt enamel eye, solid gold evil eye, set of 2 bracelets, initial bracelet set
```

## Materials

Solid gold, Vitreous enamel, 14K gold, 10K gold, 18K gold

## Attributes

- Primary color: Gold
- Secondary color: Blue
- Holiday: Christmas
- Occasion: Birthday
- Recipient: Women
- Style: Minimalist

## Price and Quantity

Quantity 20. Processing time 5 to 7 business days.

| Karat | Original list price | Shown during the 30% shop sale |
|---|---|---|
| 10K | $848.65 | $594.05 |
| 14K | $1,144.82 | $801.37 |
| 18K | $1,499.72 | $1,049.80 |

Basis: est. 1.9 g in 14K, 2 make-floor, adders 75 (two make-floors + enamel cell 25 + two tag engravings 50), 14K base 905. List = base x 1.265; 10K = 14K / 1.349; 18K = 14K x 1.31. Efe's cast weight overrides the estimate.

## Variations

- Karat: 10K / 14K / 18K (price varies)
- Metal Color: Yellow Gold / White Gold / Rose Gold
- Length: 6.5 inches / 7 inches / 7.5 inches

## Personalization

On, optional, max 40 characters.

```text
Two initials, almond bracelet first, then iris (e.g. H / C). Add a second length if wrists differ (e.g. H 6.5 / C 7).
```

## Shipping profile

Free US shipping, ships from West New York NJ

## Return policy

Shop default

## Deviations from the brief

- category id: brief says "Jewelry > Bracelets > Chain & Link Bracelets", used kept; resolved at push by the repo's chain_bracelet protocol (root Jewelry), the protocol the shop's earlier bracelet drafts were pushed with. lib/etsy/listing-protocol.ts chain_bracelet: taxonomyNames Chain & Link Bracelets, Bracelets; taxonomyRoot Jewelry.
- personalization instructions: brief says "Two initials, almond bracelet first, then iris bracelet (example: H / C). Optional: a second length if the wrists differ (example: H 6.5 / C 7).", used Two initials, almond bracelet first, then iris (e.g. H / C). Add a second length if wrists differ (e.g. H 6.5 / C 7).. Etsy rejects personalization instructions over 120 characters and with more than one word starting with three capitals (developers.etsy.com personalization-migration, read 2026-10-17); the brief's text is 144 characters. Same meaning, shortened.
