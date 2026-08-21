import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  productData?: {
    name: string;
    description?: string;
    price: number;
    brand?: string;
    image?: string;
    inStock?: boolean;
    rating?: number;
    reviewsCount?: number;
  };
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  keywords,
  image,
  productData
}) => {
  const location = useLocation();

  useEffect(() => {
    // 1. Dynamic Page Titles
    const baseTitle = 'Giriraj Power | Kolkata Electrical, Electronics & Construction Supplies';
    let computedTitle = title || baseTitle;

    if (!title) {
      if (location.pathname === '/') {
        computedTitle = 'Giriraj Power | Buy Electrical, Electronics, Construction & Wiring Services Kolkata';
      } else if (location.pathname.startsWith('/electrical')) {
        computedTitle = 'Buy Electrical Goods & Wiring Materials Online Kolkata | Giriraj Power (60 Min Delivery)';
      } else if (location.pathname.startsWith('/construction')) {
        computedTitle = 'Order Cement, TMT Steel & Construction Materials Online Kolkata | Giriraj Power';
      } else if (location.pathname.startsWith('/services')) {
        computedTitle = 'Certified House Wiring & Real Estate Electrification Contractors Kolkata | Giriraj Power';
      } else if (location.pathname.startsWith('/terms/shipping')) {
        computedTitle = 'Shipping & Delivery Policy | Giriraj Power Kolkata';
      } else if (location.pathname.startsWith('/terms/returns')) {
        computedTitle = 'Refund & Return Policy (7-Day Condition) | Giriraj Power';
      } else if (location.pathname.startsWith('/terms/privacy')) {
        computedTitle = 'Privacy Policy | Giriraj Power';
      } else if (location.pathname.startsWith('/terms/service')) {
        computedTitle = 'Terms of Service | Giriraj Power';
      }
    }

    document.title = computedTitle;

    // 2. Dynamic Meta Description
    const defaultDesc =
      'Giriraj Power: Kolkata’s trusted supplier for electrical goods, modular switches, Polycab & Havells wires, electronics, cement, TMT bars, and certified house & real estate wiring contractors with 60-minute express delivery.';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', description || defaultDesc);
    }

    // 3. Dynamic Meta Keywords
    const defaultKeywords =
      'electrical shop near me, buy electrical goods online Kolkata, electronics hardware store, house wiring contractor, electrical wiring services, modular switches, Polycab wire, Havells cables, Finolex wire, Schneider MCB, distribution board, LED lighting, construction materials Kolkata, cement delivery, UltraTech cement, ACC cement, TMT steel bars, Tata Tiscon rebars, waterproofing chemicals, real estate electrification, licensed electrician Kolkata, Kasba electrical shop, wholesale electrical market Kolkata';
    const metaKey = document.querySelector('meta[name="keywords"]');
    if (metaKey) {
      metaKey.setAttribute('content', keywords || defaultKeywords);
    }

    // 4. Update OpenGraph Tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', computedTitle);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', description || defaultDesc);

    if (image) {
      const ogImg = document.querySelector('meta[property="og:image"]');
      if (ogImg) ogImg.setAttribute('content', image);
    }

    // 5. Inject Dynamic Product Schema if on a product page
    let productScriptTag = document.getElementById('dynamic-product-jsonld');
    if (productData) {
      if (!productScriptTag) {
        productScriptTag = document.createElement('script');
        productScriptTag.id = 'dynamic-product-jsonld';
        productScriptTag.setAttribute('type', 'application/ld+json');
        document.head.appendChild(productScriptTag);
      }

      const productSchema = {
        '@context': 'https://schema.org/',
        '@type': 'Product',
        name: productData.name,
        image: productData.image || 'https://i.imgur.com/uAyxOg2.png',
        description: productData.description || `${productData.name} available at Giriraj Power Kolkata with express delivery.`,
        brand: {
          '@type': 'Brand',
          name: productData.brand || 'Giriraj Power'
        },
        offers: {
          '@type': 'Offer',
          url: window.location.href,
          priceCurrency: 'INR',
          price: productData.price,
          availability: productData.inStock !== false ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          itemCondition: 'https://schema.org/NewCondition',
          seller: {
            '@type': 'Organization',
            name: 'Giriraj Power'
          }
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: productData.rating || 4.8,
          reviewCount: productData.reviewsCount || 42
        }
      };

      productScriptTag.textContent = JSON.stringify(productSchema);
    } else if (productScriptTag) {
      productScriptTag.remove();
    }
  }, [location.pathname, title, description, keywords, image, productData]);

  return null;
};
