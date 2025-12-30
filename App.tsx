
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
import { getNextScenario, getEndGameAnalysis } from './services/geminiService';
import Dashboard from './components/Dashboard';
import StockMarket from './components/StockMarket';
import { 
  Loader2, 
  CheckCircle2, 
  Banknote, 
  Heart, 
  ChevronRight, 
  Zap, 
  RefreshCcw, 
  Skull, 
  Newspaper, 
  Flame, 
  Crown, 
  AlertCircle, 
  Info,
  Check,
  TrendingUp,
  Gem,
  ArrowRight
} from 'lucide-react';

const INITIAL_ASSETS: Stock[] = [
  { id: 'lagos-gas', name: 'Lagos Gas Ltd.', price: 12500, history: [12000, 12500], sector: 'Energy', assetType: 'stock' },
  { id: 'nairatech', name: 'NairaTech Solutions', price: 25000, history: [22000, 25000], sector: 'Tech', assetType: 'stock' },
  { id: 'obudu-agri', name: 'Obudu Agriculture', price: 8000, history: [8200, 8000], sector: 'Agriculture', assetType: 'stock' },
  { id: 'naija-balanced', name: 'Naija Balanced Fund', price: 1000, history: [990, 1000], sector: 'Diversified', assetType: 'mutual_fund', description: 'Mixed bonds & stocks for safety.' },
  { id: 'arm-growth', name: 'Hustle Growth Fund', price: 2500, history: [2400, 2500], sector: 'Growth', assetType: 'mutual_fund', description: 'Aggressive equity-only mutual fund.' },
  { id: 'fgn-bond-fund', name: 'FGN Treasury Fund', price: 500, history: [500, 500], sector: 'Government', assetType: 'mutual_fund', description: 'Ultra-safe government bond pool.' },
];

