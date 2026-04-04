"use client"

import * as React from "react"
import {
  Users,
  GraduationCap,
  LayoutGrid,
  Home,
  LineChart,
  BadgeDollarSign,
} from "lucide-react"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

const data = {
  teams: [
    {
      name: "CSEDU PMICS Portal",
      logo: GraduationCap,
      plan: "University Management",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/protected",
      icon: Home,
    },
    {
      title: "Batches",
      url: "/protected/batch",
      icon: LayoutGrid,
    },
    {
      title: "Teachers",
      url: "/protected/teachers",
      icon: Users,
    },
    {
      title: "Courses",
      url: "/protected/courses",
      icon: GraduationCap,
    },
    {
      title: "Fees",
      url: "/protected/fees",
      icon: BadgeDollarSign,
      items: [
        { title: "Fee Types", url: "/protected/fees" },
        { title: "Fee Collection", url: "/protected/fees/collection" },
      ],
    },
    {
      title: "Reports",
      url: "/protected/report",
      icon: LineChart,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
