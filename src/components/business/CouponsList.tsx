import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../lib/firebase';
import { useCoupons } from '../../lib/hooks/useCoupons';
import { Button } from '../ui/button';
import { UserAuthModal } from '../auth/UserAuthModal';
import { Ticket, AlertCircle, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface CouponsListProps {
  businessId: string;
  onHasCoupons?: (hasCoupons: boolean) => void;
}

export function CouponsList({ businessId, onHasCoupons }: CouponsListProps) {
  const [user] = useAuthState(auth);
  const { coupons = [], loading, error, useCoupon } = useCoupons(businessId);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [usingCouponId, setUsingCouponId] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [usedCoupons, setUsedCoupons] = useState<string[]>([]);

  // Fetch user's used coupons
  useEffect(() => {
    const fetchUsedCoupons = async () => {
      if (!user) return;

      try {
        const usedCouponsRef = collection(db, 'used_coupons');
        const q = query(
          usedCouponsRef,
          where('userId', '==', user.uid),
          where('businessId', '==', businessId)
        );
        const snapshot = await getDocs(q);
        const usedCouponIds = snapshot.docs.map(doc => doc.data().couponId);
        setUsedCoupons(usedCouponIds);
      } catch (err) {
        console.error('Error fetching used coupons:', err);
      }
    };

    fetchUsedCoupons();
  }, [user, businessId]);

  // Solo mostrar cupones que:
  // 1. Están activos
  // 2. No han terminado aún
  // 3. Ya han comenzado o comienzan hoy
  const activeCoupons = coupons.filter(coupon => {
    if (!coupon.isActive) return false;
    
    const now = Timestamp.now();
    const startDate = coupon.startDate;
    const endDate = coupon.endDate;

    // Verificar que el cupón no haya terminado
    if (endDate.seconds <= now.seconds) return false;

    // Verificar que el cupón haya comenzado o comience hoy
    const startDateDay = new Date(startDate.seconds * 1000).setHours(0, 0, 0, 0);
    const nowDay = new Date(now.seconds * 1000).setHours(0, 0, 0, 0);
    
    return startDateDay <= nowDay;
  });

  useEffect(() => {
    if (onHasCoupons) {
      onHasCoupons(activeCoupons.length > 0);
    }
  }, [activeCoupons.length, onHasCoupons]);

  const handleUseCoupon = async (coupon: any) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      setUsingCouponId(coupon.id);
      await useCoupon(coupon);
      setUsedCoupons(prev => [...prev, coupon.id]);
    } catch (err) {
      console.error('Error using coupon:', err);
      setOperationError(err instanceof Error ? err.message : 'Error al usar el cupón');
    } finally {
      setUsingCouponId(null);
    }
  };

  if (loading || error || activeCoupons.length === 0) {
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
        <Ticket className="h-5 w-5 text-primary" />
        Cupones disponibles
      </h3>

      {operationError && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{operationError}</p>
        </div>
      )}

      <div className="grid gap-4">
        {activeCoupons.map((coupon) => {
          const using = usingCouponId === coupon.id;
          const isUsed = usedCoupons.includes(coupon.id);
          const hasReachedLimit = coupon.currentUses >= coupon.maxUses;
          const remainingUses = coupon.maxUses - coupon.currentUses;

          return (
            <div
              key={coupon.id}
              className={cn(
                "bg-primary/5 border border-primary/10 rounded-lg p-4",
                "transform hover:scale-[1.02] transition-transform",
                (hasReachedLimit || isUsed) && "opacity-75"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    {coupon.title}
                  </h4>
                  <p className="text-gray-600 text-sm mb-2">
                    {coupon.description}
                  </p>
                  <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                    <span className="font-medium text-primary">
                      {coupon.discount}% de descuento
                    </span>
                    <span className="text-gray-400">•</span>
                    <span>
                      Válido hasta el {formatDate(coupon.endDate)}
                    </span>
                  </div>

                  {/* Mostrar estado del cupón */}
                  <div className="mt-2 text-sm">
                    {isUsed ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <Check className="h-4 w-4" />
                        <span>Cupón utilizado</span>
                      </div>
                    ) : hasReachedLimit ? (
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        <span>Este cupón ya alcanzó su límite de {coupon.maxUses} usos</span>
                      </div>
                    ) : (
                      <p className="text-gray-600">
                        ¡Apúrate! Quedan {remainingUses} {remainingUses === 1 ? 'uso' : 'usos'} disponibles
                      </p>
                    )}
                  </div>
                </div>

                {!isUsed && !hasReachedLimit && (
                  <Button
                    onClick={() => handleUseCoupon(coupon)}
                    disabled={using}
                    className="shrink-0"
                  >
                    <Ticket className="h-4 w-4 mr-2" />
                    {using ? 'Usando...' : 'Usar cupón'}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <UserAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}