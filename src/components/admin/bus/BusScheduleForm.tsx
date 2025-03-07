import { useState } from 'react';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { useBusRoutes } from '../../../lib/hooks/useBusRoutes';
import { useBusLines } from '../../../lib/hooks/useBusLines';
import { useBusLineTypes } from '../../../lib/hooks/useBusLineTypes';
import { useBusDestinations } from '../../../lib/hooks/useBusDestinations';
import { cn } from '../../../lib/utils';

interface BusScheduleFormProps {
  initialData?: {
    routeId: string;
    departureTime: string;
    daysOfWeek: {
      monday: boolean;
      tuesday: boolean;
      wednesday: boolean;
      thursday: boolean;
      friday: boolean;
      saturday: boolean;
      sunday: boolean;
    };
    isActive: boolean;
  };
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function BusScheduleForm({ initialData, onSubmit, onCancel }: BusScheduleFormProps) {
  const { routes } = useBusRoutes();
  const { lines } = useBusLines();
  const { types } = useBusLineTypes();
  const { destinations } = useBusDestinations();
  const [formData, setFormData] = useState({
    routeId: initialData?.routeId || '',
    departureTime: initialData?.departureTime || '',
    daysOfWeek: initialData?.daysOfWeek || {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false
    },
    isActive: initialData?.isActive ?? true
  });
  const [selectedLine, setSelectedLine] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Get active items only
  const activeLines = lines.filter(line => line.isActive);
  const activeTypes = types.filter(type => type.isActive);
  const activeRoutes = routes.filter(route => route.isActive);

  // Filter routes based on selected line and type
  const filteredRoutes = activeRoutes.filter(route => {
    if (selectedLine && route.lineId !== selectedLine) return false;
    if (selectedType && route.typeId !== selectedType) return false;
    return true;
  });

  // Group routes by line for better organization
  const groupedRoutes = filteredRoutes.reduce((acc, route) => {
    const line = lines.find(l => l.id === route.lineId);
    const type = types.find(t => t.id === route.typeId);
    const origin = destinations.find(d => d.id === route.originId);
    const destination = destinations.find(d => d.id === route.destinationId);

    if (!line || !type || !origin || !destination) return acc;

    const key = `${line.id}-${type.id}`;
    if (!acc[key]) {
      acc[key] = {
        line,
        type,
        routes: []
      };
    }

    acc[key].routes.push({
      ...route,
      origin,
      destination
    });

    return acc;
  }, {} as Record<string, { line: any; type: any; routes: any[] }>);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (!formData.routeId) {
        throw new Error('El recorrido es requerido');
      }

      if (!formData.departureTime) {
        throw new Error('La hora de salida es requerida');
      }

      // Ensure at least one day is selected
      const anyDaySelected = Object.values(formData.daysOfWeek).some(day => day);
      if (!anyDaySelected) {
        throw new Error('Debe seleccionar al menos un día de la semana');
      }

      setLoading(true);
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el horario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Line and Type Filters */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filtrar por línea
          </label>
          <select
            value={selectedLine}
            onChange={(e) => {
              setSelectedLine(e.target.value);
              setFormData(prev => ({ ...prev, routeId: '' }));
            }}
            className={cn(
              "w-full rounded-md border-gray-300 shadow-sm",
              "focus:border-primary focus:ring focus:ring-primary/20"
            )}
          >
            <option value="">Todas las líneas</option>
            {activeLines.map(line => (
              <option key={line.id} value={line.id}>
                {line.code} - {line.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filtrar por tipo
          </label>
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setFormData(prev => ({ ...prev, routeId: '' }));
            }}
            className={cn(
              "w-full rounded-md border-gray-300 shadow-sm",
              "focus:border-primary focus:ring focus:ring-primary/20"
            )}
          >
            <option value="">Todos los tipos</option>
            {activeTypes.map(type => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Route Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Recorrido <span className="text-red-500">*</span>
        </label>
        <div className="space-y-4">
          {Object.entries(groupedRoutes).map(([key, group]) => (
            <div key={key} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium text-gray-900">
                  {group.line.code} - {group.line.name}
                </span>
                <span className="text-gray-500">·</span>
                <span className="text-gray-600">{group.type.name}</span>
              </div>
              <div className="space-y-2">
                {group.routes.map(route => (
                  <label key={route.id} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="routeId"
                      value={route.id}
                      checked={formData.routeId === route.id}
                      onChange={(e) => setFormData({ ...formData, routeId: e.target.value })}
                      className="rounded-full border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-600">
                      {route.origin.name} → {route.destination.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Departure Time */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Hora de salida <span className="text-red-500">*</span>
        </label>
        <Input
          type="time"
          value={formData.departureTime}
          onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
          required
        />
      </div>

      {/* Days of Operation */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Días de operación <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries({
            monday: 'Lunes',
            tuesday: 'Martes',
            wednesday: 'Miércoles',
            thursday: 'Jueves',
            friday: 'Viernes',
            saturday: 'Sábado',
            sunday: 'Domingo'
          }).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.daysOfWeek[key as keyof typeof formData.daysOfWeek]}
                onChange={(e) => setFormData({
                  ...formData,
                  daysOfWeek: {
                    ...formData.daysOfWeek,
                    [key]: e.target.checked
                  }
                })}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
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
          <span className="text-sm font-medium text-gray-700">Horario activo</span>
        </label>
      </div>

      {error && (
        <div className="text-sm text-red-500">{error}</div>
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
          {loading ? 'Guardando...' : initialData ? 'Guardar cambios' : 'Crear horario'}
        </Button>
      </div>
    </form>
  );
}