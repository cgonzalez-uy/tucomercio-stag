import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../lib/firebase';
import { usePromotions } from '../../lib/hooks/usePromotions';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Percent, Plus, Edit2, Trash2, Power, Calendar, Eye, Search, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Tooltip } from '../../components/ui/tooltip';
import { PromotionDialog } from '../../components/business/PromotionDialog';
import { DeletePromotionDialog } from '../../components/business/DeletePromotionDialog';
import { PromotionPreviewDialog } from '../../components/business/PromotionPreviewDialog';
import { PremiumFeatureMessage } from '../../components/business/PremiumFeatureMessage';

export function BusinessPromotions() {
  const [user] = useAuthState(auth);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const { promotions = [], loading: promotionsLoading, error: promotionsError, createPromotion, updatePromotion, deletePromotion } = usePromotions(businessId);
  const [showDialog, setShowDialog] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<any>(null);
  const [promotionToDelete, setPromotionToDelete] = useState<any>(null);
  const [previewPromotion, setPreviewPromotion] = useState<any>(null);
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

  // Filter promotions based on search term
  const filteredPromotions = promotions.filter(promotion => 
    !searchTerm || 
    promotion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    promotion.description.toLowerCase().includes(searchTerm.toLowerCase())
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
      await updatePromotion(id, { isActive: !currentStatus });
    } catch (err) {
      console.error('Error toggling promotion status:', err);
      setOperationError('Error al cambiar el estado de la promoción');
    }
  };

  const handleEdit = (promotion: any) => {
    setOperationError(null);
    setEditingPromotion(promotion);
    setShowDialog(true);
  };

  const handleDelete = async () => {
    if (!promotionToDelete) return;

    try {
      setOperationError(null);
      await deletePromotion(promotionToDelete.id);
      setPromotionToDelete(null);
    } catch (err) {
      console.error('Error deleting promotion:', err);
      setOperationError('Error al eliminar la promoción');
    }
  };

  const handleSubmit = async (data: any) => {
    if (!businessId) {
      setOperationError('Error de autenticación. Por favor, vuelve a iniciar sesión.');
      return;
    }

    try {
      setOperationError(null);
      if (editingPromotion) {
        await updatePromotion(editingPromotion.id, data);
      } else {
        await createPromotion(data);
      }
      setShowDialog(false);
      setEditingPromotion(null);
    } catch (err) {
      console.error(editingPromotion ? 'Error updating promotion:' : 'Error creating promotion:', err);
      setOperationError(err instanceof Error ? err.message : 'Error al guardar la promoción');
      throw err;
    }
  };

  if (promotionsLoading) {
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

  if (promotionsError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{promotionsError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Percent className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Promociones</h2>
            <p className="text-sm text-gray-500">
              {filteredPromotions.length} {filteredPromotions.length === 1 ? 'promoción' : 'promociones'}
            </p>
          </div>
        </div>
        <Button 
          onClick={() => {
            setOperationError(null);
            setEditingPromotion(null);
            setShowDialog(true);
          }} 
          className="w-full sm:w-auto flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nueva promoción
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar promociones..."
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
        {filteredPromotions.length === 0 ? (
          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Percent className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No se encontraron promociones' : 'No hay promociones activas'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Crea tu primera promoción para atraer más clientes'}
            </p>
            <Button 
              onClick={() => {
                setOperationError(null);
                setEditingPromotion(null);
                setShowDialog(true);
              }}
            >
              Crear promoción
            </Button>
          </div>
        ) : (
          filteredPromotions.map((promotion) => (
            <div
              key={promotion.id}
              className="bg-white rounded-lg border border-gray-200 hover:border-primary/20 hover:shadow-md transition-all duration-200"
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-medium text-gray-900">
                        {promotion.title}
                      </h3>
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        promotion.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      )}>
                        {promotion.isActive ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{promotion.description}</p>
                    <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                      <span className="font-medium text-primary">
                        {promotion.discount}% de descuento
                      </span>
                      <span className="text-gray-400">•</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {formatDate(promotion.startDate)}
                        </span>
                      </div>
                      <span className="text-gray-400">→</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {formatDate(promotion.endDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Actions */}
                <div className="grid grid-cols-2 gap-2 sm:hidden mt-4 pt-4 border-t">
                  <Button
                    onClick={() => setPreviewPromotion(promotion)}
                    variant="outline"
                    className="w-full"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver
                  </Button>

                  <Button
                    onClick={() => handleToggleActive(promotion.id, promotion.isActive)}
                    variant="outline"
                    className={cn(
                      "w-full",
                      promotion.isActive ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    <Power className="h-4 w-4 mr-2" />
                    {promotion.isActive ? 'Desactivar' : 'Activar'}
                  </Button>

                  <Button
                    onClick={() => handleEdit(promotion)}
                    variant="outline"
                    className="w-full"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Editar
                  </Button>

                  <Button
                    onClick={() => setPromotionToDelete(promotion)}
                    variant="outline"
                    className="w-full text-red-500"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </Button>
                </div>

                {/* Desktop Actions */}
                <div className="hidden sm:flex items-center justify-end gap-2">
                  <Tooltip content="Ver promoción">
                    <Button
                      onClick={() => setPreviewPromotion(promotion)}
                      variant="ghost"
                      size="sm"
                      className="text-gray-600"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Tooltip>

                  <Tooltip content={promotion.isActive ? 'Desactivar promoción' : 'Activar promoción'}>
                    <Button
                      onClick={() => handleToggleActive(promotion.id, promotion.isActive)}
                      variant="ghost"
                      size="sm"
                      className={promotion.isActive ? 'text-green-600' : 'text-red-600'}
                    >
                      <Power className="h-4 w-4" />
                    </Button>
                  </Tooltip>

                  <Tooltip content="Editar promoción">
                    <Button
                      onClick={() => handleEdit(promotion)}
                      variant="ghost"
                      size="sm"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </Tooltip>

                  <Tooltip content="Eliminar promoción">
                    <Button
                      onClick={() => setPromotionToDelete(promotion)}
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

      <PromotionDialog
        isOpen={showDialog}
        onClose={() => {
          setShowDialog(false);
          setEditingPromotion(null);
          setOperationError(null);
        }}
        onSubmit={handleSubmit}
        promotion={editingPromotion}
      />

      <DeletePromotionDialog
        isOpen={promotionToDelete !== null}
        onClose={() => setPromotionToDelete(null)}
        onConfirm={handleDelete}
        title={promotionToDelete?.title || ''}
      />

      {previewPromotion && (
        <PromotionPreviewDialog
          isOpen={true}
          onClose={() => setPreviewPromotion(null)}
          promotion={previewPromotion}
        />
      )}
    </div>
  );
}
