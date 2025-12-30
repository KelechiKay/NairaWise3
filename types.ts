
export interface PlayerStats {
  name: string;
  gender: 'male' | 'female' | 'other';
  age: number;
  salary: number;
  balance: number;
  savings: number;
  debt: number;
  happiness: number;
  currentWeek: number;
  job: string;
  city: string;
  challenge: string;
  maritalStatus: 'single' | 'married';
  numberOfKids: number;
}

export interface Goal {
  id: string;
  title: string;
  target: number;
  category: 'savings' | 'investment' | 'lifestyle';
  completed: boolean;
}

export interface Stock {
  id: string;
  name: string;
  price: number;
  history: number[];
  sector: string;
  assetType: 'stock' | 'mutual_fund';
  description?: string;
}

export interface PortfolioItem {
  stockId: string;
  shares: number;
  averagePrice: number;
  stopLoss?: number;
  takeProfit?: number;
}

export interface MarketNews {
  headline: string;
  impact: 'positive' | 'negative' | 'neutral';
  stockId?: string;
}

export interface Choice {
  text: string;
  consequence: string;
  impact: {
    balance: number;
    savings: number;
    debt: number;
    happiness: number;
  };
  investmentId?: string;
}

export interface Scenario {
  title: string;
  description: string;
  imageTheme: string;
  choices: Choice[];
  marketEvent?: MarketNews;
}

export interface GameLog {
  week: number;
  title: string;
  decision: string;
  consequence: string;
}

export enum GameStatus {
  START = 'START',
  SETUP = 'SETUP',
  PLAYING = 'PLAYING',
  GAMEOVER = 'GAMEOVER',
  LOADING = 'LOADING'
}
