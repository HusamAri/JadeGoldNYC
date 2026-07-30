import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireMembership } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { SocialPost } from "@/lib/db/queries/social";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SocialPostForm } from "@/components/social/social-post-form";
import { PublishKit } from "@/components/social/publish-kit";

export const metadata = { title: "Sosyal içerik" };

export default async function SosyalDetayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const m = await requireMembership();
  const supabase = await createClient();
  const { data } = await supabase
    .from("social_posts")
    .select("*")
    .eq("org_id", m.org_id)
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const post = data as SocialPost;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title={post.title}
        description="İçerik düzenle · caption / hashtag / durum"
        action={
          <Button asChild variant="outline">
            <Link href="/sosyal">
              <ArrowLeft />
              Takvim
            </Link>
          </Button>
        }
      />
      {/* Günü gelince platforma aktarım: hazır kopyala-yapıştır blokları. */}
      <PublishKit post={post} />
      <Card>
        <CardContent className="pt-6">
          <SocialPostForm post={post} />
        </CardContent>
      </Card>
    </div>
  );
}
