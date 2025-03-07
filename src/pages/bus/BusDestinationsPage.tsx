import { useState } from 'react';
import { useBusDestinations } from '../../lib/hooks/useBusDestinations';
import { Button } from '../../components/ui/button';
import { DataTable } from '../../components/ui/data-table';
import { Plus, Edit2, Trash2, Power, MapPin, Search, AlertCircle } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { BusDestination } from '../../types/bus';
import { BusDestinationForm } from '../../components/admin/bus/BusDestinationForm';
import { DeleteSettingDialog } from '../../components/settings/DeleteSettingDialog';
import { Input } from '../../components/ui/input';
import { cn } from '../../lib/utils';

export function BusDestinationsPage() {
  const { destinations, loading, error, createDestination, updateDestination, deleteDestination } = useBusDestinations();
  const [showForm, setShowForm] = useState(false);
  const [editingDestination, setEditingDestination] = useState<BusDestination | null>(null);
  const [destinationToDelete, setDestinationToDelete] = useState<BusDestination | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [operationError, setOperationError] = useState<string | null>(null);

  // Filter destinations based on search term
  const filteredDestinations = destinations.filter(destination => 
    !searchTerm || 
    destination.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    destination.terminal.toLowerCase().includes(searchTerm.toLowerCase()) ||
    destination.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Mobile card view for each destination
  const DestinationCard = ({ destination }: { destination: BusDestination }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
      {/* Destination Info */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg shrink-0">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{destination.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{destination.terminal}</p>
            {destination.description && (
              <p className="text-sm text-gray-500 mt-2">{destination.description}</p>
            )}
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
            destination.isActive
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          )}
        >
          {destination.isActive ? 'Activo' : 'Inactivo'}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-4 border-t">
        <Button
          onClick={() => handleToggleActive(destination.id, destination.isActive)}
          variant="ghost"
          size="sm"
          className={destination.isActive ? 'text-green-600' : 'text-red-600'}
        >
          <Power className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => {
            setEditingDestination(destination);
            setShowForm(true);
          }}
          variant="ghost"
          size="sm"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => setDestinationToDelete(destination)}
          variant="ghost"
          size="sm"
          className="text-red-500"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      setOperationError(null);
      await updateDestination(id, { isActive: !currentStatus });
    } catch (err) {
      console.error('Error toggling destination status:', err);
      setOperationError('Error al cambiar el estado del destino. Por favor, intenta nuevamente.');
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      setOperationError(null);
      if (editingDestination) {
        await updateDestination(editingDestination.id, data);
      } else {
        await createDestination(data);
      }
      setShowForm(false);
      setEditingDestination(null);
    } catch (err) {
      console.error('Error saving destination:', err);
      setOperationError('Error al guardar el destino. Por favor, verifica los datos e intenta nuevamente.');
      throw err;
    }
  };

  const handleDelete = async () => {
    if (!destinationToDelete) return;
    try {
      setOperationError(null);
      await deleteDestination(destinationToDelete.id);
      setDestinationToDelete(null);
    } catch (err) {
      console.error('Error deleting destination:', err);
      setOperationError('Error al eliminar el destino. Por favor, intenta nuevamente.');
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
            <h2 className="text-2xl font-bold text-gray-900">Destinos</h2>
            <p className="text-sm text-gray-500">
              {filteredDestinations.length} {filteredDestinations.length === 1 ? 'destino' : 'destinos'}
            </p>
          </div>
        </div>
        <Button 
          onClick={() => {
            setEditingDestination(null);
            setShowForm(true);
            setOperationError(null);
          }}
          className="w-full sm:w-auto flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nuevo destino
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar destinos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
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
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            {editingDestination ? 'Editar destino' : 'Nuevo destino'}
          </h3>
          <BusDestinationForm
            initialData={editingDestination || undefined}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingDestination(null);
              setOperationError(null);
            }}
          />
        </div>
      ) : (
        <>
          {/* Mobile View */}
          <div className="lg:hidden space-y-4">
            {filteredDestinations.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-xl shadow-sm">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <MapPin className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No se encontraron destinos
                </h3>
                <p className="text-gray-500">
                  {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Agrega un nuevo destino para empezar'}
                </p>
              </div>
            ) : (
              filteredDestinations.map(destination => (
                <DestinationCard key={destination.id} destination={destination} />
              ))
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
                          {row.original.terminal}
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  accessorKey: 'description',
                  header: 'Descripción',
                  cell: ({ row }) => (
                    <div className="text-sm text-gray-600 max-w-[300px] truncate">
                      {row.original.description || '-'}
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
                    const destination = row.original;
                    return (
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => handleToggleActive(destination.id, destination.isActive)}
                          variant="ghost"
                          size="sm"
                          className={destination.isActive ? 'text-green-600' : 'text-red-600'}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => {
                            setEditingDestination(destination);
                            setShowForm(true);
                          }}
                          variant="ghost"
                          size="sm"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => setDestinationToDelete(destination)}
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
              data={filteredDestinations}
              searchPlaceholder="Buscar destinos..."
              searchColumn="name"
            >
              <DeleteSettingDialog
                isOpen={destinationToDelete !== null}
                onClose={() => setDestinationToDelete(null)}
                onConfirm={handleDelete}
                itemName={destinationToDelete?.name || ''}
                type="Destino"
              />
            </DataTable>
          </div>
        </>
      )}

      {/* Shared Dialog */}
      <DeleteSettingDialog
        isOpen={destinationToDelete !== null}
        onClose={() => setDestinationToDelete(null)}
        onConfirm={handleDelete}
        itemName={destinationToDelete?.name || ''}
        type="Destino"
      />
    </div>
  );
}