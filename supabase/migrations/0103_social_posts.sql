-- 0103 — Sosyal medya içerik takvimi (Instagram vb.)
-- Özellik TÜM organizasyonlarda açık; içerik org_id ile ayrılır.
-- EON publishing calendar seed yalnızca EON org için dolar; Jade boş takvim görür.

create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  platform text not null default 'instagram'
    check (platform in ('instagram', 'tiktok', 'pinterest', 'other')),
  format text not null default 'post'
    check (format in ('reel', 'photo', 'carousel', 'story', 'post')),
  status text not null default 'idea'
    check (status in ('idea', 'planned', 'ready', 'published', 'skipped')),
  week_number smallint,
  week_theme text,
  series text,
  title text not null,
  scheduled_at timestamptz,
  published_at timestamptz,
  asset_note text,
  overlay text,
  caption text,
  hashtags text,
  tags_note text,
  permalink text,
  sort_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists social_posts_org_sched_idx
  on public.social_posts (org_id, scheduled_at);
create index if not exists social_posts_org_status_idx
  on public.social_posts (org_id, status);

create trigger set_updated_at
  before update on public.social_posts
  for each row execute function public.set_updated_at();

create trigger audit after insert or update or delete on public.social_posts
  for each row execute function public.audit_trigger();

alter table public.social_posts enable row level security;

create policy "social_posts_select" on public.social_posts
  for select to authenticated
  using (org_id = public.current_org_id());
create policy "social_posts_insert" on public.social_posts
  for insert to authenticated
  with check (org_id = public.current_org_id());
create policy "social_posts_update" on public.social_posts
  for update to authenticated
  using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());
create policy "social_posts_delete" on public.social_posts
  for delete to authenticated
  using (
    org_id = public.current_org_id()
    and public.current_org_role() in ('owner', 'admin')
  );

grant select, insert, update, delete on public.social_posts to authenticated;

do $$
declare
  v_org uuid;
  v_count int;
