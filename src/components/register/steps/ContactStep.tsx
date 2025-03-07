import { Input } from '../../ui/input';
import { Button } from '../../ui/button';

interface ContactStepProps {
  data: {
    email: string;
    whatsapp: string;
    instagram: string;
    facebook: string;
    website: string;
  };
  onChange: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ContactStep({ data, onChange, onNext, onBack }: ContactStepProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl mx-auto">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Correo electrónico <span className="text-gray-500">(opcional)</span>
        </label>
        <Input
          type="email"
          value={data.email || ''}
          onChange={(e) => onChange({ ...data, email: e.target.value })}
          placeholder="Ej: contacto@mitienda.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          WhatsApp <span className="text-gray-500">(opcional)</span>
        </label>
        <Input
          type="tel"
          value={data.whatsapp}
          onChange={(e) => onChange({ ...data, whatsapp: e.target.value })}
          placeholder="Ej: 099123456"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Instagram <span className="text-gray-500">(opcional)</span>
        </label>
        <Input
          type="text"
          value={data.instagram}
          onChange={(e) => onChange({ ...data, instagram: e.target.value })}
          placeholder="Ej: @mitienda"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Facebook <span className="text-gray-500">(opcional)</span>
        </label>
        <Input
          type="text"
          value={data.facebook}
          onChange={(e) => onChange({ ...data, facebook: e.target.value })}
          placeholder="Ej: mitienda"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Sitio web <span className="text-gray-500">(opcional)</span>
        </label>
        <Input
          type="text"
          value={data.website}
          onChange={(e) => onChange({ ...data, website: e.target.value })}
          placeholder="Ej: www.mitienda.com"
        />
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Atrás
        </Button>
        <Button type="submit">
          Continuar
        </Button>
      </div>
    </form>
  );
}