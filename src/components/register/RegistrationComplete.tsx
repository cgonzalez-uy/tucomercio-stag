import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { CheckCircle2 } from 'lucide-react';

export function RegistrationComplete() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900">
          ¡Registro completado con éxito!
        </h2>

        <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
          <p className="text-gray-600">
            Tu comercio ha sido registrado y está siendo revisado por nuestro equipo. 
            Te notificaremos cuando sea aprobado y esté visible en la plataforma.
          </p>

          <div className="text-sm text-gray-500">
            Este proceso puede tomar hasta 24 horas hábiles.
          </div>
        </div>

        <Button asChild className="w-full">
          <Link to="/">Volver al inicio</Link>
        </Button>
      </div>
    </div>
  );
}