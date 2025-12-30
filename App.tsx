
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
  CheckCircle2, 
  Banknote, 
  Heart, 
  ChevronRight, 
  Zap, 
  Skull, 
  Newspaper, 
  Flame, 
  Crown, 
  AlertCircle, 
  Check,
  TrendingUp,
  Gem,
  ArrowRight
} from 'lucide-react';

const INITIAL_ASSETS: Stock[] = [
  { id: 'lagos-gas', name: 'Lagos Gas Ltd.', price: 12500, history: [12000, 12500], sector: 'Energy', assetType: 'stock' },
  { id: 'nairatech', name: 'NairaTech Solutions', price: 25000, history: [22000, 25000], sector: 'Tech', assetType: 'stock' },
  { id: 'obudu-agri', name: 'Obudu Agriculture', price: 8000, history: [8200, 8000], sector: 'Agriculture', assetType: 'stock' },
  { id: 'naija-balanced', name: 'Naija Balanced Fund', price: 1000, history: [990, 1000], sector: 'Diversified', assetType: 'mutual_fund', description: 'Mixed bonds & stocks.' },
  { id: 'arm-growth', name: 'Hustle Growth Fund', price: 2500, history: [2400, 2500], sector: 'Growth', assetType: 'mutual_fund', description: 'Aggressive equity fund.' },
  { id: 'fgn-bond-fund', name: 'FGN Treasury Fund', price: 500, history: [500, 500], sector: 'Government', assetType: 'mutual_fund', description: 'Safe government bond pool.' },
];

const CHALLENGES = [
  { id: 'black-tax', name: 'Black Tax Heavy', icon: Heart, color: 'text-rose-500', description: 'Family needs a cut of every profit. Responsibility is heavy.' },
  { id: 'sapa-max', name: 'Sapa Level Max', icon: Flame, color: 'text-orange-500', description: 'Start with ₦0. Only your grit can save you.' },
  { id: 'inflation', name: 'Inflation Fighter', icon: AlertCircle, color: 'text-amber-500', description: 'Start with ₦500k student debt. Tick-tock.' },
  { id: 'silver-spoon', name: 'Silver Spoon', icon: Crown, color: 'text-indigo-500', description: '₦1M headstart, but boredom kills happiness fast.' }
];

const PRESET_GOALS: Goal[] = [
  { id: 'survive', title: 'Financial Peace', target: 2000000, category: 'savings', completed: false },
  { id: 'lekki', title: 'Lekki Landlord', target: 15000000, category: 'investment', completed: false },
  { id: 'japa', title: 'The Great Japa', target: 40000000, category: 'lifestyle', completed: false },
];

