import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Percent } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PromotionsListProps {
  businessId: string;
  onHasPromotions?: (hasPromotions: boolean) => void;
}

export function PromotionsList({ businessId, onHasPromotions }: PromotionsListProps) {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const now = Timestamp.now();

    // Get active promotions that:
    // 1. Haven't ended yet
    // 2. Have already started
    // 3. Are active
    const q = query(
      collection(db, 'promotions'),
      where('businessId', '==', businessId),
      where('isActive', '==', true),
      where('endDate', '>', now),
      where('startDate', '<=', now),
      orderBy('startDate', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activePromotions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setPromotions(activePromotions);
      if (onHasPromotions) {
        onHasPromotions(activePromotions.length > 0);
      }
      setLoading(false);
    }, (err) => {
      console.error('Error fetching promotions:', err);
      setError('Error al cargar las promociones');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [businessId, onHasPromotions]);

  if (loading || error || promotions.length === 0) {
    return null;
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp || !timestamp.seconds) return '';
    
    try {
      return new Date(timestamp.seconds * 1000).toLocaleDateString('es-UY', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (err) {
      console.error('Error formatting date:', err);
      return '';
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900 flex items-center gap-2">
        <Percent className="h-5 w-5 text-primary" />
        Promociones activas
      </h3>

      <div className="grid gap-4">
        {promotions.map((promotion) => (
          <div
            key={promotion.id}
            className={cn(
              "bg-primary/5 border border-primary/10 rounded-lg p-4",
              "transform hover:scale-[1.02] transition-transform"
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-1">
                  {promotion.title}
                </h4>
                <p className="text-gray-600 text-sm mb-2">
                  {promotion.description}
                </p>
                <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                  <span className="font-medium text-primary">
                    {promotion.discount}% de descuento
                  </span>
                  <span className="text-gray-400">•</span>
                  <span>
                    Válido hasta el {formatDate(promotion.endDate)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}