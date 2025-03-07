import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Check } from "lucide-react";
import type { Plan } from "../../types/subscription";
import { cn } from "../../lib/utils";

interface PlanPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  plans: Plan[];
}

export function PlanPreviewDialog({ isOpen, onClose, plans }: PlanPreviewDialogProps) {
  const activePlans = plans.filter(plan => plan.isActive);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Vista previa de planes</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {/* Título y descripción */}
          <div className="text-center max-w-3xl mx-auto mb-8 md:mb-12 px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Elige el plan perfecto para tu negocio
            </h2>
            <p className="text-base md:text-lg text-gray-600">
              Todos nuestros planes incluyen acceso a la plataforma y soporte personalizado. 
              Puedes cambiar de plan en cualquier momento.
            </p>
          </div>

          {/* Grid de planes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
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

                  <div className="p-6 md:p-8 flex flex-col flex-1">
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
                            <span className="text-gray-600 text-sm md:text-base">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action button - Always at the bottom */}
                    <div className="mt-8">
                      <Button
                        className={cn(
                          "w-full",
                          plan.price === 0 && "bg-white border-2 border-primary text-primary hover:bg-primary/5"
                        )}
                        variant={plan.price === 0 ? 'outline' : 'default'}
                      >
                        {plan.price === 0 ? 'Comenzar gratis' : 'Seleccionar plan'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Nota al pie */}
          <p className="text-center text-sm text-gray-500 mt-8">
            * Los precios no incluyen IVA
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}