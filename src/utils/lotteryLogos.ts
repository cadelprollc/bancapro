/**
 * Preset Logos Oficiales de Loterías y Fondos del Sistema
 * Emblemas vectoriales SVG de alta fidelidad, ligeros y sin dependencias externas.
 */

// Helper para convertir SVG limpio a Data URI
function svgToDataUri(svgString: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString.trim())}`;
}

// -------------------------------------------------------------
// LOGOS OFICIALES DE LOTERÍAS (SVG DATA URIS)
// -------------------------------------------------------------

export const PRESET_LOTTERY_LOGOS: Record<string, { name: string; color: string; dataUri: string }> = {
  REAL: {
    name: 'Lotería Real',
    color: '#16A34A',
    dataUri: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <defs>
          <linearGradient id="realGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#16a34a"/>
            <stop offset="100%" stop-color="#065f46"/>
          </linearGradient>
          <linearGradient id="goldCrown" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fde047"/>
            <stop offset="100%" stop-color="#d97706"/>
          </linearGradient>
        </defs>
        <rect width="120" height="120" rx="28" fill="url(#realGrad)"/>
        <circle cx="60" cy="60" r="50" fill="none" stroke="#22c55e" stroke-width="2" stroke-dasharray="4,4"/>
        <!-- Corona Real -->
        <path d="M35 48 L42 70 L78 70 L85 48 L68 58 L60 40 L52 58 Z" fill="url(#goldCrown)" stroke="#b45309" stroke-width="1.5"/>
        <circle cx="35" cy="48" r="3" fill="#fef08a"/>
        <circle cx="60" cy="40" r="3.5" fill="#fef08a"/>
        <circle cx="85" cy="48" r="3" fill="#fef08a"/>
        <rect x="42" y="72" width="36" height="5" rx="2.5" fill="url(#goldCrown)"/>
        <!-- Texto REAL -->
        <text x="60" y="96" font-family="Arial, sans-serif" font-weight="900" font-size="20" fill="#ffffff" text-anchor="middle" letter-spacing="2">REAL</text>
      </svg>
    `),
  },
  GANAMAS: {
    name: 'Gana Más',
    color: '#2563EB',
    dataUri: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <defs>
          <linearGradient id="gmGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#2563eb"/>
            <stop offset="100%" stop-color="#1e3a8a"/>
          </linearGradient>
          <linearGradient id="starGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fbbf24"/>
            <stop offset="100%" stop-color="#ea580c"/>
          </linearGradient>
        </defs>
        <rect width="120" height="120" rx="28" fill="url(#gmGrad)"/>
        <!-- Estrella de la Suerte -->
        <path d="M60 22 L66 42 L88 43 L70 56 L76 77 L60 64 L44 77 L50 56 L32 43 L54 42 Z" fill="url(#starGrad)"/>
        <circle cx="60" cy="50" r="7" fill="#ffffff"/>
        <!-- Texto GANA MÁS -->
        <text x="60" y="93" font-family="Arial, sans-serif" font-weight="900" font-size="16" fill="#ffffff" text-anchor="middle">GANA MÁS</text>
        <text x="60" y="106" font-family="Arial, sans-serif" font-weight="bold" font-size="9" fill="#93c5fd" text-anchor="middle" letter-spacing="1.5">NACIONAL</text>
      </svg>
    `),
  },
  NACIONAL: {
    name: 'Lotería Nacional',
    color: '#1E3A8A',
    dataUri: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <defs>
          <linearGradient id="nacBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0f172a"/>
            <stop offset="100%" stop-color="#1e3a8a"/>
          </linearGradient>
        </defs>
        <rect width="120" height="120" rx="28" fill="url(#nacBg)"/>
        <!-- Escudo / Bandera estilizada -->
        <circle cx="60" cy="52" r="28" fill="#1e40af" stroke="#ffffff" stroke-width="2"/>
        <path d="M60 26 L60 78 M34 52 L86 52" stroke="#ffffff" stroke-width="4"/>
        <rect x="36" y="28" width="22" height="22" fill="#002F6C"/>
        <rect x="62" y="28" width="22" height="22" fill="#CE1126"/>
        <rect x="36" y="54" width="22" height="22" fill="#CE1126"/>
        <rect x="62" y="54" width="22" height="22" fill="#002F6C"/>
        <circle cx="60" cy="52" r="6" fill="#facc15" stroke="#ffffff" stroke-width="1.5"/>
        <!-- Texto NACIONAL -->
        <text x="60" y="96" font-family="Arial, sans-serif" font-weight="900" font-size="14" fill="#ffffff" text-anchor="middle" letter-spacing="1">NACIONAL</text>
        <text x="60" y="108" font-family="Arial, sans-serif" font-weight="bold" font-size="8" fill="#e2e8f0" text-anchor="middle" letter-spacing="1">DOMINICANA</text>
      </svg>
    `),
  },
  LEIDSA: {
    name: 'Leidsa',
    color: '#0D9488',
    dataUri: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <defs>
          <linearGradient id="leidGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0d9488"/>
            <stop offset="100%" stop-color="#115e59"/>
          </linearGradient>
        </defs>
        <rect width="120" height="120" rx="28" fill="url(#leidGrad)"/>
        <!-- Bola Electrónica Loto -->
        <circle cx="60" cy="48" r="24" fill="#ffffff" shadow="0 4px 6px rgba(0,0,0,0.3)"/>
        <circle cx="60" cy="48" r="19" fill="#0f766e"/>
        <circle cx="56" cy="44" r="5" fill="#5eead4" opacity="0.6"/>
        <text x="60" y="54" font-family="Arial, sans-serif" font-weight="900" font-size="18" fill="#ffffff" text-anchor="middle">L</text>
        <!-- Texto LEIDSA -->
        <text x="60" y="88" font-family="Arial, sans-serif" font-weight="900" font-size="17" fill="#ffffff" text-anchor="middle" letter-spacing="1.5">LEIDSA</text>
        <text x="60" y="102" font-family="Arial, sans-serif" font-weight="bold" font-size="8" fill="#ccfbf1" text-anchor="middle">FÁBRICA DE MILLONARIOS</text>
      </svg>
    `),
  },
  LOTEKA: {
    name: 'Loteka',
    color: '#DC2626',
    dataUri: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <defs>
          <linearGradient id="lotkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#dc2626"/>
            <stop offset="100%" stop-color="#991b1b"/>
          </linearGradient>
        </defs>
        <rect width="120" height="120" rx="28" fill="url(#lotkGrad)"/>
        <!-- Diamante y dados -->
        <polygon points="60,26 82,46 60,66 38,46" fill="#facc15" stroke="#ffffff" stroke-width="2"/>
        <circle cx="60" cy="46" r="4.5" fill="#991b1b"/>
        <!-- Texto LOTEKA -->
        <text x="60" y="88" font-family="Arial, sans-serif" font-weight="900" font-size="18" fill="#ffffff" text-anchor="middle" letter-spacing="2">LOTEKA</text>
        <text x="60" y="102" font-family="Arial, sans-serif" font-weight="bold" font-size="8.5" fill="#fecaca" text-anchor="middle">TE TOCA A TI</text>
      </svg>
    `),
  },
  LOTEDOM: {
    name: 'Lotedom',
    color: '#9333EA',
    dataUri: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <defs>
          <linearGradient id="ldomGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#9333ea"/>
            <stop offset="100%" stop-color="#581c87"/>
          </linearGradient>
        </defs>
        <rect width="120" height="120" rx="28" fill="url(#ldomGrad)"/>
        <circle cx="60" cy="48" r="22" fill="none" stroke="#facc15" stroke-width="4"/>
        <path d="M48 48 L72 48 M60 36 L60 60" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
        <circle cx="60" cy="48" r="5" fill="#facc15"/>
        <text x="60" y="88" font-family="Arial, sans-serif" font-weight="900" font-size="16" fill="#ffffff" text-anchor="middle" letter-spacing="1.5">LOTEDOM</text>
        <text x="60" y="102" font-family="Arial, sans-serif" font-weight="bold" font-size="8" fill="#f3e8ff" text-anchor="middle">AGARRA 4</text>
      </svg>
    `),
  },
  NEWYORK: {
    name: 'New York Lottery',
    color: '#0369A1',
    dataUri: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <defs>
          <linearGradient id="nyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0284c7"/>
            <stop offset="100%" stop-color="#0c4a6e"/>
          </linearGradient>
        </defs>
        <rect width="120" height="120" rx="28" fill="url(#nyGrad)"/>
        <!-- Antorcha Estatua de la Libertad -->
        <circle cx="60" cy="35" r="8" fill="#facc15"/>
        <path d="M54 36 Q60 22 66 36 Z" fill="#ef4444"/>
        <path d="M56 42 L64 42 L62 62 L58 62 Z" fill="#f1f5f9"/>
        <text x="60" y="86" font-family="Arial, sans-serif" font-weight="900" font-size="16" fill="#ffffff" text-anchor="middle" letter-spacing="1">NEW YORK</text>
        <text x="60" y="100" font-family="Arial, sans-serif" font-weight="bold" font-size="9" fill="#fed7aa" text-anchor="middle">MIDDAY & EVE</text>
      </svg>
    `),
  },
  FLORIDA: {
    name: 'Florida Lottery',
    color: '#EA580C',
    dataUri: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <defs>
          <linearGradient id="floGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#f97316"/>
            <stop offset="100%" stop-color="#c2410c"/>
          </linearGradient>
        </defs>
        <rect width="120" height="120" rx="28" fill="url(#floGrad)"/>
        <!-- Sol & Palmera -->
        <circle cx="60" cy="46" r="18" fill="#fde047"/>
        <path d="M60 36 Q68 44 60 58 Q52 44 60 36 Z" fill="#15803d"/>
        <text x="60" y="86" font-family="Arial, sans-serif" font-weight="900" font-size="16" fill="#ffffff" text-anchor="middle" letter-spacing="1">FLORIDA</text>
        <text x="60" y="100" font-family="Arial, sans-serif" font-weight="bold" font-size="9" fill="#fef08a" text-anchor="middle">OFFICIAL DRAW</text>
      </svg>
    `),
  },
  PRIMERA: {
    name: 'La Primera',
    color: '#D97706',
    dataUri: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <defs>
          <linearGradient id="p1Grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#f59e0b"/>
            <stop offset="100%" stop-color="#b45309"/>
          </linearGradient>
        </defs>
        <rect width="120" height="120" rx="28" fill="url(#p1Grad)"/>
        <circle cx="60" cy="48" r="22" fill="#ffffff"/>
        <text x="60" y="56" font-family="Arial, sans-serif" font-weight="900" font-size="24" fill="#b45309" text-anchor="middle">1ª</text>
        <text x="60" y="88" font-family="Arial, sans-serif" font-weight="900" font-size="15" fill="#ffffff" text-anchor="middle" letter-spacing="1">PRIMERA</text>
        <text x="60" y="102" font-family="Arial, sans-serif" font-weight="bold" font-size="8" fill="#fef3c7" text-anchor="middle">DÍA & NOCHE</text>
      </svg>
    `),
  },
  ANGUILA: {
    name: 'Anguila Lottery',
    color: '#0284C7',
    dataUri: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <defs>
          <linearGradient id="angGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#38bdf8"/>
            <stop offset="100%" stop-color="#0369a1"/>
          </linearGradient>
        </defs>
        <rect width="120" height="120" rx="28" fill="url(#angGrad)"/>
        <!-- Tres delfines en circulo de Anguila -->
        <circle cx="60" cy="46" r="20" fill="none" stroke="#ffffff" stroke-width="3" stroke-dasharray="6,4"/>
        <circle cx="60" cy="46" r="9" fill="#f59e0b"/>
        <text x="60" y="86" font-family="Arial, sans-serif" font-weight="900" font-size="16" fill="#ffffff" text-anchor="middle" letter-spacing="1">ANGUILA</text>
        <text x="60" y="100" font-family="Arial, sans-serif" font-weight="bold" font-size="8.5" fill="#e0f2fe" text-anchor="middle">CARIBBEAN</text>
      </svg>
    `),
  },
  SUERTE: {
    name: 'La Suerte Dominicana',
    color: '#10B981',
    dataUri: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <defs>
          <linearGradient id="sueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#10b981"/>
            <stop offset="100%" stop-color="#047857"/>
          </linearGradient>
        </defs>
        <rect width="120" height="120" rx="28" fill="url(#sueGrad)"/>
        <!-- Trebol de 4 hojas -->
        <circle cx="53" cy="42" r="7.5" fill="#fde047"/>
        <circle cx="67" cy="42" r="7.5" fill="#fde047"/>
        <circle cx="53" cy="54" r="7.5" fill="#fde047"/>
        <circle cx="67" cy="54" r="7.5" fill="#fde047"/>
        <path d="M60 48 Q60 66 65 68" stroke="#fde047" stroke-width="3" fill="none"/>
        <text x="60" y="88" font-family="Arial, sans-serif" font-weight="900" font-size="15" fill="#ffffff" text-anchor="middle" letter-spacing="1">LA SUERTE</text>
        <text x="60" y="102" font-family="Arial, sans-serif" font-weight="bold" font-size="8" fill="#d1fae5" text-anchor="middle">DOMINICANA</text>
      </svg>
    `),
  },
  KING: {
    name: 'King Lottery',
    color: '#854D0E',
    dataUri: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <defs>
          <linearGradient id="kingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ca8a04"/>
            <stop offset="100%" stop-color="#713f12"/>
          </linearGradient>
        </defs>
        <rect width="120" height="120" rx="28" fill="url(#kingGrad)"/>
        <path d="M38 60 L45 38 L60 48 L75 38 L82 60 Z" fill="#fef08a" stroke="#ffffff" stroke-width="1.5"/>
        <circle cx="60" cy="48" r="3" fill="#ef4444"/>
        <text x="60" y="88" font-family="Arial, sans-serif" font-weight="900" font-size="15" fill="#ffffff" text-anchor="middle" letter-spacing="1.5">KING</text>
        <text x="60" y="102" font-family="Arial, sans-serif" font-weight="bold" font-size="8" fill="#fef9c3" text-anchor="middle">INTERNATIONAL</text>
      </svg>
    `),
  },
  EXPRESS: {
    name: 'Lotería Express 24/7',
    color: '#06B6D4',
    dataUri: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <defs>
          <linearGradient id="expGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#06b6d4"/>
            <stop offset="100%" stop-color="#0e7490"/>
          </linearGradient>
        </defs>
        <rect width="120" height="120" rx="28" fill="url(#expGrad)"/>
        <!-- Rayo veloz -->
        <path d="M64 24 L42 54 L58 54 L52 78 L78 46 L62 46 Z" fill="#fef08a" stroke="#ffffff" stroke-width="1.5"/>
        <text x="60" y="93" font-family="Arial, sans-serif" font-weight="900" font-size="15" fill="#ffffff" text-anchor="middle" letter-spacing="1">EXPRESS</text>
        <text x="60" y="106" font-family="Arial, sans-serif" font-weight="bold" font-size="9" fill="#cffafe" text-anchor="middle">SORTEO EN VIVO</text>
      </svg>
    `),
  },
};

