import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Star,
  Zap,
  ShoppingCart,
  ShieldCheck,
  Truck,
  RotateCcw,
  Tag,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  MessageSquare,
  ThumbsUp,
  Camera,
  X,
  Share2,
  Check,
  HelpCircle,
  Palette
} from 'lucide-react';
import { ElectricalProduct, ProductReview } from '../../types/electrical';
import {
  fetchElectricalProductById,
  fetchSimilarElectricalProducts,
  fetchProductReviews,
  submitProductReview
} from '../../services/electricalService';
import { Product, UserProfile } from '../../types';
import { supabase } from '../../lib/supabaseClient';
import { INDIAN_STANDARD_WIRE_COLORS, isWireProduct } from '../../data/wireColors';

interface ProductDetailPageProps {
  onAddToCart: (product: Product) => void;
  cartItems?: { product: Product; quantity: number }[];
  onOpenCart: () => void;
  userProfile: UserProfile | null;
  onOpenAuth: () => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  onAddToCart,
  cartItems = [],
  onOpenCart,
  userProfile,
  onOpenAuth
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<ElectricalProduct | null>(null);
  const [similarProducts, setSimilarProducts] = useState<ElectricalProduct[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedWireColor, setSelectedWireColor] = useState<string>('Red');

  // Zoom on Hover State
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const thumbnailContainerRef = useRef<HTMLDivElement>(null);

  const scrollThumbnails = (direction: 'prev' | 'next') => {
    if (!thumbnailContainerRef.current) return;
    const isMobile = window.innerWidth < 640;
    const scrollAmount = isMobile ? 160 : 150;
    if (isMobile) {
      thumbnailContainerRef.current.scrollBy({
        left: direction === 'next' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
      });
    } else {
      thumbnailContainerRef.current.scrollBy({
        top: direction === 'next' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Delivery Pincode Check State
  const [pincode, setPincode] = useState('700091');
  const [pincodeChecked, setPincodeChecked] = useState(true);

  // Specifications Accordion State
  const [isSpecsExpanded, setIsSpecsExpanded] = useState(true);

  // Review Form State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Reviews Pagination State
  const [visibleReviewsCount, setVisibleReviewsCount] = useState(4);
  const [copiedLink, setCopiedLink] = useState(false);

  // FAQ Accordion State (first item open by default)
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const reviewsSectionRef = useRef<HTMLDivElement>(null);

  // Fetch product, reviews, and similar items
  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    setLoading(true);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    fetchElectricalProductById(id)
      .then((data) => {
        if (!isMounted) return;
        setProduct(data);
        setSelectedImageIndex(0);
        setLoading(false);

        if (data) {
          // Fetch similar products
          fetchSimilarElectricalProducts(data.id, data.subcategory)
            .then((sim) => {
              if (isMounted) setSimilarProducts(sim);
            })
            .catch(console.warn);

          // Fetch reviews
          fetchProductReviews(data.id)
            .then((revs) => {
              if (isMounted) setReviews(revs);
            })
            .catch(console.warn);
        }
      })
      .catch((err) => {
        console.error(err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const isWire = product ? isWireProduct(product) : false;

  // Adapt for App's Cart system
  const adaptToCartProduct = (ep: ElectricalProduct): Product => ({
    id: ep.id,
    name: ep.name,
    brand: ep.brand,
    category: 'electrical',
    subCategory: ep.subcategory,
    price: ep.price,
    originalPrice: ep.mrp,
    discountPercentage: ep.discount_percent,
    unit: '1 unit',
    rating: ep.rating_avg,
    reviewsCount: ep.rating_count,
    deliveryMinutes: 60,
    image: ep.image_urls[0] || 'https://images.unsplash.com/photo-1558223616-e5d79faebdd6?q=80&w=800&auto=format&fit=crop',
    inStock: ep.stock_quantity > 0,
    stockCount: ep.stock_quantity,
    isEmergency: false,
    specs: typeof ep.specifications?.Specifications === 'object' ? ep.specifications.Specifications : {},
    description: ep.description,
    tags: [ep.brand, ep.subcategory, 'Electrical'],
    selectedColor: isWire ? selectedWireColor : undefined
  });

  const cartQty = product
    ? (cartItems.find((i) => String(i.product.id) === String(product.id))?.quantity || 0)
    : 0;

  // Zoom Handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const { left, top, width, height } = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPosition({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  const scrollToReviews = () => {
    reviewsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleShareProduct = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Submit Review Handler
  const handleOpenReviewModal = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data?.user) {
      onOpenAuth();
      return;
    }
    setReviewError(null);
    setReviewSuccess(false);
    setIsReviewModalOpen(true);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    if (!reviewTitle.trim() || !reviewComment.trim()) {
      setReviewError('Please provide both a review title and comment.');
      return;
    }

    setIsSubmittingReview(true);
    setReviewError(null);

    const res = await submitProductReview({
      product_id: product.id,
      rating: reviewRating,
      title: reviewTitle,
      comment: reviewComment
    });

    setIsSubmittingReview(false);

    if (res.success && res.review) {
      setReviews((prev) => [res.review!, ...prev]);
      setReviewSuccess(true);
      setReviewTitle('');
      setReviewComment('');
      setTimeout(() => {
        setIsReviewModalOpen(false);
        setReviewSuccess(false);
      }, 1500);
    } else {
      setReviewError(res.error || 'Failed to submit review. Please try again.');
    }
  };

  // Calculate Ratings Distribution (5-star down to 1-star) from real reviews only
  const ratingsDistribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((r) => Math.round(r.rating) === stars).length;
    const percentage = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
    return { stars, count, percentage };
  });

  const averageRating = useMemo(() => {
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
      return Number((sum / reviews.length).toFixed(1));
    }
    return product ? Number(product.rating_avg || 0) : 0;
  }, [reviews, product]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f1f3f6] flex items-center justify-center p-8">
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center shadow-xs">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-bold text-slate-800">Loading Product Details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#f1f3f6] flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full p-8 rounded-xl border border-slate-200 text-center shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-black text-slate-900">Product Not Found</h2>
          <p className="text-xs text-slate-500">
            The electrical product you are looking for does not exist or has been removed.
          </p>
          <Link
            to="/electrical"
            className="inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-md transition-colors"
          >
            Back to Electrical Store
          </Link>
        </div>
      </div>
    );
  }

