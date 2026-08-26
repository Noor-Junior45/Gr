import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Zap,
  Building2,
  Sparkles,
  Layers,
  Home,
  Plus,
  Minus,
  RotateCcw,
  MessageSquare,
  ShoppingCart,
  Printer,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Truck,
  Loader2,
  CheckCircle2,
  PackageCheck,
  Sliders,
  Sparkle,
  BadgePercent,
  Check
} from 'lucide-react';
import { Product, CartItem } from '../types';

interface MaterialCostCalculatorProps {
  onAddToCart?: (product: Product, quantity?: number) => void;
  cartItems?: CartItem[];
  currentArea?: {
    name: string;
    pincode: string;
    deliveryMinutes?: number;
  };
}

interface AIResponseData {
  summary: string;
  sanctionedLoadRecommendation?: string;
  electrical?: {
    wireCoilsLight?: { qty: number };
    wireCoilsPower?: { qty: number };
    modularSwitches?: { qty: number };
    mcbDistribution?: { qty: number };
    pvcConduits?: { qty: number };
  };
  construction?: {
    cementBags?: { qty: number };
    tmtSteelKg?: { qty: number };
    waterproofingLiters?: { qty: number };
    wallPuttyBags?: { qty: number };
  };
  engineeringAdvice?: string[];
}