begin
  select id into v_org
  from public.organizations
  where slug = 'eon' or upper(coalesce(name, '')) = 'EON'
  limit 1;
  if v_org is null then
    raise notice '0103: EON org yok — sosyal seed atlandı';
    return;
  end if;
  select count(*) into v_count from public.social_posts where org_id = v_org;
  if v_count > 0 then
    raise notice '0103: EON sosyal içerik zaten var (%), seed atlandı', v_count;
    return;
  end if;

  insert into public.social_posts (
    org_id, platform, format, status, week_number, week_theme, series, title,
    scheduled_at, asset_note, overlay, caption, hashtags, tags_note
  )
  select
    v_org,
    v.platform::text, v.format::text, v.status::text, v.week_number::int,
    v.week_theme::text, v.series::text, v.title::text,
    v.scheduled_at::timestamptz, v.asset_note::text, v.overlay::text,
    v.caption::text, v.hashtags::text, v.tags_note::text
  from (values
    ($s$instagram$s$, $s$reel$s$, $s$planned$s$, 1, $s$The Omen$s$, $s$The Long Time$s$, $s$“It doesn’t end.”$s$, $s$2026-07-20T12:30:00+02:00$s$, $s$Reel 01 — molten gold forms a ring by itself (no logo)$s$, $s$Some things are not made. They begin.$s$, $s$Some things are not made. They begin.

7 days.$s$, $s$#goldsmith #moltengold #finejewelry #artfilm #madewithai #weddingband #solidgold #eonfinejewelry #meaningdesignedtolast #quietluxury$s$, $s$none · location: EON · Atelier$s$),
    ($s$instagram$s$, $s$photo$s$, $s$planned$s$, 1, $s$The Omen$s$, $s$The Long Time$s$, $s$The omen still$s$, $s$2026-07-22T19:00:00+02:00$s$, $s$assets/world/ring-plinth.jpg — band on dark stone, dust in one beam$s$, $s$— none — (let it be silent)$s$, $s$What of yours will outlast you?

5 days.$s$, $s$#stilllife #finejewelry #goldband #permanence #quietluxury #solidgold #14kgold #eonfinejewelry #outofseason #meaningdesignedtolast$s$, $s$none · location only$s$),
    ($s$instagram$s$, $s$reel$s$, $s$planned$s$, 1, $s$The Omen$s$, $s$The Record$s$, $s$“Whose hands next?”$s$, $s$2026-07-24T12:30:00+02:00$s$, $s$Reel 02 — an old hand lowers a band into a young palm$s$, $s$Worn today. Carried by the next hands.$s$, $s$Worn today. Carried by the next hands.

2 days.$s$, $s$#heirloom #weddingband #nexthands #finejewelry #solidgold #madetoorder #engravedring #eonfinejewelry #meaningdesignedtolast #14kgold$s$, $s$none · location only$s$),
    ($s$instagram$s$, $s$reel$s$, $s$planned$s$, 2, $s$The Reveal$s$, $s$Hero film$s$, $s$“An Eon Later”$s$, $s$2026-07-27T12:30:00+02:00$s$, $s$Reel 03 — the band untouched while the room ages; ends on the mark + AI credit$s$, $s$No camera can film a thousand years. This was dreamed by a machine. The gold is real — solid, and made by hand.  →  the EON mark + “Meaning designed to last.”$s$, $s$A thousand years, in nine seconds.

No camera could film it — so we dreamed it. The film is made with AI. The gold is real: solid, and made by hand.

This is EON. Begin an heirloom — link in bio.$s$, $s$#madewithai #aifilm #finejewelry #solidgold #weddingband #heirloom #goldsmith #eonfinejewelry #meaningdesignedtolast #quietluxury #14kgold #18kgold$s$, $s$none · location only$s$),
    ($s$instagram$s$, $s$carousel$s$, $s$planned$s$, 2, $s$The Reveal$s$, $s$Behind the brand$s$, $s$“We couldn’t film forever. So we imagined it.”$s$, $s$2026-07-29T11:00:00+02:00$s$, $s$7-slide EON template — the honest making-of$s$, $s$1 We couldn’t film forever. · 2 So we imagined it. · 3 No camera can shoot a thousand years. · 4 But the gold is real. · 5 Solid. Hand-made. Engraved inside. · 6 The film is a dream. The ring is not. · 7 EON — meaning designed to last.$s$, $s$The idea was older than any set we could build.

So we didn’t build one. We asked a machine to dream the one thing a camera can’t hold — time — and we kept everything else true: the gold is solid, cut and finished by hand, engraved inside for the person who’ll wear it.

We won’t hide the machine. It’s the only lens that can film a thousand years. The guide to what we make is in our bio.$s$, $s$#madewithai #behindthebrand #goldsmith #solidgold #finejewelry #weddingband #engravedring #madetoorder #eonfinejewelry #meaningdesignedtolast #honestluxury$s$, $s$none · location only$s$),
    ($s$instagram$s$, $s$photo$s$, $s$planned$s$, 2, $s$The Reveal$s$, $s$The landing$s$, $s$The product, at last$s$, $s$2026-07-31T12:30:00+02:00$s$, $s$assets/photography/meridian-hero.jpg$s$, $s$— none —$s$, $s$Here it is.

Solid 10k, 14k or 18k gold — never plated. Engraved by hand, inside, always. Made to order for the person you have in mind.

Begin an heirloom — link in bio.$s$, $s$#weddingband #solidgold #14kgold #18kgold #madetoorder #engravedring #comfortfit #finejewelry #eonfinejewelry #meaningdesignedtolast$s$, $s$none · location only$s$),
    ($s$instagram$s$, $s$carousel$s$, $s$planned$s$, 3, null, $s$The Record$s$, $s$The words we hide$s$, $s$2026-08-03T11:00:00+02:00$s$, $s$campaign/instagram/carousels/EON-Record-1…7.png$s$, $s$The 7 lines set into the slides (paper, basalt, gold, the mark, the plinth).$s$, $s$There’s a part of every ring that no one but the wearer will ever see.

We cut a line inside the band — a date, a name, a word someone couldn’t say out loud. It faces the skin. It stays between the two of them and the metal.

We engrave it by hand, inside every solid gold band, and we don’t charge for it — it always felt like the point, not an add-on.

So, if it were yours: what would you put inside?

The full engraving guide is in our bio.$s$, $s$#engravedring #weddingband #solidgold #14kgold #madetoorder #comfortfit #finejewelry #eonfinejewelry #meaningdesignedtolast$s$, $s$none · location only$s$),
    ($s$instagram$s$, $s$photo$s$, $s$planned$s$, 3, null, $s$The Long Time$s$, $s$The mark carved in basalt$s$, $s$2026-08-05T19:00:00+02:00$s$, $s$the EON mark still (df47beb3) / assets/world/band-wall.jpg$s$, $s$— none — (or small caps: “Gold does not speak. It signals.”)$s$, $s$Gold doesn’t announce itself. It just outlasts everything around it.

We cut our mark into stone the same way we cut it into a band — once, and for good. Three bars: the first stands alone, then it’s carried, and it becomes many. That’s the whole idea of the thing, really.

Solid 10k, 14k and 18k. Never plated.$s$, $s$#finejewelry #solidgold #weddingband #14kgold #18kgold #quietluxury #eonfinejewelry #meaningdesignedtolast #outofseason #goldsmith$s$, $s$none · location only$s$),
    ($s$instagram$s$, $s$reel$s$, $s$planned$s$, 3, null, $s$The Record$s$, $s$Engraving revealed inside a band$s$, $s$2026-08-07T12:30:00+02:00$s$, $s$campaign/reels/week1-record-engraving.md$s$, $s$The line no one else will read.$s$, $s$We turned the band so you could see the part that usually faces the skin.

Someone chose these words. We won’t tell you what they mean — that’s rather the point. Hand-engraved inside solid gold, free, on every band we make.

What would yours say? The guide’s in our bio.$s$, $s$#engravedring #weddingband #solidgold #madetoorder #14kgold #asmr #goldsmith #eonfinejewelry #meaningdesignedtolast$s$, $s$none · location only$s$),
    ($s$instagram$s$, $s$carousel$s$, $s$planned$s$, 4, null, $s$The Bench$s$, $s$10k vs 14k vs 18k$s$, $s$2026-08-10T11:00:00+02:00$s$, $s$the Gold Karats guide carousel (built)$s$, $s$Slide hooks from the guide (e.g. “How much gold is in your gold?”).$s$, $s$The number stamped inside your ring is a recipe, not a grade.

10k, 14k, 18k — how much of it is pure gold, and which one is right for a ring you’ll wear every day for fifty years. No wrong answer; just trade-offs, explained plainly.

The full karat guide is in our bio.$s$, $s$#14kgold #18kgold #10kgold #goldkarats #weddingband #solidgold #jewelryguide #madetoorder #eonfinejewelry #meaningdesignedtolast$s$, $s$none · location only$s$),
    ($s$instagram$s$, $s$photo$s$, $s$planned$s$, 4, null, $s$The Bench$s$, $s$Macro of molten gold$s$, $s$2026-08-12T19:00:00+02:00$s$, $s$molten gold macro (0be3c8df / fc8fc6c4)$s$, $s$— none — (or “Solid gold, through and through.”)$s$, $s$Before it’s a ring, it’s a pour.

Everything we make starts as solid gold and stays that way — nothing underneath that isn’t the same gold on top. You’re paying for weight, not a coating.

Made to order, in the karat you choose.$s$, $s$#moltengold #goldsmith #solidgold #finejewelry #weddingband #14kgold #behindthebench #madetoorder #eonfinejewelry #meaningdesignedtolast$s$, $s$none · location only$s$),
    ($s$instagram$s$, $s$reel$s$, $s$planned$s$, 4, null, $s$The Bench$s$, $s$Raw gold → finished band$s$, $s$2026-08-14T12:30:00+02:00$s$, $s$campaign/reels/week2-bench-pour.md$s$, $s$This begins as a puddle of gold.$s$, $s$This begins as a puddle of gold. Nine seconds later, a band someone will wear for the rest of their life.

No shortcuts, no plating — just gold, heat, and a steady hand.

Made to order. The guide’s in our bio.$s$, $s$#goldsmith #moltengold #handmade #weddingband #solidgold #jewelrymaking #asmr #madetoorder #eonfinejewelry #meaningdesignedtolast$s$, $s$none · location only$s$),
    ($s$instagram$s$, $s$carousel$s$, $s$planned$s$, 5, null, $s$The Long Time$s$, $s$Meaning designed to last$s$, $s$2026-08-17T11:00:00+02:00$s$, $s$the EON story, as a 7-slide carousel (surfaces + the world)$s$, $s$The story, one line per slide (out of season, out of time; the one thing that survives; the first object of an inheritance…).$s$, $s$Nearly everything you own is on its way to being lost.

We make the exception — the one object built to outlast the hands that wear it, and to be handed to the ones who come after. That’s the whole idea: not a purchase, a beginning.

Solid gold, engraved by hand, made to order.$s$, $s$#heirloom #quietluxury #permanence #finejewelry #solidgold #weddingband #eonfinejewelry #meaningdesignedtolast #outofseason #14kgold$s$, $s$none · location only$s$),
    ($s$instagram$s$, $s$photo$s$, $s$planned$s$, 5, null, $s$The Record$s$, $s$The next-hands image$s$, $s$2026-08-19T19:00:00+02:00$s$, $s$assets/photography/next-hands.jpg / dome-hand-two-generation.jpg$s$, $s$— none — (or “Worn today. Carried by the next hands.”)$s$, $s$A ring is the rare thing you buy already knowing you’ll give it away.

Worn today, carried by the next hands — that’s not marketing, it’s just what gold does if you let it.

Solid, engraved inside, made to last longer than any of us.$s$, $s$#heirloom #nexthands #weddingband #solidgold #finejewelry #engravedring #quietluxury #eonfinejewelry #meaningdesignedtolast #madetoorder$s$, $s$none · location only$s$),
    ($s$instagram$s$, $s$reel$s$, $s$planned$s$, 5, null, $s$The Long Time$s$, $s$Light across a band on the plinth$s$, $s$2026-08-21T12:30:00+02:00$s$, $s$campaign/reels/week3-longtime-light.md$s$, $s$Out of season. Out of time.$s$, $s$One band, one beam of light, one slow minute.

Nothing happens, and that’s the point — it’s the one object in your life that doesn’t need to.

Out of season. Out of time.$s$, $s$#quietluxury #finejewelry #solidgold #weddingband #stillness #goldband #eonfinejewelry #meaningdesignedtolast #outofseason #14kgold$s$, $s$none · location only$s$),
    ($s$instagram$s$, $s$carousel$s$, $s$planned$s$, 6, null, $s$The Bench$s$, $s$Finding your ring size$s$, $s$2026-08-24T11:00:00+02:00$s$, $s$the Ring Size guide carousel (built)$s$, $s$Sizing hooks from the guide.$s$, $s$The one measurement people get wrong from home — and the three easy ways to get it right, including the trick jewellers actually use.

Save this before you order anything.

Full sizing guide in our bio.$s$, $s$#ringsize #weddingband #jewelryguide #solidgold #madetoorder #comfortfit #14kgold #howto #eonfinejewelry #meaningdesignedtolast$s$, $s$none · location only$s$),
    ($s$instagram$s$, $s$photo$s$, $s$planned$s$, 6, null, $s$The Long Time$s$, $s$The plinth in one beam$s$, $s$2026-08-26T19:00:00+02:00$s$, $s$assets/world/ring-plinth.jpg (evening grade)$s$, $s$— none —$s$, $s$We photograph our rings the way a museum lights a relic: one object, one beam, a lot of dark around it.

Not to sell it faster. To say what it is.

Solid gold. Made to order.$s$, $s$#quietluxury #finejewelry #solidgold #weddingband #stilllife #goldband #eonfinejewelry #meaningdesignedtolast #outofseason #18kgold$s$, $s$none · location only$s$),
    ($s$instagram$s$, $s$reel$s$, $s$planned$s$, 6, null, $s$The Record$s$, $s$A date in Roman numerals forming on gold$s$, $s$2026-08-28T12:30:00+02:00$s$, $s$new reel — Record strand$s$, $s$An object becomes a record the moment you put words inside it.$s$, $s$A date only two people need to know, appearing letter by letter inside a band.

This is the moment an object turns into a record — the day you press words into something that will outlast the saying of them.

Hand-engraved, free, inside every ring. The guide’s in our bio.$s$, $s$#engravedring #romannumerals #weddingband #solidgold #madetoorder #14kgold #heirloom #eonfinejewelry #meaningdesignedtolast #goldsmith$s$, $s$none · location only$s$),
    ($s$instagram$s$, $s$carousel$s$, $s$idea$s$, 7, null, null, $s$One ring, three golds$s$, $s$2026-08-31T12:30:00+02:00$s$, $s$Outline from publishing calendar — caption TBD$s$, null, null, null, null),
    ($s$instagram$s$, $s$photo$s$, $s$idea$s$, 7, null, null, $s$The band upright on stone$s$, $s$2026-09-02T12:30:00+02:00$s$, $s$Outline from publishing calendar — caption TBD$s$, null, null, null, null),
    ($s$instagram$s$, $s$reel$s$, $s$idea$s$, 7, null, null, $s$one highlight$s$, $s$2026-09-04T12:30:00+02:00$s$, $s$Outline from publishing calendar — caption TBD$s$, null, null, null, null),
    ($s$instagram$s$, $s$carousel$s$, $s$idea$s$, 8, null, null, $s$What to engrave — pt.2$s$, $s$2026-09-07T12:30:00+02:00$s$, $s$Outline from publishing calendar — caption TBD$s$, null, null, null, null),
    ($s$instagram$s$, $s$photo$s$, $s$idea$s$, 8, null, null, $s$A macro edge, keystone$s$, $s$2026-09-09T12:30:00+02:00$s$, $s$Outline from publishing calendar — caption TBD$s$, null, null, null, null),
    ($s$instagram$s$, $s$reel$s$, $s$idea$s$, 8, null, null, $s$polished · ASMR$s$, $s$2026-09-11T12:30:00+02:00$s$, $s$Outline from publishing calendar — caption TBD$s$, null, null, null, null),
    ($s$instagram$s$, $s$carousel$s$, $s$idea$s$, 9, null, null, $s$Caring for gold — guide$s$, $s$2026-09-14T12:30:00+02:00$s$, $s$Outline from publishing calendar — caption TBD$s$, null, null, null, null),
    ($s$instagram$s$, $s$photo$s$, $s$idea$s$, 9, null, null, $s$A worn-on-hand listing$s$, $s$2026-09-16T12:30:00+02:00$s$, $s$Outline from publishing calendar — caption TBD$s$, null, null, null, null),
    ($s$instagram$s$, $s$reel$s$, $s$idea$s$, 9, null, null, $s$the band passed$s$, $s$2026-09-18T12:30:00+02:00$s$, $s$Outline from publishing calendar — caption TBD$s$, null, null, null, null),
    ($s$instagram$s$, $s$carousel$s$, $s$idea$s$, 10, null, null, $s$The three bars, explained$s$, $s$2026-09-21T12:30:00+02:00$s$, $s$Outline from publishing calendar — caption TBD$s$, null, null, null, null),
    ($s$instagram$s$, $s$photo$s$, $s$idea$s$, 10, null, null, $s$The museum corridor$s$, $s$2026-09-23T12:30:00+02:00$s$, $s$Outline from publishing calendar — caption TBD$s$, null, null, null, null)
  ) as v(
    platform, format, status, week_number, week_theme, series, title,
    scheduled_at, asset_note, overlay, caption, hashtags, tags_note
  );
end $$;
