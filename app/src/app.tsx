import React, { useState } from 'react'
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  ThemeEditorModal,
  NavBreadcrumbs,
  NavOutlet,
  useTheme,
  useNavigation,
} from '@consona/interface'
import {
  Moon,
  Palette,
  Sun,
} from 'lucide-react'
import { OverviewPage } from './components/overview-page'
import { SearchDialog } from './components/search-dialog'
import { AppSidebar } from './components/app-sidebar'

export const App: React.FC = () => {
  const { navigate } = useNavigation()
  const [searchOpen, setSearchOpen] = useState(false)
  const [themeEditorOpen, setThemeEditorOpen] = useState(false)

  const { resolvedMode, setMode } = useTheme()

  const toggleTheme = () => {
    setMode(resolvedMode === 'dark' ? 'light' : 'dark')
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-bg text-fg flex flex-col selection:bg-primary/20">
      <SidebarProvider defaultOpen className="h-full flex-1 flex overflow-hidden">
        <div className="flex-1 flex overflow-hidden h-full">
          {/* Extracted Modular Sidebar Component */}
          <AppSidebar
            onOpenSearch={() => setSearchOpen(true)}
            onOpenThemeEditor={() => setThemeEditorOpen(true)}
          />

          {/* Main Inset Content Area */}
          <SidebarInset className="flex-1 flex flex-col min-w-0 overflow-hidden bg-bg h-full p-0">
            {/* Topbar Bar with Breadcrumbs & Theme Controls */}
            <header className="shrink-0 h-11 border-b border-border/60 bg-bg/85 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 z-10 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 overflow-hidden">
                <SidebarTrigger className="shrink-0" />
                <div className="h-4 w-px bg-border shrink-0" />
                <NavBreadcrumbs className="min-w-0 flex-1" />
              </div>

              {/* Density & Theme Controls */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                {/* Theme Editor Modal Button */}
                <button
                  type="button"
                  onClick={() => setThemeEditorOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-base border border-border/80 bg-primary/10 hover:bg-primary/20 text-primary transition-colors cursor-pointer text-xs font-semibold"
                  title="Open Theme & Design System Editor"
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Theme Editor</span>
                </button>

                {/* Theme Mode Toggle Button */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="p-1.5 rounded-base border border-border/80 bg-secondary hover:bg-secondary/80 text-secondary-fg transition-colors cursor-pointer"
                  title="Toggle Theme"
                >
                  {resolvedMode === 'dark' ? <Sun className="w-4 h-4 text-primary" /> : <Moon className="w-4 h-4 text-primary" />}
                </button>
              </div>
            </header>

            {/* Document Content View - Zero-Overhead Declarative NavOutlet */}
            <main className="flex-1 overflow-y-auto p-6 md:p-10 min-h-0">
              <NavOutlet fallback={<OverviewPage />} />
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>

      {/* ⌘K Search Modal - Direct O(1) Routing */}
      <SearchDialog
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={(path) => navigate(path)}
      />

      {/* Theme & Design System Editor Modal */}
      <ThemeEditorModal
        isOpen={themeEditorOpen}
        onClose={() => setThemeEditorOpen(false)}
      />
    </div>
  )
}
