
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  PlayerStats, 
  Scenario, 
  GameLog, 
  GameStatus, 
  Choice,
  Stock,
  PortfolioItem,
  Goal
} from './types';
import { getNextScenario, getEndGameAnalysis } from './geminiService';
import Dashboard from './Dashboard';
import StockMarket from './StockMarket';
import { 
  Loader2, 
  Banknote, 
  Heart, 
  Skull, 
  Flame, 
  Crown, 
  AlertCircle, 
  ArrowRight,
  CircleDollarSign,
  CheckCircle2,
  Zap,
  Users,
  MapPin,
  Briefcase
} from 'lucide-react';

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", 
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe", 
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", 
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", 
  "Sokoto", "Taraba", "Yobe", "Zamfara"
];

const INITIAL_ASSETS: Stock[] = [
  { id: 'lagos-gas', name: 'Lagos Gas Ltd.', price: 12500, history: [12000, 12500], sector: 'Energy', assetType: 'stock' },
  { id: 'nairatech', name: 'NairaTech Solutions', price: 25000, history: [22000, 25000], sector: 'Tech', assetType: 'stock' },
  { id: 'obudu-agri', name: 'Obudu Agriculture', price: 8000, history: [8200, 8000], sector: 'Agriculture', assetType: 'stock' },
  { id: 'naija-balanced', name: 'Naija Balanced Fund', price: 1000, history: [990, 1000], sector: 'Diversified', assetType: 'mutual_fund', description: 'Mixed bonds & stocks.' },
  { id: 'arm-growth', name: 'Hustle Growth Fund', price: 2500, history: [2400, 2500], sector: 'Growth', assetType: 'mutual_fund', description: 'Aggressive equity fund.' },
  { id: 'fgn-bond-fund', name: 'FGN Treasury Fund', price: 500, history: [500, 500], sector: 'Government', assetType: 'mutual_fund', description: 'Safe government bond pool.' },
];

const CHALLENGES = [
  { id: 'black-tax', name: 'Black Tax Heavy', icon: Heart, color: 'text-rose-500', description: 'Family needs a cut of every profit.' },
  { id: 'sapa-max', name: 'Sapa Level Max', icon: Flame, color: 'text-orange-500', description: 'Start with ₦10k + salary. Survival is key.' },
  { id: 'inflation', name: 'Inflation Fighter', icon: AlertCircle, color: 'text-amber-500', description: 'Start with ₦500k student debt.' },
  { id: 'silver-spoon', name: 'Silver Spoon', icon: Crown, color: 'text-indigo-500', description: '₦1M headstart, high expectations.' }
];

const JOBS = [
  "Digital Hustler", "Civil Servant", "Banker", "Market Trader", 
  "Tech Sis/Bro", "Doctor", "Artisan", "Content Creator", "Student"
];

