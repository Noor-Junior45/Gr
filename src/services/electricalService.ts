import { supabase } from '../lib/supabaseClient';
import { ElectricalProduct, ProductReview, FilterState, SortOption } from '../types/electrical';
import { INITIAL_PRODUCTS } from '../data/products';

/**
 * Transforms legacy or initial products to standard ElectricalProduct format
 */
export function transformToElectricalProduct(item: any): ElectricalProduct {
  const price = Number(item.price || 0);
  const mrp = Number(item.mrp || item.originalPrice || item.original_price || (price * 1.15));
  const discount_percent = Number(
    item.discount_percent ||
    item.discountPercentage ||
    (mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0)
  );

  let image_urls: string[] = [];
  if (Array.isArray(item.image_urls) && item.image_urls.length > 0) {
    image_urls = item.image_urls;
  } else if (item.image) {
    image_urls = [
      item.image,
      'https://images.unsplash.com/photo-1558223616-e5d79faebdd6?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1544724559-562244955743?q=80&w=800&auto=format&fit=crop'
    ];
  } else {
    image_urls = ['https://images.unsplash.com/photo-1558223616-e5d79faebdd6?q=80&w=800&auto=format&fit=crop'];
  }

  return {
    id: String(item.id),
    name: item.name || 'Electrical Product',
    brand: item.brand || 'Giriraj Genuine',
    category: item.category || 'Electrical',
    subcategory: item.subcategory || item.subCategory || 'General',
    price,
    mrp,
    discount_percent,
    description: item.description || 'High-grade electrical material certified for heavy residential and commercial installations.',
    specifications: typeof item.specifications === 'object' && item.specifications !== null 
      ? item.specifications 
      : {
          "General": {
            "Brand": item.brand || 'Giriraj Genuine',
            "Category": item.category || 'Electrical',
            "Sub-Category": item.subCategory || 'Electrical Supplies'
          },
          "Specifications": item.specs || {
            "Quality Grade": "100% Electrolytic Pure",
            "Certification": "IS / ISI Standard"
          },
          "Warranty": {
            "Summary": "Manufacturer Genuine Replacement"
          }
        },
    stock_quantity: Number(item.stock_quantity ?? item.stockCount ?? 50),
    image_urls,
    rating_avg: Number(item.rating_avg || item.rating || 0),
    rating_count: Number(item.rating_count || item.reviewsCount || 0),
    created_at: item.created_at || new Date().toISOString()
  };
}

/**
 * Fetch electrical products with STRICT Supabase query (Strict Database Mode)
 */
export async function fetchElectricalProducts(
  filters?: FilterState,
  sort: SortOption = 'popularity',
  searchQuery: string = ''
): Promise<{ products: ElectricalProduct[]; total: number }> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*');

    if (!error && data) {
      let productsList = data
        .filter((row) => {
          const cat = (row.category || '').toLowerCase();
          return !cat || cat.includes('electrical') || cat.includes('wire') || cat.includes('cable') || cat.includes('switch');
        })
        .map(transformToElectricalProduct);

      // Apply filters
      if (filters?.subcategories && filters.subcategories.length > 0) {
        productsList = productsList.filter((p) => filters.subcategories.includes(p.subcategory));
      }

      if (filters?.brands && filters.brands.length > 0) {
        productsList = productsList.filter((p) => filters.brands.includes(p.brand));
      }

      if (filters?.minPrice !== undefined && filters.minPrice > 0) {
        productsList = productsList.filter((p) => p.price >= filters.minPrice!);
      }

      if (filters?.maxPrice !== undefined && filters.maxPrice > 0) {
        productsList = productsList.filter((p) => p.price <= filters.maxPrice!);
      }

      if (filters?.minRating !== undefined && filters.minRating > 0) {
        productsList = productsList.filter((p) => p.rating_avg >= filters.minRating!);
      }

      if (filters?.minDiscount !== undefined && filters.minDiscount > 0) {
        productsList = productsList.filter((p) => p.discount_percent >= filters.minDiscount!);
      }

      if (filters?.inStockOnly) {
        productsList = productsList.filter((p) => p.stock_quantity > 0);
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        productsList = productsList.filter((p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.subcategory.toLowerCase().includes(q)
        );
      }

      // Sort order
      switch (sort) {
        case 'price_asc':
          productsList.sort((a, b) => a.price - b.price);
          break;
        case 'price_desc':
          productsList.sort((a, b) => b.price - a.price);
          break;
        case 'newest':
          productsList.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
          break;
        case 'rating':
          productsList.sort((a, b) => b.rating_avg - a.rating_avg);
          break;
        case 'popularity':
        default:
          productsList.sort((a, b) => b.rating_count - a.rating_count);
          break;
      }

      return { products: productsList, total: productsList.length };
    }
  } catch (err) {
    console.warn('Supabase electrical products query error:', err);
  }

  return { products: [], total: 0 };
}

