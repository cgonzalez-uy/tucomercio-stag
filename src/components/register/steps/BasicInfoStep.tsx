import { useState } from 'react';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

interface BasicInfoStepProps {
  data: {
    name: string;
    shortDescription: string;
    description: string;
    address: string;
    phone: string;
    email: string;
  };
  onChange: (data: any) => void;
  onNext: () => void;
  onCancel: () => void;
}

export function BasicInfoStep({ data, onChange, onNext, onCancel }: BasicInfoStepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validar todos los campos requeridos
    const form = e.target as HTMLFormElement;
    let isValid = true;

    // Validar nombre
    if (!data.name.trim()) {
      const input = form.querySelector('input[name="name"]') as HTMLInputElement;
      input.setCustomValidity('Por favor ingresa el nombre de tu comercio');
      input.reportValidity();
      isValid = false;
      return;
    }

    // Validar descripción breve
    if (!data.shortDescription.trim()) {
      const input = form.querySelector('input[name="shortDescription"]') as HTMLInputElement;
      input.setCustomValidity('Por favor ingresa una descripción breve de tu comercio');
      input.reportValidity();
      isValid = false;
      return;
    }

    // Validar descripción completa
    if (!data.description.trim()) {
      const textarea = form.querySelector('textarea[name="description"]') as HTMLTextAreaElement;
      textarea.setCustomValidity('Por favor ingresa una descripción completa de tu comercio');
      textarea.reportValidity();
      isValid = false;
      return;
    }

    // Validar dirección
    if (!data.address.trim()) {
      const input = form.querySelector('input[name="address"]') as HTMLInputElement;
      input.setCustomValidity('Por favor ingresa la dirección de tu comercio');
      input.reportValidity();
      isValid = false;
      return;
    }

    // Validar teléfono
    if (!data.phone.trim()) {
      const input = form.querySelector('input[name="phone"]') as HTMLInputElement;
      input.setCustomValidity('Por favor ingresa un número de teléfono');
      input.reportValidity();
      isValid = false;
      return;
    }

    // Validar formato del teléfono
    const phoneRegex = /^[0-9]{8,9}$/;
    if (!phoneRegex.test(data.phone.trim())) {
      const input = form.querySelector('input[name="phone"]') as HTMLInputElement;
      input.setCustomValidity('El número de teléfono debe tener 8 o 9 dígitos sin espacios ni guiones');
      input.reportValidity();
      isValid = false;
      return;
    }

    // Validar email si se proporciona
    if (data.email.trim()) {
      try {
        setLoading(true);
        // Buscar comercios con el mismo email
        const businessesRef = collection(db, 'businesses');
        const q = query(businessesRef, where('email', '==', data.email.trim()));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          setError('Este correo electrónico ya está registrado. Por favor, utiliza otro correo.');
          return;
        }
      } catch (err) {
        console.error('Error checking email:', err);
        setError('Error al verificar el correo electrónico. Por favor, intenta nuevamente.');
        return;
      } finally {
        setLoading(false);
      }
    }

    if (isValid) {
      onNext();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // Limpiar mensaje de error cuando el usuario empieza a escribir
    e.target.setCustomValidity('');
    setError(null);
    
    const { name, value } = e.target;
    onChange({ ...data, [name]: value });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl mx-auto" noValidate>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Nombre del comercio <span className="text-red-500">*</span>
        </label>
        <Input
          type="text"
          name="name"
          required
          value={data.name}
          onChange={handleInputChange}
          placeholder="Ej: Mi Tienda"
          aria-label="Nombre del comercio"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Descripción breve <span className="text-red-500">*</span>
          <span className="text-sm text-gray-500 font-normal"> (máx. 150 caracteres)</span>
        </label>
        <Input
          type="text"
          name="shortDescription"
          required
          maxLength={150}
          value={data.shortDescription}
          onChange={handleInputChange}
          placeholder="Una breve descripción de tu comercio"
          aria-label="Descripción breve"
        />
        <p className="mt-1 text-sm text-gray-500">
          {data.shortDescription.length}/150 caracteres
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Descripción completa <span className="text-red-500">*</span>
          <span className="text-sm text-gray-500 font-normal"> (máx. 350 caracteres)</span>
        </label>
        <textarea
          name="description"
          required
          maxLength={350}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20"
          rows={4}
          value={data.description}
          onChange={handleInputChange}
          placeholder="Describe tu comercio con más detalle"
          aria-label="Descripción completa"
        />
        <p className="mt-1 text-sm text-gray-500">
          {data.description.length}/350 caracteres
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Dirección <span className="text-red-500">*</span>
        </label>
        <Input
          type="text"
          name="address"
          required
          value={data.address}
          onChange={handleInputChange}
          placeholder="Ej: Av. Principal 123"
          aria-label="Dirección"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Teléfono <span className="text-red-500">*</span>
        </label>
        <Input
          type="tel"
          name="phone"
          required
          value={data.phone}
          onChange={handleInputChange}
          placeholder="Ej: 099123456"
          aria-label="Teléfono"
          pattern="[0-9]{8,9}"
        />
        <p className="mt-1 text-sm text-gray-500">
          Ingresa un número de teléfono válido sin espacios ni guiones (8 o 9 dígitos)
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Correo electrónico <span className="text-gray-500">(opcional)</span>
        </label>
        <Input
          type="email"
          name="email"
          value={data.email}
          onChange={handleInputChange}
          placeholder="contacto@comercio.com"
          aria-label="Correo electrónico"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Verificando...' : 'Continuar'}
        </Button>
      </div>
    </form>
  );
}