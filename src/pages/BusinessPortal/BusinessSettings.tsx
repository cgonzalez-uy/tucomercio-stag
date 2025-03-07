import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../lib/firebase';
import { useBusinesses } from '../../lib/hooks/useBusinesses';
import { usePlans } from '../../lib/hooks/usePlans';
import { useBusinessSettings } from '../../lib/hooks/useBusinessSettings';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Crown, Check, X, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

export function BusinessSettings() {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const { businesses } = useBusinesses();
  const { plans, loading: loadingPlans } = usePlans();
  const { paymentAccounts, loading: loadingAccounts } = useBusinessSettings();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [planStartDate, setPlanStartDate] = useState<Date | null>(null);
  const [showPaymentInfo, setShowPaymentInfo] = useState(false);
  const [error, setError] = useState('');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [success, setSuccess] = useState('');

  // Get business info and current plan
  useEffect(() => {
    const getBusinessInfo = async () => {
      if (user) {
        try {
          const idTokenResult = await user.getIdTokenResult();
          const businessId = idTokenResult.claims.businessId;
          
          if (!businessId) {
            navigate('/portal/login');
            return;
          }

          setBusinessId(businessId);

          // Get business and plan info
          const business = businesses.find(b => b.id === businessId);
          if (business) {
            const plan = plans.find(p => p.id === business.planId);
            setCurrentPlan(plan);
            if (business.planStartDate) {
              setPlanStartDate(new Date(business.planStartDate.seconds * 1000));
            }
          }
        } catch (err) {
          console.error('Error getting business info:', err);
          setError('Error al cargar la información del comercio');
        }
      }
    };

    if (!loadingPlans) {
      getBusinessInfo();
    }
  }, [user, navigate, businesses, plans, loadingPlans]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error('No hay usuario autenticado');
      }

      // Reautenticar al usuario antes de cambiar la contraseña
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Cambiar la contraseña
      await updatePassword(user, newPassword);
      
      setSuccess('Contraseña actualizada correctamente');
      
      // Cerrar sesión y redirigir al login después de 2 segundos
      setTimeout(async () => {
        await auth.signOut();
        navigate('/portal/login');
      }, 2000);
      
    } catch (err: any) {
      console.error('Error changing password:', err);
      
      if (err.code === 'auth/wrong-password') {
        setPasswordError('La contraseña actual es incorrecta');
      } else if (err.code === 'auth/too-many-requests') {
        setPasswordError('Demasiados intentos fallidos. Por favor, intenta más tarde');
      } else if (err.code === 'auth/requires-recent-login') {
        setPasswordError('Por seguridad, debes volver a iniciar sesión antes de cambiar tu contraseña');
      } else {
        setPasswordError('Error al cambiar la contraseña. Por favor, intenta nuevamente');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingPlans || loadingAccounts) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-UY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get all available plans
  const availablePlans = plans.filter(p => p.isActive  && p.price > 0).sort((a, b) => a.price - b.price);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Plan Information */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Plan Actual</h2>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Crown className={cn(
              "h-5 w-5",
              currentPlan?.price > 0 ? "text-yellow-500" : "text-gray-400"
            )} />
          </div>
          <div>
            <p className="font-medium text-gray-900">{currentPlan?.name || 'Plan Básico'}</p>
            <p className="text-sm text-gray-500">
              ${currentPlan?.price || 0}/{currentPlan?.billingPeriod === 'monthly' ? 'mes' : 'año'}
            </p>
            {planStartDate && (
              <p className="text-sm text-gray-500 mt-1">
                Activo desde: {formatDate(planStartDate)}
              </p>
            )}
          </div>
        </div>

       {/* Plan Comparison */}
<div className="mt-8 pt-8 border-t">
  <h3 className="text-lg font-medium text-gray-900 mb-6">Planes Disponibles</h3>
  
  <div className="grid md:grid-cols-2 gap-8">
    {availablePlans.map((plan, index) => {
      const isCurrentPlan = currentPlan?.id === plan.id;
      const isPopular = index === Math.floor(availablePlans.length / 2); // Middle plan

      return (
        <div
          key={plan.id}
          className={cn(
            "relative bg-white rounded-xl shadow-sm transition-all duration-200",
            "hover:shadow-md flex flex-col h-full",
            isPopular && "ring-2 ring-primary md:scale-105",
            isCurrentPlan && "bg-primary/5"
          )}
        >
          {/* Popular badge */}
          {isPopular && (
            <div className="absolute -top-4 left-0 right-0 mx-auto w-fit">
              <span className="bg-primary text-white text-sm font-medium px-3 py-1 rounded-full">
                Más popular
              </span>
            </div>
          )}

          {/* Current plan badge */}
          {isCurrentPlan && (
            <div className="absolute -top-4 left-0 right-0 mx-auto w-fit">
              <span className="bg-primary text-white text-sm font-medium px-3 py-1 rounded-full">
                Plan actual
              </span>
            </div>
          )}

          <div className="p-6 flex flex-col flex-1">
            {/* Plan header */}
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="p-2 rounded-full bg-yellow-100">
                  <Crown className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {plan.name}
              </h3>
              <p className="text-gray-500 text-sm mb-4">
                {plan.description}
              </p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold text-gray-900">
                  ${plan.price}
                </span>
                <span className="text-gray-500">
                  /{plan.billingPeriod === 'monthly' ? 'mes' : 'año'}
                </span>
              </div>
            </div>

            {/* Features list */}
            <div className="flex-1">
              <ul className="space-y-4">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="shrink-0 mt-1">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                    </div>
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action button */}
            <div className="mt-8">
              {isCurrentPlan ? (
                <Button
                  disabled
                  className="w-full bg-primary/10 text-primary border-2 border-primary"
                >
                  Plan actual
                </Button>
              ) : (
                <Button
                  onClick={() => setShowPaymentInfo(true)}
                  className="w-full"
                >
                  Actualizar plan
                </Button>
              )}
            </div>
          </div>
        </div>
      );
    })}
  </div>
