import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Timestamp } from 'firebase/firestore';
import { Percent, Calendar, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PromotionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  promotion?: any;
}

export function PromotionDialog({ isOpen, onClose, onSubmit, promotion }: PromotionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discount: 0,
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    isActive: true
  });

  // Initialize form data when editing
  useEffect(() => {
    if (promotion) {
      const startDate = new Date(promotion.startDate.seconds * 1000);
      const endDate = new Date(promotion.endDate.seconds * 1000);

      setFormData({
        title: promotion.title,
        description: promotion.description,
        discount: promotion.discount,
        startDate: startDate.toISOString().split('T')[0],
        startTime: startDate.toTimeString().slice(0, 5),
        endDate: endDate.toISOString().split('T')[0],
        endTime: endDate.toTimeString().slice(0, 5),
        isActive: promotion.isActive
      });
    } else {
      // Set default values for new promotion
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      setFormData({
        title: '',
        description: '',
        discount: 10, // Default discount of 10%
        startDate: now.toISOString().split('T')[0],
        startTime: now.toTimeString().slice(0, 5),
        endDate: tomorrow.toISOString().split('T')[0],
        endTime: now.toTimeString().slice(0, 5),
        isActive: true
      });
    }
  }, [promotion]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Validate data
      if (!formData.title.trim()) {
        throw new Error('El título es requerido');
      }

      if (!formData.description.trim()) {
        throw new Error('La descripción es requerida');
      }

      if (!formData.discount || formData.discount <= 0 || formData.discount > 100) {
        throw new Error('El descuento debe ser entre 1 y 100');
      }

      // Create timestamps
      const startTimestamp = Timestamp.fromDate(new Date(`${formData.startDate}T${formData.startTime}`));
      const endTimestamp = Timestamp.fromDate(new Date(`${formData.endDate}T${formData.endTime}`));

      // Validate dates
      if (endTimestamp.seconds <= startTimestamp.seconds) {
        throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
      }

      setLoading(true);

      await onSubmit({
        title: formData.title.trim(),
        description: formData.description.trim(),
        discount: Number(formData.discount),
        startDate: startTimestamp,
        endDate: endTimestamp,
        isActive: formData.isActive
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la promoción');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string, time: string) => {
    try {
      return new Date(`${date}T${time}`).toLocaleDateString('es-UY', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {promotion ? 'Editar promoción' : 'Nueva promoción'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej: 20% de descuento en todos los productos"
                maxLength={100}
              />
              <p className="mt-1 text-xs text-gray-500">
                {formData.title.length}/100 caracteres
              </p>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Descripción <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe los detalles de la promoción"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20 p-3"
                rows={3}
                maxLength={250}
              />
              <p className="text-xs text-gray-500">
                {formData.description.length}/250 caracteres
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descuento (%) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min="1"
                max="100"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha inicio <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hora inicio <span className="text-red-500">*</span>
                </label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha fin <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hora fin <span className="text-red-500">*</span>
                </label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
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
                <span className="text-sm font-medium text-gray-700">Promoción activa</span>
              </label>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-md">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}
          </form>

          {/* Preview - Hidden on mobile, shown on lg screens */}
          <div className="hidden lg:block space-y-4">
            <h3 className="font-medium text-gray-900">Vista previa</h3>

            <div className={cn(
              "bg-primary/5 border border-primary/10 rounded-lg p-4",
              "transform hover:scale-[1.02] transition-transform"
            )}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    {formData.title || 'Título de la promoción'}
                  </h4>
                  <p className="text-gray-600 text-sm mb-2">
                    {formData.description || 'Descripción de la promoción'}
                  </p>
                  <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                    <span className="font-medium text-primary">
                      {formData.discount}% de descuento
                    </span>
                    <span className="text-gray-400">•</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Desde {formatDate(formData.startDate, formData.startTime)}
                      </span>
                    </div>
                    <span className="text-gray-400">•</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Hasta {formatDate(formData.endDate, formData.endTime)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="shrink-0">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Percent className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-500">
              <p>Esta es una vista previa de cómo se verá la promoción para tus clientes.</p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-3 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Guardando...' : promotion ? 'Guardar cambios' : 'Crear promoción'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}