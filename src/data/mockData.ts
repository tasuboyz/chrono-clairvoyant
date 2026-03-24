import type { WatchExtended, Opportunity, PortfolioWatch, MarketAnalysisData, MarketListing } from '@/types/watch';

// --- Deterministic hash ---
function hashCode(s: string): number {
  return Math.abs(s.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 0));
}

// --- Mock watches database ---
export const MOCK_WATCHES: WatchExtended[] = [
  {
    id: 'w1', brand: 'Rolex', model: 'Submariner', reference: '126610LN',
    collection: 'Oyster Perpetual', year_introduced: 2020,
    movement: 'Automatico', caliber: 'Cal. 3235', power_reserve: '70h', frequency: '28.800 bph',
    case_material: 'Acciaio Oystersteel', case_size: '41mm', thickness: '12.5mm', case_back: 'Vite',
    crystal: 'Zaffiro', water_resistance: '300m', weight: '155g', bracelet: 'Oyster',
    dial_color: 'Nero', complications: [],
    price_range_min: 9800, price_range_max: 12500, liquidity: 'ALTA',
    seo_title: 'Rolex Submariner 126610LN | Acciaio Ghiera Nera',
    seo_description: 'Rolex Submariner ref. 126610LN, ghiera nera, acciaio Oystersteel, calibro 3235.',
    seo_keywords: ['rolex submariner', '126610LN', 'sub acciaio nero'],
    seo_meta: 'Rolex Submariner 126610LN — acciaio, ghiera nera, cal. 3235, 41mm.',
  },
  {
    id: 'w2', brand: 'Rolex', model: 'Daytona', reference: '116500LN',
    collection: 'Oyster Perpetual', year_introduced: 2016,
    movement: 'Automatico', caliber: 'Cal. 4130', power_reserve: '72h', frequency: '28.800 bph',
    case_material: 'Acciaio Oystersteel', case_size: '40mm', thickness: '12.4mm', case_back: 'Vite',
    crystal: 'Zaffiro', water_resistance: '100m', weight: '134g', bracelet: 'Oyster',
    dial_color: 'Bianco', complications: ['Cronografo'],
    price_range_min: 17000, price_range_max: 22000, liquidity: 'ALTA',
    seo_title: 'Rolex Daytona 116500LN | Acciaio Quadrante Bianco',
    seo_description: 'Rolex Daytona ref. 116500LN, quadrante bianco, lunetta ceramica nera.',
    seo_keywords: ['rolex daytona', '116500LN', 'daytona ceramica'],
    seo_meta: 'Rolex Daytona 116500LN — acciaio, quadrante bianco, cal. 4130.',
  },
  {
    id: 'w3', brand: 'Omega', model: 'Speedmaster Moonwatch', reference: '310.30.42.50.01.001',
    collection: 'Speedmaster', year_introduced: 2021,
    movement: 'Manuale', caliber: 'Cal. 3861', power_reserve: '50h', frequency: '21.600 bph',
    case_material: 'Acciaio', case_size: '42mm', thickness: '13.2mm', case_back: 'Sapphire',
    crystal: 'Zaffiro', water_resistance: '50m', weight: '128g', bracelet: 'Bracciale NATO',
    dial_color: 'Nero', complications: ['Cronografo'],
    price_range_min: 5200, price_range_max: 6800, liquidity: 'ALTA',
    seo_title: 'Omega Speedmaster Moonwatch 310.30.42.50.01.001 | Cal. 3861',
    seo_description: 'Omega Speedmaster Professional Moonwatch, calibro 3861, fondello zaffiro.',
    seo_keywords: ['omega speedmaster', 'moonwatch', 'cal 3861'],
    seo_meta: 'Omega Speedmaster Moonwatch — cal. 3861, 42mm, cronografo manuale.',
  },
  {
    id: 'w4', brand: 'Omega', model: 'Seamaster Diver 300M', reference: '210.30.42.20.01.001',
    collection: 'Seamaster', year_introduced: 2018,
    movement: 'Automatico', caliber: 'Cal. 8800', power_reserve: '55h', frequency: '25.200 bph',
    case_material: 'Acciaio', case_size: '42mm', thickness: '13mm', case_back: 'Vite',
    crystal: 'Zaffiro', water_resistance: '300m', weight: '140g', bracelet: 'Acciaio',
    dial_color: 'Blu', complications: ['Impermeabilità'],
    price_range_min: 3800, price_range_max: 5000, liquidity: 'ALTA',
    seo_title: 'Omega Seamaster Diver 300M | Quadrante Blu Cal. 8800',
    seo_description: 'Omega Seamaster Diver 300M quadrante blu, calibro 8800, 42mm acciaio.',
    seo_keywords: ['omega seamaster', 'diver 300m', '210.30.42.20.01.001'],
    seo_meta: 'Omega Seamaster Diver 300M — cal. 8800, 42mm, 300m.',
  },
  {
    id: 'w5', brand: 'IWC', model: 'Portugieser Chronograph', reference: 'IW371617',
    collection: 'Portugieser', year_introduced: 2020,
    movement: 'Automatico', caliber: 'Cal. 69355', power_reserve: '46h', frequency: '28.800 bph',
    case_material: 'Acciaio', case_size: '41mm', thickness: '12.7mm', case_back: 'Sapphire',
    crystal: 'Zaffiro', water_resistance: '30m', weight: '118g', bracelet: 'Pelle',
    dial_color: 'Bianco', complications: ['Cronografo'],
    price_range_min: 5800, price_range_max: 7200, liquidity: 'MEDIA',
    seo_title: 'IWC Portugieser Chronograph IW371617 | Acciaio',
    seo_description: 'IWC Portugieser Chronograph ref. IW371617, quadrante bianco, cal. 69355.',
    seo_keywords: ['iwc portugieser', 'chronograph', 'IW371617'],
    seo_meta: 'IWC Portugieser Chronograph IW371617 — cal. 69355, 41mm.',
  },
  {
    id: 'w6', brand: 'Zenith', model: 'El Primero 42mm', reference: '03.2097.400/21.C496',
    collection: 'El Primero', year_introduced: 2017,
    movement: 'Automatico', caliber: 'Cal. 400', power_reserve: '50h', frequency: '36.000 bph',
    case_material: 'Acciaio', case_size: '42mm', thickness: '12.75mm', case_back: 'Sapphire',
    crystal: 'Zaffiro', water_resistance: '100m', weight: '124g', bracelet: 'Acciaio',
    dial_color: 'Nero', complications: ['Cronografo'],
    price_range_min: 5200, price_range_max: 6800, liquidity: 'MEDIA',
    seo_title: 'Zenith El Primero 42mm | Cal. 400 10Hz',
    seo_description: 'Zenith El Primero 42mm, calibro 400, 36.000 bph, cronografo meccanico.',
    seo_keywords: ['zenith el primero', '03.2097.400', 'el primero 42'],
    seo_meta: 'Zenith El Primero 42mm — cal. 400, cronografo, 42mm.',
  },
  {
    id: 'w7', brand: 'Tudor', model: 'Black Bay 58', reference: 'M79030N-0001',
    collection: 'Black Bay', year_introduced: 2018,
    movement: 'Automatico', caliber: 'Cal. MT5402', power_reserve: '70h', frequency: '28.800 bph',
    case_material: 'Acciaio', case_size: '39mm', thickness: '11.9mm', case_back: 'Vite',
    crystal: 'Zaffiro', water_resistance: '200m', weight: '140g', bracelet: 'Acciaio',
    dial_color: 'Nero', complications: [],
    price_range_min: 3200, price_range_max: 4200, liquidity: 'ALTA',
    seo_title: 'Tudor Black Bay 58 M79030N | Acciaio Quadrante Nero',
    seo_description: 'Tudor Black Bay 58, 39mm acciaio, calibro MT5402, lunetta nera.',
    seo_keywords: ['tudor black bay 58', 'M79030N', 'BB58'],
    seo_meta: 'Tudor Black Bay 58 — cal. MT5402, 39mm, 200m.',
  },
  {
    id: 'w8', brand: 'Panerai', model: 'Luminor Marina', reference: 'PAM00111',
    collection: 'Luminor', year_introduced: 2009,
    movement: 'Manuale', caliber: 'Cal. OP XI', power_reserve: '56h', frequency: '21.600 bph',
    case_material: 'Acciaio', case_size: '44mm', thickness: '15.5mm', case_back: 'Vite',
    crystal: 'Zaffiro', water_resistance: '300m', weight: '185g', bracelet: 'Pelle',
    dial_color: 'Nero', complications: ['Secondi piccoli'],
    price_range_min: 3500, price_range_max: 5000, liquidity: 'MEDIA',
    seo_title: 'Panerai Luminor Marina PAM00111 | 44mm Acciaio',
    seo_description: 'Panerai Luminor Marina PAM00111, 44mm acciaio, carica manuale OP XI.',
    seo_keywords: ['panerai luminor', 'PAM00111', 'luminor marina 44'],
    seo_meta: 'Panerai Luminor Marina PAM00111 — cal. OP XI, 44mm.',
  },
  {
    id: 'w9', brand: 'Cartier', model: 'Santos de Cartier', reference: 'WSSA0018',
    collection: 'Santos', year_introduced: 2019,
    movement: 'Automatico', caliber: 'Cal. 1847 MC', power_reserve: '40h', frequency: '28.800 bph',
    case_material: 'Acciaio', case_size: '39.8mm', thickness: '9.08mm', case_back: 'Vite',
    crystal: 'Zaffiro', water_resistance: '100m', weight: '112g', bracelet: 'Acciaio',
    dial_color: 'Argento', complications: [],
    price_range_min: 5500, price_range_max: 7000, liquidity: 'MEDIA',
    seo_title: 'Cartier Santos de Cartier WSSA0018 | Grande Modello Acciaio',
    seo_description: 'Cartier Santos de Cartier WSSA0018, modello grande, bracciale interscambiabile.',
    seo_keywords: ['cartier santos', 'WSSA0018', 'santos cartier acciaio'],
    seo_meta: 'Cartier Santos WSSA0018 — cal. 1847 MC, 39.8mm.',
  },
  {
    id: 'w10', brand: 'TAG Heuer', model: 'Carrera Heuer-02', reference: 'CBN2A1A.BA0643',
    collection: 'Carrera', year_introduced: 2020,
    movement: 'Automatico', caliber: 'Cal. Heuer-02', power_reserve: '80h', frequency: '28.800 bph',
    case_material: 'Acciaio', case_size: '44mm', thickness: '14.4mm', case_back: 'Sapphire',
    crystal: 'Zaffiro', water_resistance: '100m', weight: '148g', bracelet: 'Pelle',
    dial_color: 'Nero', complications: ['Cronografo'],
    price_range_min: 4500, price_range_max: 5800, liquidity: 'MEDIA',
    seo_title: 'TAG Heuer Carrera Heuer-02 CBN2A1A | Cronografo Automatico',
    seo_description: 'TAG Heuer Carrera con calibro Heuer-02, riserva 80h, 44mm acciaio.',
    seo_keywords: ['tag heuer carrera', 'heuer 02', 'CBN2A1A'],
    seo_meta: 'TAG Heuer Carrera Heuer-02 — cal. Heuer-02, 44mm, 80h.',
  },
  {
    id: 'w11', brand: 'Breitling', model: 'Navitimer B01', reference: 'AB0139211G1A1',
    collection: 'Navitimer', year_introduced: 2021,
    movement: 'Automatico', caliber: 'Cal. B01', power_reserve: '70h', frequency: '28.800 bph',
    case_material: 'Acciaio', case_size: '43mm', thickness: '14.25mm', case_back: 'Sapphire',
    crystal: 'Zaffiro', water_resistance: '30m', weight: '180g', bracelet: 'Acciaio',
    dial_color: 'Nero', complications: ['Cronografo', 'Regolo di calcolo'],
    price_range_min: 7500, price_range_max: 9500, liquidity: 'MEDIA',
    seo_title: 'Breitling Navitimer B01 43mm | Calibro B01 In-House',
    seo_description: 'Breitling Navitimer B01 43mm, calibro in-house B01, regolo circolare.',
    seo_keywords: ['breitling navitimer', 'B01', 'navitimer 43'],
    seo_meta: 'Breitling Navitimer B01 — cal. B01, 43mm, riserva 70h.',
  },
  {
    id: 'w12', brand: 'Longines', model: 'Master Collection', reference: 'L2.628.4.78.3',
    collection: 'Master Collection', year_introduced: 2018,
    movement: 'Automatico', caliber: 'Cal. L888.4', power_reserve: '64h', frequency: '25.200 bph',
    case_material: 'Acciaio', case_size: '40mm', thickness: '10.3mm', case_back: 'Sapphire',
    crystal: 'Zaffiro', water_resistance: '30m', weight: '95g', bracelet: 'Pelle',
    dial_color: 'Bianco', complications: ['Data', 'Fasi lunari'],
    price_range_min: 1200, price_range_max: 1800, liquidity: 'BASSA',
    seo_title: 'Longines Master Collection L2.628.4.78.3 | Fasi Lunari 40mm',
    seo_description: 'Longines Master Collection 40mm con fasi lunari e data, cal. L888.4.',
    seo_keywords: ['longines master', 'fasi lunari', 'L2.628.4.78.3'],
    seo_meta: 'Longines Master Collection — cal. L888.4, 40mm, fasi lunari.',
  },
  {
    id: 'w13', brand: 'Hublot', model: 'Big Bang Unico', reference: '441.NX.1171.RX',
    collection: 'Big Bang', year_introduced: 2019,
    movement: 'Automatico', caliber: 'Cal. HUB1242', power_reserve: '72h', frequency: '28.800 bph',
    case_material: 'Titanio', case_size: '42mm', thickness: '14.8mm', case_back: 'Sapphire',
    crystal: 'Zaffiro', water_resistance: '100m', weight: '120g', bracelet: 'Caucciù',
    dial_color: 'Nero', complications: ['Cronografo', 'Flyback'],
    price_range_min: 12000, price_range_max: 16000, liquidity: 'MEDIA',
    seo_title: 'Hublot Big Bang Unico 42mm Titanio | Cal. HUB1242',
    seo_description: 'Hublot Big Bang Unico 42mm titanio, calibro HUB1242, cronografo flyback.',
    seo_keywords: ['hublot big bang unico', '441.NX.1171.RX', 'big bang titanio'],
    seo_meta: 'Hublot Big Bang Unico — cal. HUB1242, 42mm titanio, flyback.',
  },
  {
    id: 'w14', brand: 'Jaeger-LeCoultre', model: 'Reverso Classic', reference: 'Q2438522',
    collection: 'Reverso', year_introduced: 2018,
    movement: 'Manuale', caliber: 'Cal. 822', power_reserve: '45h', frequency: '21.600 bph',
    case_material: 'Acciaio', case_size: '45.6x27.4mm', thickness: '9.14mm', case_back: 'Reversibile',
    crystal: 'Zaffiro', water_resistance: '30m', weight: '88g', bracelet: 'Pelle',
    dial_color: 'Argento', complications: ['Data'],
    price_range_min: 6000, price_range_max: 8000, liquidity: 'BASSA',
    seo_title: 'Jaeger-LeCoultre Reverso Classic Q2438522 | Acciaio',
    seo_description: 'Jaeger-LeCoultre Reverso Classic acciaio, calibro 822 manuale, cassa reversibile.',
    seo_keywords: ['jaeger lecoultre reverso', 'Q2438522', 'reverso classic'],
    seo_meta: 'JLC Reverso Classic — cal. 822, 45.6mm, cassa reversibile.',
  },
  {
    id: 'w15', brand: 'Audemars Piguet', model: 'Royal Oak', reference: '15510ST.OO.1320ST.01',
    collection: 'Royal Oak', year_introduced: 2022,
    movement: 'Automatico', caliber: 'Cal. 4302', power_reserve: '70h', frequency: '28.800 bph',
    case_material: 'Acciaio', case_size: '41mm', thickness: '9.7mm', case_back: 'Sapphire',
    crystal: 'Zaffiro', water_resistance: '50m', weight: '135g', bracelet: 'Acciaio',
    dial_color: 'Blu', complications: ['Data', 'Piccoli secondi'],
    price_range_min: 28000, price_range_max: 38000, liquidity: 'ALTA',
    seo_title: 'Audemars Piguet Royal Oak 41mm Blu | Cal. 4302',
    seo_description: 'Audemars Piguet Royal Oak 41mm, quadrante blu "tapisserie", calibro 4302.',
    seo_keywords: ['audemars piguet royal oak', '15510ST', 'royal oak 41 blu'],
    seo_meta: 'AP Royal Oak 15510ST — cal. 4302, 41mm acciaio, blu.',
  },
];

