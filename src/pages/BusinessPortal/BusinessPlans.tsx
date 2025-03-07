import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../lib/firebase';
import { useBusinesses } from '../../lib/hooks/useBusinesses';
import { usePlans } from '../../lib/hooks/usePlans';
import { Button } from '../../components/ui/button';
import { Crown, Check, X } from 'lucide-react';
import { cn } from '../../lib/utils';

const PAYMENT_METHODS = [
  {
    bank: "Mi Dinero",
    accountNumber: "123456789",
    accountName: "TuComercio.uy",
    accountType: "Caja de Ahorros"
  },
  {
    bank: "Prex",
    accountNumber: "987654321",
    accountName: "TuComercio.uy",
    accountType: "Cuenta Prex"
  },
  {
    bank: "Itaú",
    accountNumber: "456789123",
    accountName: "TuComercio.uy",
    accountType: "Cuenta Corriente"
  }
];

const MERCADOPAGO_LINK = "https://mpago.la/premium-plan";

const PLAN_FEATURES = {
  basic: [
    "Perfil de comercio básico",
    "Información de contacto",
    "Horarios de atención",
    "Métodos de pago y envío",
    "Reseñas de clientes",
    "Soporte técnico básico"
  ],
  premium: [
    "Todo lo incluido en el plan básico",
    "Galería de imágenes ilimitada",
    "Gestión de promociones",
    "Sistema de cupones de descuento",
    "Respuestas a reseñas",
    "Estadísticas avanzadas",
    "Soporte técnico prioritario",
    "Destacado en búsquedas",
    "Notificaciones a clientes"
  ]
};

export function BusinessPlans() {
  const [user] = useAuthState(auth);
  const { businesses } = useBusinesses();
  const { plans, loading } = usePlans();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [showPaymentInfo, setShowPaymentInfo] = useState(false);

  // Get business info and current plan
  useEffect(() => {
    const getBusinessInfo = async () => {
      if (user) {
        const idTokenResult = await user.getIdTokenResult();
        const businessId = idTokenResult.claims.businessId;
        if (businessId) {
          setBusinessId(businessId);
          const business = businesses.find(b => b.id === businessId);
          if (business) {
            const plan = plans.find(p => p.id === business.planId);
            setCurrentPlan(plan);
          }
        }
      }
    };

    getBusinessInfo();
  }, [user, businesses, plans]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Planes y Suscripción</h1>

      {/* Current Plan */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Plan Actual</h2>
        
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Crown className={cn(
              "h-5 w-5",
              currentPlan?.price > 0 ? "text-yellow-500" : "text-gray-400"
            )} />
          </div>
          <div>
            <p className="font-medium text-gray-900">{currentPlan?.name || 'Plan Básico'}</p>
            <p className="text-sm text-gray-500">
              ${currentPlan?.price || 0}/{currentPlan?.billingPeriod === 'monthly' ? 'mes' : 'año'}
            </p>
          </div>
        </div>

        {currentPlan?.price === 0 && (
          <>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Comparación de Planes</h3>
            
            {/* Plan Comparison */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Basic Plan */}
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Crown className="h-5 w-5 text-gray-400" />
                  <h4 className="text-lg font-medium text-gray-900">Plan Básico</h4>
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">$0</span>
                  <span className="text-gray-500">/mes</span>
                </div>
                <ul className="space-y-3">
                  {PLAN_FEATURES.basic.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Premium Plan */}
              <div className="bg-primary/5 rounded-xl p-6 border-2 border-primary relative">
                <div className="absolute -top-3 right-6 bg-primary text-white text-sm px-3 py-1 rounded-full">
                  Recomendado
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  <h4 className="text-lg font-medium text-gray-900">Plan Premium</h4>
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">$1000</span>
                  <span className="text-gray-500">/mes</span>
                </div>
                <ul className="space-y-3">
                  {PLAN_FEATURES.premium.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Payment Info Dialog */}
            {showPaymentInfo && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg max-w-md w-full p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Información de Pago</h3>
                    <button
                      onClick={() => setShowPaymentInfo(false)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Bank Accounts */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Transferencia Bancaria</h4>
                      {PAYMENT_METHODS.map((method, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg">
                          <p className="font-medium text-gray-900">{method.bank}</p>
                          <p className="text-sm text-gray-600">{method.accountType}</p>
                          <p className="text-sm text-gray-600">Cuenta: {method.accountNumber}</p>
                          <p className="text-sm text-gray-600">Titular: {method.accountName}</p>
                        </div>
                      ))}
                    </div>

                    {/* MercadoPago Option */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">MercadoPago</h4>
                      <Button
                        asChild
                        className="w-full"
                        variant="outline"
                      >
                        <a 
                          href={MERCADOPAGO_LINK} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          Pagar con MercadoPago
                        </a>
                      </Button>
                    </div>

                    <div className="text-sm text-gray-500">
                      <p>Una vez realizado el pago, envíanos el comprobante a través del chat de soporte para activar tu plan Premium.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={() => setShowPaymentInfo(true)}
              disabled={loading}
              className="w-full md:w-auto"
            >
              Actualizar a Premium
            </Button>
          </>
        )}
      </div>
    </div>
  );
}