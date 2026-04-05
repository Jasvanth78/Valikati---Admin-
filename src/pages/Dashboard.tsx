import React from 'react'
import { Users, LayoutDashboard, Star } from 'lucide-react'

const Dashboard = () => {
  const stats = {
    totalUsers: 1250,
    activeUsers: 450,
    mostSelectedRasi: 'Simmam (Leo)',
    dailyPredictions: 890
  }

  return (
    <div>
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-astrology-gold">Welcome back, Admin</h2>
          <p className="text-gray-400 font-['Inter']">Here's what's happening today in Valikatti.</p>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <StatCard title="Total Users" value={stats.totalUsers.toLocaleString()} icon={<Users className="text-astrology-gold" />} />
        <StatCard title="Active Users" value={stats.activeUsers.toLocaleString()} icon={<ActivityIcon className="text-astrology-gold" />} />
        <StatCard title="Top Rasi" value={stats.mostSelectedRasi} icon={<Star className="text-astrology-gold" />} />
        <StatCard title="Predicts Today" value={stats.dailyPredictions.toLocaleString()} icon={<LayoutDashboard className="text-astrology-gold" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-astrology-card p-6 rounded-xl border border-astrology-gold/10 h-80 flex flex-col">
          <h3 className="text-xl font-bold mb-4 text-astrology-gold">User Growth</h3>
          <div className="flex-1 flex items-center justify-center text-gray-600 border border-dashed border-gray-800 rounded-lg">
            Analytics Chart Coming Soon
          </div>
        </div>
        <div className="bg-astrology-card p-6 rounded-xl border border-astrology-gold/10 h-80 overflow-y-auto">
          <h3 className="text-xl font-bold mb-4 text-astrology-gold">Recent Activities</h3>
          <div className="space-y-4">
            <ActivityItem title="New Prediction Added" time="2h ago" type="Rasi Palan" />
            <ActivityItem title="Panchangam Updated" time="5h ago" type="System" />
            <ActivityItem title="12 New Users Joined" time="8h ago" type="Users" />
            <ActivityItem title="AI Prompt Modified" time="12h ago" type="AI" />
          </div>
        </div>
      </div>
    </div>
  )
}

const StatCard = ({ title, value, icon }: any) => (
  <div className="bg-astrology-card p-6 rounded-xl border border-astrology-gold/10 hover:border-astrology-gold/40 transition-all shadow-xl">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-astrology-gold/10 rounded-lg">{icon}</div>
      <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">+12%</span>
    </div>
    <h4 className="text-gray-400 text-sm font-['Inter']">{title}</h4>
    <p className="text-2xl font-bold mt-1 text-white">{value}</p>
  </div>
)

const ActivityItem = ({ title, time, type }: any) => (
  <div className="flex justify-between items-center p-3 rounded-lg bg-black/40 border border-white/5 hover:bg-black/60 transition-colors">
    <div className="flex items-center gap-3">
      <div className="w-1.5 h-1.5 rounded-full bg-astrology-gold shadow-[0_0_8px_#d4af37]"></div>
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-gray-500">{type}</div>
      </div>
    </div>
    <span className="text-xs text-gray-600 italic">{time}</span>
  </div>
)

const ActivityIcon = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
)

export default Dashboard
