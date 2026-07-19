import type { NavItem } from "@/components/layout/nav-items";

/**
 * En uzun href eşleşmesini tercih eder — `/analizler` altında
 * `/analizler/tani` gibi kardeş rotaların "Performans"a yutulmasını önler.
 */
export function matchNavItem(
  items: NavItem[],
  pathname: string,
): NavItem | undefined {
  let best: NavItem | undefined;
  for (const item of items) {
    const hit =
      pathname === item.href || pathname.startsWith(`${item.href}/`);
    if (!hit) continue;
    if (!best || item.href.length > best.href.length) best = item;
  }
  return best;
}