  const currentImage =
    product.image_urls[selectedImageIndex] ||
    product.image_urls[0] ||
    'https://images.unsplash.com/photo-1558223616-e5d79faebdd6?q=80&w=800&auto=format&fit=crop';

  return (
    <div className="min-h-screen bg-[#f1f3f6] text-slate-900 pb-32 sm:pb-36 font-sans">
      
      {/* Breadcrumbs Bar (Starts from Electrical) with Back Arrow Button */}
      <div className="bg-white border-b border-slate-200 shadow-2xs sticky top-0 sm:static z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none">
            <button
              onClick={() => navigate('/electrical')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-yellow-400 hover:text-slate-950 text-slate-800 font-bold transition-all cursor-pointer border border-slate-200 active:scale-95 shrink-0"
              title="Back to all Electrical Products"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              <span className="text-xs">Back to List</span>
            </button>

            <span className="text-slate-300">|</span>

            <Link to="/electrical" className="hover:text-amber-600 font-bold text-slate-900">
              Electrical
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <Link
              to={`/electrical?subcategory=${encodeURIComponent(product.subcategory)}`}
              className="hover:text-amber-600 font-semibold text-slate-700"
            >
              {product.subcategory}
            </Link>
            {product.brand && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <Link
                  to={`/electrical?subcategory=${encodeURIComponent(product.subcategory)}&brand=${encodeURIComponent(product.brand)}`}
                  className="hover:text-amber-600 font-semibold text-slate-700"
                >
                  {product.brand}
                </Link>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-bold text-slate-900 truncate max-w-xs">{product.name}</span>
          </div>

          <button
            onClick={handleShareProduct}
            className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-amber-600 cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link Copied' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4">
        <div className="bg-white border border-slate-200 shadow-xs rounded-xl p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* ========================================================================= */}
          {/* LEFT COLUMN: IMAGE GALLERY WITH ZOOM + ACTION BUTTONS */}
          {/* ========================================================================= */}
          <div className="lg:col-span-5 flex flex-col gap-4 self-start lg:sticky lg:top-20">
            
            {/* Gallery Image Display */}
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              
              {/* Thumbnail Strip with Up/Down and Left/Right Scroll Arrows */}
              {product.image_urls.length > 1 && (
                <div className="flex sm:flex-col items-center justify-center relative select-none">
                  {/* Desktop Up Scroll Button (shown when 5+ images) */}
                  {product.image_urls.length >= 5 && (
                    <button
                      type="button"
                      onClick={() => scrollThumbnails('prev')}
                      className="hidden sm:flex mb-1 p-1 rounded-full bg-white hover:bg-yellow-400 hover:text-slate-950 text-slate-600 border border-slate-200 shadow-xs transition-all cursor-pointer items-center justify-center z-10 active:scale-90"
                      title="Scroll previous thumbnails"
                      aria-label="Scroll previous thumbnails"
                    >
                      <ChevronUp className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  )}

                  {/* Mobile Left Scroll Button (shown when 5+ images) */}
                  {product.image_urls.length >= 5 && (
                    <button
                      type="button"
                      onClick={() => scrollThumbnails('prev')}
                      className="sm:hidden absolute left-0 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/95 text-slate-800 border border-slate-200 shadow-md transition-all cursor-pointer z-20 active:scale-90 hover:bg-yellow-400"
                      title="Scroll left"
                      aria-label="Scroll left"
                    >
                      <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  )}

                  {/* Scrollable Thumbnails List */}
                  <div
                    ref={thumbnailContainerRef}
                    className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-y-auto sm:max-h-96 px-6 sm:px-0 py-0.5 sm:py-1 scrollbar-none scroll-smooth"
                  >
                    {product.image_urls.map((imgUrl, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        onMouseEnter={() => setSelectedImageIndex(idx)}
                        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-lg border p-1 bg-slate-50 shrink-0 transition-all cursor-pointer relative ${
                          selectedImageIndex === idx
                            ? 'border-yellow-500 ring-2 ring-yellow-300 shadow-xs'
                            : 'border-slate-200 hover:border-slate-400 opacity-85 hover:opacity-100'
                        }`}
                        title={`View photo ${idx + 1}`}
                      >
                        <img
                          src={imgUrl}
                          alt={`thumbnail-${idx}`}
                          className="w-full h-full object-contain"
                        />
                      </button>
                    ))}
                  </div>

                  {/* Desktop Down Scroll Button (shown when 5+ images) */}
                  {product.image_urls.length >= 5 && (
                    <button
                      type="button"
                      onClick={() => scrollThumbnails('next')}
                      className="hidden sm:flex mt-1 p-1 rounded-full bg-white hover:bg-yellow-400 hover:text-slate-950 text-slate-600 border border-slate-200 shadow-xs transition-all cursor-pointer items-center justify-center z-10 active:scale-90"
                      title="Scroll next thumbnails"
                      aria-label="Scroll next thumbnails"
                    >
                      <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  )}

                  {/* Mobile Right Scroll Button (shown when 5+ images) */}
                  {product.image_urls.length >= 5 && (
                    <button
                      type="button"
                      onClick={() => scrollThumbnails('next')}
                      className="sm:hidden absolute right-0 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/95 text-slate-800 border border-slate-200 shadow-md transition-all cursor-pointer z-20 active:scale-90 hover:bg-yellow-400"
                      title="Scroll right"
                      aria-label="Scroll right"
                    >
                      <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  )}
                </div>
              )}

              {/* Main Image with Zoom on Hover */}
              <div
                ref={imageContainerRef}
                onMouseEnter={() => setIsZooming(true)}
                onMouseLeave={() => setIsZooming(false)}
                onMouseMove={handleMouseMove}
                className="flex-1 aspect-square relative bg-slate-50 border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center p-4 cursor-crosshair group"
              >
                <img
                  src={currentImage}
                  alt={product.name}
                  className={`w-full h-full object-contain transition-transform duration-200 ${
                    isZooming ? 'opacity-0' : 'opacity-100'
                  }`}
                />

                {/* Magnified Zoom Canvas Window */}
                {isZooming && (
                  <div
                    className="absolute inset-0 bg-no-repeat pointer-events-none bg-slate-50"
                    style={{
                      backgroundImage: `url(${currentImage})`,
                      backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                      backgroundSize: '250%'
                    }}
                  />
                )}

                {/* Fast Delivery Badge */}
                <div className="absolute top-3 left-3 bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2.5 py-1 rounded shadow-xs flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 fill-slate-950" />
                  60-Min Kolkata Dispatch
                </div>

                {/* 100% Genuine Transparent Pill Tag */}
                <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-md border border-white/60 text-emerald-800 text-[11px] font-black px-3 py-1 rounded-full shadow-xs flex items-center gap-1.5 z-10">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>100% Genuine</span>
                </div>
              </div>
            </div>

            {/* Floating Action Buttons at Bottom of Screen */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] py-3 px-4 sm:px-6">
              <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-6">
                
                {/* Left Product Quick Info (Shown on tablets and desktop) */}
                <div className="hidden sm:flex items-center gap-3 min-w-0">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-11 h-11 object-contain rounded-lg border border-slate-200 bg-white p-1 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-slate-900 truncate max-w-xs md:max-w-sm">
                      {product.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-black text-sm text-slate-950">
                        ₹{product.price.toLocaleString('en-IN')}
                      </span>
                      {product.mrp && (
                        <span className="text-[11px] text-slate-400 line-through">
                          ₹{product.mrp.toLocaleString('en-IN')}
                        </span>
                      )}
                      <span className="text-[11px] font-bold text-emerald-600">
                        In Stock • Free Ezra St. Dispatch
                      </span>
                    </div>
                  </div>
                </div>

                {/* Floating Action Buttons */}
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3 w-full sm:w-auto sm:min-w-[360px] md:min-w-[400px]">
                  <button
                    onClick={() => onAddToCart(adaptToCartProduct(product))}
                    className="py-3 px-4 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-98 border border-yellow-500/40"
                  >
                    <ShoppingCart className="w-4 h-4 shrink-0" />
                    <span>Add to Cart {cartQty > 0 && `(${cartQty})`}</span>
                  </button>

                  <button
                    onClick={() => {
                      onAddToCart(adaptToCartProduct(product));
                      onOpenCart();
                    }}
                    className="py-3 px-4 rounded-xl bg-[#fb641b] hover:bg-[#e85b17] text-white font-black text-xs sm:text-sm uppercase tracking-wide flex items-center justify-center shadow-sm transition-all cursor-pointer active:scale-98"
                  >
                    <span>Buy Now</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN: PRODUCT DETAILS & REVIEWS */}
          {/* ========================================================================= */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Title & Brand */}
            <div>
              <p className="text-xs font-black text-amber-600 uppercase tracking-wider mb-1">
                {product.brand} • {product.subcategory}
              </p>
              <h1 className="text-lg sm:text-2xl font-black text-slate-900 leading-tight">
                {product.name}
              </h1>

              {/* Real Rating & Reviews Count */}
              <div className="flex items-center gap-3 mt-2">
                {reviews.length > 0 ? (
                  <>
                    <button
                      onClick={scrollToReviews}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#388e3c] text-white text-xs font-black tracking-tight shadow-2xs hover:bg-green-700 transition-colors cursor-pointer"
                    >
                      {averageRating.toFixed(1)}
                      <Star className="w-3 h-3 fill-white" />
                    </button>
                    <button
                      onClick={scrollToReviews}
                      className="text-xs font-bold text-slate-500 hover:text-amber-600 transition-colors cursor-pointer"
                    >
                      {reviews.length} {reviews.length === 1 ? 'Customer Review' : 'Customer Reviews'}
                    </button>
                  </>
                ) : (
                  <span className="text-xs font-semibold text-slate-400">
                    No ratings yet
                  </span>
                )}
                <span className="text-slate-300">•</span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Giriraj Assured
                </span>
              </div>
            </div>

            {/* Price Block (Flipkart Style) */}
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-1">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
                {product.mrp > product.price && (
                  <span className="text-sm text-slate-400 line-through font-semibold">
                    ₹{product.mrp.toLocaleString('en-IN')}
                  </span>
                )}
                {product.discount_percent > 0 && (
                  <span className="text-sm font-black text-[#388e3c]">
                    {product.discount_percent}% off
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Inclusive of all taxes • GST invoice available on checkout
              </p>
            </div>

            {/* Wire Colour Options (IS 694 Indian Standards) */}
            {isWire && (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-200/90 shadow-xs space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                      <Palette className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
                        Select Wire Colour
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Indian Standard (IS 694 / IS 732) Colour Coding
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-blue-800 bg-blue-100/90 px-3 py-1 rounded-full border border-blue-200 shadow-2xs">
                    Selected: {selectedWireColor}
                  </span>
                </div>

                {/* Interactive Colour Swatches Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 pt-1">
                  {INDIAN_STANDARD_WIRE_COLORS.map((opt) => {
                    const isSelected = selectedWireColor === opt.name;
                    return (
                      <button
                        key={opt.name}
                        type="button"
                        onClick={() => setSelectedWireColor(opt.name)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer text-center relative ${
                          isSelected
                            ? 'border-slate-900 bg-white ring-2 ring-slate-900 shadow-md scale-102'
                            : 'border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50/80 shadow-2xs'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center border transition-transform ${
                            isSelected ? 'border-white ring-2 ring-slate-900 scale-110 shadow-sm' : 'border-black/20'
                          }`}
                          style={{ backgroundColor: opt.hex }}
                        >
                          {isSelected && (
                            <Check
                              className={`w-4 h-4 stroke-[3] ${
                                opt.name === 'White' ? 'text-slate-900' : 'text-white'
                              }`}
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="block text-xs font-black text-slate-900 leading-none mb-0.5">
                            {opt.name}
                          </span>
                          <span className="block text-[10px] font-bold text-slate-500 truncate">
                            {opt.shortRole}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Color Purpose Banner */}
                {(() => {
                  const activeColor = INDIAN_STANDARD_WIRE_COLORS.find(c => c.name === selectedWireColor);
                  if (!activeColor) return null;
                  return (
                    <div className="p-2.5 rounded-xl bg-white border border-blue-100 text-xs text-slate-700 flex items-start gap-2.5 shadow-2xs">
                      <span className="w-3.5 h-3.5 rounded-full shrink-0 mt-0.5 border border-black/20" style={{ backgroundColor: activeColor.hex }}></span>
                      <div className="leading-snug">
                        <span className="font-extrabold text-slate-900">{activeColor.label}:</span>{' '}
                        <span className="text-slate-600">{activeColor.description}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Available Offers - Replaced with actual Product Discounts */}
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Available Offers
              </h3>
              <div className="space-y-2 text-xs text-slate-700">
                {product.discount_percent > 0 ? (
                  <>
                    <div className="flex items-start gap-2">
                      <Tag className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>
                        <strong className="font-bold text-slate-900">Special Product Discount:</strong> {product.discount_percent}% instant off on MRP ₹{product.mrp.toLocaleString('en-IN')}. You save ₹{(product.mrp - product.price).toLocaleString('en-IN')} per unit.
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Tag className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>
                        <strong className="font-bold text-slate-900">Wholesale Direct Price:</strong> Buy at ₹{product.price.toLocaleString('en-IN')} with manufacturer standard warranty &amp; authentic tax invoice.
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-start gap-2">
                    <Tag className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong className="font-bold text-slate-900">Best Direct Price:</strong> Genuine manufacturer-direct price of ₹{product.price.toLocaleString('en-IN')} with GST invoice.
                    </span>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <Tag className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong className="font-bold text-slate-900">Free Express Delivery:</strong> 60-Minute rapid dispatch in Kolkata for eligible orders above ₹499.
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery & Pincode Checker */}
            <div className="p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs font-black text-slate-900">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  Delivery &amp; Services
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="Enter 6-digit Pincode"
                    className="w-32 px-2.5 py-1 text-xs border border-slate-300 rounded font-mono font-bold focus:ring-1 focus:ring-blue-500 outline-hidden"
                    maxLength={6}
                  />
                  <button
                    onClick={() => setPincodeChecked(true)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded cursor-pointer"
                  >
                    Check
                  </button>
                </div>
              </div>

              {pincodeChecked && (
                <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-slate-100">
                  <p className="flex items-center gap-1.5 text-emerald-700 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Delivery within 60 minutes in Kolkata (Pincode: {pincode})
                  </p>
                  <p className="text-[11px] text-slate-500 pl-5">
                    Dispatched from Central Ezra Street Kolkata warehouse • Free delivery on orders above ₹499
                  </p>
                </div>
              )}
            </div>

            {/* Stock Status */}
            <div>
              {product.stock_quantity > 0 ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-800 text-xs font-extrabold border border-green-200">
                  <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />
                  In Stock ({product.stock_quantity} units available in Kolkata hub)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-800 text-xs font-extrabold border border-red-200">
                  Currently Out of Stock
                </span>
              )}
            </div>

            {/* Specifications Table (Flipkart Spec Table Style) */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setIsSpecsExpanded(!isSpecsExpanded)}
                className="w-full p-4 bg-slate-50 hover:bg-slate-100 flex items-center justify-between font-black text-sm text-slate-900 cursor-pointer transition-colors"
              >
                <span>Product Specifications</span>
                {isSpecsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {isSpecsExpanded && (
                <div className="p-4 sm:p-6 space-y-6 text-xs divide-y divide-slate-100">
                  {Object.entries(product.specifications || {}).map(([sectionTitle, sectionValues]) => (
                    <div key={sectionTitle} className="pt-4 first:pt-0 space-y-3">
                      <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">
                        {sectionTitle}
                      </h4>
                      <div className="space-y-2">
                        {typeof sectionValues === 'object' && sectionValues !== null ? (
                          Object.entries(sectionValues).map(([key, val]) => (
                            <div key={key} className="grid grid-cols-12 gap-2">
                              <span className="col-span-5 sm:col-span-4 text-slate-500 font-semibold">
                                {key}
                              </span>
                              <span className="col-span-7 sm:col-span-8 text-slate-900 font-bold">
                                {String(val)}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="grid grid-cols-12 gap-2">
                            <span className="col-span-5 sm:col-span-4 text-slate-500 font-semibold">
                              Details
                            </span>
                            <span className="col-span-7 sm:col-span-8 text-slate-900 font-bold">
                              {String(sectionValues)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Description */}
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Product Description
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                {product.description}
              </p>
            </div>

            {/* Return Policy Section */}
            <div className="space-y-3 bg-amber-50/60 border border-amber-200/80 rounded-xl p-4 sm:p-5">
              <div className="flex items-center gap-2 text-slate-950 font-black text-sm">
                <RotateCcw className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Return &amp; Replacement Policy</span>
              </div>
              <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    <strong className="font-bold text-slate-900">Non-Refundable:</strong> All electrical supplies, wires, switches, and components are non-refundable once purchased.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong className="font-bold text-slate-900">7-Day Replacement Only:</strong> Free instant replacement within 7 days if the product is received damaged, broken, or defective during transit.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong className="font-bold text-slate-900">Return Eligibility:</strong> The item must be uninstalled, unused, and in its original manufacturer packaging with all seals, labels, and warranty cards intact.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong className="font-bold text-slate-900">Manufacturer Warranty:</strong> Post-installation defects are fully covered under standard {product.brand} brand warranty support across authorized service centers.
                  </span>
                </div>
              </div>
            </div>

            {/* Frequently Asked Questions (FAQ) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-amber-600" />
                  Frequently Asked Questions
                </h3>
                <span className="text-[11px] text-slate-400 font-semibold">4 Questions</span>
              </div>

              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden bg-white shadow-2xs">
                {[
                  {
                    q: `Is this ${product.brand} ${product.subcategory} 100% original and certified?`,
                    a: `Yes, all ${product.brand} products sold on Giriraj Power are 100% genuine, factory-sealed, and adhere strictly to standard ISI / BIS safety certifications. We source directly from authorized brand distributors.`
                  },
                  {
                    q: 'How fast is delivery to my address in Kolkata?',
                    a: 'We dispatch immediately from our central Ezra Street electrical market hub in Kolkata. Orders are delivered within minimum 60 minutes or maximum 7 days depending on your specific pin code and order volume.'
                  },
                  {
                    q: 'Will I receive a GST tax invoice with my order?',
                    a: 'Yes, every order includes a valid GST tax invoice with proper HSN codes and breakdown that you can use for business tax input credits (ITC) and warranty verification.'
                  },
                  {
                    q: 'Can contractors and builders place bulk coil/carton orders?',
                    a: 'Yes, you can order project-scale bulk quantities directly through the store with special wholesale benefits and site delivery across Kolkata and West Bengal.'
                  }
                ].map((faq, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div key={idx} className="transition-colors">
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        className="w-full p-3.5 sm:p-4 text-left flex items-center justify-between gap-3 hover:bg-slate-50 cursor-pointer font-bold text-xs text-slate-900 transition-colors"
                      >
                        <span className="flex-1">{faq.q}</span>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-amber-600 shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-3.5 sm:px-4 pb-4 pt-1 text-xs text-slate-600 leading-relaxed bg-slate-50/70 border-t border-slate-100 animate-in fade-in">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ========================================================================= */}
            {/* RATINGS & REVIEWS SECTION */}
            {/* ========================================================================= */}
            <div ref={reviewsSectionRef} className="pt-6 border-t border-slate-200 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Ratings &amp; Customer Reviews
                  </h3>
                  <p className="text-xs text-slate-500">
                    Verified feedback from real customers
                  </p>
                </div>

                <button
                  onClick={handleOpenReviewModal}
                  className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-black text-xs rounded-md shadow-xs transition-colors cursor-pointer self-start sm:self-auto border border-yellow-500/30"
                >
                  Write a Review
                </button>
              </div>

              {reviews.length > 0 ? (
                /* Rating Summary Breakdown Box (from real reviews) */
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 p-5 bg-slate-50 rounded-xl border border-slate-200 items-center">
                  
                  {/* Overall Score */}
                  <div className="sm:col-span-4 text-center sm:text-left space-y-1 sm:border-r sm:border-slate-200 sm:pr-6">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="text-3xl font-black text-slate-900">
                        {averageRating.toFixed(1)}
                      </span>
                      <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
                    </div>
                    <p className="text-xs font-bold text-slate-600">
                      {reviews.length} {reviews.length === 1 ? 'Customer Rating &' : 'Customer Ratings &'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {reviews.length} Verified {reviews.length === 1 ? 'Review' : 'Reviews'}
                    </p>
                  </div>

                  {/* Rating Distribution Progress Bars */}
                  <div className="sm:col-span-8 space-y-1.5 text-xs">
                    {ratingsDistribution.map((item) => (
                      <div key={item.stars} className="flex items-center gap-3">
                        <span className="w-8 font-bold text-slate-700 flex items-center gap-0.5">
                          {item.stars} <Star className="w-2.5 h-2.5 fill-slate-500 text-slate-500" />
                        </span>
                        <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              item.stars >= 4
                                ? 'bg-[#388e3c]'
                                : item.stars === 3
                                ? 'bg-amber-400'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-[10px] text-slate-500 font-semibold">
                          {item.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <MessageSquare className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-800">No customer reviews yet</p>
                  <p className="text-[11px] text-slate-500">
                    Be the first to rate and review this genuine electrical product.
                  </p>
                  <button
                    onClick={handleOpenReviewModal}
                    className="inline-block mt-2 px-4 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-black text-xs rounded-md shadow-xs transition-colors cursor-pointer border border-yellow-500/30"
                  >
                    Be the first to rate
                  </button>
                </div>
              )}

              {/* Reviews List */}
              {reviews.length > 0 && (
                <div className="space-y-4">
                  {reviews.slice(0, visibleReviewsCount).map((rev) => (
                    <div
                      key={rev.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#388e3c] text-white text-[11px] font-black">
                            {rev.rating} <Star className="w-2.5 h-2.5 fill-white" />
                          </span>
                          <span className="font-black text-slate-900 text-xs">
                            {rev.title}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(rev.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>

                      <p className="text-slate-700 leading-relaxed text-xs">
                        {rev.comment}
                      </p>

                      <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500 font-semibold">
                        <span className="flex items-center gap-1 text-slate-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          {rev.user_name || 'Verified Buyer'}
                        </span>
                        <span>•</span>
                        <span className="text-emerald-700 font-bold">Verified Purchase</span>
                      </div>
                    </div>
                  ))}

                  {reviews.length > visibleReviewsCount && (
                    <button
                      onClick={() => setVisibleReviewsCount((p) => p + 4)}
                      className="w-full py-2.5 rounded-lg border border-slate-300 text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      Load More Reviews ({reviews.length - visibleReviewsCount} remaining)
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SIMILAR PRODUCTS CAROUSEL / ROW */}
        {/* ========================================================================= */}
        {similarProducts.length > 0 && (
          <div className="mt-8 bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900">
                Similar Products in {product.subcategory}
              </h2>
              <Link
                to={`/electrical?subcategory=${encodeURIComponent(product.subcategory)}`}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                View All
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 overflow-x-auto pb-2 scrollbar-none">
              {similarProducts.map((sp) => (
                <Link
                  key={sp.id}
                  to={`/electrical/product/${sp.id}`}
                  className="group bg-white rounded-lg border border-slate-200 p-3 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="aspect-square bg-slate-50 rounded-md p-2 mb-2 flex items-center justify-center overflow-hidden">
                    <img
                      src={sp.image_urls[0] || 'https://images.unsplash.com/photo-1558223616-e5d79faebdd6?q=80&w=800&auto=format&fit=crop'}
                      alt={sp.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {sp.name}
                    </h4>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-xs font-black text-slate-900">
                        ₹{sp.price.toLocaleString('en-IN')}
                      </span>
                      {sp.mrp > sp.price && (
                        <span className="text-[10px] text-slate-400 line-through">
                          ₹{sp.mrp.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* WRITE A REVIEW MODAL */}
      {/* ========================================================================= */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                Write Product Review
              </h3>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-200 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="p-5 space-y-4 text-xs">
              {reviewSuccess ? (
                <div className="p-6 text-center space-y-2">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
                  <h4 className="text-sm font-black text-slate-900">Review Submitted!</h4>
                  <p className="text-xs text-slate-500">
                    Thank you for sharing your genuine feedback with Kolkata customers.
                  </p>
                </div>
              ) : (
                <>
                  {reviewError && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 font-semibold">
                      {reviewError}
                    </div>
                  )}

                  {/* Star Rating Picker */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">
                      Overall Rating
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="p-1 rounded hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star
                            className={`w-7 h-7 ${
                              star <= reviewRating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-300'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-slate-600 ml-2">
                        {reviewRating === 5
                          ? 'Excellent (5★)'
                          : reviewRating === 4
                          ? 'Very Good (4★)'
                          : reviewRating === 3
                          ? 'Good (3★)'
                          : reviewRating === 2
                          ? 'Fair (2★)'
                          : 'Poor (1★)'}
                      </span>
                    </div>
                  </div>

                  {/* Review Title */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Review Title / Summary
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Excellent 100% Copper Quality & Fast Delivery"
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-hidden font-medium"
                    />
                  </div>

                  {/* Review Comment */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Detailed Review
                    </label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Describe your installation experience, insulation quality, brand authenticity, or delivery speed..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-hidden font-medium resize-none"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsReviewModalOpen(false)}
                      className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingReview}
                      className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
