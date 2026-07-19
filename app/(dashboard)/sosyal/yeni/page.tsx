import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireMembership } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SocialPostForm } from "@/components/social/social-post-form";

export const metadata = { title: "Yeni sosyal içerik" };

export default async function SosyalYeniPage() {
  await requireMembership();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Yeni içerik"
        description="Takvime Instagram / TikTok planı ekle"
        action={
          <Button asChild variant="outline">
            <Link href="/sosyal">
              <ArrowLeft />
              Takvim
            </Link>
          </Button>
        }
      />
      <Card>
        <CardContent className="pt-6">
          <SocialPostForm />
        </CardContent>
      </Card>
    </div>
  );
}
