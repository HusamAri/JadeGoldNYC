"use server";

import { revalidatePath } from "next/cache";

import { requireMembership, getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/db/queries/profile";
import {
  boardTitleSchema,
  commentBodySchema,
  pinPositionSchema,
} from "@/lib/validations/design-board";

export interface BoardActionResult {
  ok?: boolean;
  id?: string;
  error?: string;
}

/** Oturumdaki kullanıcının görünen adı (yorum yazarı için). */
async function currentAuthor(): Promise<{ id: string | null; name: string | null }> {
  const user = await getUser();
  if (!user) return { id: null, name: null };
  const supabase = await createClient();
  const profile = await getProfile(supabase, user.id);
  return { id: user.id, name: profile?.full_name || user.email || null };
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Yeni pano — görsel FormData ile SUNUCUYA gönderilir, sunucu Storage'a org
 * klasörüne yükler (istemci egress'ine bağlı değil), sonra kayıt oluşturur.
 * Ölçüler (width/height) istemcide okunup gönderilir (leader-line oranı için).
 */
export async function createBoard(
  formData: FormData,
): Promise<BoardActionResult> {
  const m = await requireMembership();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Görsel seçilmedi." };
  }
  if (!file.type.startsWith("image/")) {
    return { error: "Yalnızca görsel dosyası yükleyebilirsiniz." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { error: "Görsel 10 MB'ı aşamaz." };
  }
  const title =
    boardTitleSchema.parse(String(formData.get("title") ?? "").trim() || "Pano") ||
    "Pano";
  const width = Number(formData.get("width")) || null;
  const height = Number(formData.get("height")) || null;
  const ext = (file.type.split("/")[1] || "png")
    .replace("jpeg", "jpg")
    .replace("svg+xml", "svg");
  const path = `${m.org_id}/${crypto.randomUUID()}.${ext}`;

  const supabase = await createClient();
  const author = await currentAuthor();
  const { error: upErr } = await supabase.storage
    .from("design-boards")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (upErr) return { error: "Yükleme başarısız: " + upErr.message };

  const { data, error } = await supabase
    .from("design_boards")
    .insert({
      org_id: m.org_id,
      title,
      image_path: path,
      image_width: width,
      image_height: height,
      created_by: author.id,
    })
    .select("id")
    .single();
  if (error) {
    await supabase.storage.from("design-boards").remove([path]);
    return { error: error.message };
  }
  revalidatePath("/tasarimlar/pano");
  return { ok: true, id: (data as { id: string }).id };
}

/** Panoya pin + ilk yorum ekler. */
export async function addPin(input: {
  boardId: string;
  x: number;
  y: number;
  body: string;
}): Promise<BoardActionResult> {
  const m = await requireMembership();
  const pos = pinPositionSchema.safeParse({ x: input.x, y: input.y });
  const body = commentBodySchema.safeParse(input.body);
  if (!pos.success) return { error: "Geçersiz pin konumu." };
  if (!body.success)
    return { error: body.error.issues[0]?.message ?? "Yorum geçersiz." };

  const supabase = await createClient();
  const author = await currentAuthor();
  const { data: pin, error: pinError } = await supabase
    .from("design_pins")
    .insert({
      board_id: input.boardId,
      org_id: m.org_id,
      x: pos.data.x,
      y: pos.data.y,
      created_by: author.id,
    })
    .select("id")
    .single();
  if (pinError) return { error: pinError.message };

  const { error: cError } = await supabase.from("design_pin_comments").insert({
    pin_id: (pin as { id: string }).id,
    org_id: m.org_id,
    author_id: author.id,
    author_name: author.name,
    body: body.data,
  });
  if (cError) return { error: cError.message };

  revalidatePath(`/tasarimlar/pano/${input.boardId}`);
  return { ok: true, id: (pin as { id: string }).id };
}

/** Bir pin'in thread'ine yanıt ekler (tüm org üyeleri yazabilir). */
export async function addComment(input: {
  boardId: string;
  pinId: string;
  body: string;
}): Promise<BoardActionResult> {
  const m = await requireMembership();
  const body = commentBodySchema.safeParse(input.body);
  if (!body.success)
    return { error: body.error.issues[0]?.message ?? "Yorum geçersiz." };

  const supabase = await createClient();
  const author = await currentAuthor();
  const { error } = await supabase.from("design_pin_comments").insert({
    pin_id: input.pinId,
    org_id: m.org_id,
    author_id: author.id,
    author_name: author.name,
    body: body.data,
  });
  if (error) return { error: error.message };

  revalidatePath(`/tasarimlar/pano/${input.boardId}`);
  return { ok: true };
}

/** Panoyu (ve Storage görselini) siler. */
export async function deleteBoard(id: string): Promise<{ error?: string }> {
  const m = await requireMembership();
  const supabase = await createClient();
  const { data: board } = await supabase
    .from("design_boards")
    .select("image_path")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.from("design_boards").delete().eq("id", id);
  if (error) return { error: error.message };
  const path = (board as { image_path?: string } | null)?.image_path;
  if (path && path.startsWith(`${m.org_id}/`)) {
    await supabase.storage.from("design-boards").remove([path]);
  }
  revalidatePath("/tasarimlar/pano");
  return {};
}
