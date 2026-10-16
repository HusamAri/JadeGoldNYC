import { NextResponse } from "next/server";

import { logAudit } from "@/lib/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { EtsyClient, EtsyNotConnectedError } from "@/lib/etsy/client";
import { etsyPaths } from "@/lib/etsy/endpoints";
import {
  CHRISTMAS_LISTING_IDS,
  COUNTERFORM_LISTING_ID,
  ENGRAVING_LISTING_IDS,
  EON_ORG_ID,
  EON_SHOP_NAME,
  FEATURED_REPLACEMENTS,
  fontMenuLabel,
  HAMMERED_REFERENCE_LISTING_ID,
  hasUnconfirmedHolidayDisclosure,
  KINETIC_LISTING_ID,
  LAUREL_LISTING_ID,
  repairCoreListingCopy,
  type FontQuestion,
} from "@/lib/etsy/eon-recovery";
import { getListing, updateListingDescription } from "@/lib/etsy/listing";
import { getListingPersonalization } from "@/lib/etsy/personalization";
import { decodeHtmlEntities } from "@/lib/etsy/text";

export const maxDuration = 300;

/**
 * One-shot Eon recovery from the 16 October 2026 audit.
 *
 * Auth: Authorization: Bearer $REPAIR_ONE_SHOT_TOKEN
 * Query: dry=1 (default) reports the plan. apply=1 writes.
 *
 * Writes: pause unconfirmed Christmas listings, align engraving prose
 * to the live font menu, correct the 10K/14K-only brand sentence, the
 * laurel width comma, and the Counterform internal approval note.
 * Prices, tags, titles and processing profiles are not touched.
 */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function authorized(request: Request): boolean {
  const token = process.env.REPAIR_ONE_SHOT_TOKEN;
  const auth = request.headers.get("authorization");
  return Boolean(token && token.length >= 24 && auth === `Bearer ${token}`);
}

async function shopName(client: EtsyClient, shopId: number): Promise<string> {
  const shop = await client.get<{ shop_name?: string }>(etsyPaths.shop(shopId));
  return shop.shop_name ?? "";
}

async function openListingIds(client: EtsyClient, shopId: number): Promise<Set<number>> {
  const open = new Set<number>();
  const page = await client.get<{
    results?: { transactions?: { listing_id?: number }[] }[];
  }>(etsyPaths.receipts(shopId) + "?was_shipped=false&limit=100");
  for (const receipt of page.results ?? []) {
    for (const tx of receipt.transactions ?? []) {
      if (tx.listing_id != null) open.add(tx.listing_id);
    }
  }
  return open;
}

