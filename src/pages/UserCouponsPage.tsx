import { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebase';
import { useUsedCoupons } from '../lib/hooks/useUsedCoupons';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';
import { Ticket, ArrowLeft, Store } from 'lucide-react';

export function UserCouponsPage() {
  const [user] = useAuthState(auth);
  const { usedCoupons, loading, error } = useUsedCoupons(user?.uid);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Calculate total pages
  const totalPages = Math.ceil(usedCoupons.length / ITEMS_PER_PAGE);

  // Get coupons for current page
  const paginatedCoupons = usedCoupons.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const formatDate = (timestamp: any) => {
    if (!timestamp || !timestamp.seconds) return '';
    
    try {
      return new Date(timestamp.seconds * 1000).toLocaleDateString('es-UY', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      console.error('Error formatting date:', err);
      return '';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Inicia sesión para ver tus cupones
          </h2>
          <Button asChild>
            <Link to="/">Volver al inicio</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button asChild>
            <Link to="/">Volver al inicio</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center gap-4 mb-8">
          <Link 
            to="/profile"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver a mi perfil</span>
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-8">
          Mis Cupones Utilizados
        </h1>

        {usedCoupons.length === 0 ? (
          <div className="text-center max-w-md mx-auto">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Store className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No has utilizado ningún cupón
            </h2>
            <p className="text-gray-600 mb-6">
              Explora los comercios y utiliza cupones para obtener descuentos
            </p>
            <Button asChild>
              <Link to="/">Explorar comercios</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {paginatedCoupons.map((coupon) => (
              <div
                key={coupon.id}
                className="bg-white p-6 rounded-lg shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Link 
                      to={`/comercios/${coupon.businessId}`}
                      className="text-lg font-medium text-gray-900 hover:text-primary"
                    >
                      {coupon.title}
                    </Link>
                    <div className="flex flex-wrap gap-2 text-sm text-gray-500 mt-2">
                      <span className="font-medium text-primary">
                        {coupon.discount}% de descuento
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="font-medium">
                        Código: {coupon.code}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span>
                        Utilizado el {formatDate(coupon.usedAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Ticket className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium text-gray-500">
                      Cupón utilizado
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-6">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <span className="text-sm text-gray-600">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}