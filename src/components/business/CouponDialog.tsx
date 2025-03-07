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
import { Ticket, Calendar, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CouponDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  coupon?: any;
}

export function CouponDialog({ isOpen, onClose, onSubmit, coupon }: CouponDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    discount: 0,
    maxUses: 100,
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    isActive: true
  });

  // Initialize form data when editing
  useEffect(() => {
    if (coupon) {
      const startDate = new Date(coupon.startDate.seconds * 1000);
      const endDate = new Date(coupon.endDate.seconds * 1000);

      setFormData({
        code: coupon.code,
        title: coupon.title,
        description: coupon.description,
        discount: coupon.discount,
        maxUses: coupon.maxUses,
        startDate: startDate.toISOString().split('T')[0],
        startTime: startDate.toTimeString().slice(0, 5),
        endDate: endDate.toISOString().split('T')[0],
        endTime: endDate.toTimeString().slice(0, 5),
        isActive: coupon.isActive
      });
    } else {
      // Set default values for new coupon
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      setFormData({
        code: '',
        title: '',
        description: '',
        discount: 10, // Default discount of 10%
        maxUses: 100, // Default max uses
        startDate: now.toISOString().split('T')[0],
        startTime: now.toTimeString().slice(0, 5),
        endDate: tomorrow.toISOString().split('T')[0],
        endTime: now.toTimeString().slice(0, 5),
        isActive: true
      });
    }
  }, [coupon]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Validate form
      if (!formData.code.trim()) {
        throw new Error('El código es requerido');
      }

      if (!formData.title.trim()) {
        throw new Error('El título es requerido');
      }

      if (!formData.description.trim()) {
        throw new Error('La descripción es requerida');
      }

      if (!formData.discount || formData.discount <= 0 || formData.discount > 100) {
        throw new Error('El descuento debe ser entre 1 y 100');
      }

      if (!formData.maxUses || formData.maxUses <= 0) {
        throw new Error('El número máximo de usos debe ser mayor a 0');
      }

      // Create timestamps
      const startTimestamp = Timestamp.fromDate(new Date(`${formData.startDate}T${formData.startTime}`));
      const endTimestamp = Timestamp.fromDate(new Date(`${formData.endDate}T${formData.endTime}`));

      // Validate dates
      if (endTimestamp.seconds <= startTimestamp.seconds) {
        throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
      }

      if (endTimestamp.seconds <= Timestamp.now().seconds) {
        throw new Error('La fecha de fin debe ser posterior a la fecha actual');
      }

      setLoading(true);

      await onSubmit({
        code: formData.code.trim().toUpperCase(),
        title: formData.title.trim(),
        description: formData.description.trim(),
        discount: Number(formData.discount),
        maxUses: Number(formData.maxUses),
        startDate: startTimestamp,
        endDate: endTimestamp,
        isActive: formData.isActive
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el cupón');
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
            {coupon ? 'Editar cupón' : 'Nuevo cupón'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="Ej: VERANO2024"
                maxLength={20}
              />
              <p className="mt-1 text-xs text-gray-500">
                {formData.code.length}/20 caracteres
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej: 20% de descuento en tu primera compra"
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
                placeholder="Describe los términos y condiciones del cupón"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20 p-3"
                rows={3}
                maxLength={250}
              />
              <p className="text-xs text-gray-500">
                {formData.description.length}/250 caracteres
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Usos máximos <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min="1"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: Number(e.target.value) })}
                />
              </div>
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
                <span className="text-sm font-medium text-gray-700">Cupón activo</span>
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
                    {formData.title || 'Título del cupón'}
                  </h4>
                  <p className="text-gray-600 text-sm mb-2">
                    {formData.description || 'Descripción del cupón'}
                  </p>
                  <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                    <span className="font-medium text-primary">
                      {formData.discount}% de descuento
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="font-medium">
                      Código: {formData.code || 'CODIGO'}
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
                    <Ticket className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-500">
              <p>Esta es una vista previa de cómo se verá el cupón para tus clientes.</p>
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
            {loading ? 'Guardando...' : coupon ? 'Guardar cambios' : 'Crear cupón'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}