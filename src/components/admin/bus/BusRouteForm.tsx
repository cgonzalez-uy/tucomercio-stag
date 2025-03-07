import { useState } from 'react';
import { Button } from '../../ui/button';
import { useBusLines } from '../../../lib/hooks/useBusLines';
import { useBusLineTypes } from '../../../lib/hooks/useBusLineTypes';
import { useBusDestinations } from '../../../lib/hooks/useBusDestinations';
import { ArrowRight, ArrowLeftRight } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface BusRouteFormProps {
  initialData?: {
    lineId: string;
    typeId: string;
    originId: string;
    destinationId: string;
    isActive: boolean;
  };
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function BusRouteForm({ initialData, onSubmit, onCancel }: BusRouteFormProps) {
  const { lines } = useBusLines();
  const { types } = useBusLineTypes();
  const { destinations } = useBusDestinations();
  const [formData, setFormData] = useState({
    lineId: initialData?.lineId || '',
    typeId: initialData?.typeId || '',
    originId: initialData?.originId || '',
    destinationId: initialData?.destinationId || '',
    isActive: initialData?.isActive ?? true
  });
  const [createInverse, setCreateInverse] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filter active items only
  const activeLines = lines.filter(line => line.isActive);
  const activeTypes = types.filter(type => type.isActive);
  const activeDestinations = destinations.filter(dest => dest.isActive);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (!formData.lineId) {
        throw new Error('La línea es requerida');
      }

      if (!formData.typeId) {
        throw new Error('El tipo de línea es requerido');
      }

      if (!formData.originId) {
        throw new Error('El origen es requerido');
      }

      if (!formData.destinationId) {
        throw new Error('El destino es requerido');
      }

      if (formData.originId === formData.destinationId) {
        throw new Error('El origen y el destino no pueden ser iguales');
      }

      setLoading(true);

      // Create main route
      await onSubmit(formData);

      // If createInverse is true, create the inverse route
      if (createInverse) {
        const inverseRoute = {
          ...formData,
          originId: formData.destinationId,
          destinationId: formData.originId
        };
        await onSubmit(inverseRoute);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el recorrido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Line and Type Selection */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Línea <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.lineId}
            onChange={(e) => setFormData({ ...formData, lineId: e.target.value })}
            className={cn(
              "w-full rounded-md border-gray-300 shadow-sm",
              "focus:border-primary focus:ring focus:ring-primary/20",
              "disabled:bg-gray-50 disabled:text-gray-500"
            )}
          >
            <option value="">Seleccionar línea</option>
            {activeLines.map(line => (
              <option key={line.id} value={line.id}>
                {line.code} - {line.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.typeId}
            onChange={(e) => setFormData({ ...formData, typeId: e.target.value })}
            className={cn(
              "w-full rounded-md border-gray-300 shadow-sm",
              "focus:border-primary focus:ring focus:ring-primary/20",
              "disabled:bg-gray-50 disabled:text-gray-500"
            )}
          >
            <option value="">Seleccionar tipo</option>
            {activeTypes.map(type => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Origin and Destination */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Origen <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.originId}
              onChange={(e) => setFormData({ ...formData, originId: e.target.value })}
              className={cn(
                "w-full rounded-md border-gray-300 shadow-sm",
                "focus:border-primary focus:ring focus:ring-primary/20",
                "disabled:bg-gray-50 disabled:text-gray-500"
              )}
            >
              <option value="">Seleccionar origen</option>
              {activeDestinations.map(destination => (
                <option 
                  key={destination.id} 
                  value={destination.id}
                  disabled={destination.id === formData.destinationId}
                >
                  {destination.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-center">
            <ArrowRight className="h-5 w-5 text-gray-400" />
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Destino <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.destinationId}
              onChange={(e) => setFormData({ ...formData, destinationId: e.target.value })}
              className={cn(
                "w-full rounded-md border-gray-300 shadow-sm",
                "focus:border-primary focus:ring focus:ring-primary/20",
                "disabled:bg-gray-50 disabled:text-gray-500"
              )}
            >
              <option value="">Seleccionar destino</option>
              {activeDestinations.map(destination => (
                <option 
                  key={destination.id} 
                  value={destination.id}
                  disabled={destination.id === formData.originId}
                >
                  {destination.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Create Inverse Route Option */}
      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={createInverse}
            onChange={(e) => setCreateInverse(e.target.checked)}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              Crear también el recorrido inverso
            </span>
          </div>
        </label>
        <p className="mt-1 text-sm text-gray-500 ml-6">
          Se creará automáticamente el recorrido en sentido contrario
        </p>
      </div>

      {/* Active Status */}
      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span className="text-sm font-medium text-gray-700">Recorrido activo</span>
        </label>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3">
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
          {loading ? 'Guardando...' : initialData ? 'Guardar cambios' : 'Crear recorrido'}
        </Button>
      </div>
    </form>
  );
}