const PRESET_GOALS: Goal[] = [
  { id: 'survive', title: 'Financial Peace', target: 2000000, category: 'savings', completed: false },
  { id: 'lekki', title: 'Lekki Landlord', target: 15000000, category: 'investment', completed: false },
  { id: 'japa', title: 'The Great Japa', target: 40000000, category: 'lifestyle', completed: false },
];

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.START);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [nextScenario, setNextScenario] = useState<Scenario | null>(null);
  const [history, setHistory] = useState<GameLog[]>([]);
  const [lastConsequences, setLastConsequences] = useState<{title: string, items: {text: string, decision: string}[]} | null>(null);
  const [activeTab, setActiveTab] = useState<'scenario' | 'invest' | 'history'>('scenario');
  const [stocks, setStocks] = useState<Stock[]>(INITIAL_ASSETS);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [gameOverReport, setGameOverReport] = useState<string>('');
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const isPrefetching = useRef(false);

  const [setupData, setSetupData] = useState({
    name: '', gender: 'male' as 'male' | 'female' | 'other', 
    job: 'Digital Hustler', salary: 150000, city: 'Lagos',
    challengeId: 'sapa-max', selectedGoalId: 'survive', 
    maritalStatus: 'single' as 'single' | 'married', numberOfKids: 0
  });

  const prefetchNext = useCallback(async (s: PlayerStats, h: GameLog[]) => {
    if (isPrefetching.current) return;
    isPrefetching.current = true;
    try {
      const scenario = await getNextScenario(s, h);
      setNextScenario(scenario);
    } catch (e) { console.error(e); }
    isPrefetching.current = false;
  }, []);

  const handleFinishSetup = async () => {
    if (!setupData.name) return alert("Enter your name!");
    
    // WEEK 1: START WITH SALARY PAID
    const baseline = setupData.challengeId === 'sapa-max' ? 10000 : setupData.challengeId === 'silver-spoon' ? 1000000 : 50000;
    const startBalance = baseline + setupData.salary;

    const initial: PlayerStats = {
      ...setupData, 
      age: 22, 
      balance: startBalance,
      savings: 0, 
      debt: setupData.challengeId === 'inflation' ? 500000 : 0, 
      happiness: 80, 
      currentWeek: 1, 
      challenge: CHALLENGES.find(c => c.id === setupData.challengeId)?.name || "The Hustle"
    };
    
    setStatus(GameStatus.LOADING);
    setStats(initial);
    setGoals([{ ...PRESET_GOALS.find(g => g.id === setupData.selectedGoalId)! }]);
    try {
      const scenario = await getNextScenario(initial, []);
      setCurrentScenario(scenario); setStatus(GameStatus.PLAYING); prefetchNext(initial, []);
    } catch (e) { setStatus(GameStatus.START); }
  };

  const toggleChoice = (index: number) => {
    if (selectedIndices.includes(index)) {
      setSelectedIndices(selectedIndices.filter(i => i !== index));
    } else if (selectedIndices.length < 2) {
      setSelectedIndices([...selectedIndices, index]);
    }
  };

  const triggerGameOver = async (s: PlayerStats, h: GameLog[]) => {
    setStatus(GameStatus.LOADING);
    const report = await getEndGameAnalysis(s, h);
    setGameOverReport(report);
    setStatus(GameStatus.GAMEOVER);
  };

  const confirmChoices = async () => {
    if (!stats || !currentScenario || selectedIndices.length === 0) return;
    
    let totalBalanceImpact = 0;
    let totalSavingsImpact = 0;
    let totalDebtImpact = 0;
    let totalHappinessImpact = 0;
    let consequences: {text: string, decision: string}[] = [];

    selectedIndices.forEach(idx => {
      const choice = currentScenario.choices[idx];
      totalBalanceImpact += choice.impact.balance;
      totalSavingsImpact += choice.impact.savings;
      totalDebtImpact += choice.impact.debt;
      totalHappinessImpact += choice.impact.happiness;
      consequences.push({ text: choice.consequence, decision: choice.text });

      if (choice.investmentId) {
        const stock = stocks.find(s => s.id === choice.investmentId);
        if (stock) {
          setPortfolio(prev => {
            const existing = prev.find(p => p.stockId === stock.id);
            if (existing) return prev.map(p => p.stockId === stock.id ? { ...p, shares: p.shares + 1 } : p);
            return [...prev, { stockId: stock.id, shares: 1, averagePrice: stock.price }];
          });
        }
      }
    });

    // SALARY CYCLE: Work 4 weeks, get paid Week 5, 9, 13...
    const isSalaryWeek = stats.currentWeek > 1 && (stats.currentWeek - 1) % 4 === 0;
    if (isSalaryWeek) {
      totalBalanceImpact += stats.salary;
      consequences.push({ text: `Salary Alert! ₦${stats.salary.toLocaleString()} don enter. Manage am well!`, decision: "SALARY PAYMENT" });
    }

    const newStats = {
      ...stats,
      balance: stats.balance + totalBalanceImpact,
      savings: Math.max(0, stats.savings + totalSavingsImpact),
      debt: Math.max(0, stats.debt + totalDebtImpact),
      happiness: Math.min(100, Math.max(0, stats.happiness + totalHappinessImpact)),
      currentWeek: stats.currentWeek + 1
    };

    const newHistory = [...history, { 
      week: stats.currentWeek, 
      title: currentScenario.title, 
      decision: selectedIndices.map(i => currentScenario.choices[i].text).join(" + "), 
      consequence: consequences.map(c => c.text).join(" ") 
    }];

    if (newStats.balance <= 0) {
      return triggerGameOver(newStats, newHistory);
    }

    setStats(newStats);
    setHistory(newHistory);
    setLastConsequences({ title: currentScenario.title, items: consequences });
    setSelectedIndices([]);
    if (!nextScenario) prefetchNext(newStats, newHistory);
  };

  const proceed = () => {
    if (nextScenario && stats) {
      setCurrentScenario(nextScenario); 
      setLastConsequences(null); 
      setNextScenario(null); 
      prefetchNext(stats, history);
    } else { 
      setStatus(GameStatus.LOADING); 
      setTimeout(() => setStatus(GameStatus.PLAYING), 1000); 
    }
  };

  const netAssets = (stats?.balance || 0) + portfolio.reduce((acc, p) => acc + (stocks.find(s => s.id === p.stockId)?.price || 0) * p.shares, 0);

  return (
    <div className="min-h-screen max-w-5xl mx-auto px-4 py-10 pb-32">
      {status === GameStatus.START && (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-10 animate-in fade-in zoom-in duration-700">
           <h1 className="text-8xl font-black text-slate-900 logo-font tracking-tighter"><span className="text-gradient">NairaWise</span></h1>
           <p className="text-xl text-slate-500 font-bold max-w-md leading-relaxed">Secular Financial Sim. Salary starts Week 1. Survive the 4-week cycles. Zero balance = Game Over!</p>
           <button onClick={() => setStatus(GameStatus.SETUP)} className="px-14 py-7 bg-slate-900 text-white rounded-[2.5rem] font-black text-2xl flex items-center gap-4 transition-all hover:scale-105 active:scale-95 shadow-xl">Start My Journey <ArrowRight /></button>
        </div>
      )}

      {status === GameStatus.SETUP && (
        <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 animate-in slide-in-from-bottom-8 duration-500">
          <h2 className="text-4xl font-black mb-10 logo-font text-center">Setup Your Life</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4 mb-2 block">Name</label>
                <input placeholder="e.g. Chinedu" className="w-full bg-slate-50 p-5 rounded-2xl font-bold border-2 border-transparent focus:border-indigo-500 outline-none" value={setupData.name} onChange={e => setSetupData({...setupData, name: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4 mb-2 block">Gender</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['male', 'female', 'other'] as const).map(g => (
                    <button key={g} onClick={() => setSetupData({...setupData, gender: g})} className={`py-4 rounded-2xl font-black text-[10px] uppercase border-2 transition-all ${setupData.gender === g ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-slate-50 border-transparent text-slate-500'}`}>{g}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4 mb-2 block">Career</label>
                <select className="w-full bg-slate-50 p-5 rounded-2xl font-bold border-2 border-transparent outline-none focus:border-indigo-500" value={setupData.job} onChange={e => setSetupData({...setupData, job: e.target.value})}>
                  {JOBS.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4 mb-2 block">Monthly Income (₦)</label>
                <input type="number" className="w-full bg-slate-50 p-5 rounded-2xl font-bold border-2 border-transparent focus:border-indigo-500 outline-none" value={setupData.salary} onChange={e => setSetupData({...setupData, salary: Number(e.target.value)})} />
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4 mb-2 block">State of Residence</label>
                <select className="w-full bg-slate-50 p-5 rounded-2xl font-bold border-2 border-transparent outline-none focus:border-indigo-500" value={setupData.city} onChange={e => setSetupData({...setupData, city: e.target.value})}>
                  {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4 mb-2 block">Marital Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['single', 'married'] as const).map(m => (
                    <button key={m} onClick={() => setSetupData({...setupData, maritalStatus: m})} className={`py-4 rounded-2xl font-black text-[10px] uppercase border-2 transition-all ${setupData.maritalStatus === m ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-slate-50 border-transparent text-slate-500'}`}>{m}</button>
                  ))}
                </div>
              </div>
              {setupData.maritalStatus === 'married' && (
                <div className="animate-in slide-in-from-top-4 duration-300">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4 mb-2 block">Number of Children</label>
                  <input type="number" min="0" className="w-full bg-slate-50 p-5 rounded-2xl font-bold border-2 border-transparent focus:border-indigo-500 outline-none" value={setupData.numberOfKids} onChange={e => setSetupData({...setupData, numberOfKids: Number(e.target.value)})} />
                </div>
              )}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4 mb-2 block">Starting Challenge</label>
                <select className="w-full bg-slate-50 p-5 rounded-2xl font-bold border-2 border-transparent outline-none focus:border-indigo-500" value={setupData.challengeId} onChange={e => setSetupData({...setupData, challengeId: e.target.value})}>
                  {CHALLENGES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
          </div>
          <button onClick={handleFinishSetup} className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all">Start My Hustle</button>
        </div>
      )}

      {status === GameStatus.LOADING && (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-24 h-24 text-emerald-600 animate-spin" />
          <p className="mt-8 font-black text-xl text-slate-700 uppercase tracking-widest">Checking Account Balance...</p>
        </div>
      )}

      {status === GameStatus.PLAYING && stats && (
        <div className="space-y-8 animate-in fade-in duration-1000">
          <header className="flex justify-between items-center bg-white px-8 py-5 rounded-[2.5rem] shadow-xl border border-slate-100">
             <h1 className="text-2xl font-black logo-font text-gradient">NairaWise</h1>
             <nav className="flex gap-4">
               {['scenario', 'invest', 'history'].map(t => (
                 <button key={t} onClick={() => setActiveTab(t as any)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === t ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>{t}</button>
               ))}
             </nav>
          </header>

          {activeTab === 'invest' ? (
            <StockMarket stocks={stocks} portfolio={portfolio} news={[]} onBuy={(id) => {
              const stock = stocks.find(s => s.id === id);
              if (stock && stats.balance >= stock.price) {
                const newStats = { ...stats, balance: stats.balance - stock.price };
                setStats(newStats);
                setPortfolio(prev => {
                  const existing = prev.find(p => p.stockId === id);
                  if (existing) return prev.map(p => p.stockId === id ? { ...p, shares: p.shares + 1 } : p);
                  return [...prev, { stockId: id, shares: 1, averagePrice: stock.price }];
                });
              }
            }} onSell={(id) => {
              const stock = stocks.find(s => s.id === id);
              const holding = portfolio.find(p => p.stockId === id);
              if (stock && holding && holding.shares > 0) {
                const newStats = { ...stats, balance: stats.balance + stock.price };
                setStats(newStats);
                setPortfolio(prev => prev.map(p => p.stockId === id ? { ...p, shares: p.shares - 1 } : p));
              }
            }} balance={stats.balance} onSetTrigger={() => {}} />
          ) : lastConsequences ? (
             <div className="bg-white p-12 rounded-[4.5rem] shadow-2xl text-center animate-in zoom-in duration-300">
               <h3 className="text-5xl font-black mb-12 logo-font">Week Review</h3>
               <div className="space-y-6 mb-16">
                 {lastConsequences.items.map((it, i) => (
                   <div key={i} className="p-10 bg-slate-50 rounded-[3rem] text-left border border-slate-100">
                     <p className="text-[10px] font-black text-emerald-600 uppercase mb-2 tracking-widest">{it.decision}</p>
                     <p className="text-2xl text-slate-700 font-medium italic leading-relaxed">"{it.text}"</p>
                   </div>
                 ))}
               </div>
               <button onClick={proceed} className="px-20 py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-2xl shadow-2xl active:scale-95 transition-all">Next Turn</button>
             </div>
          ) : (
            <>
              <Dashboard stats={stats} goals={goals} netAssets={netAssets} />
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-7 space-y-8">
                   <div className="bg-white rounded-[3.5rem] overflow-hidden shadow-2xl border border-slate-100">
                     <div className="relative h-96">
                       <img src={`https://picsum.photos/seed/${currentScenario?.imageTheme || 'lagos'}/1200/800`} className="w-full h-full object-cover" />
                       <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-90" />
                     </div>
                     <div className="p-12 -mt-20 relative">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-4xl font-black logo-font leading-tight">{currentScenario?.title}</h3>
                          <div className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase">
                            Week {stats.currentWeek}
                          </div>
                        </div>
                        <p className="text-slate-500 text-2xl leading-relaxed font-medium">{currentScenario?.description}</p>
                        <div className="mt-4 flex items-center gap-2 text-slate-400">
                          <MapPin size={14} />
                          <span className="text-xs font-bold uppercase tracking-widest">{stats.city}</span>
                        </div>
                        {stats.currentWeek % 4 === 0 && (
                          <div className="mt-8 p-6 bg-amber-50 border-2 border-amber-200 rounded-[2rem] flex items-center gap-4 text-amber-800 animate-pulse">
                             <AlertCircle className="w-8 h-8 flex-shrink-0" />
                             <p className="font-black text-xs uppercase tracking-widest">Payday Alert! Next week completes your 4-week cycle.</p>
                          </div>
                        )}
                     </div>
                   </div>
                   <div className={`p-10 rounded-[3rem] transition-all duration-500 ${selectedIndices.length > 0 ? 'bg-emerald-600 text-white shadow-emerald-200 shadow-2xl' : 'bg-slate-100 text-slate-400'} flex justify-between items-center`}>
                     <p className="text-2xl font-black">
                        {selectedIndices.length > 0 ? `${selectedIndices.length} Choice Selected` : 'Pick 1 or 2 options'}
                     </p>
                     {selectedIndices.length > 0 && (
                        <button onClick={confirmChoices} className="px-12 py-6 bg-white text-emerald-600 rounded-3xl font-black text-xl shadow-lg hover:scale-105 active:scale-95 transition-all">Confirm</button>
                     )}
                   </div>
                </div>
                <div className="lg:col-span-5 space-y-4">
                  {currentScenario?.choices.map((c, i) => {
                    const isSel = selectedIndices.includes(i);
                    const isInvest = !!c.investmentId;
                    return (
                      <button key={i} onClick={() => toggleChoice(i)} className={`w-full text-left p-8 rounded-[2.5rem] border-4 transition-all duration-300 ${isSel ? 'bg-emerald-600 border-emerald-400 text-white shadow-2xl scale-[1.02]' : 'bg-white border-transparent hover:border-emerald-100 shadow-md'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-black text-2xl mb-1 leading-tight">{c.text}</p>
                          {isInvest && <Zap className="w-5 h-5 text-amber-500 fill-current" />}
                        </div>
                        <div className="flex gap-6 opacity-80 text-[10px] font-black uppercase tracking-widest">
                          <span className="flex items-center gap-1"><Banknote size={14} /> {c.impact.balance >= 0 ? '+' : ''}₦{c.impact.balance.toLocaleString()}</span>
                          <span className="flex items-center gap-1"><Heart size={14} /> {c.impact.happiness > 0 ? '+' : ''}{c.impact.happiness}% Hap</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {status === GameStatus.GAMEOVER && (
        <div className="max-w-3xl mx-auto bg-white p-16 rounded-[4.5rem] shadow-2xl text-center border-4 border-rose-500 animate-in fade-in scale-95 duration-500">
          <Skull className="w-24 h-24 text-rose-500 mx-auto mb-8" />
          <h2 className="text-6xl font-black mb-6 logo-font text-rose-600">SAPA WON.</h2>
          <div className="bg-rose-50 p-10 rounded-[3rem] mb-12 border-2 border-rose-100">
            <p className="text-2xl font-black text-rose-900 leading-relaxed italic">"{gameOverReport}"</p>
          </div>
          <button onClick={() => window.location.reload()} className="px-20 py-8 bg-slate-900 text-white rounded-[3rem] font-black text-3xl shadow-2xl hover:bg-rose-600 transition-colors">Start New Life</button>
        </div>
      )}
    </div>
  );
};

export default App;