export const MaterialCostCalculator: React.FC<MaterialCostCalculatorProps> = ({
  onAddToCart,
  currentArea
}) => {
  // ---------------------------------------------------------------------------
  // 1. Primary User Selections
  // ---------------------------------------------------------------------------
  const [projectScope, setProjectScope] = useState<'both' | 'electrical' | 'construction'>('both');
  const [propertyPreset, setPropertyPreset] = useState<'1bhk' | '2bhk' | '3bhk' | '4bhk' | 'commercial'>('2bhk');
  const [houseAreaSqFt, setHouseAreaSqFt] = useState<number>(950);
  const [qualityTier, setQualityTier] = useState<'standard' | 'premium' | 'heavy_duty'>('premium');

  // ---------------------------------------------------------------------------
  // 2. Material Quantities State
  // ---------------------------------------------------------------------------
  // Electrical
  const [wireCoilsLight, setWireCoilsLight] = useState<number>(3);
  const [wireCoilsPower, setWireCoilsPower] = useState<number>(2);
  const [modularSwitches, setModularSwitches] = useState<number>(26);
  const [mcbBoxes, setMcbBoxes] = useState<number>(1);
  const [pvcConduits, setPvcConduits] = useState<number>(14);

  // Construction
  const [cementBags, setCementBags] = useState<number>(60);
  const [tmtSteelKg, setTmtSteelKg] = useState<number>(500);
  const [waterproofingLiters, setWaterproofingLiters] = useState<number>(10);
  const [wallPuttyBags, setWallPuttyBags] = useState<number>(4);

  // ---------------------------------------------------------------------------
  // 3. AI Assist State (Simplified & Compact)
  // ---------------------------------------------------------------------------
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiAdvice, setAiAdvice] = useState<string[] | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [addedToCartSuccess, setAddedToCartSuccess] = useState<boolean>(false);

  // Preset Handler
  const handlePresetSelect = (preset: '1bhk' | '2bhk' | '3bhk' | '4bhk' | 'commercial') => {
    setPropertyPreset(preset);

    if (preset === '1bhk') {
      setHouseAreaSqFt(550);
      setWireCoilsLight(2);
      setWireCoilsPower(1);
      setModularSwitches(16);
      setMcbBoxes(1);
      setPvcConduits(8);
      setCementBags(30);
      setTmtSteelKg(250);
      setWaterproofingLiters(5);
      setWallPuttyBags(2);
    } else if (preset === '2bhk') {
      setHouseAreaSqFt(950);
      setWireCoilsLight(3);
      setWireCoilsPower(2);
      setModularSwitches(26);
      setMcbBoxes(1);
      setPvcConduits(14);
      setCementBags(60);
      setTmtSteelKg(500);
      setWaterproofingLiters(10);
      setWallPuttyBags(4);
    } else if (preset === '3bhk') {
      setHouseAreaSqFt(1400);
      setWireCoilsLight(5);
      setWireCoilsPower(3);
      setModularSwitches(42);
      setMcbBoxes(2);
      setPvcConduits(22);
      setCementBags(100);
      setTmtSteelKg(850);
      setWaterproofingLiters(20);
      setWallPuttyBags(7);
    } else if (preset === '4bhk') {
      setHouseAreaSqFt(2100);
      setWireCoilsLight(7);
      setWireCoilsPower(5);
      setModularSwitches(60);
      setMcbBoxes(3);
      setPvcConduits(32);
      setCementBags(160);
      setTmtSteelKg(1350);
      setWaterproofingLiters(30);
      setWallPuttyBags(11);
    } else if (preset === 'commercial') {
      setHouseAreaSqFt(1200);
      setWireCoilsLight(6);
      setWireCoilsPower(6);
      setModularSwitches(35);
      setMcbBoxes(3);
      setPvcConduits(28);
      setCementBags(50);
      setTmtSteelKg(400);
      setWaterproofingLiters(15);
      setWallPuttyBags(6);
    }
  };

  // Adjust material price multipliers based on quality tier
  const priceTierMultiplier = useMemo(() => {
    if (qualityTier === 'standard') return 0.92;
    if (qualityTier === 'heavy_duty') return 1.15;
    return 1.0; // premium
  }, [qualityTier]);

  // Wholesale unit rates (Kolkata Kasba Depot Rates)
  const rates = useMemo(() => {
    return {
      wireLight: Math.round(3600 * priceTierMultiplier),
      wirePower: Math.round(4200 * priceTierMultiplier),
      switchPoint: Math.round(140 * priceTierMultiplier),
      mcbBox: Math.round(1150 * priceTierMultiplier),
      conduitPipe: 120,
      cementBag: Math.round(385 * (qualityTier === 'heavy_duty' ? 1.05 : 1.0)),
      tmtKg: 62,
      wpLiter: 135,
      puttyBag: 690
    };
  }, [priceTierMultiplier, qualityTier]);

  // Live itemized cost calculations
  const calculatedCosts = useMemo(() => {
    const electricalSubtotal =
      wireCoilsLight * rates.wireLight +
      wireCoilsPower * rates.wirePower +
      modularSwitches * rates.switchPoint +
      mcbBoxes * rates.mcbBox +
      pvcConduits * rates.conduitPipe;

    const constructionSubtotal =
      cementBags * rates.cementBag +
      tmtSteelKg * rates.tmtKg +
      waterproofingLiters * rates.wpLiter +
      wallPuttyBags * rates.puttyBag;

    let grandTotal = 0;
    if (projectScope === 'electrical') {
      grandTotal = electricalSubtotal;
    } else if (projectScope === 'construction') {
      grandTotal = constructionSubtotal;
    } else {
      grandTotal = electricalSubtotal + constructionSubtotal;
    }

    return {
      electricalSubtotal,
      constructionSubtotal,
      grandTotal,
      gstAmount: Math.round(grandTotal * 0.18)
    };
  }, [
    projectScope,
    wireCoilsLight,
    wireCoilsPower,
    modularSwitches,
    mcbBoxes,
    pvcConduits,
    cementBags,
    tmtSteelKg,
    waterproofingLiters,
    wallPuttyBags,
    rates
  ]);

  // Call Gemini AI server-side endpoint for smart recommendations
  const handleGeminiEstimate = async (promptOverride?: string) => {
    const promptToUse = promptOverride || customPrompt;
    setIsAiLoading(true);

    try {
      const response = await fetch('/api/gemini/estimate-materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clientName: 'Valued Customer',
          phone: '9830012345',
          area: currentArea?.name || 'Kasba Depot, Kolkata',
          pincode: currentArea?.pincode || '700039',
          houseAreaSqFt,
          propertyType: propertyPreset.toUpperCase(),
          floors: 1,
          projectScope,
          qualityTier,
          customRequirements: promptToUse
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data: AIResponseData = await response.json();
      setAiSummary(data.summary || 'AI tailored material quantities based on your specifications.');
      if (data.engineeringAdvice) {
        setAiAdvice(data.engineeringAdvice);
      }

      // Sync the interactive matrix with Gemini recommendations
      if (data.electrical) {
        if (data.electrical.wireCoilsLight?.qty) setWireCoilsLight(data.electrical.wireCoilsLight.qty);
        if (data.electrical.wireCoilsPower?.qty) setWireCoilsPower(data.electrical.wireCoilsPower.qty);
        if (data.electrical.modularSwitches?.qty) setModularSwitches(data.electrical.modularSwitches.qty);
        if (data.electrical.mcbDistribution?.qty) setMcbBoxes(data.electrical.mcbDistribution.qty);
        if (data.electrical.pvcConduits?.qty) setPvcConduits(data.electrical.pvcConduits.qty);
      }

      if (data.construction) {
        if (data.construction.cementBags?.qty) setCementBags(data.construction.cementBags.qty);
        if (data.construction.tmtSteelKg?.qty) setTmtSteelKg(data.construction.tmtSteelKg.qty);
        if (data.construction.waterproofingLiters?.qty) setWaterproofingLiters(data.construction.waterproofingLiters.qty);
        if (data.construction.wallPuttyBags?.qty) setWallPuttyBags(data.construction.wallPuttyBags.qty);
      }
    } catch (err) {
      console.warn('Gemini estimation error:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // 1-Click "Add All Materials to Cart"
  const handleAddAllToCart = () => {
    if (!onAddToCart) return;

    const createEstProduct = (
      id: string,
      name: string,
      brand: string,
      category: 'electrical' | 'construction',
      subCategory: string,
      price: number,
      originalPrice: number,
      unit: string,
      deliveryMinutes: number,
      image: string,
      description: string
    ): Product => ({
      id,
      name,
      brand,
      category,
      subCategory,
      price,
      originalPrice,
      discountPercentage: Math.max(0, Math.round(((originalPrice - price) / originalPrice) * 100)),
      unit,
      rating: 4.9,
      reviewsCount: 142,
      deliveryMinutes,
      image,
      inStock: true,
      stockCount: 500,
      isEmergency: false,
      specs: { Origin: 'Depot Stock', Certification: 'ISI Certified' },
      description,
      tags: [category, subCategory, 'Wholesale']
    });

    const itemsToAdd: Array<{ product: Product; quantity: number }> = [];

    if (projectScope === 'electrical' || projectScope === 'both') {
      itemsToAdd.push({
        product: createEstProduct(
          'est-wire-light',
          'Polycab FR-LSH 1.5 sq.mm Copper Wire Coil (90m)',
          'Polycab',
          'electrical',
          'Wires & Cables',
          rates.wireLight,
          rates.wireLight + 400,
          'Coil (90m)',
          60,
          'https://i.imgur.com/8QZpP5E.png',
          '100% Pure Electrolytic Copper wire ISI 694 certified for lighting & fans.'
        ),
        quantity: wireCoilsLight
      });

      itemsToAdd.push({
        product: createEstProduct(
          'est-wire-power',
          'RR Kabel FlameX 2.5/4.0 sq.mm Heavy Power Cable (90m)',
          'RR Kabel',
          'electrical',
          'Wires & Cables',
          rates.wirePower,
          rates.wirePower + 500,
          'Coil (90m)',
          60,
          'https://i.imgur.com/G9LIx1R.jpeg',
          'Heavy duty fire retardant cable for Air Conditioners, Geysers and Induction.'
        ),
        quantity: wireCoilsPower
      });

      itemsToAdd.push({
        product: createEstProduct(
          'est-modular-switches',
          'Schneider Opale 6A/16A Modular Switch & Socket Set',
          'Schneider',
          'electrical',
          'Modular Switches',
          rates.switchPoint,
          rates.switchPoint + 30,
          'Point Set',
          60,
          'https://i.imgur.com/Kz3Hn96.jpeg',
          'Gloss white fire-resistant polycarbonate modular switch points with safety shutter.'
        ),
        quantity: modularSwitches
      });

      itemsToAdd.push({
        product: createEstProduct(
          'est-mcb-box',
          'Havells Double Door SPN/TPN MCB Distribution Box + Isolator',
          'Havells',
          'electrical',
          'Distribution Boards',
          rates.mcbBox,
          rates.mcbBox + 250,
          'Set',
          60,
          'https://i.imgur.com/SQXJ1g6.jpeg',
          'IP43 rated sheet metal distribution box with DIN rail and neutral bus bar.'
        ),
        quantity: mcbBoxes
      });

      itemsToAdd.push({
        product: createEstProduct(
          'est-pvc-conduit',
          'Heavy Rigid PVC Electrical Conduit Pipe (20mm/25mm - 3m)',
          'Finolex',
          'electrical',
          'PVC Items',
          rates.conduitPipe,
          rates.conduitPipe + 25,
          'Pipe (3m)',
          60,
          'https://i.imgur.com/G9LIx1R.jpeg',
          'Unplasticised heavy PVC pipe for wall and slab concealed wiring.'
        ),
        quantity: pvcConduits
      });
    }

    if (projectScope === 'construction' || projectScope === 'both') {
      itemsToAdd.push({
        product: createEstProduct(
          'est-cement-bag',
          'UltraTech 53 Grade Fresh OPC Cement (50kg Bag)',
          'UltraTech',
          'construction',
          'Cement & Concrete',
          rates.cementBag,
          rates.cementBag + 40,
          '50kg Bag',
          120,
          'https://i.imgur.com/u0PYh6L.png',
          'Fresh OPC 53 Grade high-early strength structural cement from factory depot.'
        ),
        quantity: cementBags
      });

      itemsToAdd.push({
        product: createEstProduct(
          'est-tmt-steel',
          'Tata Tiscon 550D Super Ductile Fe TMT Rebar (kg)',
          'Tata Tiscon',
          'construction',
          'TMT Steel',
          rates.tmtKg,
          rates.tmtKg + 6,
          'kg',
          120,
          'https://i.imgur.com/WwkWGNa.jpeg',
          'Primary mill high-ductility seismic earthquake resistant TMT steel bars.'
        ),
        quantity: tmtSteelKg
      });

      itemsToAdd.push({
        product: createEstProduct(
          'est-waterproofing',
          'Dr. Fixit 101 LW+ Integral Waterproofing Liquid (1L)',
          'Dr. Fixit',
          'construction',
          'Waterproofing',
          rates.wpLiter,
          rates.wpLiter + 20,
          'Liter',
          60,
          'https://i.imgur.com/PmoHsyt.png',
          'Corrosion inhibitor liquid waterproofing admixture for concrete and plaster.'
        ),
        quantity: waterproofingLiters
      });

      itemsToAdd.push({
        product: createEstProduct(
          'est-wall-putty',
          'Asian Paints TruCare Polymer White Wall Putty (20kg Bag)',
          'Asian Paints',
          'construction',
          'Paints & Putty',
          rates.puttyBag,
          rates.puttyBag + 60,
          '20kg Bag',
          60,
          'https://i.imgur.com/PZgJwqo.png',
          'White cement based water-resistant polymer putty for smooth interior finish.'
        ),
        quantity: wallPuttyBags
      });
    }

    itemsToAdd.forEach((item) => {
      onAddToCart(item.product, item.quantity);
    });

    setAddedToCartSuccess(true);
    setTimeout(() => {
      setAddedToCartSuccess(false);
    }, 4000);
  };

  // WhatsApp quotation link
  const whatsappQuoteUrl = useMemo(() => {
    const message = encodeURIComponent(
      `Hello Giriraj Power Kasba Hub! ⚡
I estimated materials on your website:
━━━━━━━━━━━━━━━━━━━━━━
🏠 Property: ${propertyPreset.toUpperCase()} (~${houseAreaSqFt} sq.ft)
📋 Scope: ${projectScope.toUpperCase()} (${qualityTier.toUpperCase()} Quality)
━━━━━━━━━━━━━━━━━━━━━━
${
  projectScope === 'electrical' || projectScope === 'both'
    ? `⚡ Electrical:
• 1.5mm Wire Coils: ${wireCoilsLight} coils
• 2.5/4.0mm Power Coils: ${wireCoilsPower} coils
• Modular Switches: ${modularSwitches} points
• MCB Box: ${mcbBoxes} units
• PVC Conduits: ${pvcConduits} pipes
`
    : ''
}${
        projectScope === 'construction' || projectScope === 'both'
          ? `🏗️ Construction:
• UltraTech Cement: ${cementBags} Bags
• Tata Tiscon Steel: ${tmtSteelKg} kg
• Dr. Fixit Waterproofing: ${waterproofingLiters} L
• Asian Paints Putty: ${wallPuttyBags} Bags
`
          : ''
      }━━━━━━━━━━━━━━━━━━━━━━
💰 Total Wholesale Price: ₹${calculatedCosts.grandTotal.toLocaleString('en-IN')} (GST Included)

Please share the official GST invoice & confirm same-day truck dispatch.`
    );
    return `https://wa.me/918777400280?text=${message}`;
  }, [
    propertyPreset,
    houseAreaSqFt,
    projectScope,
    qualityTier,
    wireCoilsLight,
    wireCoilsPower,
    modularSwitches,
    mcbBoxes,
    pvcConduits,
    cementBags,
    tmtSteelKg,
    waterproofingLiters,
    wallPuttyBags,
    calculatedCosts.grandTotal
  ]);

  return (
    <section id="unified-material-cost-calculator" className="space-y-4 pt-1 px-1 sm:px-0">
      {/* -------------------------------------------------------------------
          Header
          ------------------------------------------------------------------- */}
      <div className="text-center max-w-2xl mx-auto space-y-1 px-2">
        <div className="inline-flex items-center justify-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center shadow-2xs">
            <Calculator className="w-4.5 h-4.5 text-amber-600" />
          </span>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black font-sf-pro text-slate-900 tracking-tight">
            Material &amp; Cost Estimator
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 font-medium">
          Instant wholesale depot rates for electrical &amp; construction materials
        </p>
      </div>

      {/* -------------------------------------------------------------------
          2x2 Quad Grid Layout (2 cols on tablet/desktop, 1 col on mobile)
          ------------------------------------------------------------------- */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 lg:gap-5">
        
        {/* =================================================================
            BOX 1 (Top Left / [1,1]): Scope & Property Preset
            ================================================================= */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            {/* Box Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-slate-900 text-white text-xs font-black flex items-center justify-center font-sf-pro">
                  1
                </span>
                <h3 className="text-xs sm:text-sm font-black font-sf-pro text-slate-900">
                  Project Scope &amp; Type
                </h3>
              </div>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-200">
                Step 1 of 4
              </span>
            </div>

            {/* Scope Selector: 3 Touch-friendly tabs */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Work Scope
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setProjectScope('electrical')}
                  className={`min-h-[42px] flex items-center justify-center gap-1.5 py-2 px-1.5 rounded-lg text-xs font-black font-sf-pro transition-all cursor-pointer ${
                    projectScope === 'electrical'
                      ? 'bg-white text-slate-950 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  <Zap className={`w-3.5 h-3.5 ${projectScope === 'electrical' ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
                  <span>Electrical</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProjectScope('construction')}
                  className={`min-h-[42px] flex items-center justify-center gap-1.5 py-2 px-1.5 rounded-lg text-xs font-black font-sf-pro transition-all cursor-pointer ${
                    projectScope === 'construction'
                      ? 'bg-white text-slate-950 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  <Building2 className={`w-3.5 h-3.5 ${projectScope === 'construction' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>Building</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProjectScope('both')}
                  className={`min-h-[42px] flex items-center justify-center gap-1.5 py-2 px-1.5 rounded-lg text-xs font-black font-sf-pro transition-all cursor-pointer ${
                    projectScope === 'both'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  <Layers className={`w-3.5 h-3.5 ${projectScope === 'both' ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>Both</span>
                </button>
              </div>
            </div>

            {/* Property Presets: 2x2 grid on mobile / 4 items */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Quick Property Preset
                </label>
                <span className="text-[10px] text-slate-400 font-medium">Auto sets quantities</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: '1bhk', label: '1 BHK Flat', area: '550 sq.ft' },
                  { id: '2bhk', label: '2 BHK Flat', area: '950 sq.ft', badge: 'Popular' },
                  { id: '3bhk', label: '3 BHK Flat', area: '1,400 sq.ft' },
                  { id: '4bhk', label: '4 BHK / House', area: '2,100 sq.ft' }
                ].map((p) => {
                  const isSelected = propertyPreset === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handlePresetSelect(p.id as any)}
                      className={`min-h-[50px] relative p-2.5 rounded-xl text-left font-sf-pro transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-xs ring-2 ring-amber-400/30'
                          : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {p.badge && (
                        <span className="absolute top-2 right-2 bg-slate-900 text-amber-300 text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-2xs">
                          {p.badge}
                        </span>
                      )}
                      <div className="text-xs font-black leading-tight flex items-center gap-1">
                        {p.label}
                        {isSelected && <Check className="w-3 h-3 text-slate-950 shrink-0" />}
                      </div>
                      <div className={`text-[10px] font-semibold leading-tight mt-0.5 ${isSelected ? 'text-slate-900' : 'text-slate-500'}`}>
                        {p.area}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Commercial / Shop chip */}
              <button
                type="button"
                onClick={() => handlePresetSelect('commercial')}
                className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold font-sf-pro transition-all cursor-pointer border flex items-center justify-between ${
                  propertyPreset === 'commercial'
                    ? 'bg-amber-400 text-slate-950 border-amber-500 font-black'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>🏬 Commercial / Shop / Office</span>
                <span className="text-[10px] opacity-80">1,200 sq.ft</span>
              </button>
            </div>
          </div>
        </div>

        {/* =================================================================
            BOX 2 (Top Right / [1,2]): Property Dimensions & Quality Tier
            ================================================================= */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            {/* Box Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 text-xs font-black flex items-center justify-center font-sf-pro">
                  2
                </span>
                <h3 className="text-xs sm:text-sm font-black font-sf-pro text-slate-900">
                  Area &amp; Quality Grade
                </h3>
              </div>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-200">
                Step 2 of 4
              </span>
            </div>

            {/* Built-up Area Fine Tuning */}
            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Home className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-slate-800">
                    Floor Built-up Area
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-black text-slate-950 bg-white px-2.5 py-1 rounded-md border border-slate-300 shadow-2xs font-sf-pro">
                    {houseAreaSqFt} sq.ft
                  </span>
                </div>
              </div>

              {/* Slider */}
              <div className="pt-1">
                <input
                  type="range"
                  min={300}
                  max={3500}
                  step={50}
                  value={houseAreaSqFt}
                  onChange={(e) => setHouseAreaSqFt(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[10px] font-semibold text-slate-400 mt-1">
                  <span>300 sq.ft</span>
                  <span>1,500 sq.ft</span>
                  <span>3,500 sq.ft</span>
                </div>
              </div>

              {/* Quick Area Stepper */}
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setHouseAreaSqFt(Math.max(300, houseAreaSqFt - 50))}
                  className="min-h-[36px] px-3 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer shadow-2xs"
                >
                  - 50 sq.ft
                </button>
                <button
                  type="button"
                  onClick={() => setHouseAreaSqFt(Math.min(4000, houseAreaSqFt + 50))}
                  className="min-h-[36px] px-3 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer shadow-2xs"
                >
                  + 50 sq.ft
                </button>
              </div>
            </div>

            {/* Quality Tier Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Quality Grade
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200">
                {[
                  { id: 'standard', label: 'Standard', desc: 'ISI Budget' },
                  { id: 'premium', label: 'Premium', desc: 'Top Brands' },
                  { id: 'heavy_duty', label: 'Heavy Duty', desc: 'Commercial' }
                ].map((tier) => {
                  const isSelected = qualityTier === tier.id;
                  return (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => setQualityTier(tier.id as any)}
                      className={`min-h-[46px] p-1.5 rounded-lg text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white text-slate-950 font-black shadow-xs border border-slate-200 ring-1 ring-amber-400'
                          : 'text-slate-600 hover:text-slate-950'
                      }`}
                    >
                      <div className="text-[11px] font-black leading-tight">{tier.label}</div>
                      <div className="text-[9px] text-slate-400 font-medium leading-tight mt-0.5">
                        {tier.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* =================================================================
            BOX 3 (Bottom Left / [2,1]): Material Quantities Matrix
            ================================================================= */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3.5">
          <div className="space-y-3">
            {/* Box Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white text-xs font-black flex items-center justify-center font-sf-pro">
                  3
                </span>
                <h3 className="text-xs sm:text-sm font-black font-sf-pro text-slate-900">
                  Itemized Material Quantities
                </h3>
              </div>
              <span className="text-[10px] font-bold text-slate-500">
                Tap - / + to adjust
              </span>
            </div>

            {/* Materials List in 2x2 Sub-Grid */}
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              
              {/* Electrical Section */}
              {(projectScope === 'electrical' || projectScope === 'both') && (
                <div className="space-y-2">
                  <div className="text-[11px] font-black text-amber-800 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3 fill-amber-500 text-amber-500" />
                      Electrical Wiring &amp; Switches
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold">
                      Subtotal: ₹{calculatedCosts.electricalSubtotal.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Item 1: Light Wires */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-1.5">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">1.5mm Light Wire</div>
                        <div className="text-[10px] text-slate-500">₹{rates.wireLight}/coil (90m)</div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setWireCoilsLight(Math.max(1, wireCoilsLight - 1))}
                          className="w-8 h-8 rounded-lg bg-white border border-slate-300 active:bg-slate-200 flex items-center justify-center font-black text-slate-700 cursor-pointer shadow-2xs"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-black">{wireCoilsLight}</span>
                        <button
                          type="button"
                          onClick={() => setWireCoilsLight(wireCoilsLight + 1)}
                          className="w-8 h-8 rounded-lg bg-amber-400 hover:bg-amber-500 border border-amber-500 active:bg-amber-600 flex items-center justify-center font-black text-slate-950 cursor-pointer shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Item 2: Power Wires */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-1.5">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">2.5/4mm AC Wire</div>
                        <div className="text-[10px] text-slate-500">₹{rates.wirePower}/coil (90m)</div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setWireCoilsPower(Math.max(1, wireCoilsPower - 1))}
                          className="w-8 h-8 rounded-lg bg-white border border-slate-300 active:bg-slate-200 flex items-center justify-center font-black text-slate-700 cursor-pointer shadow-2xs"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-black">{wireCoilsPower}</span>
                        <button
                          type="button"
                          onClick={() => setWireCoilsPower(wireCoilsPower + 1)}
                          className="w-8 h-8 rounded-lg bg-amber-400 hover:bg-amber-500 border border-amber-500 active:bg-amber-600 flex items-center justify-center font-black text-slate-950 cursor-pointer shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Item 3: Switches */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-1.5">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">Modular Switches</div>
                        <div className="text-[10px] text-slate-500">₹{rates.switchPoint}/point</div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setModularSwitches(Math.max(4, modularSwitches - 2))}
                          className="w-8 h-8 rounded-lg bg-white border border-slate-300 active:bg-slate-200 flex items-center justify-center font-black text-slate-700 cursor-pointer shadow-2xs"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-black">{modularSwitches}</span>
                        <button
                          type="button"
                          onClick={() => setModularSwitches(modularSwitches + 2)}
                          className="w-8 h-8 rounded-lg bg-amber-400 hover:bg-amber-500 border border-amber-500 active:bg-amber-600 flex items-center justify-center font-black text-slate-950 cursor-pointer shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Item 4: MCB Box & Conduits */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-1.5">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">MCB DB Box</div>
                        <div className="text-[10px] text-slate-500">₹{rates.mcbBox}/box</div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setMcbBoxes(Math.max(1, mcbBoxes - 1))}
                          className="w-8 h-8 rounded-lg bg-white border border-slate-300 active:bg-slate-200 flex items-center justify-center font-black text-slate-700 cursor-pointer shadow-2xs"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-black">{mcbBoxes}</span>
                        <button
                          type="button"
                          onClick={() => setMcbBoxes(mcbBoxes + 1)}
                          className="w-8 h-8 rounded-lg bg-amber-400 hover:bg-amber-500 border border-amber-500 active:bg-amber-600 flex items-center justify-center font-black text-slate-950 cursor-pointer shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Construction Section */}
              {(projectScope === 'construction' || projectScope === 'both') && (
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <div className="text-[11px] font-black text-emerald-800 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-emerald-600" />
                      Cement, Steel &amp; Waterproofing
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold">
                      Subtotal: ₹{calculatedCosts.constructionSubtotal.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Item 1: Cement */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-1.5">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">UltraTech Cement</div>
                        <div className="text-[10px] text-slate-500">₹{rates.cementBag}/50kg bag</div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setCementBags(Math.max(5, cementBags - 5))}
                          className="w-8 h-8 rounded-lg bg-white border border-slate-300 active:bg-slate-200 flex items-center justify-center font-black text-slate-700 cursor-pointer shadow-2xs"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 text-center text-xs font-black">{cementBags}</span>
                        <button
                          type="button"
                          onClick={() => setCementBags(cementBags + 5)}
                          className="w-8 h-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 text-white flex items-center justify-center font-black cursor-pointer shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Item 2: Steel */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-1.5">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">Tata Tiscon TMT</div>
                        <div className="text-[10px] text-slate-500">₹{rates.tmtKg}/kg (550D)</div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setTmtSteelKg(Math.max(50, tmtSteelKg - 50))}
                          className="w-8 h-8 rounded-lg bg-white border border-slate-300 active:bg-slate-200 flex items-center justify-center font-black text-slate-700 cursor-pointer shadow-2xs"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-9 text-center text-xs font-black">{tmtSteelKg}</span>
                        <button
                          type="button"
                          onClick={() => setTmtSteelKg(tmtSteelKg + 50)}
                          className="w-8 h-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 text-white flex items-center justify-center font-black cursor-pointer shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Item 3: Waterproofing */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-1.5">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">Dr. Fixit 101 LW+</div>
                        <div className="text-[10px] text-slate-500">₹{rates.wpLiter}/Liter</div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setWaterproofingLiters(Math.max(1, waterproofingLiters - 1))}
                          className="w-8 h-8 rounded-lg bg-white border border-slate-300 active:bg-slate-200 flex items-center justify-center font-black text-slate-700 cursor-pointer shadow-2xs"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-black">{waterproofingLiters}L</span>
                        <button
                          type="button"
                          onClick={() => setWaterproofingLiters(waterproofingLiters + 1)}
                          className="w-8 h-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 text-white flex items-center justify-center font-black cursor-pointer shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Item 4: Wall Putty */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-1.5">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">Asian Paints Putty</div>
                        <div className="text-[10px] text-slate-500">₹{rates.puttyBag}/20kg bag</div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setWallPuttyBags(Math.max(1, wallPuttyBags - 1))}
                          className="w-8 h-8 rounded-lg bg-white border border-slate-300 active:bg-slate-200 flex items-center justify-center font-black text-slate-700 cursor-pointer shadow-2xs"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-black">{wallPuttyBags}</span>
                        <button
                          type="button"
                          onClick={() => setWallPuttyBags(wallPuttyBags + 1)}
                          className="w-8 h-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 text-white flex items-center justify-center font-black cursor-pointer shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* =================================================================
            BOX 4 (Bottom Right / [2,2]): Wholesale Total & Direct Order
            ================================================================= */}
        <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-b from-amber-50/50 via-white to-amber-50/30 text-slate-900 p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            {/* Box Header */}
            <div className="flex items-center justify-between border-b border-amber-200/60 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 text-xs font-black flex items-center justify-center font-sf-pro">
                  4
                </span>
                <h3 className="text-xs sm:text-sm font-black font-sf-pro text-slate-900">
                  Live Quotation &amp; Order
                </h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                GST Invoice Included
              </span>
            </div>

            {/* Big Price Display */}
            <div className="space-y-0.5">
              <div className="text-3xl sm:text-4xl font-black font-sf-pro tracking-tight text-slate-950">
                ₹{calculatedCosts.grandTotal.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-600 font-medium flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Direct Kasba Depot Wholesale Rate</span>
              </div>
            </div>

            {/* Quick breakdown pills */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
              <div>
                <span className="text-[10px] text-slate-500 block">Electrical</span>
                <span className="font-black text-amber-700 text-xs">
                  ₹{calculatedCosts.electricalSubtotal.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Construction</span>
                <span className="font-black text-emerald-700 text-xs">
                  ₹{calculatedCosts.constructionSubtotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Actions: 2 Full-width mobile buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleAddAllToCart}
                className={`min-h-[46px] w-full py-2.5 px-3 rounded-xl font-black font-sf-pro text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                  addedToCartSuccess
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-400 hover:bg-amber-500 text-slate-950 active:scale-[0.98] border border-amber-500'
                }`}
              >
                {addedToCartSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Added Items to Cart!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 text-slate-950" />
                    <span>Add All Items to Cart</span>
                  </>
                )}
              </button>

              <a
                href={whatsappQuoteUrl}
                target="_blank"
                rel="noreferrer"
                className="min-h-[46px] w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black font-sf-pro text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] text-center shadow-xs"
              >
                <MessageSquare className="w-4 h-4 fill-white text-emerald-600 shrink-0" />
                <span>Instant WhatsApp Quote</span>
              </a>
            </div>

            {/* Collapsible Mini AI Helper */}
            <div className="border-t border-amber-200/60 pt-2">
              <button
                type="button"
                onClick={() => setShowAiModal(!showAiModal)}
                className="w-full flex items-center justify-between text-[11px] font-bold text-slate-700 hover:text-slate-950 cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                  Ask AI to fine-tune requirements
                </span>
                {showAiModal ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showAiModal && (
                <div className="space-y-2 pt-2">
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="e.g. 3 ACs, false ceiling, terrace..."
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                    <button
                      type="button"
                      onClick={() => handleGeminiEstimate()}
                      disabled={isAiLoading}
                      className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black shrink-0 transition-all cursor-pointer disabled:opacity-50 border border-amber-500"
                    >
                      {isAiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Go'}
                    </button>
                  </div>

                  {aiSummary && (
                    <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-300 text-[11px] text-amber-900 font-medium">
                      ✨ {aiSummary}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* Quick Footer Links */}
          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-amber-200/60">
            <button
              type="button"
              onClick={() => handlePresetSelect('2bhk')}
              className="hover:text-slate-900 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Defaults</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="hover:text-slate-900 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Printer className="w-3 h-3" />
              <span>Print PDF</span>
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
