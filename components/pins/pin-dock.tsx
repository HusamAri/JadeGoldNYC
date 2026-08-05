import { getMembership, getUser } from "@/lib/auth";
import { getPinLibrary, getPinsForTargets } from "@/lib/db/queries/pins";
import { PinBoard } from "@/components/pins/pin-board";

/**
 * TEK hedefli yüzeyler (detay sayfaları) için RSC sarmalayıcı — pinleri ve
 * kullanıcının setini kendisi çeker. LİSTE yüzeyleri bunu KULLANMAZ (satır
 * başına sorgu olur): sayfada getPinsForTargets ile toplu çekip PinBoard'u
 * doğrudan render ederler.
 */
export async function PinDock({
  targetType,
  targetId,
  size = "md",
  className,
}: {
  targetType: "task" | "sale" | "event" | "audit";
  targetId: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const m = await getMembership();
  const user = await getUser();
  if (!m || !user) return null;
  const [pinMap, myStickers] = await Promise.all([
    getPinsForTargets(m.org_id, targetType, [targetId]),
    getPinLibrary(),
  ]);
  const pins = pinMap.get(targetId) ?? [];
  if (pins.length === 0 && myStickers.length === 0) return null;
  return (
    <PinBoard
      targetType={targetType}
      targetId={targetId}
      pins={pins}
      myStickers={myStickers}
      meId={user.id}
      size={size}
      className={className}
    />
  );
}