/**
 * Fetch a single electrical product by ID (Strict Database Mode)
 */
export async function fetchElectricalProductById(id: string): Promise<ElectricalProduct | null> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (!error && data) {
      return transformToElectricalProduct(data);
    }
  } catch (err) {
    console.warn('Supabase product by id fetch error:', err);
  }

  return null;
}

/**
 * Fetch similar products by subcategory
 */
export async function fetchSimilarElectricalProducts(
  currentProductId: string,
  subcategory: string,
  limit: number = 6
): Promise<ElectricalProduct[]> {
  const { products } = await fetchElectricalProducts();

  const sameSub = products.filter(
    (p) => String(p.id) !== String(currentProductId) && p.subcategory.toLowerCase() === subcategory.toLowerCase()
  );

  if (sameSub.length >= limit) {
    return sameSub.slice(0, limit);
  }

  // If fewer than limit in same subcategory, supplement with other electrical products
  const others = products.filter(
    (p) => String(p.id) !== String(currentProductId) && p.subcategory.toLowerCase() !== subcategory.toLowerCase()
  );

  return [...sameSub, ...others].slice(0, limit);
}

/**
 * Fetch reviews for a product from Supabase `reviews` table
 */
export async function fetchProductReviews(productId: string): Promise<ProductReview[]> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      return data.map((r) => ({
        id: r.id,
        product_id: r.product_id,
        user_id: r.user_id,
        user_name: r.user_name || 'Verified Buyer',
        rating: Number(r.rating || 5),
        title: r.title || '',
        comment: r.comment || '',
        images: r.images || [],
        created_at: r.created_at || new Date().toISOString()
      }));
    }
  } catch (err) {
    console.warn('Supabase reviews query notice:', err);
  }

  // Return empty list if no genuine customer reviews yet
  return [];
}

/**
 * Submit a customer review to Supabase `reviews` table
 */
export async function submitProductReview(reviewData: {
  product_id: string;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
}): Promise<{ success: boolean; review?: ProductReview; error?: string }> {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user?.id) {
      return { success: false, error: 'Please log in with Google or Phone to post your review.' };
    }

    const userId = authData.user.id;
    const userMeta = authData.user.user_metadata || {};
    const userName = userMeta.full_name || userMeta.name || authData.user.email?.split('@')[0] || 'Verified Buyer';

    const payload = {
      product_id: reviewData.product_id,
      user_id: userId,
      user_name: userName,
      rating: Math.max(1, Math.min(5, Math.round(reviewData.rating))),
      title: reviewData.title.trim(),
      comment: reviewData.comment.trim(),
      images: reviewData.images || []
    };

    const { data, error } = await supabase
      .from('reviews')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Supabase review insert error:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      review: {
        id: data.id,
        product_id: data.product_id,
        user_id: data.user_id,
        user_name: data.user_name || userName,
        rating: data.rating,
        title: data.title,
        comment: data.comment,
        images: data.images || [],
        created_at: data.created_at
      }
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Review submit error:', msg);
    return { success: false, error: msg };
  }
}
