import { Suspense } from "react";

import { PageContainer } from "@/components/layout/page-container";
import { ToolSidebar } from "@/components/layout/tool-sidebar";

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageContainer>
      <div className="flex items-start">
        <Suspense fallback={<div className="hidden w-64 shrink-0 lg:block" />}>
          <ToolSidebar />
        </Suspense>
        <div className="min-w-0 flex-1 lg:border-l lg:pl-8">{children}</div>
      </div>
    </PageContainer>
  );
}
