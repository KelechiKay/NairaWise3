
import React, { useState } from 'react';
import { Stock, PortfolioItem, MarketNews } from './types';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  Newspaper, 
  Settings2, 
  Target, 
  ShieldCheck, 
  PieChart, 
  BarChart3, 
  Info 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  YAxis, 
  Tooltip,
  CartesianGrid
} from 'recharts';

interface StockMarketProps {
  stocks: Stock[];
  portfolio: PortfolioItem[];
  news: MarketNews[];
  onBuy: (stockId: string) => void;
  onSell: (stockId: string) => void;
  balance: number;
  onSetTrigger: (stockId: string, type: 'stopLoss' | 'takeProfit', value: number | undefined) => void;
}

const StockMarket: React.FC<StockMarketProps> = ({ stocks, portfolio, news, onBuy, onSell, balance, onSetTrigger }) => {
  const [selectedStockId, setSelectedStockId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'stock' | 'mutual_fund'>('all');

  const filteredAssets = stocks.filter(s => filter === 'all' || s.assetType === filter);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
      {/* Sidebar / Filters */}
      <div className="lg:col-span-3 space-y-6">
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Investment Center</h3>
          <div className="space-y-2">
            {[
              { id: 'all', label: 'All Assets', icon: PieChart },
              { id: 'stock', label: 'Equities', icon: BarChart3 },
              { id: 'mutual_fund', label: 'Mutual Funds', icon: Target },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setFilter(item.id as any)}
                className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-black text-sm transition-all ${
                  filter === item.id 
                  ? 'bg-slate-900 text-white shadow-lg scale-105' 
                  : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-indigo-600 p-6 rounded-[2.5rem] text-white shadow-xl">
           <Info className="w-8 h-8 mb-4 opacity-50" />
           <p className="text-sm font-black uppercase tracking-wider mb-2">Did you know?</p>
           <p className="text-xs font-medium leading-relaxed opacity-90">
             Mutual funds pool money from many investors to buy a diversified mix of assets. They are generally less volatile than individual stocks like Tech or Energy.
           </p>
        </div>
      </div>

      {/* Assets Grid */}
      <div className="lg:col-span-9 space-y-6">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Marketplace</h3>
          <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-black uppercase tracking-widest border border-emerald-100">
            Purchasing Power: ₦{balance.toLocaleString()}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredAssets.map((asset) => {
            const holding = portfolio.find(p => p.stockId === asset.id);
            const priceChange = asset.history.length > 1 
              ? ((asset.price - asset.history[asset.history.length - 2]) / asset.history[asset.history.length - 2] * 100).toFixed(2)
              : "0.00";
            const isPositive = parseFloat(priceChange) >= 0;
            const chartData = asset.history.map((price, index) => ({ week: index, price }));

            return (
              <div key={asset.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col hover:shadow-xl transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                        asset.assetType === 'stock' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
                      }`}>
                        {asset.assetType === 'stock' ? 'Equity' : 'Mutual Fund'}
                      </span>
                      <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">{asset.sector}</span>
                    </div>
                    <h4 className="text-xl font-black text-slate-900">{asset.name}</h4>
                  </div>
                  <div className={`flex items-center gap-1 font-black text-sm ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    {priceChange}%
                  </div>
                </div>

                <div className="flex justify-between items-end mb-6">
                  <div>
                    <p className="text-3xl font-black text-slate-900">₦{asset.price.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Per Unit / Share</p>
                  </div>
                  {holding && (
                    <div className="text-right">
                      <p className="text-lg font-black text-indigo-600">{holding.shares}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase">Held</p>
                      <button 
                        onClick={() => setSelectedStockId(selectedStockId === asset.id ? null : asset.id)}
                        className={`mt-2 p-1.5 rounded-xl transition-all ${selectedStockId === asset.id ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400 hover:text-slate-900'}`}
                      >
                        <Settings2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {holding && selectedStockId === asset.id && (
                  <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 animate-in slide-in-from-top-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1"><Target className="w-3 h-3 text-emerald-500" /> Target Profit</span>
                      <input 
                        type="number" 
                        value={holding.takeProfit || ''}
                        onChange={(e) => onSetTrigger(asset.id, 'takeProfit', e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="₦ Target"
                        className="w-24 p-2 text-xs font-black border border-slate-200 rounded-xl bg-white outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-rose-500" /> Stop Loss</span>
                      <input 
                        type="number" 
                        value={holding.stopLoss || ''}
                        onChange={(e) => onSetTrigger(asset.id, 'stopLoss', e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="₦ Limit"
                        className="w-24 p-2 text-xs font-black border border-slate-200 rounded-xl bg-white outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}

                <div className="h-28 w-full mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <Line 
                        type="monotone" 
                        dataKey="price" 
                        stroke={isPositive ? '#10b981' : '#f43f5e'} 
                        strokeWidth={4} 
                        dot={false} 
                      />
                      <YAxis hide domain={['auto', 'auto']} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex gap-3 mt-auto">
                  <button 
                    onClick={() => onBuy(asset.id)} 
                    disabled={balance < asset.price} 
                    className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm transition-all hover:bg-emerald-600 disabled:opacity-20 shadow-md active:scale-95"
                  >
                    Buy Unit
                  </button>
                  <button 
                    onClick={() => onSell(asset.id)} 
                    disabled={!holding || holding.shares <= 0} 
                    className="flex-1 py-4 border-2 border-slate-100 text-slate-400 hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50 rounded-2xl font-black text-sm transition-all disabled:opacity-20 active:scale-95"
                  >
                    Sell Unit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StockMarket;
