
import React from 'react';
import { PlayerStats, Goal } from './types';
import { 
  TrendingUp, 
  Wallet, 
  Heart, 
  CreditCard, 
  Calendar,
  Briefcase,
  Target,
  Trophy,
  MapPin,
  Zap,
  Users,
  Banknote
} from 'lucide-react';

interface DashboardProps {
  stats: PlayerStats;
  goals: Goal[];
  netAssets: number;
}

const StatCard = ({ icon: Icon, label, value, color, unit = "₦" }: any) => (
  <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5 hover:border-emerald-100 transition-all hover:shadow-md">
    <div className={`p-4 rounded-2xl ${color} shadow-sm`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div className="overflow-hidden">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-lg font-black text-slate-900 truncate">
        {unit === "₦" ? `₦${Math.floor(value).toLocaleString()}` : `${Math.floor(value)}${unit}`}
      </p>
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ stats, goals, netAssets }) => {
  const getPhase = () => {
    if (stats.currentWeek > 300) return { name: "Billionaire Era", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" };
    if (stats.currentWeek > 150) return { name: "Oga Era", color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200" };
    if (stats.currentWeek > 50) return { name: "Hustle Era", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" };
    return { name: "Sapa Era", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" };
  };

  const phase = getPhase();

  return (
    <div className="space-y-6 mb-8">
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-900 rounded-2xl text-white">
            <Calendar size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Timeline</p>
            <p className="text-sm font-black text-slate-900">Week {stats.currentWeek}</p>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-2xl border ${phase.bg} ${phase.color} ${phase.border} flex items-center gap-2 animate-pulse`}>
          <Zap size={14} className="fill-current" />
          <span className="text-xs font-black uppercase tracking-widest">{phase.name}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Wallet} label="Liquid Cash" value={stats.balance} color="bg-emerald-500" />
        <StatCard icon={TrendingUp} label="Net Worth" value={netAssets} color="bg-indigo-500" />
        <StatCard icon={CreditCard} label="Debt" value={stats.debt} color="bg-rose-500" />
        <StatCard icon={Heart} label="Vibes" value={stats.happiness} color="bg-pink-500" unit="%" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="p-4 rounded-2xl bg-slate-100 text-slate-700"><Briefcase size={24} /></div>
          <div className="overflow-hidden">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stats.name}</p>
            <p className="text-sm font-black text-slate-900 truncate uppercase flex items-center gap-2">
              {stats.job}
              {stats.maritalStatus === 'married' && <Users size={12} className="text-indigo-400" />}
            </p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="p-4 rounded-2xl bg-amber-100 text-amber-600"><MapPin size={24} /></div>
          <div className="overflow-hidden">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Base Location</p>
            <p className="text-sm font-black text-slate-900 uppercase">{stats.city}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="p-4 rounded-2xl bg-emerald-100 text-emerald-600"><Banknote size={24} /></div>
          <div className="overflow-hidden">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Monthly Income</p>
            <p className="text-sm font-black text-slate-900">₦{stats.salary.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Trophy className="w-32 h-32 text-white" />
        </div>
        <div className="relative z-10">
          <h3 className="text-xs font-black text-indigo-400 flex items-center gap-2 mb-4 uppercase tracking-[0.2em]">
            <Target className="w-4 h-4" /> Destination Wealth
          </h3>
          {goals.map(goal => {
            const progress = Math.min(100, Math.max(0, (netAssets / goal.target) * 100));
            return (
              <div key={goal.id} className="space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-2xl font-black text-white">{goal.title}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Cost: ₦{goal.target.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-3xl font-black ${goal.completed ? 'text-emerald-400' : 'text-amber-400'}`}>{Math.floor(progress)}%</p>
                  </div>
                </div>
                <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className={`h-full transition-all duration-1000 rounded-full ${goal.completed ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-amber-400'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
