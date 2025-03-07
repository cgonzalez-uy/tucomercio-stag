import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, sendPasswordResetEmail, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Store, ArrowRight, Store as StoreIcon, Menu, X, Eye, EyeOff } from 'lucide-react';
import { trackAuth } from '../lib/analytics';

export function BusinessLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/portal/profile');
      trackAuth('login', 'email'); // Track login de comercio
    } catch (err) {
      setError('Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setResetEmailSent(true);
    } catch (err) {
      setError('Error al enviar el email de recuperación. Verifica tu dirección de correo.');
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
          trackAuth('login', 'google'); // Track auth con Google
          navigate('/portal/profile');
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
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 text-primary hover:opacity-80">
              <Store className="h-6 w-6" />
              <span className="font-semibold">TuComercio.uy</span>
            </Link>

            {/* Navegación desktop */}
            <div className="hidden md:flex items-center gap-4">
              <Button asChild variant="ghost">
                <Link to="/">Ver comercios</Link>
              </Button>
              <Button asChild>
                <Link to="/register" className="flex items-center gap-2">
                  Registrar comercio
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Botón menú móvil */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>

          {/* Menú móvil */}
          {isMobileMenuOpen && (
            <div className="border-t md:hidden py-4 space-y-4">
              <Button asChild variant="ghost" className="w-full justify-start">
                <Link to="/">Ver comercios</Link>
              </Button>
              <Button asChild className="w-full justify-start">
                <Link to="/register" className="flex items-center gap-2">
                  Registrar comercio
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Contenido principal */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {!isResettingPassword ? (
            <>
              {/* Formulario de login */}
              <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <StoreIcon className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Portal de Comercios
                </h2>
                <p className="mt-2 text-gray-600">
                  Accede a tu panel de control
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
                </div>

                {error && (
                  <div className="text-red-500 text-sm">{error}</div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                </Button>
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
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setIsResettingPassword(true)}
                    className="text-sm text-primary hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              {/* Formulario de recuperación de contraseña */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">
                  Recuperar contraseña
                </h2>
                <p className="mt-2 text-gray-600">
                  Ingresa tu email para recibir un enlace de recuperación
                </p>
              </div>

              {resetEmailSent ? (
                <div className="text-center">
                  <p className="text-green-600 mb-4">
                    Se ha enviado un email con las instrucciones para recuperar tu contraseña
                  </p>
                  <Button
                    onClick={() => {
                      setIsResettingPassword(false);
                      setResetEmailSent(false);
                    }}
                  >
                    Volver al login
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  {error && (
                    <div className="text-red-500 text-sm">{error}</div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setIsResettingPassword(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={loading}
                    >
                      {loading ? 'Enviando...' : 'Enviar email'}
                    </Button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-600">
          <p>¿No tienes una cuenta? <Link to="/register" className="text-primary hover:underline">Registra tu comercio</Link></p>
        </div>
      </footer>
    </div>
  );
}