// --- Mock opportunities ---
export const MOCK_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'opp-1', brand: 'Zenith', model: 'El Primero 42mm', reference: '03.2097.400/21.C496',
    marketAvg: 6200, listingPrice: 4950, margin: 1250,
    source: 'Chrono24', url: 'https://www.chrono24.com/', liquidity: 'MEDIA', foundAt: '2026-03-24T08:30:00Z',
  },
  {
    id: 'opp-2', brand: 'Tudor', model: 'Black Bay 58', reference: 'M79030N-0001',
    marketAvg: 3800, listingPrice: 2900, margin: 900,
    source: 'Watchfinder', url: 'https://www.watchfinder.com/', liquidity: 'ALTA', foundAt: '2026-03-24T09:15:00Z',
  },
  {
    id: 'opp-3', brand: 'Omega', model: 'Speedmaster Moonwatch', reference: '310.30.42.50.01.001',
    marketAvg: 6000, listingPrice: 5100, margin: 900,
    source: 'Chrono24 IT', url: 'https://www.chrono24.it/', liquidity: 'ALTA', foundAt: '2026-03-24T10:00:00Z',
  },
  {
    id: 'opp-4', brand: 'IWC', model: 'Portugieser Chronograph', reference: 'IW371617',
    marketAvg: 6500, listingPrice: 5300, margin: 1200,
    source: 'Spazio21', url: 'https://www.spazio21.com/', liquidity: 'MEDIA', foundAt: '2026-03-24T11:45:00Z',
  },
  {
    id: 'opp-5', brand: 'Panerai', model: 'Luminor Marina', reference: 'PAM00111',
    marketAvg: 4400, listingPrice: 3500, margin: 900,
    source: 'WatchBox', url: 'https://www.thewatchbox.com/', liquidity: 'MEDIA', foundAt: '2026-03-24T12:30:00Z',
  },
  {
    id: 'opp-6', brand: 'TAG Heuer', model: 'Carrera Heuer-02', reference: 'CBN2A1A.BA0643',
    marketAvg: 5200, listingPrice: 4100, margin: 1100,
    source: 'Jomashop', url: 'https://www.jomashop.com/', liquidity: 'MEDIA', foundAt: '2026-03-24T14:00:00Z',
  },
];

