# Cursor Automations — Buyer Memory loops

API ile otomasyon oluşturulamaz; bunları
[cursor.com/automations/new](https://cursor.com/automations/new) üzerinde
yapıştır. Repo: `HusamAri/JadeGoldNYC`. Branch base tercihi:
`claude/serene-knuth-js7wvl`. Branch adı: `artifact/<slug>-b469`.

Mevcut otomasyon (örnek, dokunma):  
[Pull Request Router and Approver](https://cursor.com/automations/6a09fb4d-87f5-11f1-b532-320a589b8025)

Ürün kaynağı: `docs/buyer-memory.md`. **Tek odak / tekrar yok** kuralını her
loop’ta doğrula.

---

## Loop A — Capture gap (haftalık)

| Alan | Değer |
|---|---|
| Name | Buyer Memory · Capture Etsy variations |
| Trigger | Scheduled · weekly (Pazartesi 09:00 Europe/Istanbul) |
| Repo | JadeGoldNYC · base `claude/serene-knuth-js7wvl` |
| Tools | PR create, Memories ON |
| Model | güçlü coding model |

**Prompt:**

```text
You implement / harden Buyer Memory capture for JadeGoldNYC.

Read docs/buyer-memory.md first. Goal this run: persist Etsy receipt
transaction variations/personalization onto sale_items (or buyer_facts),
without inventing a second CRM UI.

Check:
- lib/etsy/types.ts EtsyTransaction
- lib/etsy/sync.ts upsertSalesPage
- Whether variations / product_data are dropped

If gaps remain:
1. Extend types + sync (smallest safe change)
2. Map known EON keys (size, width, engraving text/style, gift*) into
   structured fields or jsonb
3. Migration if needed (next free number after existing migrations)
4. npm run typecheck + lint
5. Open a focused draft PR; title feat(buyers): capture Etsy variations
6. Do NOT add duplicate note UIs on /satislar or /sepet-kurtarma

If already complete, do nothing and write a short memory note.
Use Memories to skip repeated work across weeks.
```

---

## Loop B — Identity + profile scaffold

| Alan | Değer |
|---|---|
| Name | Buyer Memory · Identity + /musteriler |
| Trigger | Scheduled · weekly (Çarşamba 09:00) OR after Loop A PR merged |
| Repo | same |
| Tools | PR create, Memories ON, Computer use ON |

**Prompt:**

```text
Continue Buyer Memory per docs/buyer-memory.md.

Build or finish:
- buyers + buyer_facts + buyer_notes tables (RLS org-scoped)
- backfill buyers from sales (email-first identity_key)
- sales.buyer_id FK
- /musteriler list + /musteriler/[id] profile:
  ONE composition: TLDR → structured facts → timeline → add-note
- Sale detail: thin returning-buyer strip linking to profile ONLY
  (no second note form)

Reject scope creep: do not redesign sepet-kurtarma into a CRM.
Follow module pattern: page + actions + queries + zod.
typecheck + lint. Draft PR. Demo screenshot of /musteriler/[id] if possible.
```

---

## Loop C — Return reminder

| Alan | Değer |
|---|---|
| Name | Buyer Memory · Return reminder |
| Trigger | Scheduled · weekly (Cuma 09:00) OR webhook after sync |
| Repo | same |
| Tools | PR create, Memories ON |

**Prompt:**

```text
Wire returning-buyer reminders per docs/buyer-memory.md.

Requirements:
1. On sale upsert when buyer_id already existed → create/update alert
   key returning_buyer (severity: onemli) with TLDR of prior facts
2. Sale detail banner uses same TLDR (single source)
3. Optional: daily digest section "bugün dönenler" via existing digest pipeline
4. No duplicate copy across surfaces — one helper builds the reminder text

Keep UI focused. typecheck + lint. Draft PR.
```

---

## Loop D — Cleanliness gate (her Buyer Memory PR)

| Alan | Değer |
|---|---|
| Name | Buyer Memory · Clean UI gate |
| Trigger | Source control · PR opened + PR pushed |
| Filter | title/body contains "buyer" OR "musteri" OR path docs/buyer-memory.md |
| Repo | same |
| Tools | Comment on PR, Memories ON |

**Prompt:**

```text
Review this PR against docs/buyer-memory.md cleanliness rules:

FAIL if:
- A second free-text customer note UI appears outside /musteriler/[id]
- Sepet-kurtarma gained CRM/profile duplication
- Sale detail shows a full biography instead of a thin strip + link
- Sections repeat the same facts (TLDR and facts list identical blobs)

PASS if each surface has one job and auto facts are not retyped as manual notes.

Comment with PASS/FAIL checklist. Request changes only on FAIL.
Do not open a competing PR.
```

---

## Loop E — Memory quality digest (iki haftada bir)

| Alan | Değer |
|---|---|
| Name | Buyer Memory · Quality dig |
| Trigger | Scheduled · every 2 weeks |
| Repo | same |
| Tools | PR create (only if code fix), Send to Slack (optional), Memories ON |

**Prompt:**

```text
Audit Buyer Memory data quality in code + local/docs assumptions:

1. How many sale_items lack variations after capture ship?
2. Are identity collisions (same name, different email) handled?
3. Are SKU→size/width inferences documented?

If a small code fix improves capture, open a tiny PR.
Otherwise append findings to docs/buyer-memory.md (short "Quality log" section)
and stop. Prefer no change over noisy churn.
```

---

## Kurulum checklist (Husam)

1. Open https://cursor.com/automations/new
2. Create Loop A → E in order (A first)
3. Enable Memories on all
4. Point repo to JadeGoldNYC, base branch `claude/serene-knuth-js7wvl`
5. Private permission (billed to your usage) unless team-owned is preferred
6. After first Loop A PR merges, enable B/C if they were waiting

Mevcut PR router otomasyonuna dokunma.
