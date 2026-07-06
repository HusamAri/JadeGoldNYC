import { createClient } from "@/lib/supabase/server";

export interface DesignBoardListItem {
  id: string;
  title: string;
  image_path: string;
  image_width: number | null;
  image_height: number | null;
  created_at: string;
  pin_count: number;
}

export interface DesignPinComment {
  id: string;
  author_name: string | null;
  body: string;
  created_at: string;
}

export interface DesignPin {
  id: string;
  x: number;
  y: number;
  created_at: string;
  comments: DesignPinComment[];
}

export interface DesignBoardDetail {
  id: string;
  title: string;
  image_path: string;
  image_width: number | null;
  image_height: number | null;
  created_at: string;
  pins: DesignPin[];
}

const SIGNED_URL_TTL = 60 * 60; // 1 saat

/** Org'un tasarım panoları — imzalı görsel URL'i + pin sayısıyla. */
export async function listDesignBoards(
  orgId: string,
): Promise<(DesignBoardListItem & { imageUrl: string | null })[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("design_boards")
    .select("id, title, image_path, image_width, image_height, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  const boards = (data ?? []) as unknown as Omit<
    DesignBoardListItem,
    "pin_count"
  >[];
  if (boards.length === 0) return [];

  const ids = boards.map((b) => b.id);
  const { data: pinRows } = await supabase
    .from("design_pins")
    .select("board_id")
    .in("board_id", ids);
  const counts = new Map<string, number>();
  for (const p of (pinRows ?? []) as { board_id: string }[]) {
    counts.set(p.board_id, (counts.get(p.board_id) ?? 0) + 1);
  }

  const signed = await Promise.all(
    boards.map((b) =>
      supabase.storage
        .from("design-boards")
        .createSignedUrl(b.image_path, SIGNED_URL_TTL),
    ),
  );

  return boards.map((b, i) => ({
    ...b,
    pin_count: counts.get(b.id) ?? 0,
    imageUrl: signed[i]?.data?.signedUrl ?? null,
  }));
}

/** Org'un koleksiyonları (kullanıcının "pano"ları) — tasarımları gruplar. */
export async function listCollections(
  orgId: string,
): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("design_collections")
    .select("id, name")
    .eq("org_id", orgId)
    .order("created_at", { ascending: true });
  return (data ?? []) as { id: string; name: string }[];
}

/** design_id → imzalı görsel URL'i (panosu/görseli olan tasarımlar için). */
export async function getDesignThumbs(
  orgId: string,
): Promise<Map<string, string>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("design_boards")
    .select("design_id, image_path")
    .eq("org_id", orgId)
    .not("design_id", "is", null);
  const rows = (data ?? []) as { design_id: string; image_path: string }[];
  const map = new Map<string, string>();
  if (rows.length === 0) return map;
  const signed = await Promise.all(
    rows.map((r) =>
      supabase.storage
        .from("design-boards")
        .createSignedUrl(r.image_path, SIGNED_URL_TTL),
    ),
  );
  rows.forEach((r, i) => {
    const url = signed[i]?.data?.signedUrl;
    if (url && !map.has(r.design_id)) map.set(r.design_id, url);
  });
  return map;
}

/** Bir TASARIM kaydının panosu (0 veya 1) — pinler + thread + imzalı URL. */
export async function getBoardByDesign(
  designId: string,
): Promise<(DesignBoardDetail & { imageUrl: string | null }) | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("design_boards")
    .select("id")
    .eq("design_id", designId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const boardId = (data as { id: string } | null)?.id;
  if (!boardId) return null;
  return getDesignBoard(boardId);
}

/** Tek pano — pinler + her pin'in yorum thread'i + imzalı görsel URL'i. */
export async function getDesignBoard(
  id: string,
): Promise<(DesignBoardDetail & { imageUrl: string | null }) | null> {
  const supabase = await createClient();
  const { data: board } = await supabase
    .from("design_boards")
    .select("id, title, image_path, image_width, image_height, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!board) return null;
  const b = board as unknown as Omit<DesignBoardDetail, "pins">;

  const { data: pinRows } = await supabase
    .from("design_pins")
    .select("id, x, y, created_at")
    .eq("board_id", id)
    .order("created_at", { ascending: true });
  const pins = (pinRows ?? []) as unknown as Omit<DesignPin, "comments">[];

  const commentsByPin = new Map<string, DesignPinComment[]>();
  if (pins.length > 0) {
    const { data: commentRows } = await supabase
      .from("design_pin_comments")
      .select("id, pin_id, author_name, body, created_at")
      .in(
        "pin_id",
        pins.map((p) => p.id),
      )
      .order("created_at", { ascending: true });
    for (const c of (commentRows ?? []) as (DesignPinComment & {
      pin_id: string;
    })[]) {
      const list = commentsByPin.get(c.pin_id) ?? [];
      list.push({
        id: c.id,
        author_name: c.author_name,
        body: c.body,
        created_at: c.created_at,
      });
      commentsByPin.set(c.pin_id, list);
    }
  }

  const { data: signed } = await supabase.storage
    .from("design-boards")
    .createSignedUrl(b.image_path, SIGNED_URL_TTL);

  return {
    ...b,
    pins: pins.map((p) => ({ ...p, comments: commentsByPin.get(p.id) ?? [] })),
    imageUrl: signed?.signedUrl ?? null,
  };
}