// --- Mock portfolio seed ---
export const MOCK_PORTFOLIO_SEED: PortfolioWatch[] = [
  {
    id: 'port-1', brand: 'Rolex', model: 'Submariner', reference: '126610LN',
    purchasePrice: 9500, marketPrice: 11200,
    status: 'In Vendita', purchaseDate: '2026-01-15',
    notes: 'Acquistato da privato, scatola e garanzia presenti.',
  },
  {
    id: 'port-2', brand: 'Tudor', model: 'Black Bay 58', reference: 'M79030N-0001',
    purchasePrice: 2900, marketPrice: 3800,
    status: 'In Portafoglio', purchaseDate: '2026-02-20',
  },
  {
    id: 'port-3', brand: 'Omega', model: 'Seamaster Diver 300M', reference: '210.30.42.20.01.001',
    purchasePrice: 3600, marketPrice: 3600, soldPrice: 4300,
    status: 'Venduto', purchaseDate: '2025-11-05',
    notes: 'Venduto su Chrono24 in 12 giorni.',
  },
];

// --- Deterministic market data generator ---
const SOURCES = ['Chrono24', 'Watchfinder', 'Jomashop', 'Spazio21', 'Montredo', 'LuxuryInStock', 'WatchBox', 'Chrono24 IT'];
const CONDITIONS: MarketListing['condition'][] = ['Nuovo', 'Ottimo', 'Buono', 'Usato'];

