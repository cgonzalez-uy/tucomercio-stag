import { useState } from 'react';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Plus, Minus, Clock, Clock2 } from 'lucide-react';
import { POI_TYPES, type PoiType } from '../../../types/poi';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';

interface PoiFormProps {
  initialData?: {
    name: string;
    type: PoiType;
    description?: string;
    address: string;
    phones: string[];
    schedule: {
      monday: { isOpen: boolean; hours: string; };
      tuesday: { isOpen: boolean; hours: string; };
      wednesday: { isOpen: boolean; hours: string; };
      thursday: { isOpen: boolean; hours: string; };
      friday: { isOpen: boolean; hours: string; };
      saturday: { isOpen: boolean; hours: string; };
      sunday: { isOpen: boolean; hours: string; };
    };
    isActive: boolean;
  };
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function PoiForm({ initialData, onSubmit, onCancel }: PoiFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    type: initialData?.type || 'other',
    description: initialData?.description || '',
    address: initialData?.address || '',
    phones: initialData?.phones || [''],
    schedule: initialData?.schedule || {
      monday: { isOpen: true, hours: '09:00 - 18:00' },
      tuesday: { isOpen: true, hours: '09:00 - 18:00' },
      wednesday: { isOpen: true, hours: '09:00 - 18:00' },
      thursday: { isOpen: true, hours: '09:00 - 18:00' },
      friday: { isOpen: true, hours: '09:00 - 18:00' },
      saturday: { isOpen: false, hours: '' },
      sunday: { isOpen: false, hours: '' }
    },
    isActive: initialData?.isActive ?? true
  });
  const [isAlwaysOpen, setIsAlwaysOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (!formData.name.trim()) {
        throw new Error('El nombre es requerido');
      }

      if (!formData.address.trim()) {
        throw new Error('La dirección es requerida');
      }

      if (formData.phones.some(p => !p.trim())) {
        throw new Error('Todos los teléfonos deben tener contenido');
      }

      // Si está siempre abierto, actualizar el horario
      const dataToSubmit = {
        ...formData,
        schedule: isAlwaysOpen ? {
          monday: { isOpen: true, hours: '24 horas' },
          tuesday: { isOpen: true, hours: '24 horas' },
          wednesday: { isOpen: true, hours: '24 horas' },
          thursday: { isOpen: true, hours: '24 horas' },
          friday: { isOpen: true, hours: '24 horas' },
          saturday: { isOpen: true, hours: '24 horas' },
          sunday: { isOpen: true, hours: '24 horas' }
        } : formData.schedule
      };

      setLoading(true);
      await onSubmit(dataToSubmit);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const addPhone = () => {
    setFormData(prev => ({
      ...prev,
      phones: [...prev.phones, '']
    }));
  };

  const removePhone = (index: number) => {
    setFormData(prev => ({
      ...prev,
      phones: prev.phones.filter((_, i) => i !== index)
    }));
  };

  const updatePhone = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      phones: prev.phones.map((p, i) => i === index ? value : p)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Nombre <span className="text-red-500">*</span>
        </label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ej: Comisaría 1ra"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Tipo <span className="text-red-500">*</span>
        </label>
        <Select 
          value={formData.type} 
          onValueChange={(value) => setFormData({ ...formData, type: value as PoiType })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un tipo" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(POI_TYPES).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Descripción
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Dirección <span className="text-red-500">*</span>
        </label>
        <Input
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Ej: Av. Principal 123"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Teléfonos <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          {formData.phones.map((phone, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={phone}
                onChange={(e) => updatePhone(index, e.target.value)}
                placeholder="Ej: 099123456"
              />
              {formData.phones.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removePhone(index)}
                  className="shrink-0"
                >
                  <Minus className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={addPhone}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar teléfono
          </Button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Horarios
        </label>

        {/* Opción de siempre abierto */}
        <div className="mb-4">
          <label className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg cursor-pointer hover:bg-primary/10 transition-colors">
            <input
              type="checkbox"
              checked={isAlwaysOpen}
              onChange={(e) => setIsAlwaysOpen(e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <div className="flex items-center gap-2">
              <Clock2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-gray-900">Abierto 24 horas</span>
            </div>
          </label>
        </div>

        {/* Horarios por día - deshabilitado si está siempre abierto */}
        <div className={`space-y-4 ${isAlwaysOpen ? 'opacity-50' : ''}`}>
          {Object.entries({
            monday: 'Lunes',
            tuesday: 'Martes',
            wednesday: 'Miércoles',
            thursday: 'Jueves',
            friday: 'Viernes',
            saturday: 'Sábado',
            sunday: 'Domingo'
          }).map(([day, label]) => (
            <div key={day} className="flex items-center gap-4">
              <label className="flex items-center gap-2 min-w-[200px]">
                <input
                  type="checkbox"
                  checked={isAlwaysOpen || formData.schedule[day as keyof typeof formData.schedule].isOpen}
                  onChange={(e) => !isAlwaysOpen && setFormData({
                    ...formData,
                    schedule: {
                      ...formData.schedule,
                      [day]: {
                        ...formData.schedule[day as keyof typeof formData.schedule],
                        isOpen: e.target.checked
                      }
                    }
                  })}
                  disabled={isAlwaysOpen}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <Input
                  value={isAlwaysOpen ? '24 horas' : formData.schedule[day as keyof typeof formData.schedule].hours}
                  onChange={(e) => !isAlwaysOpen && setFormData({
                    ...formData,
                    schedule: {
                      ...formData.schedule,
                      [day]: {
                        ...formData.schedule[day as keyof typeof formData.schedule],
                        hours: e.target.value
                      }
                    }
                  })}
                  placeholder="Ej: 09:00 - 18:00"
                  disabled={isAlwaysOpen || !formData.schedule[day as keyof typeof formData.schedule].isOpen}
                />
              </div>
            </div>
          ))}
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
          <span className="text-sm font-medium text-gray-700">Activo</span>
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
          {loading ? 'Guardando...' : initialData ? 'Guardar cambios' : 'Crear'}
        </Button>
      </div>
    </form>
  );
}