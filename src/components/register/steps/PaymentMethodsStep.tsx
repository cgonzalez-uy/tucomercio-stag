import { useSettings } from '../../../lib/hooks/useSettings';
import { Button } from '../../ui/button';
import { AlertCircle } from 'lucide-react';

interface PaymentMethodsStepProps {
  data: {
    paymentMethods: string[];
    shippingMethods: string[];
  };
  onChange: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
  onCancel: () => void;
}

export function PaymentMethodsStep({ data, onChange, onNext, onBack, onCancel }: PaymentMethodsStepProps) {
  const { settings: paymentMethods } = useSettings('payment-methods');
  const { settings: shippingMethods } = useSettings('shipping-methods');

  const activePaymentMethods = paymentMethods.filter(method => method.isActive);
  const activeShippingMethods = shippingMethods.filter(method => method.isActive);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;

    // Validar métodos de pago
    if (data.paymentMethods.length === 0) {
      const errorDiv = document.getElementById('payment-error');
      if (errorDiv) {
        errorDiv.style.display = 'flex';
        setTimeout(() => {
          errorDiv.style.display = 'none';
        }, 3000);
      }
      hasError = true;
    }

    // Validar métodos de envío
    if (data.shippingMethods.length === 0) {
      const errorDiv = document.getElementById('shipping-error');
      if (errorDiv) {
        errorDiv.style.display = 'flex';
        setTimeout(() => {
          errorDiv.style.display = 'none';
        }, 3000);
      }
      hasError = true;
    }

    if (!hasError) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-xl mx-auto" noValidate>
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Métodos de pago <span className="text-red-500">*</span>
        </h3>

        {/* Mensaje de error para métodos de pago */}
        <div 
          id="payment-error" 
          className="hidden items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-md text-red-600"
          role="alert"
        >
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">Por favor selecciona al menos un método de pago</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {activePaymentMethods.map((method) => (
            <label 
              key={method.id} 
              className="flex items-center gap-2 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={data.paymentMethods.includes(method.name)}
                onChange={(e) => {
                  const newMethods = e.target.checked
                    ? [...data.paymentMethods, method.name]
                    : data.paymentMethods.filter((m) => m !== method.name);
                  onChange({ ...data, paymentMethods: newMethods });
                  // Ocultar mensaje de error si se selecciona un método
                  const errorDiv = document.getElementById('payment-error');
                  if (errorDiv) {
                    errorDiv.style.display = 'none';
                  }
                }}
                className="rounded border-gray-300 text-primary focus:ring-primary"
                aria-label={`Método de pago ${method.name}`}
              />
              <span className="text-sm text-gray-700">{method.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Métodos de envío <span className="text-red-500">*</span>
        </h3>

        {/* Mensaje de error para métodos de envío */}
        <div 
          id="shipping-error" 
          className="hidden items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-md text-red-600"
          role="alert"
        >
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">Por favor selecciona al menos un método de envío</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {activeShippingMethods.map((method) => (
            <label 
              key={method.id} 
              className="flex items-center gap-2 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={data.shippingMethods.includes(method.name)}
                onChange={(e) => {
                  const newMethods = e.target.checked
                    ? [...data.shippingMethods, method.name]
                    : data.shippingMethods.filter((m) => m !== method.name);
                  onChange({ ...data, shippingMethods: newMethods });
                  // Ocultar mensaje de error si se selecciona un método
                  const errorDiv = document.getElementById('shipping-error');
                  if (errorDiv) {
                    errorDiv.style.display = 'none';
                  }
                }}
                className="rounded border-gray-300 text-primary focus:ring-primary"
                aria-label={`Método de envío ${method.name}`}
              />
              <span className="text-sm text-gray-700">{method.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <div className="space-x-3">
          <Button type="button" variant="outline" onClick={onBack}>
            Atrás
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
        <Button type="submit">
          Continuar
        </Button>
      </div>
    </form>
  );
}