// Obtiene o sugiere el logo adecuado por nombre o código de lotería
export function getPresetLogoForLottery(nameOrCode: string): string | undefined {
  const clean = nameOrCode.toUpperCase().trim();
  if (clean.includes('REAL')) return PRESET_LOTTERY_LOGOS.REAL.dataUri;
  if (clean.includes('GANA') || clean.includes('GMAS')) return PRESET_LOTTERY_LOGOS.GANAMAS.dataUri;
  if (clean.includes('LEIDSA')) return PRESET_LOTTERY_LOGOS.LEIDSA.dataUri;
  if (clean.includes('LOTEKA')) return PRESET_LOTTERY_LOGOS.LOTEKA.dataUri;
  if (clean.includes('LOTEDOM')) return PRESET_LOTTERY_LOGOS.LOTEDOM.dataUri;
  if (clean.includes('NACIONAL')) return PRESET_LOTTERY_LOGOS.NACIONAL.dataUri;
  if (clean.includes('YORK') || clean.includes('NY')) return PRESET_LOTTERY_LOGOS.NEWYORK.dataUri;
  if (clean.includes('FLORIDA') || clean.includes('FL')) return PRESET_LOTTERY_LOGOS.FLORIDA.dataUri;
  if (clean.includes('PRIMERA') || clean.includes('P1')) return PRESET_LOTTERY_LOGOS.PRIMERA.dataUri;
  if (clean.includes('ANGUILA') || clean.includes('ANG')) return PRESET_LOTTERY_LOGOS.ANGUILA.dataUri;
  if (clean.includes('SUERTE') || clean.includes('SUE')) return PRESET_LOTTERY_LOGOS.SUERTE.dataUri;
  if (clean.includes('KING')) return PRESET_LOTTERY_LOGOS.KING.dataUri;
  if (clean.includes('EXPRESS') || clean.includes('EXP')) return PRESET_LOTTERY_LOGOS.EXPRESS.dataUri;
  return undefined;
}