function getMonthLabel(offsetFromNow: number): string {
  const d = new Date('2026-03-24');
  d.setMonth(d.getMonth() - (5 - offsetFromNow));
  return d.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' });
}

function getRecentDate(daysAgo: number): string {
  const d = new Date('2026-03-24');
  d.setDate(d.getDate() - daysAgo * 3);
  return d.toLocaleDateString('it-IT');
}

export function generateMarketData(brand: string, model: string, reference: string): MarketAnalysisData {
  const seed = hashCode(brand + reference);
  const basePrice = 3000 + (seed % 12000);
  const spread = 500 + (seed % 2000);
  const avgPrice = Math.round(basePrice + spread * 0.5);

  const listings: MarketListing[] = SOURCES.map((source, i) => ({
    source,
    price: Math.round(basePrice + ((seed * (i + 1)) % spread)),
    condition: CONDITIONS[(seed + i) % 4],
    url: `http://chrono24.com/search/index.htm?dosearch=true&query=${encodeURIComponent(brand + ' ' + reference)}`,
    date: getRecentDate(i),
  }));

  const priceHistory = Array.from({ length: 6 }, (_, i) => ({
    month: getMonthLabel(i),
    avg: Math.round(avgPrice * (0.92 + (((seed + i * 17) % 16) / 100))),
  }));

  return {
    brand,
    model,
    reference,
    listingsCount: 20 + (seed % 80),
    priceMin: Math.min(...listings.map(l => l.price)),
    priceAvg: avgPrice,
    priceMax: Math.max(...listings.map(l => l.price)),
    listings,
    priceHistory,
  };
}
