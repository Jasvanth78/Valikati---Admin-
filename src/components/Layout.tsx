import React, { useEffect, useState } from 'react'
import { LayoutDashboard, Users as UsersIcon, Calendar, Bell, MessageSquare, Settings as SettingsIcon, Star, Clock, LayoutGrid, BookOpen, Sparkles, Shield, Home, Eye, LogOut, PanelLeftClose, PanelLeftOpen, ChevronRight, X } from 'lucide-react'
import Dashboard from '../pages/Dashboard'
import RasiPalan from '../pages/RasiPalan'
import Panchangam from '../pages/Panchangam'
import Notifications from '../pages/Notifications'
import Users from '../pages/Users'
import AIControl from '../pages/AIControl'
import Festivals from '../pages/Festivals'
import MugurthaNaal from '../pages/MugurthaNaal'
import NallaNeram from '../pages/NallaNeram'
import Settings from '../pages/Settings'
import AppCards from '../pages/AppCards'
import Blogs from '../pages/Blogs'
import PosterPosts from '../pages/PosterPosts'
import AdManagement from '../pages/AdManagement'
import Events from '../pages/Events'
import Admins from '../pages/Admins'
import VastuSasthiram from '../pages/VastuSasthiram'
import Sakunam from '../pages/Sakunam'
import SpecialFeatures from '../pages/SpecialFeatures'
import Reels from '../pages/Reels'
import GovtHolidays from '../pages/GovtHolidays'
import Proverbs from '../pages/Proverbs'
import HomeComponents from '../pages/HomeComponents'

