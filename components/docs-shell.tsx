"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { forwardRef, useEffect, useState } from "react"
import { Sidebar, useSidebar } from "@cloudflare/kumo/components/sidebar"
import { LinkProvider, type LinkComponentProps } from "@cloudflare/kumo/utils"
import { SiteFooter } from "@/components/ui/site-footer"
import { SiteHeader, type NavigationItem } from "@/components/ui/site-header"
import { IconButton } from "@/components/ui/icon-button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { BookOpen, Braces, Database, FileCode2, FileQuestion, Github, House, KeyRound, Layers3, Library, PanelLeft, Search, Terminal, Upload, Users } from "lucide-react"
import { docHref, endpoints, groups, guides, references } from "@/lib/navigation"
import { SearchDialog } from "./search-dialog"
import { DocumentSwitcher } from "./document-switcher"

const AppLink = forwardRef<HTMLAnchorElement, LinkComponentProps>(function AppLink({ href, to: _to, ...props }, ref) {
  return <Link ref={ref} href={href ?? "/"} {...props} />
})

const groupIcons = [Database, Users, Library, Layers3, Upload, Braces]
const guideIcons = [BookOpen, KeyRound, Layers3]
const headerItems: NavigationItem[] = [
  { href: "/", title: "首页", icon: House },
  { href: docHref("overview"), title: "指南", icon: BookOpen },
  { href: docHref("upload"), title: "API 参考", icon: Braces },
  { href: docHref("examples"), title: "调用示例", icon: Terminal },
]

function Navigation({ onSearch }: { onSearch: () => void }) {
  const pathname = usePathname()
  const { setOpenMobile, state, toggleSidebar } = useSidebar()
  const active = endpoints.find(endpoint => pathname === docHref(endpoint.slug))
  return <Sidebar className="docs-sidebar" aria-label="文档导航">
    <Sidebar.Header className="docs-sidebar-header">
      <DocumentSwitcher />
      <Sidebar.Close className="docs-mobile-close" aria-label="关闭文档导航" />
    </Sidebar.Header>
    <Sidebar.Content className="docs-sidebar-content">
      <button className="docs-search" onClick={() => { setOpenMobile(false); onSearch() }} aria-label="搜索文档"><Search size={16} /><span>搜索文档...</span><kbd>Ctrl K</kbd></button>
      <Sidebar.Group>
        <Sidebar.GroupLabel>开始使用</Sidebar.GroupLabel>
        <Sidebar.Menu>{guides.map((guide, index) => <Sidebar.MenuButton key={guide.slug} href={docHref(guide.slug)} icon={guideIcons[index]} active={pathname === docHref(guide.slug)} aria-current={pathname === docHref(guide.slug) ? "page" : undefined} onClick={() => setOpenMobile(false)} tooltip={guide.title}>{guide.title}</Sidebar.MenuButton>)}</Sidebar.Menu>
      </Sidebar.Group>
      <Sidebar.Group>
        <Sidebar.GroupLabel>API 参考 <span className="docs-nav-count">{endpoints.length}</span></Sidebar.GroupLabel>
        <Sidebar.Menu>{groups.map((group, index) => <Sidebar.MenuItem key={group}>
          <Sidebar.Collapsible key={`${group}-${active?.group === group}`} defaultOpen={active?.group === group}>
            <Sidebar.CollapsibleTrigger render={<Sidebar.MenuButton icon={groupIcons[index]} tooltip={group} className={active?.group === group ? "docs-group-current" : undefined}>{group}<Sidebar.MenuChevron /></Sidebar.MenuButton>} />
            <Sidebar.CollapsibleContent><Sidebar.MenuSub>{endpoints.filter(endpoint => endpoint.group === group).map(endpoint => <Sidebar.MenuSubButton key={endpoint.slug} href={docHref(endpoint.slug)} active={pathname === docHref(endpoint.slug)} aria-current={pathname === docHref(endpoint.slug) ? "page" : undefined} onClick={() => setOpenMobile(false)}><span className="docs-nav-title">{endpoint.title}</span><span className={`method-text method-${endpoint.method.toLowerCase()}`}>{endpoint.method}</span></Sidebar.MenuSubButton>)}</Sidebar.MenuSub></Sidebar.CollapsibleContent>
          </Sidebar.Collapsible>
        </Sidebar.MenuItem>)}</Sidebar.Menu>
      </Sidebar.Group>
      <Sidebar.Group>
        <Sidebar.GroupLabel>资源</Sidebar.GroupLabel>
        <Sidebar.Menu>{references.map((item, index) => <Sidebar.MenuButton key={item.slug} href={docHref(item.slug)} icon={index ? FileCode2 : FileQuestion} active={pathname === docHref(item.slug)} aria-current={pathname === docHref(item.slug) ? "page" : undefined} onClick={() => setOpenMobile(false)} tooltip={item.title}>{item.title}</Sidebar.MenuButton>)}</Sidebar.Menu>
      </Sidebar.Group>
    </Sidebar.Content>
    <Sidebar.Footer className="docs-sidebar-footer"><button onClick={toggleSidebar} aria-label={state === "expanded" ? "收起侧栏" : "展开侧栏"} aria-expanded={state === "expanded"}><PanelLeft size={18} /><span>收起侧栏</span></button><Link href="/" aria-label="返回文档首页"><House size={18} /></Link><ThemeToggle /></Sidebar.Footer>
  </Sidebar>
}

function MobileTrigger() {
  const { toggleSidebar, openMobile } = useSidebar()
  return <IconButton className="docs-mobile-trigger" onClick={toggleSidebar} label="打开文档导航" aria-expanded={openMobile}><PanelLeft size={18} /></IconButton>
}

export function DocsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [searchOpen, setSearchOpen] = useState(false)
  const isHome = pathname === "/"
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setSearchOpen(value => !value) }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])
  return <LinkProvider component={AppLink}>
    <a className="docs-skip" href="#doc-content">跳转到文档内容</a>
    <Sidebar.Provider defaultOpen peekable className={`docs-shell${isHome ? " docs-shell-home" : ""}`} style={{ "--sidebar-width": "280px" } as React.CSSProperties}>
      {!isHome && <Navigation onSearch={() => setSearchOpen(true)} />}
      <div className="docs-body">
        {isHome ? <SiteHeader items={headerItems} activeHref="/" navigationLabel="文档分类" routeKey={pathname} LinkComponent={Link} actions={<>
          <IconButton label="搜索文档" onClick={() => setSearchOpen(true)}><Search size={18} /></IconButton>
          <IconButton className="docs-header-github" nativeButton={false} label="在 GitHub 查看 ATHub" render={<a href="https://github.com/AlbaTextus/athub" target="_blank" rel="noopener noreferrer" />}><Github size={18} /></IconButton>
          <ThemeToggle />
        </>} /> : <div className="docs-mobile-controls"><MobileTrigger /></div>}
        <main id="doc-content" className="docs-main" key={pathname}>{children}</main>
        {isHome && <SiteFooter LinkComponent={Link} brandHref="/" />}
      </div>
    </Sidebar.Provider>
    <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
  </LinkProvider>
}
