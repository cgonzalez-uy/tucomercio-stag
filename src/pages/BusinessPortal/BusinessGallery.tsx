import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../lib/firebase';
import { GalleryManager } from '../../components/business/GalleryManager';
import { useBusinesses } from '../../lib/hooks/useBusinesses';
import { usePlans } from '../../lib/hooks/usePlans';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PremiumFeatureMessage } from '../../components/business/PremiumFeatureMessage';

export function BusinessGallery() {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const { businesses, updateBusiness } = useBusinesses();
  const { plans, loading: loadingPlans } = usePlans();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [gallery, setGallery] = useState<string[]>([]);
  const [isPremium, setIsPremium] = useState<boolean | null>(null);

  // Get businessId and check premium access
  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        navigate('/portal/login');
        return;
      }

      try {
        const idTokenResult = await user.getIdTokenResult(true);
        const businessId = idTokenResult.claims.businessId;
        
        if (!businessId) {
          navigate('/portal/login');
          return;
        }

        setBusinessId(businessId);

        // Check if business has premium plan
        const business = businesses.find(b => b.id === businessId);
        if (business) {
          const plan = plans.find(p => p.id === business.planId);
          // Check specifically for "Premium" plan name
          setIsPremium(plan?.name === 'Premium');
          setGallery(business.gallery || []);
        }
      } catch (err) {
        console.error('Error checking access:', err);
        setError('Error al obtener la información del comercio');
      } finally {
        setLoading(false);
      }
    };

    if (!loadingPlans) {
      checkAccess();
    }
  }, [user, navigate, businesses, plans, loadingPlans]);

  const handleGalleryUpdate = async (images: string[]) => {
    if (!businessId) return;

    try {
      await updateBusiness(businessId, { gallery: images });
      setGallery(images);
    } catch (err) {
      console.error('Error updating gallery:', err);
      setError('Error al actualizar la galería');
    }
  };

  if (loading || loadingPlans || isPremium === null) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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

  // Show premium message if not premium
  if (!isPremium) {
    return (
      <PremiumFeatureMessage
        title="Galería de imágenes"
        description="Mejora la presencia de tu comercio con una galería de imágenes. Actualiza a Premium para acceder a esta funcionalidad."
      />
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Galería de imágenes</h1>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        {businessId && (
          <GalleryManager
            businessId={businessId}
            images={gallery}
            onUpdate={handleGalleryUpdate}
          />
        )}
      </div>
    </div>
  );
}