</div>


        {/* Payment Info Dialog */}
        {showPaymentInfo && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium text-gray-900">Información de Pago</h3>
                <button
                  onClick={() => setShowPaymentInfo(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Bank Accounts */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Transferencia Bancaria</h4>
                  {paymentAccounts.map((account, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-medium text-gray-900">{account.bank}</p>
                      <p className="text-sm text-gray-600">{account.accountType}</p>
                      <p className="text-sm text-gray-600">Cuenta: {account.accountNumber}</p>
                      <p className="text-sm text-gray-600">Titular: {account.accountName}</p>
                    </div>
                  ))}
                </div>

                {/* MercadoPago Option */}
                {currentPlan?.mercadoPagoLink && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">MercadoPago</h4>
                    <Button
                      asChild
                      className="w-full"
                      variant="outline"
                    >
                      <a 
                        href={currentPlan.mercadoPagoLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        Pagar con MercadoPago
                      </a>
                    </Button>
                  </div>
                )}

                <div className=" p-4 m-4 text-md text-center text-gray-500 bg-primary/10 text-primary border border-primary">
                  Una vez realizado el pago, envíanos el comprobante a través del chat de soporte para activar tu plan Premium.
              </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Password Change */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Cambiar contraseña</h2>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Contraseña actual
            </label>
            <div className="relative">
              <Input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nueva contraseña
            </label>
            <div className="relative">
              <Input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Confirmar nueva contraseña
            </label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {passwordError && (
            <div className="text-sm text-red-500">{passwordError}</div>
          )}

          {success && (
            <div className="text-sm text-green-500">
              {success}
              <br />
              <span className="text-gray-500">
                Serás redirigido al login en unos segundos...
              </span>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || success !== ''}
            className="w-full"
          >
            {loading ? 'Cambiando contraseña...' : 'Cambiar contraseña'}
          </Button>
        </form>
      </div>
    </div>
  );
}