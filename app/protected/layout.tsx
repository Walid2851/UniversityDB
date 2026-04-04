'use client';

import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/protected": "Dashboard",
  "/protected/batch": "Batches",
  "/protected/teachers": "Teachers",
  "/protected/courses": "Courses",
  "/protected/fees": "Fees",
  "/protected/fees/collection": "Fee Collection",
  "/protected/report": "Reports",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const pageTitle = PAGE_TITLES[pathname] ?? "Dashboard";

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />
          <span className="font-semibold text-sm">{pageTitle}</span>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
        <footer className="border-t py-3 px-6 text-xs text-muted-foreground flex items-center justify-between">
          <span>CSEDU PMICS Portal</span>
          <span>© {new Date().getFullYear()} University Management System</span>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
