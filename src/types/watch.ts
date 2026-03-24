export type Liquidity = 'ALTA' | 'MEDIA' | 'BASSA';

export interface WatchExtended {
  id: string;
  brand: string;
  model: string;
  reference: string | null;
  collection?: string;
  year_introduced?: number;
  movement?: string;
  caliber?: string;
  power_reserve?: string;
  frequency?: string;
  case_material?: string;
  case_size?: string;
  thickness?: string;
  case_back?: string;
  crystal?: string;
  water_resistance?: string;
  weight?: string;
  bracelet?: string;
  dial_color?: string;
  complications?: string[];
  price_range_min?: number;
  price_range_max?: number;
  description?: string;
  liquidity?: Liquidity;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  seo_meta?: string;
}

export interface MarketListing {
  source: string;
  price: number;
  condition: 'Nuovo' | 'Ottimo' | 'Buono' | 'Usato';
  url: string;
  date: string;
}

export interface MarketAnalysisData {
  brand: string;
  model: string;
  reference: string;
  listingsCount: number;
  priceMin: number;
  priceAvg: number;
  priceMax: number;
  listings: MarketListing[];
  priceHistory: { month: string; avg: number }[];
}

export interface PurchaseEvaluation {
  offeredPrice: number;
  marketAvg: number;
  estimatedMargin: number;
  roi: number;
  verdict: 'OTTIMA' | 'BUONA' | 'NELLA MEDIA' | 'DA EVITARE';
  verdictColor: 'green' | 'yellow' | 'orange' | 'red';
}

export interface Opportunity {
  id: string;
  brand: string;
  model: string;
  reference: string;
  marketAvg: number;
  listingPrice: number;
  margin: number;
  source: string;
  url: string;
  liquidity: Liquidity;
  foundAt: string;
}

export interface PortfolioWatch {
  id: string;
  brand: string;
  model: string;
  reference: string;
  purchasePrice: number;
  marketPrice: number;
  status: 'In Portafoglio' | 'In Vendita' | 'Venduto';
  soldPrice?: number;
  purchaseDate: string;
  notes?: string;
}