async function mirrorProduct(
  admin: ReturnType<typeof createAdminClient>,
  listingId: number,
  patch: { status?: string; description?: string },
) {
  await admin
    .from("products")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("org_id", EON_ORG_ID)
    .eq("etsy_listing_id", listingId);
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const apply = new URL(request.url).searchParams.get("apply") === "1";
  const log: Record<string, unknown>[] = [];

  try {
    const client = await EtsyClient.forOrg(EON_ORG_ID);
    const shopId = await client.requireShopId();
    const name = await shopName(client, shopId);
    if (name.toLowerCase() !== EON_SHOP_NAME.toLowerCase()) {
      return NextResponse.json(
        { error: `shop is ${name || "unknown"}, expected ${EON_SHOP_NAME}`, log },
        { status: 409 },
      );
    }

    const admin = createAdminClient();
    const open = await openListingIds(client, shopId);
    const reference = await getListingPersonalization(
      client,
      HAMMERED_REFERENCE_LISTING_ID,
    );

    for (const listingId of CHRISTMAS_LISTING_IDS) {
      const live = await getListing(client, listingId);
      const description = decodeHtmlEntities(live.description ?? "");
      const disclosed = hasUnconfirmedHolidayDisclosure(description);
      const state = (live as { state?: string }).state ?? "unknown";
      if (!disclosed) {
        log.push({ listingId, action: "pause", ok: false, detail: "disclosure absent, left active" });
        continue;
      }
      if (open.has(listingId)) {
        log.push({ listingId, action: "pause", ok: false, detail: "open unshipped order, left active" });
        continue;
      }
      if (state === "inactive") {
        log.push({ listingId, action: "pause", ok: true, detail: "already inactive" });
        continue;
      }
      if (!apply) {
        log.push({ listingId, action: "pause", ok: true, detail: `dry: would pause from ${state}` });
        continue;
      }
      await client.requestForm(
        "PATCH",
        etsyPaths.shopListing(shopId, listingId),
        { state: "inactive" },
      );
      await sleep(300);
      const back = await getListing(client, listingId);
      const backState = (back as { state?: string }).state;
      if (backState !== "inactive") {
        log.push({ listingId, action: "pause", ok: false, detail: `read-back state ${backState ?? "missing"}` });
        continue;
      }
      await mirrorProduct(admin, listingId, { status: "inactive" });
      await logAudit(admin, {
        orgId: EON_ORG_ID,
        action: "etsy.listing_state",
        entityType: "product",
        summary: `Listing ${listingId} paused: Christmas specs still unconfirmed. Record kept.`,
        diff: { etsy_listing_id: listingId, from: state, to: "inactive" },
        source: "app",
      });
      log.push({ listingId, action: "pause", ok: true, detail: "inactive, disclosure kept" });
      await sleep(150);
    }

    const copyIds = [
      ...new Set<number>([
        ...ENGRAVING_LISTING_IDS,
        LAUREL_LISTING_ID,
        COUNTERFORM_LISTING_ID,
      ]),
    ];
    for (const listingId of copyIds) {
      const questions = (await getListingPersonalization(
        client,
        listingId,
      )) as FontQuestion[];
      const menu = fontMenuLabel(questions);
      const live = await getListing(client, listingId);
      const description = decodeHtmlEntities(live.description ?? "");
      const repaired = repairCoreListingCopy({ listingId, description, fontMenu: menu });
      const entry: Record<string, unknown> = {
        listingId,
        action: "copy",
        menu,
        questions: questions.map((q) => ({
          type: q.question_type,
          text: q.question_text,
          options: (q.options ?? []).map((o) => o.label),
        })),
        changes: repaired.changes,
      };
      if (repaired.changes.length === 0) {
        log.push({ ...entry, ok: true, detail: "no safe text change" });
        continue;
      }
      if (!apply) {
        log.push({ ...entry, ok: true, detail: "dry" });
        continue;
      }
      await updateListingDescription(client, listingId, repaired.description);
      await sleep(400);
      const back = decodeHtmlEntities((await getListing(client, listingId)).description ?? "");
      if (back.trim() !== repaired.description.trim()) {
        log.push({ ...entry, ok: false, detail: "description read-back differed" });
        continue;
      }
      await mirrorProduct(admin, listingId, { description: repaired.description });
      log.push({ ...entry, ok: true, detail: "written and read back" });
      await sleep(150);
    }

    if (apply) {
      const counterLive = decodeHtmlEntities(
        (await getListing(client, COUNTERFORM_LISTING_ID)).description ?? "",
      );
      const counterQuestions = await getListingPersonalization(client, COUNTERFORM_LISTING_ID);
      if (!/no engraving/i.test(counterLive)) {
        log.push({
          listingId: COUNTERFORM_LISTING_ID,
          action: "clear-personalization",
          ok: false,
          detail: "description no longer excludes engraving; fields left as they are",
        });
      } else if (counterQuestions.length > 0) {
        try {
          await client.request(
            "POST",
            etsyPaths.listingPersonalization(shopId, COUNTERFORM_LISTING_ID) +
              "?supports_multiple_personalization_questions=true",
            { personalization_questions: [] },
          );
          await sleep(400);
          const left = await getListingPersonalization(client, COUNTERFORM_LISTING_ID);
          log.push({
            listingId: COUNTERFORM_LISTING_ID,
            action: "clear-personalization",
            ok: left.length === 0,
            detail: left.length === 0 ? "removed" : `still ${left.length} questions`,
          });
        } catch (e) {
          log.push({
            listingId: COUNTERFORM_LISTING_ID,
            action: "clear-personalization",
            ok: false,
            detail: e instanceof Error ? e.message.slice(0, 180) : String(e),
          });
        }
      } else {
        log.push({
          listingId: COUNTERFORM_LISTING_ID,
          action: "clear-personalization",
          ok: true,
          detail: "already no personalization",
        });
      }
    }

    let featuredSupported: boolean | null = null;
    for (const slot of FEATURED_REPLACEMENTS) {
      if (!apply) {
        log.push({ listingId: slot.listingId, action: "feature", ok: true, detail: `dry: rank ${slot.rank}` });
        continue;
      }
      if (featuredSupported === false) {
        log.push({ listingId: slot.listingId, action: "feature", ok: false, detail: "api rejected featured_rank" });
        continue;
      }
      try {
        await client.requestForm("PATCH", etsyPaths.shopListing(shopId, slot.listingId), {
          featured_rank: slot.rank,
        });
        await sleep(300);
        const back = await getListing(client, slot.listingId);
        const rank = (back as { featured_rank?: number }).featured_rank;
        featuredSupported = rank === slot.rank;
        log.push({
          listingId: slot.listingId,
          action: "feature",
          ok: featuredSupported,
          detail: `read-back rank ${rank ?? "missing"}`,
        });
      } catch (e) {
        featuredSupported = false;
        log.push({
          listingId: slot.listingId,
          action: "feature",
          ok: false,
          detail: e instanceof Error ? e.message.slice(0, 180) : String(e),
        });
      }
    }

    const kinetic = await getListingPersonalization(client, KINETIC_LISTING_ID);
    log.push({
      listingId: HAMMERED_REFERENCE_LISTING_ID,
      action: "reference-menu",
      ok: true,
      detail: reference.map((q) => q.question_text).join(" | "),
      options: reference.flatMap((q) => (q.options ?? []).map((o) => o.label)),
    });
    log.push({
      listingId: KINETIC_LISTING_ID,
      action: "kinetic-personalization",
      ok: kinetic.length === 0,
      detail: kinetic.length === 0 ? "no engraving fields" : `${kinetic.length} questions still offered`,
    });

    return NextResponse.json({
      shop: name,
      apply,
      paused: log.filter((r) => r.action === "pause" && r.ok).length,
      log,
    });
  } catch (e) {
    const message =
      e instanceof EtsyNotConnectedError
        ? e.message
        : e instanceof Error
          ? e.message
          : String(e);
    return NextResponse.json({ error: message.slice(0, 500), apply, log }, { status: 502 });
  }
}
