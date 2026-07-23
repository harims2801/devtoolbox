import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { SectionHeader } from "@/components/shared/section-header";
import { SavedToolsView } from "@/components/tools/saved-tools-view";

export const metadata: Metadata = {
  title: "Favorites and Recent Tools",
  description:
    "Access your locally saved favorite and recently opened DevToolbox tools.",
};

export default function FavoritesPage() {
  return (
    <PageContainer>
      <main className="py-10 sm:py-12">
        <SectionHeader
          description="Quick access to tools saved in this browser. No account or cloud sync is required."
          headingLevel={1}
          title="Your tools"
        />
        <SavedToolsView />
      </main>
    </PageContainer>
  );
}
