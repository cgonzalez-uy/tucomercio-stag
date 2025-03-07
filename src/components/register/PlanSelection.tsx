import { useState } from 'react';
import { Check, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { usePlans } from '../../lib/hooks/usePlans';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface PlanSelectionProps {
  formData: any;
  onPlanSelected: (planId: string) => void;
  onBack: () => void;
}

export function PlanSelection({ formData, onPlanSelected, onBack }: PlanSelectionProps) {
  const { plans, loading } = usePlans();
  const [registering, setRegistering] = useState(false);
  const activePlans = plans.filter(plan => plan.isActive);

  const handlePlanSelect = async (planId: string) => {
    setRegistering(true);
    await onPlanSelected(planId);
    setRegistering(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-lg font-medium text-gray-900">Cargando planes...</p>
        </div>
      </div>
    );
  }

  if (registering) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
                Registrando tu comercio
              </h2>
              <p className="text-base text-gray-600 max-w-sm mx-auto">
                Por favor espera mientras procesamos tu registro...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver al formulario</span>
          </Button>
        </div>

        {/* Title Section */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Elige el plan perfecto para tu negocio
          </h2>
          <p className="text-lg text-gray-600">
            Todos nuestros planes incluyen acceso a la plataforma y soporte personalizado. 
            Puedes cambiar de plan en cualquier momento.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {activePlans.map((plan, index) => {
            const isPopular = index === 1; // Middle plan is usually the popular one
            return (
              <div
                key={plan.id}
                className={cn(
                  "relative bg-white rounded-2xl shadow-sm transition-all duration-200 hover:shadow-lg flex flex-col h-full",
                  isPopular && "ring-2 ring-primary md:scale-105"
                )}
              >
                {/* Popular badge */}
                {isPopular && (
                  <div className="absolute -top-4 left-0 right-0 mx-auto w-fit">
                    <span className="bg-primary text-white text-sm font-medium px-3 py-1 rounded-full">
                      Más popular
                    </span>
                  </div>
                )}

                <div className="p-8 flex flex-col flex-1">
                  {/* Plan header */}
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-gray-500 text-sm mb-4">
                      {plan.description}
                    </p>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold text-gray-900">
                        ${plan.price}
                      </span>
                      <span className="text-gray-500">
                        /{plan.billingPeriod === 'monthly' ? 'mes' : 'año'}
                      </span>
                    </div>
                  </div>

                  {/* Features list */}
                  <div className="flex-1">
                    <ul className="space-y-4">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="shrink-0 mt-1">
                            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                              <Check className="h-3 w-3 text-primary" />
                            </div>
                          </div>
                          <span className="text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action button */}
                  <div className="mt-8">
                    <Button
                      onClick={() => handlePlanSelect(plan.id)}
                      className={cn(
                        "w-full",
                        plan.price === 0 && "bg-white border-2 border-primary text-primary hover:bg-primary/5"
                      )}
                      variant={plan.price === 0 ? 'outline' : 'default'}
                      disabled={registering}
                    >
                      {plan.price === 0 ? 'Comenzar gratis' : 'Seleccionar plan'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-sm text-gray-500">
            * Los precios incluyen IVA
          </p>
          <p className="text-sm text-gray-500 mt-2">
            ¿Tienes dudas sobre los planes?{' '}
            <Link to="/help" className="text-primary hover:underline">
              Consulta nuestro centro de ayuda
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}