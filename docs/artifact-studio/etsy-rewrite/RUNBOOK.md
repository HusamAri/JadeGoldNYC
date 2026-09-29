# byArtifactStudio Etsy rewrite: apply 41 listings

You are applying a finished, verified rewrite to the Etsy shop **byArtifactStudio** (by Artifact Studio Jewelry, solid 14K gold, made to order, ships from New Jersey). The copy is final. Your job is to put it into the Etsy listing editor exactly, one listing at a time, with the owner's approval, and prove each save.

## Files in this folder

- `listings_rewrite.json`: 41 listings in apply order (the 8 lead listings first). Per listing: `editor_url`, `current` (state on 28 Sep 2026, for the diff), `new` (title, 13 tags, category, attributes, materials tags, description, personalization field), `settings` (quantity, renewal, shipping, variation notes), `hold_for_workshop`, `price_note_do_not_apply`, `photo_check`.
- `apply_log.jsonl`: create it. One line per listing per attempt (schema below). It is the resume point.

## Tools

Use the Claude in Chrome browser tools on the owner's logged-in Etsy session (Shop Manager, listing editor). Do not use the Etsy API, do not ask for credentials, do not log in. If the editor is not reachable, stop and say so.

## Hard rules

1. **Approval before every save.** For each listing, show the diff (current vs new: title, tags, category, attributes, description first 2 lines, quantity, renewal, shipping, personalization) and ask: "Apply listing N/41 (<short_name>)? yes / skip". Save only on "yes". One yes covers one listing. If the owner says "yes to all remaining" in the chat, that is the only exception.
2. **Copy exactly.** Title, tags and description go in character for character from `new`. Do not rewrite, shorten, "improve" or translate. Keep the blank lines between description sections.
3. **Do not touch:** prices, the running sale, photos, videos, SKUs, sections, variation prices, anything in `price_note_do_not_apply`, and every item in `hold_for_workshop` (leave those attribute values as they are today unless the note says to clear a value).
4. **Photos are real photography.** No new shoot and no render disclosure. `photo_check` is advisory: report if slot 1 is not the piece worn or at scale; change nothing.
5. **Writing rules for anything you type yourself** (personalization field labels come from the JSON; nothing else should be typed): no em dash, no en dash, no letter "â".
6. **Never publish a draft, delete a listing, deactivate a listing, or change shop policies.**

## Per-listing procedure

1. Open `editor_url`. Wait for the editor to load.
2. Read the current state with a DOM extraction (title `#listing-title-input`, description `#listing-description-textarea`, tags from `button[aria-label^="Delete tag "]`, quantity `#listing-quantity-input`, price `#listing-price-input`). If it differs from `current` in the JSON beyond trivial whitespace, show the owner what changed and ask before overwriting.
3. Show the diff and ask for approval (rule 1).
4. Apply, in this order:
   - **Title**: replace the field value.
   - **Tags**: delete every existing tag (click each `Delete tag <name>` button), then add the 13 new tags one by one. Etsy may also hold Spanish tags on some listings; leave those alone.
   - **Category**: set to `new.category` (the path after "Jewelry >").
   - **Attributes**: set each key in `new.attributes` that the editor offers. Values given as "none" mean leave the attribute empty. Values with "(variation)" mean the attribute follows the variation; set it per variation if the editor asks, otherwise skip. If a value is not in Etsy's list, skip it and log it.
   - **Materials tags**: replace with `new.materials_tags`.
   - **Description**: replace the whole field with `new.description`.
   - **Personalization**: if `new.personalization_field` is not "none", enable personalization and use the text as instructions/label; set required only where it says required.
   - **Settings**: apply `settings.quantity`, `settings.renewal` (Automatic), `settings.shipping` (profile "freee shipping" is the free US shipping profile). For `settings.variations`, only apply what is a pure settings change the note states directly (for example adding a Chain Length 16 in / 18 in variation at one price). Any "split into separate listings" note is NOT applied: log it as `deferred`.
5. Save (Publish / Save changes, whichever the editor shows for an active listing).
6. **Verify**: reload the editor, extract again, and compare title, 13 tags, description (exact string), quantity, category, renewal, shipping profile. Every field must match. Mismatch: fix once and verify again; if it still fails, log `failed` with the field and move on.
7. Append to `apply_log.jsonl` and report one line in chat: `N/41 <short_name>: applied, verified` (or skipped / failed with reason).

## Editor quirks seen on this shop

- React inputs: typing with synthetic key events may not register. Prefer the browser tool's form-input action on the field ref, then click outside the field so React commits the value. Re-read the value before saving.
- Buttons found by ref sometimes do nothing; click by coordinate from a fresh screenshot.
- JavaScript tool output truncates near 1,000 characters and blocks output containing URLs with query strings. Return lengths, hashes or slices, never full hrefs.
- To compare the long description, compare length plus the first and last 80 characters plus a simple hash computed in the page.
- The tag field accepts comma-separated input on some editor versions; if pasting all 13 at once lands correctly, that is fine, but verify the count is exactly 13.

## Log schema (`apply_log.jsonl`)

```json
{"order": 1, "id": "4575369430", "short_name": "Evil Eye Bracelet red", "status": "applied|skipped|failed|deferred", "verified": true, "fields_failed": [], "deferred": ["split note"], "skipped_attributes": [], "attempt": 1, "ts": "ISO time"}
```

## Resume and retry

- On start, read `apply_log.jsonl`. Skip every id with `status: applied` and `verified: true`. Resume at the lowest `order` not done.
- A listing that fails is retried at most 3 times across sessions, then left as `failed` for the owner.
- If the browser disconnects or Etsy shows an error, stop the current listing without saving, log it, and continue with the next one after telling the owner.

## Finish

When all 41 are processed, report a table: applied and verified, skipped, failed (field and reason), deferred items (listing splits, held attributes), and any `photo_check` flags. End with one line labeled NEXT STEP, doable in under 5 minutes.

## Start

Read `listings_rewrite.json`, read or create `apply_log.jsonl`, open the first pending listing, and show the owner the diff for approval.
