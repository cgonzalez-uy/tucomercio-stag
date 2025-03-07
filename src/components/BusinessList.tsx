import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BusinessCard } from './BusinessCard';
import { useBusinesses } from '../lib/hooks/useBusinesses';
import { useSettings } from '../lib/hooks/useSettings';
import { usePlans } from '../lib/hooks/usePlans';
import { Button } from './ui/button';
import { ChevronDown, Store, Crown } from 'lucide-react';
import { trackSearch, trackFilterUse } from '../lib/analytics';
import { isBusinessOpen } from '../lib/utils';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface BusinessListProps {
  searchTerm: string;
  location: string;
  categories: string[];
  quickFilters: string[];
}

const ITEMS_PER_PAGE = 12; // Show 12 businesses initially (3x4 grid)

export function BusinessList({ searchTerm, location, categories, quickFilters }: BusinessListProps) {
  const { businesses, loading, error } = useBusinesses();
  const { settings: categorySettings } = useSettings('categories');
  const { plans } = usePlans();
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const [businessRatings, setBusinessRatings] = useState<{[key: string]: {avg: number, total: number}}>({});
  const [loadingRatings, setLoadingRatings] = useState(true);

  // Fetch ratings for all businesses
  useEffect(() => {
    const fetchRatings = async () => {
      try {
        setLoadingRatings(true);
        const ratings: {[key: string]: {avg: number, total: number}} = {};

        // Fetch ratings for each business
        await Promise.all(businesses.map(async (business) => {
          const reviewsRef = collection(db, `businesses/${business.id}/reviews`);
          const reviewsSnapshot = await getDocs(reviewsRef);
          const reviews = reviewsSnapshot.docs.map(doc => doc.data());
          
          if (reviews.length > 0) {
            const total = reviews.reduce((sum, review) => sum + review.rating, 0);
            ratings[business.id] = {
              avg: total / reviews.length,
              total: reviews.length
            };
          }
        }));

        setBusinessRatings(ratings);
      } catch (err) {
        console.error('Error fetching ratings:', err);
      } finally {
        setLoadingRatings(false);
      }
    };

    if (businesses.length > 0) {
      fetchRatings();
    }
  }, [businesses]);

  // Track search and filter changes
  useEffect(() => {
    if (searchTerm) {
      trackSearch('business', searchTerm);
    }
    if (location) {
      trackSearch('location', location);
    }
    if (categories.length > 0) {
      trackFilterUse('categories', categories);
    }
    if (quickFilters.length > 0) {
      trackFilterUse('quick_filters', quickFilters);
    }
  }, [searchTerm, location, categories, quickFilters]);

  // Filter businesses based on search criteria and quick filters
  const filteredBusinesses = businesses.filter(business => {
    // Only show active businesses
    if (!business.isActive) return false;

    // Search filter
    const searchMatch = !searchTerm || 
      business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.shortDescription.toLowerCase().includes(searchTerm.toLowerCase());

    // Location filter
    const locationMatch = !location ||
      business.address.toLowerCase().includes(location.toLowerCase());

    // Category filter
    const categoryMatch = categories.length === 0 ||
      business.categories.some(category => categories.includes(category));

    // Quick filters
    if (quickFilters.length > 0) {
      let passesFilters = true;

      for (const filter of quickFilters) {
        switch (filter) {
          case 'Tarjeta de crédito':
            if (!business.paymentMethods.some(method => 
              method.toLowerCase().includes('credito') || 
              method.toLowerCase().includes('debito') || 
              method.toLowerCase().includes('mercadopago')
            )) {
              passesFilters = false;
            }
            break;

          case 'Delivery':
            if (!business.shippingMethods.includes('Delivery')) {
              passesFilters = false;
            }
            break;

          case 'open':
            if (!isBusinessOpen(business.schedule)) {
              passesFilters = false;
            }
            break;

          case 'top':
            const rating = businessRatings[business.id];
            if (!rating || rating.avg < 4) {
              passesFilters = false;
            }
            break;

          case 'popular':
            if (!business.favorites || business.favorites.length < 10) {
              passesFilters = false;
            }
            break;

          case 'premium':
            const plan = plans.find(p => p.id === business.planId);
            if (!plan || plan.name !== 'Premium') {
              passesFilters = false;
            }
            break;
        }

        if (!passesFilters) break;
      }

      if (!passesFilters) return false;
    }

    return searchMatch && locationMatch && categoryMatch;
  });

  // Sort businesses by plan, metrics and filters
  const sortedBusinesses = filteredBusinesses.sort((a, b) => {
    // First sort by plan price
    const planA = plans.find(p => p.id === a.planId);
    const planB = plans.find(p => p.id === b.planId);
    if (planA?.price !== planB?.price) {
      return (planB?.price || 0) - (planA?.price || 0);
    }

    // Then by active quick filters
    if (quickFilters.includes('top')) {
      const ratingA = businessRatings[a.id]?.avg || 0;
      const ratingB = businessRatings[b.id]?.avg || 0;
      if (ratingA !== ratingB) return ratingB - ratingA;
    }

    if (quickFilters.includes('popular')) {
      const popularityDiff = (b.favorites?.length || 0) - (a.favorites?.length || 0);
      if (popularityDiff !== 0) return popularityDiff;
    }

    // Finally by creation date
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  // Get businesses to display based on current display count
  const displayedBusinesses = sortedBusinesses.slice(0, displayCount);
  const hasMore = displayCount < sortedBusinesses.length;

  const loadMore = () => {
    setDisplayCount(prev => prev + ITEMS_PER_PAGE);
  };

  if (loading || loadingRatings) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (sortedBusinesses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Store className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          No se encontraron comercios
        </h2>
        <p className="text-gray-600">
          {searchTerm || location || categories.length > 0 || quickFilters.length > 0
            ? 'Intenta ajustando los filtros de búsqueda'
            : 'No hay comercios disponibles en este momento'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {displayedBusinesses.map((business) => (
          <BusinessCard
            key={business.id}
            id={business.id}
            name={business.name}
            shortDescription={business.shortDescription}
            categories={business.categories.map(categoryName => {
              const category = categorySettings.find(c => c.name === categoryName);
              return {
                name: categoryName,
                color: category?.color || '#3B82F6'
              };
            })}
            address={business.address}
            phone={business.phone}
            image={business.image}
            website={business.website}
            instagram={business.instagram}
            facebook={business.facebook}
            whatsapp={business.whatsapp}
            shippingMethods={business.shippingMethods}
            schedule={business.schedule}
            planId={business.planId}
          />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={loadMore}
            className="group"
          >
            <ChevronDown className="h-4 w-4 mr-2 group-hover:translate-y-0.5 transition-transform" />
            Mostrar más comercios
          </Button>
        </div>
      )}
    </div>
  );
}