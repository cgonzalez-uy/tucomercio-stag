import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBusinesses } from '../lib/hooks/useBusinesses';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { createBusinessUser } from '../lib/business-auth';
import { ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react';

export function BusinessPortalSetup() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getBusiness, updateBusiness } = useBusinesses();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState<{email: string, password: string} | null>(null);

  const business = getBusiness(id || '');

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Comercio no encontrado
          </h2>
          <Button asChild>
            <a href="/superadmin/businesses">Volver a comercios</a>
          </Button>
        </div>
      </div>
    );
  }

  const handleSetupPortal = async () => {
    try {
      if (!password) {
        setError('Debes establecer una contraseña');
        return;
      }

      if (password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres');
        return;
      }

      setLoading(true);
      setError('');

      // Crear usuario del comercio con la contraseña personalizada
      const userCredentials = await createBusinessUser(business.email || '', business.id, password);
      
      // Actualizar el comercio con acceso al portal
      await updateBusiness(business.id, { hasPortalAccess: true });
      
      // Mostrar las credenciales
      setCredentials(userCredentials);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al configurar el portal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/superadmin/businesses')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a comercios
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900">
            Configurar Portal de Comercio
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* Información del comercio */}
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">
              {business.name}
            </h2>
            <p className="text-gray-600">{business.email}</p>
          </div>

          {/* Requisitos */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Requisitos</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 
                  className={business.isActive ? 'text-green-500' : 'text-gray-300'} 
                />
                <span className={business.isActive ? 'text-gray-900' : 'text-gray-500'}>
                  Comercio activo
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 
                  className={business.email ? 'text-green-500' : 'text-gray-300'} 
                />
                <span className={business.email ? 'text-gray-900' : 'text-gray-500'}>
                  Email configurado
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 
                  className={business.planId ? 'text-green-500' : 'text-gray-300'} 
                />
                <span className={business.planId ? 'text-gray-900' : 'text-gray-500'}>
                  Plan seleccionado
                </span>
              </div>
            </div>
          </div>

          {/* Configuración de contraseña */}
          {!credentials && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Contraseña del portal</h3>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa la contraseña"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-sm text-gray-500">
                La contraseña debe tener al menos 6 caracteres.
              </p>
            </div>
          )}

          {/* Credenciales generadas */}
          {credentials && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-green-900 mb-2">
                Acceso configurado exitosamente
              </h3>
              <div className="space-y-2 text-green-800">
                <p>Email: {credentials.email}</p>
                <p>Contraseña: {credentials.password}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          {/* Acciones */}
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/superadmin/businesses')}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSetupPortal}
              disabled={loading || !business.isActive || !business.email || !business.planId || business.hasPortalAccess}
            >
              {loading ? 'Configurando...' : 'Configurar acceso'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}