import { Button } from '../ui/button';
import { Store, Users, TrendingUp, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface WelcomeProps {
  onContinue: () => void;
}

export function Welcome({ onContinue }: WelcomeProps) {
  return (
    <div className="min-h-screen flex flex-col pt-24">
      <div className="flex-1 flex items-center justify-center p-4 ">
        <div className="max-w-3xl mx-auto text-center space-y-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
            ¡Bienvenido a Tu Comercio!
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Estás a punto de unirte a la comunidad de comercios locales más grande de Tu Ciudad.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Store className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Visibilidad Total</h3>
              <p className="text-gray-600">
                Destaca tu negocio y llega a más clientes potenciales
              </p>
            </div>

            <div className="p-6 bg-white rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Comunidad Activa</h3>
              <p className="text-gray-600">
                Forma parte de una red de comercios y clientes en crecimiento
              </p>
            </div>

            <div className="p-6 bg-white rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Crece con Nosotros</h3>
              <p className="text-gray-600">
                Herramientas y soporte para impulsar tu negocio
              </p>
            </div>
          </div>

          <div>
            <Button
              size="lg"
              onClick={onContinue}
              className="min-w-[200px]"
            >
              Comenzar registro
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}