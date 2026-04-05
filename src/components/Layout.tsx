import React, { useState } from 'react'
import { LayoutDashboard, Users as UsersIcon, Calendar, Bell, MessageSquare, Settings as SettingsIcon, Menu, X, Star, Clock, LayoutGrid } from 'lucide-react'
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

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768)
  const [activePage, setActivePage] = useState('dashboard')

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard />
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
    <div className="flex min-h-screen w-full bg-astrology-dark text-white font-['Outfit'] relative">
      {/* Mobile Overlay */}
      {isSidebarOpen && window.innerWidth <= 768 && (
        <div 
          className="fixed inset-0 bg-black/50 z-10" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`
        ${isSidebarOpen ? 'w-64' : 'w-0 md:w-20'} 
        bg-astrology-card border-r border-astrology-gold/20 transition-all duration-300 
        flex flex-col fixed h-full z-20 overflow-hidden
        ${!isSidebarOpen && 'md:border-r-0'}
      `}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-gold-gradient rounded-full flex items-center justify-center shrink-0">
            <Star className="w-5 h-5 text-astrology-dark fill-astrology-dark" />
          </div>
          {isSidebarOpen && <h1 className="text-xl font-bold bg-gold-gradient bg-clip-text text-transparent italic truncate">Valikatti Admin</h1>}
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activePage === 'dashboard'} onClick={() => navigate('dashboard')} isOpen={isSidebarOpen} />
          <NavItem icon={<Star size={20} />} label="Rasi Palan" active={activePage === 'rasi'} onClick={() => navigate('rasi')} isOpen={isSidebarOpen} />
          <NavItem icon={<Calendar size={20} />} label="Panchangam" active={activePage === 'panchangam'} onClick={() => navigate('panchangam')} isOpen={isSidebarOpen} />
          <NavItem icon={<Star size={20} className="text-orange-400" />} label="Festivals" active={activePage === 'festivals'} onClick={() => navigate('festivals')} isOpen={isSidebarOpen} />
          <NavItem icon={<Calendar size={20} className="text-pink-400" />} label="Mugurtha Naal" active={activePage === 'mugurtha-naal'} onClick={() => navigate('mugurtha-naal')} isOpen={isSidebarOpen} />
          <NavItem icon={<Clock size={20} className="text-blue-400" />} label="Nalla Neram" active={activePage === 'nalla-neram'} onClick={() => navigate('nalla-neram')} isOpen={isSidebarOpen} />
          <NavItem icon={<UsersIcon size={20} />} label="Users" active={activePage === 'users'} onClick={() => navigate('users')} isOpen={isSidebarOpen} />
          <NavItem icon={<Bell size={20} />} label="Notifications" active={activePage === 'notifications'} onClick={() => navigate('notifications')} isOpen={isSidebarOpen} />
          <NavItem icon={<MessageSquare size={20} />} label="AI Control" active={activePage === 'ai'} onClick={() => navigate('ai')} isOpen={isSidebarOpen} />
          <NavItem icon={<LayoutGrid size={20} />} label="App Cards" active={activePage === 'app-cards'} onClick={() => navigate('app-cards')} isOpen={isSidebarOpen} />
          <NavItem icon={<SettingsIcon size={20} />} label="Settings" active={activePage === 'settings'} onClick={() => navigate('settings')} isOpen={isSidebarOpen} />
        </nav>

        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-4 hover:bg-astrology-gold/10 text-astrology-gold transition-colors flex justify-center border-t border-astrology-gold/10"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </aside>

      <main className={`
        ${isSidebarOpen ? 'md:ml-64' : 'md:ml-20'} 
        flex-1 p-4 md:p-8 transition-all duration-300 w-full
      `}>
        {/* Mobile Toggle Button (when sidebar is closed) */}
        {!isSidebarOpen && (
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden p-2 mb-4 bg-astrology-card border border-astrology-gold/20 rounded-lg text-astrology-gold"
          >
            <Menu size={24} />
          </button>
        )}
        {renderPage()}
      </main>
    </div>
  )
}

const NavItem = ({ icon, label, active = false, isOpen = true, onClick }: any) => (
  <div 
    onClick={onClick}
    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${active ? 'bg-gold-gradient text-astrology-dark font-bold' : 'hover:bg-astrology-gold/10 text-gray-500 hover:text-astrology-gold'}`}
  >
    {icon}
    {isOpen && <span className="truncate">{label}</span>}
  </div>
)

export default Layout
