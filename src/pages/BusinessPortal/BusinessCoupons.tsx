import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../lib/firebase';
import { useCoupons } from '../../lib/hooks/useCoupons';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Ticket, Plus, Edit2, Trash2, Power, Calendar, Eye, Search, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Tooltip } from '../../components/ui/tooltip';
import { CouponDialog } from '../../components/business/CouponDialog';
import { DeleteCouponDialog } from '../../components/business/DeleteCouponDialog';
import { CouponPreviewDialog } from '../../components/business/CouponPreviewDialog';

export function BusinessCoupons() {
  const [user] = useAuthState(auth);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const { coupons = [], loading: couponsLoading, error: couponsError, createCoupon, updateCoupon, deleteCoupon } = useCoupons(businessId);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);
  const [couponToDelete, setCouponToDelete] = useState<any>(null);
  const [previewCoupon, setPreviewCoupon] = useState<any>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Get businessId from user claims
  useEffect(() => {
    const getBusinessId = async () => {
      if (user) {
        try {
          const idTokenResult = await user.getIdTokenResult();
          if (idTokenResult.claims.businessId) {
            setBusinessId(idTokenResult.claims.businessId as string);
          }
        } catch (err) {
          console.error('Error getting business ID:', err);
          setOperationError('Error al obtener la información del comercio');
        }
      }
    };

    getBusinessId();
  }, [user]);

  // Filter coupons based on search term
  const filteredCoupons = coupons.filter(coupon => 
    !searchTerm || 
    coupon.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coupon.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coupon.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (timestamp: any) => {
    if (!timestamp || !timestamp.seconds) return '';
    
    try {
      return new Date(timestamp.seconds * 1000).toLocaleDateString('es-UY', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      console.error('Error formatting date:', err);
      return '';
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      setOperationError(null);
      await updateCoupon(id, { isActive: !currentStatus });
    } catch (err) {
      console.error('Error toggling coupon status:', err);
      setOperationError('Error al cambiar el estado del cupón');
    }
  };

  const handleEdit = (coupon: any) => {
    setOperationError(null);
    setEditingCoupon(coupon);
    setShowDialog(true);
  };

  const handleDelete = async () => {
    if (!couponToDelete) return;

    try {
      setOperationError(null);
      await deleteCoupon(couponToDelete.id);
      setCouponToDelete(null);
    } catch (err) {
      console.error('Error deleting coupon:', err);
      setOperationError('Error al eliminar el cupón');
    }
  };

  const handleSubmit = async (data: any) => {
    if (!businessId) {
      setOperationError('Error de autenticación. Por favor, vuelve a iniciar sesión.');
      return;
    }

    try {
      setOperationError(null);
      if (editingCoupon) {
        await updateCoupon(editingCoupon.id, data);
      } else {
        await createCoupon(data);
      }
      setShowDialog(false);
      setEditingCoupon(null);
    } catch (err) {
      console.error(editingCoupon ? 'Error updating coupon:' : 'Error creating coupon:', err);
      setOperationError(err instanceof Error ? err.message : 'Error al guardar el cupón');
      throw err;
    }
  };

  if (couponsLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Debes iniciar sesión para acceder a esta página</p>
      </div>
    );
  }

  if (!businessId) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">No se encontró información del comercio</p>
      </div>
    );
  }

  if (couponsError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{couponsError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Ticket className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Cupones</h2>
            <p className="text-sm text-gray-500">
              {filteredCoupons.length} {filteredCoupons.length === 1 ? 'cupón' : 'cupones'}
            </p>
          </div>
        </div>
        <Button 
          onClick={() => {
            setOperationError(null);
            setEditingCoupon(null);
            setShowDialog(true);
          }} 
          className="w-full sm:w-auto flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nuevo cupón
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar cupones..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {operationError && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {operationError}
        </div>
      )}

      <div className="grid gap-4">
        {filteredCoupons.length === 0 ? (
          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Ticket className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No se encontraron cupones' : 'No hay cupones activos'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Crea tu primer cupón de descuento para tus clientes'}
            </p>
            <Button 
              onClick={() => {
                setOperationError(null);
                setEditingCoupon(null);
                setShowDialog(true);
              }}
            >
              Crear cupón
            </Button>
          </div>
        ) : (
          filteredCoupons.map((coupon) => (
            <div
              key={coupon.id}
              className="bg-white rounded-lg border border-gray-200 hover:border-primary/20 hover:shadow-md transition-all duration-200"
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-medium text-gray-900">
                        {coupon.title}
                      </h3>
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        coupon.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      )}>
                        {coupon.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{coupon.description}</p>
                    <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                      <span className="font-medium text-primary">
                        {coupon.discount}% de descuento
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="font-medium">
                        Código: {coupon.code}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span>
                        {coupon.currentUses} de {coupon.maxUses} usos
                      </span>
                      <span className="text-gray-400">•</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {formatDate(coupon.startDate)}
                        </span>
                      </div>
                      <span className="text-gray-400">→</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {formatDate(coupon.endDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Actions */}
                <div className="grid grid-cols-2 gap-2 sm:hidden mt-4 pt-4 border-t">
                  <Button
                    onClick={() => setPreviewCoupon(coupon)}
                    variant="outline"
                    className="w-full"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver
                  </Button>

                  <Button
                    onClick={() => handleToggleActive(coupon.id, coupon.isActive)}
                    variant="outline"
                    className={cn(
                      "w-full",
                      coupon.isActive ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    <Power className="h-4 w-4 mr-2" />
                    {coupon.isActive ? 'Desactivar' : 'Activar'}
                  </Button>

                  <Button
                    onClick={() => handleEdit(coupon)}
                    variant="outline"
                    className="w-full"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Editar
                  </Button>

                  <Button
                    onClick={() => setCouponToDelete(coupon)}
                    variant="outline"
                    className="w-full text-red-500"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </Button>
                </div>

                {/* Desktop Actions */}
                <div className="hidden sm:flex items-center justify-end gap-2">
                  <Tooltip content="Ver cupón">
                    <Button
                      onClick={() => setPreviewCoupon(coupon)}
                      variant="ghost"
                      size="sm"
                      className="text-gray-600"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Tooltip>

                  <Tooltip content={coupon.isActive ? 'Desactivar cupón' : 'Activar cupón'}>
                    <Button
                      onClick={() => handleToggleActive(coupon.id, coupon.isActive)}
                      variant="ghost"
                      size="sm"
                      className={coupon.isActive ? 'text-green-600' : 'text-red-600'}
                    >
                      <Power className="h-4 w-4" />
                    </Button>
                  </Tooltip>

                  <Tooltip content="Editar cupón">
                    <Button
                      onClick={() => handleEdit(coupon)}
                      variant="ghost"
                      size="sm"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </Tooltip>

                  <Tooltip content="Eliminar cupón">
                    <Button
                      onClick={() => setCouponToDelete(coupon)}
                      variant="ghost"
                      size="sm"
                      className="text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </Tooltip>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <CouponDialog
        isOpen={showDialog}
        onClose={() => {
          setShowDialog(false);
          setEditingCoupon(null);
          setOperationError(null);
        }}
        onSubmit={handleSubmit}
        coupon={editingCoupon}
      />

      <DeleteCouponDialog
        isOpen={couponToDelete !== null}
        onClose={() => setCouponToDelete(null)}
        onConfirm={handleDelete}
        title={couponToDelete?.title || ''}
      />

      {previewCoupon && (
        <CouponPreviewDialog
          isOpen={true}
          onClose={() => setPreviewCoupon(null)}
          coupon={previewCoupon}
        />
      )}
    </div>
  );
}