const ALL_NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", 
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT Abuja", "Gombe", 
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", 
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", 
  "Sokoto", "Taraba", "Yobe", "Zamfara"
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
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState<number | null>(null);
  const isPrefetching = useRef(false);

  const [setupData, setSetupData] = useState({
    name: '', job: 'Digital Hustler', salary: 150000, city: 'Lagos',
    challengeId: 'sapa-max', selectedGoalId: 'survive', maritalStatus: 'single' as 'single' | 'married', numberOfKids: 0
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
    const initial: PlayerStats = {
      ...setupData, age: 22, 
      balance: setupData.challengeId === 'sapa-max' ? 0 : setupData.challengeId === 'silver-spoon' ? 1000000 : setupData.salary,
      savings: 0, debt: setupData.challengeId === 'inflation' ? 500000 : 0, happiness: 80, currentWeek: 1, challenge: setupData.challengeId
    };
    setStatus(GameStatus.LOADING);
    setStats(initial);
    setGoals([{ ...PRESET_GOALS.find(g => g.id === setupData.selectedGoalId)! }]);
    try {
      const scenario = await getNextScenario(initial, []);
      setCurrentScenario(scenario); setStatus(GameStatus.PLAYING); prefetchNext(initial, []);
    } catch (e) { setStatus(GameStatus.START); }
  };

  const selectChoice = (index: number) => {
    setSelectedChoiceIndex(index === selectedChoiceIndex ? null : index);
  };

  const confirmChoice = async () => {
    if (!stats || !currentScenario || selectedChoiceIndex === null) return;
    const choice = currentScenario.choices[selectedChoiceIndex];
    
    const newStats = {
      ...stats,
      balance: stats.balance + choice.impact.balance,
      savings: Math.max(0, stats.savings + choice.impact.savings),
      debt: Math.max(0, stats.debt + choice.impact.debt),
      happiness: Math.min(100, Math.max(0, stats.happiness + choice.impact.happiness)),
      currentWeek: stats.currentWeek + 1
    };

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

    const newHistory = [...history, { week: stats.currentWeek, title: currentScenario.title, decision: choice.text, consequence: choice.consequence }];
    setHistory(newHistory); setStats(newStats);

    if (newStats.balance < -20000) {
      setStatus(GameStatus.LOADING);
      const report = await getEndGameAnalysis(newStats, newHistory);
      setGameOverReport(report); setStatus(GameStatus.GAMEOVER);
      return;
    }

    setLastConsequences({ title: currentScenario.title, items: [{ text: choice.consequence, decision: choice.text }] });
    setSelectedChoiceIndex(null);
    if (!nextScenario) prefetchNext(newStats, newHistory);
  };

  const proceed = () => {
    if (nextScenario && stats) {
      setCurrentScenario(nextScenario); setLastConsequences(null); setNextScenario(null); prefetchNext(stats, history);
    } else { setStatus(GameStatus.LOADING); setTimeout(() => setStatus(GameStatus.PLAYING), 1000); }
  };

  const netAssets = (stats?.balance || 0) + portfolio.reduce((acc, p) => acc + (stocks.find(s => s.id === p.stockId)?.price || 0) * p.shares, 0);

  return (
    <div className="min-h-screen max-w-5xl mx-auto px-4 py-10 pb-32">
      {status === GameStatus.START && (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-10">
           <h1 className="text-8xl font-black text-slate-900 logo-font tracking-tighter"><span className="text-gradient">NairaWise</span></h1>
           <button onClick={() => setStatus(GameStatus.SETUP)} className="px-14 py-7 bg-slate-900 text-white rounded-[2.5rem] font-black text-2xl flex items-center gap-4 transition-all hover:scale-105 active:scale-95 shadow-xl">Start Hustle <ArrowRight /></button>
        </div>
      )}

      {status === GameStatus.SETUP && (
        <div className="max-w-4xl mx-auto bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-100">
          <h2 className="text-4xl font-black mb-10 logo-font text-center">Your Hustle Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
            <div className="space-y-4">
              <input placeholder="Legal Name" className="w-full bg-slate-50 p-5 rounded-2xl font-bold" value={setupData.name} onChange={e => setSetupData({...setupData, name: e.target.value})} />
              <select className="w-full bg-slate-50 p-5 rounded-2xl font-bold" value={setupData.city} onChange={e => setSetupData({...setupData, city: e.target.value})}>
                {ALL_NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-4">
              <input type="number" placeholder="Income (₦)" className="w-full bg-slate-50 p-5 rounded-2xl font-bold" value={setupData.salary} onChange={e => setSetupData({...setupData, salary: Number(e.target.value)})} />
              <select className="w-full bg-slate-50 p-5 rounded-2xl font-bold" value={setupData.challengeId} onChange={e => setSetupData({...setupData, challengeId: e.target.value})}>
                {CHALLENGES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <button onClick={handleFinishSetup} className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-2xl">Begin Career</button>
        </div>
      )}

      {status === GameStatus.LOADING && <div className="flex flex-col items-center justify-center min-h-[60vh]"><Loader2 className="w-24 h-24 text-emerald-600 animate-spin" /><p className="mt-4 font-black">Syncing with NSE...</p></div>}

      {status === GameStatus.PLAYING && stats && (
        <div className="space-y-8">
          <header className="flex justify-between items-center bg-white px-8 py-5 rounded-[2.5rem] shadow-xl border border-slate-100">
             <h1 className="text-2xl font-black logo-font text-gradient">NairaWise</h1>
             <nav className="flex gap-4">
               {['scenario', 'invest', 'history'].map(t => (
                 <button key={t} onClick={() => setActiveTab(t as any)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === t ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>{t}</button>
               ))}
             </nav>
          </header>

          {activeTab === 'invest' ? (
            <StockMarket stocks={stocks} portfolio={portfolio} news={[]} onBuy={s => {}} onSell={s => {}} balance={stats.balance} onSetTrigger={() => {}} />
          ) : lastConsequences ? (
             <div className="bg-white p-12 rounded-[4.5rem] shadow-2xl text-center">
               <h3 className="text-5xl font-black mb-12 logo-font">Week {stats.currentWeek - 1} Results</h3>
               <div className="space-y-6 mb-16">
                 {lastConsequences.items.map((it, i) => (
                   <div key={i} className="p-8 bg-slate-50 rounded-[3rem] text-left relative overflow-hidden">
                     <p className="text-xl text-slate-700 italic font-medium">"{it.text}"</p>
                   </div>
                 ))}
               </div>
               <button onClick={proceed} className="px-20 py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-2xl">Continue</button>
             </div>
          ) : (
            <>
              <Dashboard stats={stats} goals={goals} netAssets={netAssets} />
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-6 space-y-8">
                   <div className="bg-white rounded-[3.5rem] overflow-hidden shadow-2xl border border-slate-100">
                     <img src={`https://picsum.photos/seed/${currentScenario?.imageTheme || 'hustle'}/1200/800`} className="w-full h-80 object-cover" />
                     <div className="p-12">
                        <h3 className="text-3xl font-black mb-6 logo-font">{currentScenario?.title}</h3>
                        <p className="text-slate-500 text-xl leading-relaxed font-medium">{currentScenario?.description}</p>
                     </div>
                   </div>
                   <div className={`p-10 rounded-[3rem] ${selectedChoiceIndex !== null ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'} flex justify-between items-center`}>
                     <p className="text-2xl font-black">{selectedChoiceIndex !== null ? 'Choice Ready' : 'Pick your path'}</p>
                     {selectedChoiceIndex !== null && <button onClick={confirmChoice} className="px-10 py-5 bg-white text-emerald-600 rounded-2xl font-black shadow-lg">Confirm Move</button>}
                   </div>
                </div>
                <div className="lg:col-span-6 space-y-4">
                  {currentScenario?.choices.map((c, i) => {
                    const isSel = selectedChoiceIndex === i;
                    return (
                      <button key={i} onClick={() => selectChoice(i)} className={`w-full text-left p-7 rounded-[2.5rem] border-2 transition-all ${isSel ? 'bg-emerald-600 border-emerald-600 text-white shadow-xl scale-[1.02]' : 'bg-white border-slate-50 hover:border-emerald-100'}`}>
                        <p className="font-black text-xl mb-2">{c.text}</p>
                        <div className="flex gap-4 opacity-70 text-[10px] font-black uppercase tracking-widest">
                          <span>₦{c.impact.balance.toLocaleString()}</span>
                          <span>Hap: {c.impact.happiness}%</span>
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
        <div className="max-w-3xl mx-auto bg-white p-16 rounded-[4.5rem] shadow-2xl text-center border-4 border-rose-500">
          <Skull className="w-24 h-24 text-rose-500 mx-auto mb-8" />
          <h2 className="text-5xl font-black mb-6 logo-font">Sapa Finally Won.</h2>
          <div className="bg-rose-50 p-8 rounded-[3rem] mb-12">
            <p className="text-xl font-medium text-rose-900 leading-relaxed">"{gameOverReport}"</p>
          </div>
          <button onClick={() => window.location.reload()} className="px-16 py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-2xl">Try Again</button>
        </div>
      )}
    </div>
  );
};

export default App;
