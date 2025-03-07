import { useState } from 'react';
import { useBusRoutes } from '../../lib/hooks/useBusRoutes';
import { useBusLines } from '../../lib/hooks/useBusLines';
import { useBusLineTypes } from '../../lib/hooks/useBusLineTypes';
import { useBusDestinations } from '../../lib/hooks/useBusDestinations';
import { Button } from '../../components/ui/button';
import { DataTable } from '../../components/ui/data-table';
import { Plus, Edit2, Trash2, Power, Bus, Search, AlertCircle, ArrowRight } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { BusRoute } from '../../types/bus';
import { BusRouteForm } from '../../components/admin/bus/BusRouteForm';
import { DeleteSettingDialog } from '../../components/settings/DeleteSettingDialog';
import { Input } from '../../components/ui/input';
import { cn } from '../../lib/utils';

export function BusRoutesPage() {
  const { routes, loading, error, createRoute, updateRoute, deleteRoute } = useBusRoutes();
  const { lines } = useBusLines();
  const { types } = useBusLineTypes();
  const { destinations } = useBusDestinations();
  const [showForm, setShowForm] = useState(false);
  const [editingRoute, setEditingRoute] = useState<BusRoute | null>(null);
  const [routeToDelete, setRouteToDelete] = useState<BusRoute | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [operationError, setOperationError] = useState<string | null>(null);

  // Filter routes based on search term
  const filteredRoutes = routes.filter(route => {
    if (!searchTerm) return true;
    
    const line = lines.find(l => l.id === route.lineId);
    const type = types.find(t => t.id === route.typeId);
    const origin = destinations.find(d => d.id === route.originId);
    const destination = destinations.find(d => d.id === route.destinationId);
    
    const term = searchTerm.toLowerCase();
    return (
      line?.name.toLowerCase().includes(term) ||
      line?.code.toLowerCase().includes(term) ||
      type?.name.toLowerCase().includes(term) ||
      origin?.name.toLowerCase().includes(term) ||
      destination?.name.toLowerCase().includes(term)
    );
  });

  // Mobile card view for each route
  const RouteCard = ({ route }: { route: BusRoute }) => {
    const line = lines.find(l => l.id === route.lineId);
    const type = types.find(t => t.id === route.typeId);
    const origin = destinations.find(d => d.id === route.originId);
    const destination = destinations.find(d => d.id === route.destinationId);

    return (
      <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
        {/* Line and Type */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg shrink-0">
              <Bus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-medium text-gray-900">
                  {line?.code}
                </span>
                <span className="px-2 py-1 bg-primary/10 rounded text-sm font-medium text-primary">
                  {type?.name}
                </span>
              </div>
            </div>
          </div>
          <span
            className={cn(
              "shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
              route.isActive
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            )}
          >
            {route.isActive ? 'Activo' : 'Inactivo'}
          </span>
        </div>

        {/* Route */}
        <div className="flex items-center gap-3 text-gray-700">
          <span className="font-medium">{origin?.name}</span>
          <ArrowRight className="h-4 w-4 text-gray-400 shrink-0" />
          <span className="font-medium">{destination?.name}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <Button
            onClick={() => handleToggleActive(route.id, route.isActive)}
            variant="ghost"
            size="sm"
            className={route.isActive ? 'text-green-600' : 'text-red-600'}
          >
            <Power className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => {
              setEditingRoute(route);
              setShowForm(true);
            }}
            variant="ghost"
            size="sm"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => setRouteToDelete(route)}
            variant="ghost"
            size="sm"
            className="text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      setOperationError(null);
      await updateRoute(id, { isActive: !currentStatus });
    } catch (err) {
      console.error('Error toggling route status:', err);
      setOperationError('Error al cambiar el estado del recorrido. Por favor, intenta nuevamente.');
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      setOperationError(null);
      if (editingRoute) {
        await updateRoute(editingRoute.id, data);
      } else {
        await createRoute(data);
      }
      setShowForm(false);
      setEditingRoute(null);
    } catch (err) {
      console.error('Error saving route:', err);
      setOperationError('Error al guardar el recorrido. Por favor, verifica los datos e intenta nuevamente.');
      throw err;
    }
  };

  const handleDelete = async () => {
    if (!routeToDelete) return;
    try {
      setOperationError(null);
      await deleteRoute(routeToDelete.id);
      setRouteToDelete(null);
    } catch (err) {
      console.error('Error deleting route:', err);
      setOperationError('Error al eliminar el recorrido. Por favor, intenta nuevamente.');
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
            <Bus className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Recorridos</h2>
            <p className="text-sm text-gray-500">
              {filteredRoutes.length} {filteredRoutes.length === 1 ? 'recorrido' : 'recorridos'}
            </p>
          </div>
        </div>
        <Button 
          onClick={() => {
            setEditingRoute(null);
            setShowForm(true);
            setOperationError(null);
          }}
          className="w-full sm:w-auto flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nuevo recorrido
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar recorridos..."
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
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            {editingRoute ? 'Editar recorrido' : 'Nuevo recorrido'}
          </h3>
          <BusRouteForm
            initialData={editingRoute || undefined}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingRoute(null);
              setOperationError(null);
            }}
          />
        </div>
      ) : (
        <>
          {/* Mobile View */}
          <div className="lg:hidden space-y-4">
            {filteredRoutes.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-xl shadow-sm">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Bus className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No se encontraron recorridos
                </h3>
                <p className="text-gray-500">
                  {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Agrega un nuevo recorrido para empezar'}
                </p>
              </div>
            ) : (
              filteredRoutes.map(route => (
                <RouteCard key={route.id} route={route} />
              ))
            )}
          </div>

          {/* Desktop View */}
          <div className="hidden lg:block">
            <DataTable
              columns={[
                {
                  accessorKey: 'lineId',
                  header: 'Línea',
                  cell: ({ row }) => {
                    const line = lines.find(l => l.id === row.original.lineId);
                    return (
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Bus className="h-4 w-4 text-primary" />
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {line ? `${line.code} - ${line.name}` : '-'}
                        </div>
                      </div>
                    );
                  },
                },
                {
                  accessorKey: 'typeId',
                  header: 'Tipo',
                  cell: ({ row }) => {
                    const type = types.find(t => t.id === row.original.typeId);
                    return (
                      <div className="text-sm text-gray-600">
                        {type?.name || '-'}
                      </div>
                    );
                  },
                },
                {
                  accessorKey: 'route',
                  header: 'Recorrido',
                  cell: ({ row }) => {
                    const origin = destinations.find(d => d.id === row.original.originId);
                    const destination = destinations.find(d => d.id === row.original.destinationId);
                    return (
                      <div className="text-sm text-gray-600">
                        {origin?.name || '-'} → {destination?.name || '-'}
                      </div>
                    );
                  },
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
                    const route = row.original;
                    return (
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => handleToggleActive(route.id, route.isActive)}
                          variant="ghost"
                          size="sm"
                          className={route.isActive ? 'text-green-600' : 'text-red-600'}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => {
                            setEditingRoute(route);
                            setShowForm(true);
                          }}
                          variant="ghost"
                          size="sm"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => setRouteToDelete(route)}
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
              data={filteredRoutes}
              searchPlaceholder="Buscar recorridos..."
              searchColumn="lineId"
            >
              <DeleteSettingDialog
                isOpen={routeToDelete !== null}
                onClose={() => setRouteToDelete(null)}
                onConfirm={handleDelete}
                itemName={`${lines.find(l => l.id === routeToDelete?.lineId)?.name || ''} - ${destinations.find(d => d.id === routeToDelete?.originId)?.name || ''} → ${destinations.find(d => d.id === routeToDelete?.destinationId)?.name || ''}`}
                type="Recorrido"
              />
            </DataTable>
          </div>
        </>
      )}

      {/* Shared Dialog */}
      <DeleteSettingDialog
        isOpen={routeToDelete !== null}
        onClose={() => setRouteToDelete(null)}
        onConfirm={handleDelete}
        itemName={`${lines.find(l => l.id === routeToDelete?.lineId)?.name || ''} - ${destinations.find(d => d.id === routeToDelete?.originId)?.name || ''} → ${destinations.find(d => d.id === routeToDelete?.destinationId)?.name || ''}`}
        type="Recorrido"
      />
    </div>
  );
}