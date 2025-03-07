import { usePlans } from '../lib/hooks/usePlans';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';
import { Check, ArrowLeft, Store } from 'lucide-react';
import { cn } from '../lib/utils';

export function PlansPage() {
  const { plans, loading } = usePlans();
  const activePlans = plans.filter(plan => plan.isActive);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link 
              to="/"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Volver al inicio</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Title Section */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-primary/10 rounded-full">
              <Store className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Planes para tu Negocio
          </h1>
          <p className="text-xl text-gray-600">
            Elige el plan perfecto para hacer crecer tu negocio. Todos nuestros planes incluyen acceso a la plataforma y soporte personalizado.
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
                  isPopular && "ring-2 ring-primary md:scale-105 md:-translate-y-1"
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
                    <p className="text-gray-500 text-sm mb-4 min-h-[40px]">
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

                  {/* Action button - Always at the bottom */}
                  <div className="mt-8">
                    <Button
                      asChild
                      className={cn(
                        "w-full",
                        plan.price === 0 && "bg-white border-2 border-primary text-primary hover:bg-primary/5"
                      )}
                      variant={plan.price === 0 ? 'outline' : 'default'}
                    >
                      <Link to="/register">
                        {plan.price === 0 ? 'Comenzar gratis' : 'Seleccionar plan'}
                      </Link>
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
            * Los precios no incluyen IVA
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