const CHALLENGES = [
  { id: 'black-tax', name: 'Black Tax Heavy', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50', description: 'Family needs a cut of every profit. Responsibility is heavy.' },
  { id: 'sapa-max', name: 'Sapa Level Max', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50', description: 'Start with ₦0. Only your grit can save you.' },
  { id: 'inflation', name: 'Inflation Fighter', icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50', description: 'Start with ₦500k student debt. Tick-tock.' },
  { id: 'silver-spoon', name: 'Silver Spoon', icon: Crown, color: 'text-indigo-500', bg: 'bg-indigo-50', description: '₦1M headstart, but boredom kills happiness fast.' }
];

const PRESET_GOALS: Goal[] = [
  { id: 'survive', title: 'Financial Peace', target: 2000000, category: 'savings', completed: false },
  { id: 'lekki', title: 'Lekki Landlord', target: 15000000, category: 'investment', completed: false },
  { id: 'japa', title: 'The Great Japa', target: 40000000, category: 'lifestyle', completed: false },
  { id: 'tycoon', title: 'Naira Legend', target: 250000000, category: 'investment', completed: false },
];

const SAPA_QUOTES = [
  "Calculating your urgent 2k requests...",
  "Consulting the ancestors of the hustle...",
  "Preparing your Sapa defense strategy...",
  "Analyzing the price of Jollof rice...",
  "Reviewing your financial lifespan..."
];

const FALLBACK_SCENARIO: Scenario = {
  title: "Network Glitch",
  description: "The hustle never stops, even with bad signal. Make your move.",
  imageTheme: "hustle",
  choices: [
    { text: "Stay Prudent", consequence: "You saved your energy and money.", impact: { balance: 0, savings: 0, debt: 0, happiness: 0 } },
    { text: "Mini Side-Hustle", consequence: "Quick task, quick cash.", impact: { balance: 5000, savings: 0, debt: 0, happiness: -5 } },
    { text: "Call Family", consequence: "Heart is full, pocket is slightly lighter.", impact: { balance: -2000, savings: 0, debt: 0, happiness: 10 } },
    { text: "Buy Fraction of Gas", consequence: "Energy is wealth.", investmentId: "lagos-gas", impact: { balance: -5000, savings: 0, debt: 0, happiness: -2 } },
    { text: "Gamble Small", consequence: "The odds were... the odds.", impact: { balance: -1000, savings: 0, debt: 0, happiness: -5 } }
  ]
};

const ALL_NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", 
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT Abuja", "Gombe", 
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", 
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", 
  "Sokoto", "Taraba", "Yobe", "Zamfara"
];

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.START);
  const [loadingType, setLoadingType] = useState<'scenario' | 'report'>('scenario');
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
  const [currentLoadingQuote, setCurrentLoadingQuote] = useState(0);
  const [selectedChoiceIndices, setSelectedChoiceIndices] = useState<number[]>([]);
  const isPrefetching = useRef(false);

  const [setupData, setSetupData] = useState({
    name: '', job: 'Digital Hustler', salary: 150000, city: 'Lagos',
    challengeId: 'sapa-max', selectedGoalId: 'survive', maritalStatus: 'single' as 'single' | 'married', numberOfKids: 0
  });

  useEffect(() => {
    let interval: any;
    if (status === GameStatus.LOADING) {
      interval = setInterval(() => {
        setCurrentLoadingQuote(prev => (prev + 1) % SAPA_QUOTES.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [status]);

  const prefetchNext = useCallback(async (s: PlayerStats, h: GameLog[]) => {
    if (isPrefetching.current) return;
    isPrefetching.current = true;
    try {
      const scenario = await getNextScenario(s, h);
      setNextScenario(scenario);
    } catch (e) { 
      setNextScenario(FALLBACK_SCENARIO);
    }
    isPrefetching.current = false;
  }, []);

  const resetGame = () => {
    setStatus(GameStatus.START);
    setStats(null);
    setGoals([]);
    setCurrentScenario(null);
    setNextScenario(null);
    setHistory([]);
    setLastConsequences(null);
    setPortfolio([]);
    setGameOverReport('');
    setStocks(INITIAL_ASSETS);
    setSelectedChoiceIndices([]);
  };

  const handleFinishSetup = async () => {
    if (!setupData.name || !setupData.job) return alert("Oga, complete your profile first!");
    if (setupData.salary <= 0) return alert("Hustle must pay! Enter a valid income.");
    
    const challenge = CHALLENGES.find(c => c.id === setupData.challengeId)!;
    const initial: PlayerStats = {
      ...setupData, age: 22, 
      balance: setupData.challengeId === 'sapa-max' ? 0 : setupData.challengeId === 'silver-spoon' ? 1000000 : setupData.salary,
      savings: 0, debt: setupData.challengeId === 'inflation' ? 500000 : 0, happiness: 80, currentWeek: 1, challenge: challenge.name
    };
    setLoadingType('scenario'); setStatus(GameStatus.LOADING); setStats(initial);
    setGoals([{ ...PRESET_GOALS.find(g => g.id === setupData.selectedGoalId)! }]);
    try {
      const scenario = await getNextScenario(initial, []);
      setCurrentScenario(scenario); setStatus(GameStatus.PLAYING); prefetchNext(initial, []);
    } catch (e) { 
      setCurrentScenario(FALLBACK_SCENARIO); setStatus(GameStatus.PLAYING);
    }
  };

  const toggleChoice = (index: number) => {
    setSelectedChoiceIndices(prev => {
      if (prev.includes(index)) return prev.filter(i => i !== index);
      if (prev.length >= 2) return [prev[1], index];
      return [...prev, index];
    });
  };

  const handleSetTrigger = (stockId: string, type: 'stopLoss' | 'takeProfit', value: number | undefined) => {
    setPortfolio(prev => prev.map(p => p.stockId === stockId ? { ...p, [type]: value } : p));
  };

  const confirmChoices = async () => {
    if (!stats || !currentScenario || selectedChoiceIndices.length !== 2) return;

    const choices = selectedChoiceIndices.map(i => currentScenario.choices[i]);
    const totalImpact = choices.reduce((acc, c) => ({
      balance: acc.balance + c.impact.balance,
      savings: acc.savings + c.impact.savings,
      debt: acc.debt + c.impact.debt,
      happiness: acc.happiness + c.impact.happiness
    }), { balance: 0, savings: 0, debt: 0, happiness: 0 });

    const newStats = {
      ...stats,
      balance: stats.balance + totalImpact.balance,
      savings: Math.max(0, stats.savings + totalImpact.savings),
      debt: Math.max(0, stats.debt + totalImpact.debt),
      happiness: Math.min(100, Math.max(0, stats.happiness + totalImpact.happiness)),
      currentWeek: stats.currentWeek + 1
    };

    choices.forEach(choice => {
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

    const logs: GameLog[] = choices.map(choice => ({
        week: stats.currentWeek, 
        title: currentScenario.title, 
        decision: choice.text, 
        consequence: choice.consequence 
    }));
    
    const newHistory = [...history, ...logs];
    setHistory(newHistory);
    setStats(newStats);

    if (newStats.balance < -10000) { 
      setLoadingType('report'); setStatus(GameStatus.LOADING);
      try {
        const report = await getEndGameAnalysis(newStats, newHistory);
        setGameOverReport(report); setStatus(GameStatus.GAMEOVER);
      } catch (e) {
        setGameOverReport("Sapa has finally won. You are officially broke, oga.");
        setStatus(GameStatus.GAMEOVER);
      }
      return;
    }

    const netVal = newStats.balance + portfolio.reduce((acc, p) => {
      const s = stocks.find(st => st.id === p.stockId);
      return acc + (s ? s.price * p.shares : 0);
    }, 0);

    setGoals(goals.map(g => (netVal >= g.target && !g.completed) ? { ...g, completed: true } : g));
    setLastConsequences({ title: currentScenario.title, items: choices.map(c => ({ text: c.consequence, decision: c.text })) });
    setSelectedChoiceIndices([]);
    if (!nextScenario) prefetchNext(newStats, newHistory);
  };

  const handleBuy = (stockId: string) => {
    const asset = stocks.find(s => s.id === stockId);
    if (!asset || !stats || stats.balance < asset.price) return;
    setStats({ ...stats, balance: stats.balance - asset.price });
    setPortfolio(prev => {
      const existing = prev.find(p => p.stockId === stockId);
      if (existing) return prev.map(p => p.stockId === stockId ? { ...p, shares: p.shares + 1 } : p);
      return [...prev, { stockId, shares: 1, averagePrice: asset.price }];
    });
  };

  const handleSell = (stockId: string) => {
    const asset = stocks.find(s => s.id === stockId);
    const holding = portfolio.find(p => p.stockId === stockId);
    if (!asset || !holding || holding.shares <= 0 || !stats) return;
    setStats({ ...stats, balance: stats.balance + asset.price });
    setPortfolio(prev => prev.map(p => p.stockId === stockId ? { ...p, shares: p.shares - 1 } : p).filter(p => p.shares > 0));
  };

  const proceed = () => {
    if (nextScenario && stats) {
      const newStocks = stocks.map(s => {
        const volatility = s.assetType === 'mutual_fund' ? 0.03 : 0.12;
        const change = (Math.random() * volatility * 2) - volatility;
        const newPrice = Math.max(1, Math.round(s.price * (1 + change)));
        return { ...s, price: newPrice, history: [...s.history, newPrice].slice(-20) };
      });
      setStocks(newStocks);

      let autoBalanceGain = 0;
      const updatedPortfolio = portfolio.filter(p => {
        const currentStock = newStocks.find(ns => ns.id === p.stockId);
        if (!currentStock) return true;
        
        const shouldTP = p.takeProfit && currentStock.price >= p.takeProfit;
        const shouldSL = p.stopLoss && currentStock.price <= p.stopLoss;
        
        if (shouldTP || shouldSL) {
          autoBalanceGain += currentStock.price * p.shares;
          setHistory(prev => [...prev, {
            week: stats.currentWeek,
            title: "Automated Trade",
            decision: "Trigger",
            consequence: `Auto-sold ${p.shares} units of ${currentStock.name} at ₦${currentStock.price.toLocaleString()} via ${shouldTP ? 'TP' : 'SL'}.`
          }]);
          return false;
        }
        return true;
      });

      if (autoBalanceGain > 0) {
        setStats({ ...stats, balance: stats.balance + autoBalanceGain });
        setPortfolio(updatedPortfolio);
      }

      setCurrentScenario(nextScenario); 
      setLastConsequences(null); 
      setNextScenario(null); 
      prefetchNext(stats, history);
    } else {
      setLoadingType('scenario'); setStatus(GameStatus.LOADING);
      const check = setInterval(() => { if (nextScenario) { clearInterval(check); setStatus(GameStatus.PLAYING); proceed(); } }, 100);
    }
  };

  const netAssets = (stats?.balance || 0) + portfolio.reduce((acc, p) => {
    const stock = stocks.find(s => s.id === p.stockId);
    return acc + (stock ? stock.price * p.shares : 0);
  }, 0);

  return (
    <div className="min-h-screen max-w-5xl mx-auto px-4 py-6 md:py-10 pb-32">
      {status === GameStatus.START && (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-10 animate-in zoom-in duration-500 relative">
           <div className="relative z-10 w-28 h-28 bg-emerald-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl rotate-3 border-4 border-emerald-400">
             <Crown size={52} />
           </div>
           <div className="relative z-10">
             <h1 className="text-8xl font-black text-slate-900 logo-font tracking-tighter mb-2">
               <span className="text-gradient">NairaWise</span>
             </h1>
             <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-sm">Smart Money. No Sapa.</p>
           </div>
           <button onClick={() => setStatus(GameStatus.SETUP)} className="relative z-10 group px-14 py-7 bg-slate-900 hover:bg-emerald-600 text-white rounded-[2.5rem] font-black text-2xl flex items-center gap-4 transition-all hover:scale-105 active:scale-95 shadow-xl">
             Start Hustle <ArrowRight className="group-hover:translate-x-2 transition-transform w-8 h-8" />
           </button>
        </div>
      )}

      {status === GameStatus.SETUP && (
        <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-8 duration-500 pb-20">
          <div className="bg-white p-12 md:p-16 rounded-[3.5rem] shadow-2xl border border-slate-100 relative overflow-hidden">
            <div className="absolute inset-0 ankara-pattern opacity-10 pointer-events-none"></div>
            <div className="relative z-10">
              <h2 className="text-4xl font-black mb-10 logo-font text-center tracking-tight">Your Hustle Profile</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Legal Name</label>
                    <input type="text" placeholder="e.g. Chidi" className="w-full bg-slate-50 p-5 rounded-2xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-100 transition-all" value={setupData.name} onChange={e => setSetupData({...setupData, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Dream Job</label>
                    <input type="text" placeholder="e.g. Digital Hustler" className="w-full bg-slate-50 p-5 rounded-2xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-100 transition-all" value={setupData.job} onChange={e => setSetupData({...setupData, job: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Base State</label>
                     <select className="w-full bg-slate-50 p-5 rounded-2xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-100 transition-all appearance-none" value={setupData.city} onChange={e => setSetupData({...setupData, city: e.target.value})}>
                       {ALL_NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                     </select>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Monthly Income (₦)</label>
                    <div className="relative">
                      <span className="absolute left-5 top-5 font-black text-emerald-600 text-lg">₦</span>
                      <input type="number" className="w-full bg-slate-50 p-5 pl-12 rounded-2xl font-black text-xl text-slate-900 outline-none focus:ring-2 focus:ring-emerald-100 transition-all" value={setupData.salary} onChange={e => setSetupData({...setupData, salary: Number(e.target.value)})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Marital Status</label>
                    <div className="flex gap-2">
                      <button onClick={() => setSetupData({...setupData, maritalStatus: 'single', numberOfKids: 0})} className={`flex-1 p-4 rounded-xl font-black text-xs transition-all ${setupData.maritalStatus === 'single' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}>Single</button>
                      <button onClick={() => setSetupData({...setupData, maritalStatus: 'married'})} className={`flex-1 p-4 rounded-xl font-black text-xs transition-all ${setupData.maritalStatus === 'married' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}>Married</button>
                    </div>
                  </div>
                  {setupData.maritalStatus === 'married' && (
                     <div className="space-y-2 animate-in slide-in-from-top-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Number of Kids</label>
                       <input type="number" min="0" className="w-full bg-slate-50 p-5 rounded-2xl font-bold text-slate-900" value={setupData.numberOfKids} onChange={e => setSetupData({...setupData, numberOfKids: Number(e.target.value)})} />
                     </div>
                  )}
                </div>
              </div>

              <div className="space-y-4 mb-12">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Pick Your Reality</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {CHALLENGES.map(c => (
                    <button key={c.id} onClick={() => setSetupData({...setupData, challengeId: c.id})} className={`p-6 rounded-[2rem] border-2 text-left transition-all ${setupData.challengeId === c.id ? 'border-emerald-600 bg-emerald-50/50 shadow-xl scale-[1.02]' : 'border-slate-100 hover:border-emerald-200 bg-white'}`}>
                      <div className="flex items-center gap-4 mb-3">
                        <div className={`p-3 rounded-2xl ${setupData.challengeId === c.id ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}><c.icon size={24}/></div>
                        <p className="font-black text-slate-900 text-lg">{c.name}</p>
                      </div>
                      <p className="text-sm text-slate-500 leading-relaxed font-medium">{c.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={handleFinishSetup} className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-2xl hover:bg-emerald-600 transition-all shadow-2xl active:scale-95">Begin Career</button>
            </div>
          </div>
        </div>
      )}

      {status === GameStatus.LOADING && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in">
           <div className="relative">
             <Loader2 className="w-24 h-24 text-emerald-600 animate-spin mb-8" />
             <div className="absolute inset-0 flex items-center justify-center">
               <Gem className="w-8 h-8 text-emerald-400" />
             </div>
           </div>
           <h3 className="text-4xl font-black text-slate-900 mb-2 logo-font tracking-tight">{loadingType === 'report' ? 'The Review' : 'Weekly Life Sync...'}</h3>
           <p className="text-xl text-slate-400 font-bold italic animate-pulse">"{SAPA_QUOTES[currentLoadingQuote]}"</p>
        </div>
      )}

      {status === GameStatus.GAMEOVER && (
        <div className="max-w-2xl mx-auto animate-in zoom-in duration-500">
           <div className="bg-slate-900 p-12 md:p-20 rounded-[4rem] text-center shadow-2xl border-4 border-rose-500/20 relative overflow-hidden">
             <div className="absolute inset-0 ankara-pattern opacity-10 pointer-events-none"></div>
             <div className="relative z-10">
               <Skull className="w-24 h-24 text-rose-500 mx-auto mb-8 animate-bounce" />
               <h2 className="text-7xl font-black text-white logo-font mb-4 tracking-tighter">SAPA WON</h2>
               <div className="bg-white/5 backdrop-blur-md p-10 rounded-[2.5rem] text-left border border-white/5 mb-12">
                 <p className="text-rose-400 font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2"><Newspaper size={14} /> Post-Mortem Analysis</p>
                 <div className="text-slate-200 font-medium text-lg leading-relaxed italic whitespace-pre-line border-l-4 border-rose-500 pl-8">{gameOverReport}</div>
               </div>
               <button onClick={resetGame} className="px-14 py-6 bg-white text-slate-900 rounded-[2rem] font-black text-2xl hover:bg-emerald-500 hover:text-white transition-all shadow-2xl">Try Again</button>
             </div>
           </div>
        </div>
      )}

      {status === GameStatus.PLAYING && stats && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <header className="flex flex-wrap justify-between items-center bg-white px-8 py-5 rounded-[2.5rem] shadow-xl border border-slate-100 gap-4">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg"><Crown size={22}/></div>
               <h1 className="text-2xl font-black logo-font text-gradient tracking-tighter">NairaWise</h1>
             </div>
             <nav className="flex gap-1 p-1 bg-slate-50 rounded-2xl">
               {['scenario', 'invest', 'history'].map(t => (
                 <button key={t} onClick={() => setActiveTab(t as any)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
                   {t}
                 </button>
               ))}
             </nav>
          </header>

          {activeTab === 'invest' ? (
            <StockMarket stocks={stocks} portfolio={portfolio} news={[]} onBuy={handleBuy} onSell={handleSell} balance={stats.balance} onSetTrigger={handleSetTrigger} />
          ) : activeTab === 'history' ? (
             <div className="bg-white p-10 md:p-14 rounded-[3.5rem] shadow-xl border border-slate-100">
               <h3 className="text-3xl font-black mb-10 logo-font tracking-tight">Financial Life History</h3>
               <div className="space-y-5">
                 {history.length === 0 && <p className="text-slate-400 italic font-bold text-center py-20">No history recorded yet.</p>}
                 {[...history].reverse().map((h, i) => (
                   <div key={i} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex items-center justify-between gap-8 hover:bg-white hover:border-emerald-200 transition-all">
                      <div className="shrink-0 text-center w-14"><p className="text-[10px] font-black text-slate-400 uppercase">Week</p><p className="text-3xl font-black text-slate-900">{h.week}</p></div>
                      <div className="flex-1">
                        <p className="font-black text-xl text-slate-900 mb-1">{h.title}</p>
                        <p className="text-sm text-slate-500 font-medium italic leading-relaxed">"{h.consequence}"</p>
                      </div>
                      <div className="text-right shrink-0"><span className="px-5 py-2 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest">{h.decision}</span></div>
                   </div>
                 ))}
               </div>
             </div>
          ) : lastConsequences ? (
             <div className="bg-white p-12 md:p-24 rounded-[4.5rem] shadow-2xl text-center border border-slate-100 animate-in zoom-in duration-300 relative overflow-hidden">
               <div className="absolute inset-0 ankara-pattern opacity-5 pointer-events-none"></div>
               <div className="relative z-10">
                 <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-10 shadow-inner"><CheckCircle2 size={48}/></div>
                 <h3 className="text-5xl font-black mb-12 logo-font tracking-tighter">Week {stats.currentWeek - 1} Summary</h3>
                 <div className="space-y-6 max-w-3xl mx-auto mb-16">
                   {lastConsequences.items.map((it, i) => (
                     <div key={i} className="p-10 bg-slate-50/80 backdrop-blur-sm rounded-[3rem] text-left relative overflow-hidden shadow-sm border border-slate-100">
                       <div className="absolute top-5 right-8 text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100">{it.decision}</div>
                       <p className="text-xl text-slate-700 italic font-medium leading-relaxed mt-4">"{it.text}"</p>
                     </div>
                   ))}
                 </div>
                 <button onClick={proceed} className="px-20 py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-2xl hover:bg-emerald-600 transition-all shadow-2xl active:scale-95">Next Week <ChevronRight className="inline ml-2 w-8 h-8"/></button>
               </div>
             </div>
          ) : (
            <>
              <Dashboard stats={stats} goals={goals} netAssets={netAssets} />
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-6 space-y-8">
                   <div className="bg-white rounded-[3.5rem] overflow-hidden shadow-2xl border border-slate-100 group relative">
                     <img src={`https://picsum.photos/seed/${currentScenario?.imageTheme || 'hustle'}/1200/800`} className="w-full h-72 md:h-96 object-cover transition-transform duration-1000 group-hover:scale-105" alt="Scene" />
                     <div className="p-12 -mt-12 bg-white relative rounded-t-[3.5rem] shadow-2xl">
                        <div className="flex items-center gap-2 mb-4"><Zap size={18} className="text-amber-500 fill-current"/><span className="text-[11px] font-black text-emerald-600 uppercase tracking-widest">Two Decisions Required</span></div>
                        <h3 className="text-3xl font-black mb-6 leading-tight tracking-tight logo-font text-slate-900">{currentScenario?.title}</h3>
                        <p className="text-slate-500 text-xl leading-relaxed font-medium">{currentScenario?.description}</p>
                     </div>
                   </div>

                   {/* HUD - Pick 2 */}
                   <div className={`p-10 rounded-[3rem] transition-all duration-500 ${selectedChoiceIndices.length === 2 ? 'bg-emerald-600 text-white shadow-2xl scale-105' : 'bg-slate-100 text-slate-400 shadow-inner'} flex items-center justify-between`}>
                     <div>
                       <p className="text-[11px] font-black uppercase tracking-widest opacity-80 mb-1">Execution Queue</p>
                       <p className="text-2xl font-black">{selectedChoiceIndices.length} / 2 Ready</p>
                     </div>
                     {selectedChoiceIndices.length === 2 ? (
                        <button onClick={confirmChoices} className="px-10 py-5 bg-white text-emerald-600 rounded-2xl font-black text-lg shadow-xl animate-bounce flex items-center gap-2">Execute Move <ArrowRight size={20}/></button>
                     ) : (
                        <div className="flex gap-3">
                           {[1, 2].map(i => <div key={i} className={`w-4 h-4 rounded-full ${selectedChoiceIndices.length >= i ? 'bg-emerald-500' : 'bg-slate-300 animate-pulse'}`} />)}
                        </div>
                     )}
                   </div>
                </div>

                <div className="lg:col-span-6 space-y-4">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-4 mb-2">Available Moves (Pick 2)</p>
                  {currentScenario?.choices.map((c, i) => {
                    const isSel = selectedChoiceIndices.includes(i);
                    return (
                      <button key={i} onClick={() => toggleChoice(i)} className={`w-full text-left p-7 rounded-[2.5rem] border-2 transition-all active:scale-98 group relative ${isSel ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xl z-10' : 'bg-white border-slate-50 hover:border-emerald-500'}`}>
                        {isSel && <div className="absolute -top-3 -right-3 w-10 h-10 bg-white text-emerald-600 rounded-full flex items-center justify-center border-4 border-emerald-600 shadow-xl z-20"><Check size={20} strokeWidth={4}/></div>}
                        <div className="flex gap-6">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-sm shrink-0 transition-colors ${isSel ? 'bg-white/20' : 'bg-slate-100 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600'}`}>{i+1}</div>
                          <div className="flex-1">
                            <p className={`font-black mb-3 text-xl leading-tight ${isSel ? 'text-white' : 'text-slate-900 group-hover:text-emerald-700'}`}>{c.text}</p>
                            <div className="flex items-center gap-6">
                               <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${isSel ? 'text-emerald-100' : 'text-slate-400'}`}><Banknote size={16}/> {c.impact.balance < 0 ? `₦${Math.abs(c.impact.balance).toLocaleString()}` : `+₦${c.impact.balance.toLocaleString()}`}</span>
                               {c.impact.happiness !== 0 && <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${isSel ? 'text-white' : c.impact.happiness > 0 ? 'text-emerald-500' : 'text-rose-500'}`}><Heart size={16}/> {c.impact.happiness > 0 ? `+${c.impact.happiness}%` : `${c.impact.happiness}%`}</span>}
                            </div>
                          </div>
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
    </div>
  );
};

export default App;
