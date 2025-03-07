import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../lib/firebase';
import { useBusinesses } from '../../lib/hooks/useBusinesses';
import { usePlans } from '../../lib/hooks/usePlans';
import { BusinessLayout } from './BusinessLayout';
import { BusinessDashboard } from './BusinessDashboard';
import { BusinessProfile } from './BusinessProfile';
import { BusinessGallery } from './BusinessGallery';
import { BusinessSettings } from './BusinessSettings';
import { BusinessPlans } from './BusinessPlans';
import { BusinessReviews } from './BusinessReviews';
import { BusinessMessages } from './BusinessMessages';
import { BusinessNotifications } from './BusinessNotifications';
import { BusinessPromotions } from './BusinessPromotions';
import { BusinessCoupons } from './BusinessCoupons';
import { BusinessSupport } from './BusinessSupport';
import { BusinessEvents } from './BusinessEvents';
import { PremiumFeatureMessage } from '../../components/business/PremiumFeatureMessage';

// Define premium features and their messages
const PREMIUM_FEATURES = {
  '/portal/gallery': {
    title: 'Galería de imágenes',
    description: 'Mejora la presencia de tu comercio con una galería de imágenes. Actualiza a Premium para acceder a esta funcionalidad.'
  },
  '/portal/promotions': {
    title: 'Promociones',
    description: 'Crea y gestiona promociones especiales para tus clientes. Actualiza a Premium para acceder a esta funcionalidad.'
  },
  '/portal/coupons': {
    title: 'Cupones de descuento',
    description: 'Ofrece cupones de descuento exclusivos a tus clientes. Actualiza a Premium para acceder a esta funcionalidad.'
  }
};

// Define features restricted for free plan
const FREE_PLAN_RESTRICTED = [
  '/portal/dashboard',
  '/portal/profile',
  '/portal/gallery',
  '/portal/promotions',
  '/portal/coupons',
  '/portal/notifications'
];

export function BusinessPortal() {
  const [user, loading] = useAuthState(auth);
  const navigate = useNavigate();
  const location = useLocation();
  const { businesses } = useBusinesses();
  const { plans } = usePlans();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [planName, setPlanName] = useState<string>('');
  const [isChecking, setIsChecking] = useState(true);

  // Check authentication and plan status
  useEffect(() => {
    const checkAuth = async () => {
      if (!loading) {
        if (!user) {
          navigate('/portal/login');
          return;
        }

        try {
          // Force reload of user claims
          await user.getIdToken(true);
          const idTokenResult = await user.getIdTokenResult();
          const businessId = idTokenResult.claims.businessId;
          
          if (!businessId) {
            await auth.signOut();
            navigate('/portal/login');
            return;
          }

          setBusinessId(businessId);

          // Get business plan
          const business = businesses.find(b => b.id === businessId);
          if (business) {
            const plan = plans.find(p => p.id === business.planId);
            setPlanName(plan?.name || 'Gratis');
          }

          // Redirect to dashboard if at root portal path
          if (location.pathname === '/portal' || location.pathname === '/portal/') {
            navigate('/portal/dashboard');
          }
        } catch (err) {
          console.error('Error checking auth:', err);
          navigate('/portal/login');
        } finally {
          setIsChecking(false);
        }
      }
    };

    checkAuth();
  }, [user, loading, navigate, businesses, plans, location.pathname]);

  if (loading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/portal/login" replace />;
  }

  // Check if current route is restricted based on plan
  const isRouteRestricted = () => {
    if (planName === 'Gratis' && FREE_PLAN_RESTRICTED.includes(location.pathname)) {
      return {
        restricted: true,
        title: 'Funcionalidad no disponible',
        description: 'Esta funcionalidad solo está disponible para planes pagos. Actualiza tu plan para acceder a todas las funcionalidades.'
      };
    }

    if (planName === 'Básico' && Object.keys(PREMIUM_FEATURES).includes(location.pathname)) {
      const feature = PREMIUM_FEATURES[location.pathname as keyof typeof PREMIUM_FEATURES];
      return {
        restricted: true,
        title: feature.title,
        description: feature.description
      };
    }

    return { restricted: false };
  };

  const restriction = isRouteRestricted();
  if (restriction.restricted) {
    return (
      <BusinessLayout>
        <PremiumFeatureMessage
          title={restriction.title}
          description={restriction.description}
        />
      </BusinessLayout>
    );
  }

  return (
    <BusinessLayout>
      <Routes>
        <Route index element={<Navigate to="/portal/dashboard" replace />} />
        <Route path="dashboard" element={<BusinessDashboard />} />
        <Route path="profile" element={<BusinessProfile />} />
        <Route path="gallery" element={<BusinessGallery />} />
        <Route path="settings" element={<BusinessSettings />} />
        <Route path="plans" element={<BusinessPlans />} />
        <Route path="reviews" element={<BusinessReviews />} />
        <Route path="support" element={<BusinessSupport />} />
        <Route path="notifications" element={<BusinessNotifications />} />
        <Route path="promotions" element={<BusinessPromotions />} />
        <Route path="coupons" element={<BusinessCoupons />} />
        <Route path="events" element={<BusinessEvents />} />
        <Route path="*" element={<Navigate to="/portal/dashboard" replace />} />
      </Routes>
    </BusinessLayout>
  );
}