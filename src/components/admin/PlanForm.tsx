import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { X } from 'lucide-react';
import type { Plan } from '../../types/subscription';

interface PlanFormProps {
  initialData?: Partial<Plan>;
  onSubmit: (data: Omit<Plan, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
}

export function PlanForm({ initialData, onSubmit, onCancel }: PlanFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    price: initialData?.price || 0,
    billingPeriod: initialData?.billingPeriod || 'monthly',
    features: initialData?.features || [''],
    mercadoPagoLink: initialData?.mercadoPagoLink || '',
    isActive: initialData?.isActive ?? true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.name.trim()) {
        throw new Error('El nombre es requerido');
      }

      if (formData.price < 0) {
        throw new Error('El precio no puede ser negativo');
      }

      if (formData.features.some(f => !f.trim())) {
        throw new Error('Todas las características deben tener contenido');
      }

      // Validate MercadoPago link if price > 0
      if (formData.price > 0 && !formData.mercadoPagoLink) {
        throw new Error('El link de MercadoPago es requerido para planes pagos');
      }

      await onSubmit(formData);
      onCancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el plan');
    } finally {
      setLoading(false);
    }
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((f, i) => i === index ? value : f)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-sm">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nombre <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Descripción <span className="text-gray-500">(opcional)</span>
          </label>
          <textarea
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20"
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Precio <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              min="0"
              step="0.01"
              required
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Período de facturación <span className="text-red-500">*</span>
            </label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20"
              value={formData.billingPeriod}
              onChange={(e) => setFormData({ ...formData, billingPeriod: e.target.value as 'monthly' | 'yearly' })}
            >
              <option value="monthly">Mensual</option>
              <option value="yearly">Anual</option>
            </select>
          </div>
        </div>

        {formData.price > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Link de MercadoPago <span className="text-red-500">*</span>
            </label>
            <Input
              type="url"
              value={formData.mercadoPagoLink}
              onChange={(e) => setFormData({ ...formData, mercadoPagoLink: e.target.value })}
              placeholder="https://mpago.la/..."
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Link de pago de MercadoPago para este plan
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Características <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            {formData.features.map((feature, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  type="text"
                  required
                  value={feature}
                  onChange={(e) => updateFeature(index, e.target.value)}
                  placeholder="Ej: Acceso a todas las funciones"
                />
                {formData.features.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFeature(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={addFeature}
            >
              Agregar característica
            </Button>
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm font-medium text-gray-700">Plan activo</span>
          </label>
        </div>
      </div>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? 'Guardando...' : initialData ? 'Guardar cambios' : 'Crear plan'}
        </Button>
      </div>
    </form>
  );
}