
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
  Baby,
  Banknote
} from 'lucide-react';

interface DashboardProps {
  stats: PlayerStats;
  goals: Goal[];
  netAssets: number;
}

const StatCard = ({ icon: Icon, label, value, color, unit = "₦" }: any) => (
  <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5 hover:border-indigo-100 transition-colors">
    <div className={`p-4 rounded-2xl ${color}`}>
      <Icon className="w-7 h-7 text-white" />
    </div>
    <div className="overflow-hidden">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-xl font-black text-slate-900 truncate">
        {unit === "₦" ? `₦${value.toLocaleString()}` : `${value}${unit}`}
      </p>
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ stats, goals, netAssets }) => {
  const getPhase = () => {
    if (stats.currentWeek > 300) return { name: "Billionaire Era", color: "text-amber-600", bg: "bg-amber-50" };
    if (stats.currentWeek > 150) return { name: "Oga Era", color: "text-indigo-600", bg: "bg-indigo-50" };
    if (stats.currentWeek > 50) return { name: "Hustle Era", color: "text-blue-600", bg: "bg-blue-50" };
    return { name: "Sapa Era", color: "text-emerald-600", bg: "bg-emerald-50" };
  };

  const phase = getPhase();

  return (
    <div className="space-y-6 mb-10">
      {/* Dynamic Week Header */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden relative">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-500" />
            <span className="text-sm font-black text-slate-600 uppercase tracking-widest">Endurance Run: Week {stats.currentWeek}</span>
          </div>
          <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${phase.bg} ${phase.color} flex items-center gap-1 border border-current opacity-80`}>
            <Zap className="w-3 h-3" /> {phase.name}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard icon={Wallet} label="Liquid Cash" value={stats.balance} color="bg-emerald-500" />
        <StatCard icon={TrendingUp} label="Net Assets" value={netAssets} color="bg-indigo-500" />
        <StatCard icon={CreditCard} label="Debt" value={stats.debt} color="bg-rose-500" />
        <StatCard icon={Heart} label="Happiness" value={stats.happiness} color="bg-pink-500" unit="%" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="p-4 rounded-2xl bg-slate-900"><Briefcase className="w-7 h-7 text-white" /></div>
          <div className="overflow-hidden">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stats.name}</p>
            <div className="flex flex-col">
              <p className="text-sm font-black text-slate-900 truncate uppercase flex items-center gap-2">
                {stats.job} 
                <span className="text-[8px] bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full border border-indigo-100 flex items-center gap-1">
                  {stats.maritalStatus === 'married' ? <Users size={10} /> : null}
                  {stats.maritalStatus === 'married' ? `Married (${stats.numberOfKids} Kids)` : 'Single'}
                </span>
              </p>
              <p className="text-[10px] font-bold text-emerald-600 uppercase flex items-center gap-1 mt-0.5">
                <Banknote size={10} /> ₦{stats.salary.toLocaleString()} / Month
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="p-4 rounded-2xl bg-amber-500"><MapPin className="w-7 h-7 text-white" /></div>
          <div className="overflow-hidden">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">City Context</p>
            <p className="text-sm font-black text-slate-900 truncate uppercase">{stats.city}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className={`p-4 rounded-2xl bg-rose-100`}><Target className="w-7 h-7 text-rose-600" /></div>
          <div className="overflow-hidden">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Challenge</p>
            <p className="text-xs font-black text-slate-600 truncate uppercase">{stats.challenge}</p>
          </div>
        </div>
      </div>

      {/* Primary Goal Tracking */}
      <div className="bg-slate-900 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10">
            <Trophy className="w-32 h-32 text-white" />
        </div>
        <div className="relative z-10">
          <h3 className="text-lg font-black text-white flex items-center gap-2 mb-6">
            <Zap className="w-5 h-5 text-amber-400" /> THE BIG DREAM
          </h3>
          {goals.map(goal => {
            const progress = Math.min(100, Math.max(0, (netAssets / goal.target) * 100));
            return (
              <div key={goal.id} className="space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-2xl font-black text-white">{goal.title}</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Cost: ₦{goal.target.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-amber-400">{Math.floor(progress)}%</p>
                  </div>
                </div>
                <div className="h-4 bg-white/10 rounded-full overflow-hidden border border-white/10">
                  <div 
                    className={`h-full transition-all duration-1000 rounded-full ${goal.completed ? 'bg-emerald-500' : 'bg-amber-400'}`}
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
