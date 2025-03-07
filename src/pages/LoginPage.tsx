import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword,signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { isSuperAdmin } from '../lib/auth';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Store } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (isSuperAdmin(userCredential.user)) {
        navigate('/superadmin');
      } else {
        await auth.signOut();
        setError('No tienes permisos de administrador');
      }
    } catch (err) {
      setError('Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };
 const handleGoogleAuth = async () => {
      setError('');
      setLoading(true);
  
      try {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
          prompt: 'select_account'
        });
        
        const result = await signInWithPopup(auth, provider);
        if (result.user) {
          if (isSuperAdmin(result.user)) {
            navigate('/superadmin');
          } else {
            await auth.signOut();
            setError('No tienes permisos de administrador');
          }
        }
      } catch (err: any) {
        console.error('Google auth error:', err);
        if (err.code === 'auth/unauthorized-domain') {
          setError('Este dominio no está autorizado para iniciar sesión con Google. Por favor, usa otro método de inicio de sesión.');
        } else if (err.code === 'auth/popup-blocked') {
          setError('El navegador bloqueó la ventana emergente. Por favor, permite las ventanas emergentes e intenta nuevamente.');
        } else if (err.code === 'auth/popup-closed-by-user') {
          setError('Inicio de sesión cancelado');
        } else {
          setError('Error al iniciar sesión con Google');
        }
      } finally {
        setLoading(false);
      }
    };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo y título */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Store className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h2 className="mt-2 text-3xl font-extrabold text-gray-900">
            TuComercio.uy
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Portal de administración
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Correo electrónico
              </label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Correo electrónico"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </Button>
          </div>
          
        </form>
        <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-gray-50 px-2 text-gray-500">
                  O continuar con
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleAuth}
              disabled={loading}
            >
              <img 
                src="https://www.google.com/favicon.ico" 
                alt="Google" 
                className="w-4 h-4 mr-2"
              />
              Google
            </Button>
      </div>

      
    </div>
  );
}