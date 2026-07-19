"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ShopifyConnectForm({ configured }: { configured: boolean }) {
  const [shop, setShop] = useState("");
  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!configured || !shop.trim()) return;
        window.location.href = `/api/shopify/connect?shop=${encodeURIComponent(shop.trim())}`;
      }}
    >
      <Input
        value={shop}
        onChange={(e) => setShop(e.target.value)}
        placeholder="marka.myshopify.com"
        className="max-w-xs"
        disabled={!configured}
      />
      <Button type="submit" disabled={!configured || !shop.trim()}>
        <ExternalLink className="size-4" />
        Shopify&apos;a bağlan
      </Button>
    </form>
  );
}
