export interface WireColorOption {
  name: string;
  label: string;
  shortRole: string;
  hex: string;
  twBg: string;
  twRing: string;
  description: string;
  standard: string;
}

export const INDIAN_STANDARD_WIRE_COLORS: WireColorOption[] = [
  {
    name: 'Red',
    label: 'Red (Live / Phase R)',
    shortRole: 'Phase (R)',
    hex: '#DC2626',
    twBg: 'bg-red-600',
    twRing: 'ring-red-600',
    description: 'IS 694 Standard: Live / Phase conductor in single-phase & 3-phase circuits.',
    standard: 'IS 694'
  },
  {
    name: 'Black',
    label: 'Black (Neutral N)',
    shortRole: 'Neutral (N)',
    hex: '#0F172A',
    twBg: 'bg-slate-950',
    twRing: 'ring-slate-950',
    description: 'IS 694 Standard: Neutral return conductor for AC electrical circuits.',
    standard: 'IS 694'
  },
  {
    name: 'Green',
    label: 'Green (Earth / Ground E)',
    shortRole: 'Earth (E)',
    hex: '#16A34A',
    twBg: 'bg-green-600',
    twRing: 'ring-green-600',
    description: 'IS 694 Standard: Safety protective earth grounding conductor.',
    standard: 'IS 694'
  },
  {
    name: 'Yellow',
    label: 'Yellow (Phase Y)',
    shortRole: 'Phase (Y)',
    hex: '#EAB308',
    twBg: 'bg-yellow-500',
    twRing: 'ring-yellow-500',
    description: 'IS 694 Standard: Y-Phase in 3-phase wiring & secondary switch live loops.',
    standard: 'IS 694'
  },
  {
    name: 'Blue',
    label: 'Blue (Phase B)',
    shortRole: 'Phase (B)',
    hex: '#2563EB',
    twBg: 'bg-blue-600',
    twRing: 'ring-blue-600',
    description: 'IS 694 Standard: B-Phase in 3-phase wiring & dedicated lighting loops.',
    standard: 'IS 694'
  },
  {
    name: 'White',
    label: 'White / Grey (Inverter / UPS)',
    shortRole: 'Inverter / UPS',
    hex: '#F1F5F9',
    twBg: 'bg-slate-200',
    twRing: 'ring-slate-400',
    description: 'Indian Residential Standard: Dedicated Inverter / UPS emergency backup phase.',
    standard: 'IS 732'
  }
];

export function isWireProduct(product?: {
  name?: string;
  subCategory?: string;
  subcategory?: string;
  category?: string;
  tags?: string[];
}): boolean {
  if (!product) return false;
  const name = (product.name || '').toLowerCase();
  const sub = (product.subCategory || product.subcategory || '').toLowerCase();
  const tags = (product.tags || []).map((t) => t.toLowerCase());

  return (
    sub === 'wire' ||
    sub === 'wiring' ||
    sub === 'cables' ||
    sub.includes('wire') ||
    sub.includes('cable') ||
    name.includes('wire') ||
    name.includes('frls') ||
    name.includes('fr ls') ||
    name.includes('sqmm') ||
    name.includes('cable') ||
    tags.includes('wire') ||
    tags.includes('cable')
  );
}
