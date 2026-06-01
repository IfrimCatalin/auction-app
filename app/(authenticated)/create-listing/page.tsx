import { AuthenticatedSection } from "@/components/authenticated-layout";
import { CreateListingForm } from "@/components/create-listing-form";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { createClient } from "@/lib/supabase/server";

export default async function CreateListingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return (
    <AuthenticatedSection>
      <PageHeader
        eyebrow="Sell"
        title="List an item"
        description="Share something special. Add a clear photo and an honest description."
      />

      <Card padding="lg" hover={false} className="mt-8 max-w-2xl">
        <CreateListingForm sellerId={user.id} />
      </Card>
    </AuthenticatedSection>
  );
}