// -------------------------------------------------------------
// FONDOS DE PANTALLA PREDEFINIDOS (PATRONES Y TEXTURAS MODERNAS)
// -------------------------------------------------------------

export interface SystemWallpaperPreset {
  id: string;
  name: string;
  subtitle: string;
  category: 'dark-texture' | 'casino' | 'abstract' | 'minimal';
  previewColor: string;
  dataUri: string;
}

export const SYSTEM_WALLPAPER_PRESETS: SystemWallpaperPreset[] = [
  {
    id: 'carbon-fiber',
    name: 'Fibra de Carbono Dark',
    subtitle: 'Textura técnica sobria y moderna para bancas de alto rendimiento',
    category: 'dark-texture',
    previewColor: '#0f172a',
    dataUri: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
        <rect width="60" height="60" fill="#090d16"/>
        <path d="M0 0 L30 30 L60 0 L30 30 Z" fill="#131b2e" opacity="0.4"/>
        <path d="M0 60 L30 30 L60 60 L30 30 Z" fill="#1e293b" opacity="0.4"/>
        <circle cx="30" cy="30" r="1.5" fill="#38bdf8" opacity="0.15"/>
      </svg>
    `),
  },
  {
    id: 'casino-emerald',
    name: 'Tapete Casino Esmeralda',
    subtitle: 'Gradiente suave y distinguido que emula las mesas de juego VIP',
    category: 'casino',
    previewColor: '#064e3b',
    dataUri: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
        <defs>
          <radialGradient id="casinoGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#065f46" stop-opacity="0.8"/>
            <stop offset="100%" stop-color="#022c22" stop-opacity="1"/>
          </radialGradient>
        </defs>
        <rect width="200" height="200" fill="url(#casinoGrad)"/>
        <circle cx="100" cy="100" r="80" fill="none" stroke="#10b981" stroke-width="1" stroke-dasharray="8,8" opacity="0.12"/>
      </svg>
    `),
  },
  {
    id: 'cyber-hex',
    name: 'Malla Hexagonal Cyber',
    subtitle: 'Rejilla geométrica tecnológica para pantallas POS y paneles',
    category: 'abstract',
    previewColor: '#082f49',
    dataUri: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
        <rect width="80" height="80" fill="#030712"/>
        <polygon points="40,10 70,25 70,55 40,70 10,55 10,25" fill="none" stroke="#0ea5e9" stroke-width="1.2" opacity="0.2"/>
        <circle cx="40" cy="40" r="2" fill="#38bdf8" opacity="0.3"/>
      </svg>
    `),
  },
  {
    id: 'deep-space',
    name: 'Azul Espacial Profundo',
    subtitle: 'Atmósfera estelar azul marino y violeta para máxima elegancia',
    category: 'abstract',
    previewColor: '#1e1b4b',
    dataUri: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
        <defs>
          <radialGradient id="spaceGrad" cx="70%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#312e81" stop-opacity="0.7"/>
            <stop offset="50%" stop-color="#1e1b4b" stop-opacity="0.9"/>
            <stop offset="100%" stop-color="#030712" stop-opacity="1"/>
          </radialGradient>
        </defs>
        <rect width="300" height="300" fill="url(#spaceGrad)"/>
        <circle cx="60" cy="80" r="1" fill="#ffffff" opacity="0.5"/>
        <circle cx="210" cy="150" r="1.5" fill="#818cf8" opacity="0.6"/>
        <circle cx="140" cy="240" r="1" fill="#38bdf8" opacity="0.4"/>
      </svg>
    `),
  },
  {
    id: 'gold-noir',
    name: 'Onyx con Destellos Dorados',
    subtitle: 'Fondo negro azabache con partículas doradas de la fortuna',
    category: 'casino',
    previewColor: '#1c1917',
    dataUri: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
        <rect width="120" height="120" fill="#0c0a09"/>
        <polygon points="60,15 70,35 90,35 75,50 80,70 60,58 40,70 45,50 30,35 50,35" fill="#eab308" opacity="0.08"/>
        <circle cx="20" cy="90" r="1.5" fill="#facc15" opacity="0.2"/>
        <circle cx="100" cy="20" r="2" fill="#ca8a04" opacity="0.25"/>
      </svg>
    `),
  },
  {
    id: 'minimal-slate',
    name: 'Pizarra Minimalista',
    subtitle: 'Gradiente de gris neutro sin distracciones para velocidad visual',
    category: 'minimal',
    previewColor: '#0f172a',
    dataUri: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="slateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0f172a"/>
            <stop offset="100%" stop-color="#020617"/>
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill="url(#slateGrad)"/>
      </svg>
    `),
  },
];