const Layout = ({ adminEmail = '', onLogout }: { adminEmail?: string; onLogout?: () => void }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768)
  const [activePage, setActivePage] = useState('dashboard')
  useEffect(() => {
    const breakpoint = window.matchMedia('(min-width: 768px)')
    const change = () => setIsSidebarOpen(breakpoint.matches)
    breakpoint.addEventListener('change', change)
    return () => breakpoint.removeEventListener('change', change)
  }, [])

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard />
      case 'home-components': return <HomeComponents />
      case 'blogs': return <Blogs />
      case 'poster-posts': return <PosterPosts />
      case 'ad-management': return <AdManagement />
      case 'events': return <Events />
      case 'rasi': return <RasiPalan />
      case 'panchangam': return <Panchangam />
      case 'notifications': return <Notifications />
      case 'users': return <Users />
      case 'festivals': return <Festivals />
      case 'mugurtha-naal': return <MugurthaNaal />
      case 'nalla-neram': return <NallaNeram />
      case 'ai': return <AIControl />
      case 'settings': return <Settings />
      case 'app-cards': return <AppCards />
      case 'admins': return <Admins />
      case 'vastu': return <VastuSasthiram />
      case 'sakunam': return <Sakunam />
      case 'special-features': return <SpecialFeatures />
      case 'reels': return <Reels />
      case 'govt-holidays': return <GovtHolidays />
      case 'proverbs': return <Proverbs />
      default: return <Dashboard />
    }
  }

  // Handle mobile closing on navigation
  const navigate = (page: string) => {
    setActivePage(page)
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false)
    }
  }

  return (
    <div className="admin-shell min-h-screen w-full bg-astrology-dark relative">
      {/* Mobile Overlay */}
      {isSidebarOpen && window.innerWidth <= 768 && (
        <div 
          className="fixed inset-0 bg-black/40 z-30" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : 'collapsed'}`} aria-label="Admin navigation">
        <div className="admin-brand">
          <img src="/logo.png" alt="" />
          {isSidebarOpen && <div><strong>Valikatti</strong><small>Administration</small></div>}
          {isSidebarOpen && <button className="icon-button md:hidden ml-auto" title="Close navigation" aria-label="Close navigation" onClick={() => setIsSidebarOpen(false)}><X size={16} /></button>}
        </div>

        <nav>
          {isSidebarOpen && <p className="nav-group">Workspace</p>}
          <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activePage === 'dashboard'} onClick={() => navigate('dashboard')} isOpen={isSidebarOpen} />
          <NavItem icon={<Home size={20} />} label="Home Components" active={activePage === 'home-components'} onClick={() => navigate('home-components')} isOpen={isSidebarOpen} />
          <NavItem icon={<BookOpen size={20} className="text-emerald-400" />} label="Blogs" active={activePage === 'blogs'} onClick={() => navigate('blogs')} isOpen={isSidebarOpen} />
          <NavItem icon={<LayoutGrid size={20} className="text-emerald-300" />} label="Poster Posts" active={activePage === 'poster-posts'} onClick={() => navigate('poster-posts')} isOpen={isSidebarOpen} />
          <NavItem icon={<Eye size={20} />} label="Ad Management" active={activePage === 'ad-management'} onClick={() => navigate('ad-management')} isOpen={isSidebarOpen} />
          <NavItem icon={<Sparkles size={20} className="text-amber-400" />} label="Upcoming Events" active={activePage === 'events'} onClick={() => navigate('events')} isOpen={isSidebarOpen} />
          <NavItem icon={<Star size={20} />} label="Rasi Palan" active={activePage === 'rasi'} onClick={() => navigate('rasi')} isOpen={isSidebarOpen} />
          <NavItem icon={<Calendar size={20} />} label="Panchangam" active={activePage === 'panchangam'} onClick={() => navigate('panchangam')} isOpen={isSidebarOpen} />
          <NavItem icon={<Star size={20} className="text-orange-400" />} label="Festivals" active={activePage === 'festivals'} onClick={() => navigate('festivals')} isOpen={isSidebarOpen} />
          <NavItem icon={<Home size={20} className="text-emerald-300" />} label="Vastu Sasthiram" active={activePage === 'vastu'} onClick={() => navigate('vastu')} isOpen={isSidebarOpen} />
          <NavItem icon={<Eye size={20} className="text-indigo-400" />} label="Sakunam (Omens)" active={activePage === 'sakunam'} onClick={() => navigate('sakunam')} isOpen={isSidebarOpen} />
          <NavItem icon={<Calendar size={20} className="text-pink-400" />} label="Mugurtha Naal" active={activePage === 'mugurtha-naal'} onClick={() => navigate('mugurtha-naal')} isOpen={isSidebarOpen} />
          <NavItem icon={<Clock size={20} className="text-blue-400" />} label="Nalla Neram" active={activePage === 'nalla-neram'} onClick={() => navigate('nalla-neram')} isOpen={isSidebarOpen} />
          {isSidebarOpen && <p className="nav-group">Management</p>}
          <NavItem icon={<UsersIcon size={20} />} label="Users" active={activePage === 'users'} onClick={() => navigate('users')} isOpen={isSidebarOpen} />
          <NavItem icon={<Bell size={20} />} label="Notifications" active={activePage === 'notifications'} onClick={() => navigate('notifications')} isOpen={isSidebarOpen} />
          <NavItem icon={<MessageSquare size={20} />} label="AI Control" active={activePage === 'ai'} onClick={() => navigate('ai')} isOpen={isSidebarOpen} />
          <NavItem icon={<LayoutGrid size={20} />} label="App Cards" active={activePage === 'app-cards'} onClick={() => navigate('app-cards')} isOpen={isSidebarOpen} />
          <NavItem icon={<Star size={20} className="text-yellow-400" />} label="Special Features" active={activePage === 'special-features'} onClick={() => navigate('special-features')} isOpen={isSidebarOpen} />
          <NavItem icon={<Calendar size={20} className="text-red-400" />} label="Govt Holidays" active={activePage === 'govt-holidays'} onClick={() => navigate('govt-holidays')} isOpen={isSidebarOpen} />
          <NavItem icon={<BookOpen size={20} className="text-green-400" />} label="Proverbs" active={activePage === 'proverbs'} onClick={() => navigate('proverbs')} isOpen={isSidebarOpen} />
          <NavItem icon={<Eye size={20} className="text-rose-400" />} label="Reels & Videos" active={activePage === 'reels'} onClick={() => navigate('reels')} isOpen={isSidebarOpen} />
          {isSidebarOpen && <p className="nav-group">System</p>}
          <NavItem icon={<SettingsIcon size={20} />} label="Settings" active={activePage === 'settings'} onClick={() => navigate('settings')} isOpen={isSidebarOpen} />
          <NavItem icon={<Shield size={20} />} label="Admins" active={activePage === 'admins'} onClick={() => navigate('admins')} isOpen={isSidebarOpen} />
        </nav>


        {onLogout && <div className="admin-account">{isSidebarOpen && <><span className="avatar">{adminEmail.charAt(0).toUpperCase() || 'A'}</span><div className="min-w-0 flex-1"><p className="text-xs font-semibold">Administrator</p><p className="truncate text-[10px] text-gray-500">{adminEmail}</p></div></>}<button aria-label="Sign out" title="Sign out" onClick={onLogout} className="icon-button"><LogOut size={16} /></button></div>}
      </aside>

      <div className={`admin-workspace ${!isSidebarOpen ? 'collapsed' : ''}`}>
        <header className="admin-topbar">
          <div className="flex items-center gap-3 min-w-0"><button className="icon-button" title={isSidebarOpen ? 'Collapse navigation' : 'Open navigation'} aria-label={isSidebarOpen ? 'Collapse navigation' : 'Open navigation'} onClick={() => setIsSidebarOpen(!isSidebarOpen)}>{isSidebarOpen ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}</button><span className="text-gray-500 hidden sm:inline">Workspace</span><ChevronRight size={13} className="text-gray-400 hidden sm:inline" /><span className="capitalize font-medium truncate">{activePage.replaceAll('-', ' ')}</span></div>
          <div className="flex items-center gap-2 text-[11px] text-gray-500"><Shield size={14} /><span>Admin console</span></div>
        </header>
        <main className="admin-content">{renderPage()}</main>
      </div>
    </div>
  )
}

const NavItem = ({ icon, label, active = false, isOpen = true, onClick }: any) => (
  <button type="button" title={label} aria-label={label} aria-current={active ? 'page' : undefined}
    onClick={onClick}
    className={`admin-nav-item ${active ? 'active' : ''}`}
  >
    {icon}
    {isOpen && <span className="truncate">{label}</span>}
  </button>
)

export default Layout
