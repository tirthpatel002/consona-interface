import React from 'react'
import {
  Sidebar,
  SidebarProvider,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarItem,
  SidebarSection,
  SidebarTrigger,
  SidebarRail,
  SidebarInset,
  Badge
    } from '@consona/interface'
import {
  Box,
  Compass,
  FileCode,
  Folder,
  Home,
  LayoutGrid,
  LifeBuoy,
  Settings,
  Sparkles,
  Users
    } from 'lucide-react'
import type { ComponentDocSpec } from '../types'

export const sidebarDoc: ComponentDocSpec = {
  id: 'sidebar',
  name: 'Sidebar',
  component: Sidebar,
  summary: 'Responsive navigation shell with collapsible rails, desktop/mobile breakpoints, section hierarchies, and state management.',
  subcomponents: [
    'SidebarProvider',
    'SidebarHeader',
    'SidebarContent',
    'SidebarFooter',
    'SidebarItem',
    'SidebarSection',
    'SidebarTrigger',
    'SidebarInset',
    'SidebarRail',
    'SidebarSeparator',
  ],
  playground: {
    defaultProps: {
      collapsible: 'dock'
    },
    minHeight: 600,
    controls: [
      {
        name: 'collapsible',
        type: 'select',
        options: ['dock', 'hidden', 'none']
      },
    ],
    render: (props: any) => (
      <div className="w-full h-[600px] border border-border rounded-macro overflow-hidden flex bg-bg">
        <SidebarProvider defaultOpen>
          <Sidebar {...props} className="border-r border-border">
            <SidebarHeader className="p-3 border-b border-border/60">
              <div className="flex items-center gap-2 font-bold text-sm overflow-hidden">
                <Sparkles className="w-4 h-4 shrink-0 text-primary" />
                <span className="truncate group-data-[collapsible=dock]:group-data-[state=collapsed]:hidden">Consona App</span>
              </div>
            </SidebarHeader>
            <SidebarContent className="p-2 space-y-4">
              <SidebarSection title="Platform">
                <SidebarItem icon={<Home className="w-4 h-4" />} isCurrent>
                  Overview
                </SidebarItem>
                <SidebarItem icon={<LayoutGrid className="w-4 h-4" />}>
                  Components
                </SidebarItem>
                <SidebarItem icon={<Sparkles className="w-4 h-4 text-amber-400" />}>
                  AI Assistant
                </SidebarItem>
              </SidebarSection>
            </SidebarContent>
            <SidebarFooter className="p-3 border-t border-border/60">
              <SidebarItem icon={<Settings className="w-4 h-4" />}>
                Settings
              </SidebarItem>
            </SidebarFooter>
            <SidebarRail />
          </Sidebar>
          <SidebarInset className="p-6 bg-muted/20 flex-1">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <span className="text-xs text-muted-fg font-mono">Main Viewport Container</span>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </div>
    )
    },
  examples: [
    {
      title: 'Full Navigation Shell with Sections',
      description: 'Nested sections and active state indicators.',
      minHeight: 480,
      render: () => (
        <div className="w-full h-[480px] border border-border rounded-macro overflow-hidden flex bg-bg">
          <SidebarProvider defaultOpen>
            <Sidebar collapsible="dock" className="border-r border-border">
              <SidebarHeader className="p-3 border-b border-border/60 font-semibold text-xs text-fg">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Compass className="w-4 h-4 shrink-0 text-primary" />
                  <span className="truncate group-data-[collapsible=dock]:group-data-[state=collapsed]:hidden">Workspace Shell</span>
                </div>
              </SidebarHeader>
              <SidebarContent className="p-2 space-y-3">
                <SidebarSection title="Core Features">
                  <SidebarItem icon={<Compass className="w-4 h-4" />} isCurrent>
                    Explore
                  </SidebarItem>
                  <SidebarItem icon={<Users className="w-4 h-4" />}>
                    Team Members
                  </SidebarItem>
                  <SidebarItem icon={<Folder className="w-4 h-4" />}>
                    Projects
                  </SidebarItem>
                </SidebarSection>
              </SidebarContent>
              <SidebarFooter className="p-2 border-t border-border/60">
                <SidebarItem icon={<LifeBuoy className="w-4 h-4" />}>
                  Support
                </SidebarItem>
              </SidebarFooter>
            </Sidebar>
            <SidebarInset className="p-6 bg-muted/10 flex-1 flex flex-col justify-center items-center text-center">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-fg">Active Dashboard Canvas</h4>
                <p className="text-xs text-muted-fg">Collapsing the sidebar transitions the layout smoothly.</p>
              </div>
            </SidebarInset>
          </SidebarProvider>
        </div>
      )
    },
    {
      title: 'State-Aware & Variant Slots Injection',
      description: 'Demonstrating slots with variant maps (expanded vs collapsed) and function-based state subscriptions.',
      minHeight: 500,
      render: () => (
        <div className="w-full h-[500px] border border-border rounded-macro overflow-hidden flex bg-bg">
          <SidebarProvider defaultOpen>
            <Sidebar
              collapsible="dock"
              className="border-r border-border"
              slots={{
                header: {
                  expanded: () => (
                    <div className="p-3 border-b border-border/60 flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-xs">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span>Enterprise Cloud</span>
                      </div>
                      <Badge intent="success" size="sm">Pro</Badge>
                    </div>
                  ),
                  collapsed: () => (
                    <div className="p-3 flex justify-center items-center border-b border-border/60">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                  )
                },
                search: ({ isOpen }: any) => (
                  <div className="p-2 border-b border-border/40">
                    {isOpen ? (
                      <div className="flex items-center gap-2 px-2 py-1 bg-muted/30 border border-border rounded-base text-xs text-muted-fg">
                        <span>Search docs...</span>
                        <kbd className="ml-auto text-[10px] font-mono bg-bg px-1 border border-border rounded-atom">⌘K</kbd>
                      </div>
                    ) : (
                      <div className="flex justify-center">
                        <div className="w-7 h-7 flex items-center justify-center bg-muted/30 border border-border rounded-base text-muted-fg text-xs">
                          🔍
                        </div>
                      </div>
                    )}
                  </div>
                ),
                footer: {
                  expanded: () => (
                    <div className="p-3 border-t border-border/60 flex items-center gap-2 text-xs text-muted-fg">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Cluster: us-east-1</span>
                    </div>
                  ),
                  collapsed: () => (
                    <div className="p-3 border-t border-border/60 flex justify-center">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" title="Connected" />
                    </div>
                  )
    }
    }}
            >
              <SidebarContent className="p-2 space-y-3">
                <SidebarSection title="Resources">
                  <SidebarItem icon={<Home className="w-4 h-4" />} isCurrent>
                    Dashboard
                  </SidebarItem>
                  <SidebarItem icon={<LayoutGrid className="w-4 h-4" />}>
                    Pipelines
                  </SidebarItem>
                  <SidebarItem icon={<Settings className="w-4 h-4" />}>
                    Settings
                  </SidebarItem>
                </SidebarSection>
              </SidebarContent>
              <SidebarRail />
            </Sidebar>
            <SidebarInset className="p-6 bg-muted/10 flex-1 flex flex-col justify-center items-center text-center">
              <div className="space-y-3">
                <div className="flex items-center gap-2 justify-center">
                  <SidebarTrigger />
                  <span className="text-xs font-semibold text-fg">Toggle Sidebar Dock Mode</span>
                </div>
                <p className="text-xs text-muted-fg max-w-sm">
                  Notice how the header, search, and footer slots seamlessly switch their layouts between full and collapsed icons when toggled!
                </p>
              </div>
            </SidebarInset>
          </SidebarProvider>
        </div>
      )
    },
    {
      title: 'Hidden Collapsible Mode with Edge-Hover Auto-Reveal',
      description: 'When collapsible="hidden" and collapsed, hovering near the screen/parent edge smoothly slides open the sidebar overlay and keeps it open while hovering.',
      minHeight: 500,
      render: () => (
        <div className="w-full h-[500px] border border-border rounded-macro overflow-hidden flex bg-bg relative">
          <SidebarProvider defaultOpen={false}>
            <Sidebar collapsible="hidden" className="border-r border-border">
              <SidebarHeader className="p-3 border-b border-border/60 font-semibold text-xs text-fg">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Sparkles className="w-4 h-4 shrink-0 text-primary" />
                  <span className="truncate">Auto-Reveal Navigation</span>
                </div>
              </SidebarHeader>
              <SidebarContent className="p-2 space-y-3">
                <SidebarSection title="Quick Access">
                  <SidebarItem icon={<Home className="w-4 h-4" />} isCurrent>
                    Dashboard
                  </SidebarItem>
                  <SidebarItem icon={<LayoutGrid className="w-4 h-4" />}>
                    Projects
                  </SidebarItem>
                  <SidebarItem icon={<Folder className="w-4 h-4" />}>
                    Documents
                  </SidebarItem>
                  <SidebarItem icon={<Settings className="w-4 h-4" />}>
                    Preferences
                  </SidebarItem>
                </SidebarSection>
              </SidebarContent>
              <SidebarFooter className="p-3 border-t border-border/60">
                <div className="flex items-center gap-2 text-xs text-muted-fg">
                  <div className="size-2 rounded-full bg-emerald-500" />
                  <span>Ready</span>
                </div>
              </SidebarFooter>
              <SidebarRail />
            </Sidebar>
            <SidebarInset className="p-6 bg-muted/10 flex-1 flex flex-col justify-center items-center text-center">
              <div className="space-y-3 max-w-md">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  <Sparkles className="size-3.5" />
                  Edge-Hover Enabled
                </div>
                <h4 className="text-base font-semibold text-fg">Hover the Left Edge to Reveal</h4>
                <p className="text-xs text-muted-fg leading-relaxed">
                  Move your mouse cursor to the left border of this box. The collapsed sidebar will smoothly slide in and stay open while you navigate or interact inside it.
                </p>
                <div className="pt-2 flex justify-center">
                  <SidebarTrigger />
                </div>
              </div>
            </SidebarInset>
          </SidebarProvider>
        </div>
      )
    },
  ]
}