// -------------------------------------------------------------
// PRESETS DE PALETAS DE COLOR DEL SISTEMA (TEMAS GLOBALES)
// -------------------------------------------------------------

export interface SystemThemePreset {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  badge: string;
}

export const SYSTEM_COLOR_PRESETS: SystemThemePreset[] = [
  {
    id: 'royal-blue',
    name: 'Azul Real Casino (Estándar)',
    primaryColor: '#2563EB',
    secondaryColor: '#0F172A',
    accentColor: '#38BDF8',
    badge: 'Popular',
  },
  {
    id: 'emerald-bank',
    name: 'Verde Esmeralda Ganador',
    primaryColor: '#059669',
    secondaryColor: '#064E3B',
    accentColor: '#34D399',
    badge: 'Fortuna',
  },
  {
    id: 'imperial-gold',
    name: 'Oro Imperial VIP',
    primaryColor: '#D97706',
    secondaryColor: '#1C1917',
    accentColor: '#FBBF24',
    badge: 'Exclusivo',
  },
  {
    id: 'crimson-victory',
    name: 'Rojo Carmesí Victoria',
    primaryColor: '#DC2626',
    secondaryColor: '#450A0A',
    accentColor: '#F87171',
    badge: 'Intenso',
  },
  {
    id: 'cyber-neon',
    name: 'Cyberpunk Neón Cyan',
    primaryColor: '#06B6D4',
    secondaryColor: '#083344',
    accentColor: '#22D3EE',
    badge: 'Moderno',
  },
  {
    id: 'royal-purple',
    name: 'Púrpura Amatista Loto',
    primaryColor: '#7C3AED',
    secondaryColor: '#3B0764',
    accentColor: '#A78BFA',
    badge: 'Místico',
  },
  {
    id: 'dark-stealth',
    name: 'Midnight Stealth Slate',
    primaryColor: '#3B82F6',
    secondaryColor: '#020617',
    accentColor: '#94A3B8',
    badge: 'Sobrio',
  },
];
