import { useState } from 'react';
import { usePointsOfInterest } from '../../lib/hooks/usePointsOfInterest';
import { Button } from '../../components/ui/button';
import { DataTable } from '../../components/ui/data-table';
import { Plus, Edit2, Trash2, Power, MapPin, Search, AlertCircle } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { PointOfInterest } from '../../types/poi';
import { POI_TYPES } from '../../types/poi';
import { PoiForm } from '../../components/admin/poi/PoiForm';
import { DeleteSettingDialog } from '../../components/settings/DeleteSettingDialog';
import { Input } from '../../components/ui/input';
import { cn } from '../../lib/utils';

const ITEMS_PER_PAGE = 10;

export function PointsOfInterestPage() {
  const { pois, loading, error, createPoi, updatePoi, deletePoi } = usePointsOfInterest();
  const [showForm, setShowForm] = useState(false);
  const [editingPoi, setEditingPoi] = useState<PointOfInterest | null>(null);
  const [poiToDelete, setPoiToDelete] = useState<PointOfInterest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [operationError, setOperationError] = useState<string | null>(null);

  // Filter POIs based on search term
  const filteredPois = pois.filter(poi => 
    !searchTerm || 
    poi.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    poi.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    poi.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    poi.phones.some(phone => phone.includes(searchTerm))
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredPois.length / ITEMS_PER_PAGE);
  const paginatedPois = filteredPois.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      setOperationError(null);
      await updatePoi(id, { isActive: !currentStatus });
    } catch (err) {
      console.error('Error toggling POI status:', err);
      setOperationError('Error al cambiar el estado. Por favor, intenta nuevamente.');
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      setOperationError(null);
      if (editingPoi) {
        await updatePoi(editingPoi.id, data);
      } else {
        await createPoi(data);
      }
      setShowForm(false);
      setEditingPoi(null);
    } catch (err) {
      throw err;
    }
  };

  const handleDelete = async () => {
    if (!poiToDelete) return;
    try {
      setOperationError(null);
      await deletePoi(poiToDelete.id);
      setPoiToDelete(null);
    } catch (err) {
      console.error('Error deleting POI:', err);
      setOperationError('Error al eliminar el punto de interés');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Puntos de Interés</h2>
            <p className="text-sm text-gray-500">
              {filteredPois.length} {filteredPois.length === 1 ? 'punto' : 'puntos'} de interés
            </p>
          </div>
        </div>
        <Button 
          onClick={() => {
            setEditingPoi(null);
            setShowForm(true);
            setOperationError(null);
          }}
          className="w-full sm:w-auto flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nuevo punto
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar puntos de interés..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // Reset to first page when searching
          }}
          className="pl-10"
        />
      </div>

      {/* Operation Error */}
      {operationError && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{operationError}</p>
        </div>
      )}

      {showForm ? (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            {editingPoi ? 'Editar punto de interés' : 'Nuevo punto de interés'}
          </h3>
          <PoiForm
            initialData={editingPoi || undefined}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingPoi(null);
              setOperationError(null);
            }}
          />
        </div>
      ) : (
        <>
          {/* Mobile View */}
          <div className="lg:hidden space-y-4">
            {paginatedPois.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-lg shadow-sm">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <MapPin className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No se encontraron puntos de interés
                </h3>
                <p className="text-gray-500">
                  {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Agrega un nuevo punto para empezar'}
                </p>
              </div>
            ) : (
              <>
                {paginatedPois.map(poi => (
                  <div key={poi.id} className="bg-white p-6 rounded-lg shadow-sm space-y-4">
                    {/* POI Info */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{poi.name}</h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary mt-1">
                            {POI_TYPES[poi.type as keyof typeof POI_TYPES]}
                          </span>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                          poi.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        )}
                      >
                        {poi.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="text-sm text-gray-600">
                      <p>{poi.address}</p>
                      {poi.phones.length > 0 && (
                        <p className="mt-1">{poi.phones.join(', ')}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        onClick={() => handleToggleActive(poi.id, poi.isActive)}
                        variant="outline"
                        size="sm"
                        className={`flex-1 ${poi.isActive ? 'text-green-600' : 'text-red-600'}`}
                      >
                        <Power className="h-4 w-4 mr-2" />
                        {poi.isActive ? 'Desactivar' : 'Activar'}
                      </Button>
                      <Button
                        onClick={() => {
                          setEditingPoi(poi);
                          setShowForm(true);
                        }}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        onClick={() => setPoiToDelete(poi)}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-red-500"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Mobile Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
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
              </>
            )}
          </div>

          {/* Desktop View */}
          <div className="hidden lg:block">
            <DataTable
              columns={[
                {
                  accessorKey: 'name',
                  header: 'Nombre',
                  cell: ({ row }) => (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {row.original.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {POI_TYPES[row.original.type as keyof typeof POI_TYPES]}
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  accessorKey: 'address',
                  header: 'Dirección',
                  cell: ({ row }) => (
                    <div className="text-sm text-gray-600">
                      {row.original.address}
                    </div>
                  ),
                },
                {
                  accessorKey: 'phones',
                  header: 'Teléfonos',
                  cell: ({ row }) => (
                    <div className="text-sm text-gray-600">
                      {row.original.phones.join(', ')}
                    </div>
                  ),
                },
                {
                  accessorKey: 'isActive',
                  header: 'Estado',
                  cell: ({ row }) => (
                    <span
                      className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        row.original.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      )}
                    >
                      {row.original.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  ),
                },
                {
                  id: 'actions',
                  cell: ({ row }) => {
                    const poi = row.original;
                    return (
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => handleToggleActive(poi.id, poi.isActive)}
                          variant="ghost"
                          size="sm"
                          className={poi.isActive ? 'text-green-600' : 'text-red-600'}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => {
                            setEditingPoi(poi);
                            setShowForm(true);
                          }}
                          variant="ghost"
                          size="sm"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => setPoiToDelete(poi)}
                          variant="ghost"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    );
                  },
                },
              ]}
              data={paginatedPois}
              searchPlaceholder="Buscar puntos de interés..."
              searchColumn="name"
            >
              <DeleteSettingDialog
                isOpen={poiToDelete !== null}
                onClose={() => setPoiToDelete(null)}
                onConfirm={handleDelete}
                itemName={poiToDelete?.name || ''}
                type="Punto de interés"
              />
            </DataTable>
          </div>
        </>
      )}

      {/* Shared Dialog */}
      <DeleteSettingDialog
        isOpen={poiToDelete !== null}
        onClose={() => setPoiToDelete(null)}
        onConfirm={handleDelete}
        itemName={poiToDelete?.name || ''}
        type="Punto de interés"
      />
    </div>
  );
}