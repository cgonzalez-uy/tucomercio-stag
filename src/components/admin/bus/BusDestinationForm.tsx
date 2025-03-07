import { useState } from 'react';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';

interface BusDestinationFormProps {
  initialData?: {
    name: string;
    terminal: string;
    description?: string;
    isActive: boolean;
  };
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function BusDestinationForm({ initialData, onSubmit, onCancel }: BusDestinationFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    terminal: initialData?.terminal || '',
    description: initialData?.description || '',
    isActive: initialData?.isActive ?? true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (!formData.name.trim()) {
        throw new Error('El nombre es requerido');
      }

      if (!formData.terminal.trim()) {
        throw new Error('La terminal es requerida');
      }

      setLoading(true);
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el destino');
    } finally {
      setLoading(false);
    }
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
          placeholder="Ej: Terminal Tres Cruces"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Terminal <span className="text-red-500">*</span>
        </label>
        <Input
          value={formData.terminal}
          onChange={(e) => setFormData({ ...formData, terminal: e.target.value })}
          placeholder="Ej: Terminal Tres Cruces"
        />
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
          placeholder="Descripción del destino..."
        />
      </div>

      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span className="text-sm font-medium text-gray-700">Destino activo</span>
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
          {loading ? 'Guardando...' : initialData ? 'Guardar cambios' : 'Crear destino'}
        </Button>
      </div>
    </form>
  );
}