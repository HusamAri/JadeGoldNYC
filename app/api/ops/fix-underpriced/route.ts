import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { EtsyClient } from "@/lib/etsy/client";
import {
  FLAT_FIX_TARGETS,
  runFlatFix,
  type FlatFixRow,
} from "@/lib/etsy/underpriced";

export const maxDuration = 300;

/**
 * Varyantını kaybetmiş listing'lerin ZARARINA fiyatını düzeltir
 * (gözetimli, tek seferlik, idempotent). Çekirdek mantık ve hedef listesi
 * `lib/etsy/underpriced.ts`te — aynı akış /fiyat panelindeki tek-tuş
 * itişten de koşturulabilir; bu rota curl/cron yolu için durur.
 *
 * Teşhis, mod semantiği (floor/safe) ve güvenlik korumaları (yalnız
 * yükseltme, yapılandırılmış SKU reddi, geri-okuma doğrulaması) için
 * lib dosyasının başlığına bakın.
 *
 * Auth: `Authorization: Bearer $CRON_SECRET` veya `?token=$PRUNE_ONE_SHOT_TOKEN`.
 * Varsayılan KURU ÇALIŞMA — gerçek yazma için `?apply=1`.
 */

const ONE_SHOT = process.env.PRUNE_ONE_SHOT_TOKEN;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const url = new URL(request.url);
  const oneShot = url.searchParams.get("token");
  const authorized =
    (secret && auth === `Bearer ${secret}`) ||
    (ONE_SHOT != null && ONE_SHOT.length > 0 && oneShot === ONE_SHOT);
  if (!authorized) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const apply = url.searchParams.get("apply") === "1";
  const mode = url.searchParams.get("mode") === "safe" ? "safe" : "floor";
  const only = url.searchParams.get("listing");
  const targets = only
    ? FLAT_FIX_TARGETS.filter((t) => String(t.listingId) === only)
    : FLAT_FIX_TARGETS;
  if (targets.length === 0) {
    return NextResponse.json({ error: "no matching target" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: org, error: orgErr } = await admin
    .from("organizations")
    .select("id, name")
    .eq("name", "EON")
    .maybeSingle();
  if (orgErr || !org) {
    return NextResponse.json(
      { error: orgErr?.message ?? "EON org not found" },
      { status: 500 },
    );
  }

  let client: EtsyClient;
  try {
    client = await EtsyClient.forOrg(org.id);
  } catch (e) {
    return NextResponse.json(
      {
        error: "etsy not connected",
        detail: e instanceof Error ? e.message : String(e),
      },
      { status: 503 },
    );
  }

  const results: FlatFixRow[] = [];
  for (const t of targets) {
    results.push(await runFlatFix(client, admin, org.id, t, { apply, mode }));
  }

  return NextResponse.json({
    dry_run: !apply,
    mode,
    note:
      mode === "floor"
        ? "floor modu en dar bedenin liste fiyatını basar — geniş bedende zarar riski SÜRER. Kalıcı çözüm varyant matrisini geri kurmak."
        : "safe modu hiçbir konfigürasyonun zarar etmeyeceği fiyatı basar (ticari olarak caydırıcı).",
    results,
  });
}
