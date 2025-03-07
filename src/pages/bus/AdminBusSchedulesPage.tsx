import { useState } from 'react';
import { useBusSchedules } from '../../lib/hooks/useBusSchedules';
import { useBusRoutes } from '../../lib/hooks/useBusRoutes';
import { useBusLines } from '../../lib/hooks/useBusLines';
import { useBusLineTypes } from '../../lib/hooks/useBusLineTypes';
import { useBusDestinations } from '../../lib/hooks/useBusDestinations';
import { Button } from '../../components/ui/button';
import { DataTable } from '../../components/ui/data-table';
import { Plus, Edit2, Trash2, Power, Bus, Search, Filter, Clock, ArrowRight, AlertCircle } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { BusSchedule } from '../../types/bus';
import { BusScheduleForm } from '../../components/admin/bus/BusScheduleForm';
import { DeleteSettingDialog } from '../../components/settings/DeleteSettingDialog';
import { Input } from '../../components/ui/input';
import { cn } from '../../lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

export function AdminBusSchedulesPage() {
  const { schedules, loading: loadingSchedules, error, createSchedule, updateSchedule, deleteSchedule } = useBusSchedules();
  const { routes } = useBusRoutes();
  const { lines } = useBusLines();
  const { types } = useBusLineTypes();
  const { destinations } = useBusDestinations();
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<BusSchedule | null>(null);
  const [scheduleToDelete, setScheduleToDelete] = useState<BusSchedule | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLine, setSelectedLine] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedOrigin, setSelectedOrigin] = useState<string>('all');
  const [selectedDestination, setSelectedDestination] = useState<string>('all');
  const [selectedDay, setSelectedDay] = useState<string>('all');

  // Get active items
  const activeLines = lines.filter(l => l.isActive);
  const activeTypes = types.filter(t => t.isActive);
  const activeDestinations = destinations.filter(d => d.isActive);
  const activeRoutes = routes.filter(r => r.isActive);

  const clearFilters = () => {
    setSelectedLine('all');
    setSelectedType('all'); 
    setSelectedOrigin('all');
    setSelectedDestination('all');
    setSelectedDay('all');
    setSearchTerm('');
  };

  // Filter schedules based on all criteria
  const filteredSchedules = schedules.filter(schedule => {
    const route = routes.find(r => r.id === schedule.routeId);
    if (!route) return false;

    const line = lines.find(l => l.id === route.lineId);
    const type = types.find(t => t.id === route.typeId);
    const origin = destinations.find(d => d.id === route.originId);
    const destination = destinations.find(d => d.id === route.destinationId);

    // Search filter
    const searchMatch = !searchTerm || [
      line?.name,
      line?.code,
      type?.name,
      origin?.name,
      destination?.name,
      schedule.departureTime
    ].some(field => field?.toLowerCase().includes(searchTerm.toLowerCase()));

    // Line filter
    const lineMatch = selectedLine === 'all' || route.lineId === selectedLine;

    // Type filter
    const typeMatch = selectedType === 'all' || route.typeId === selectedType;

    // Origin filter
    const originMatch = selectedOrigin === 'all' || route.originId === selectedOrigin;

    // Destination filter
    const destinationMatch = selectedDestination === 'all' || route.destinationId === selectedDestination;

    // Day filter
    const dayMatch = selectedDay === 'all' || schedule.daysOfWeek[selectedDay as keyof typeof schedule.daysOfWeek];

    return searchMatch && lineMatch && typeMatch && originMatch && destinationMatch && dayMatch;
  }).sort((a, b) => a.departureTime.localeCompare(b.departureTime));

  // Mobile card view for each schedule
  const ScheduleCard = ({ schedule }: { schedule: BusSchedule }) => {
    const route = routes.find(r => r.id === schedule.routeId);
    if (!route) return null;

    const line = lines.find(l => l.id === route.lineId);
    const type = types.find(t => t.id === route.typeId);
    const origin = destinations.find(d => d.id === route.originId);
    const destination = destinations.find(d => d.id === route.destinationId);

    return (
      <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
        {/* Time and Line Info */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg shrink-0">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {schedule.departureTime}
              </div>
              <div className="flex items-center gap-2 mt-1">
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
              schedule.isActive
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            )}
          >
            {schedule.isActive ? 'Activo' : 'Inactivo'}
          </span>
        </div>

        {/* Route */}
        <div className="flex items-center gap-3 text-gray-700">
          <span className="font-medium">{origin?.name}</span>
          <ArrowRight className="h-4 w-4 text-gray-400 shrink-0" />
          <span className="font-medium">{destination?.name}</span>
        </div>

        {/* Days */}
        <div className="flex flex-wrap gap-1.5">
          {Object.entries({
            monday: 'L',
            tuesday: 'M',
            wednesday: 'X',
            thursday: 'J',
            friday: 'V',
            saturday: 'S',
            sunday: 'D'
          }).map(([key, label]) => (
            <span
              key={key}
              className={cn(
                "px-3 py-1 rounded-full text-sm font-medium transition-colors",
                schedule.daysOfWeek[key as keyof typeof schedule.daysOfWeek]
                  ? "bg-primary/10 text-primary"
                  : "bg-gray-100 text-gray-400"
              )}
            >
              {label}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <Button
            onClick={() => handleToggleActive(schedule.id, schedule.isActive)}
            variant="ghost"
            size="sm"
            className={schedule.isActive ? 'text-green-600' : 'text-red-600'}
          >
            <Power className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => {
              setEditingSchedule(schedule);
              setShowForm(true);
            }}
            variant="ghost"
            size="sm"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => setScheduleToDelete(schedule)}
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
      await updateSchedule(id, { isActive: !currentStatus });
    } catch (err) {
      console.error('Error toggling schedule status:', err);
      setOperationError('Error al cambiar el estado del horario. Por favor, intenta nuevamente.');
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      setOperationError(null);
      if (editingSchedule) {
        await updateSchedule(editingSchedule.id, data);
      } else {
        await createSchedule(data);
      }
      setShowForm(false);
      setEditingSchedule(null);
    } catch (err) {
      console.error('Error saving schedule:', err);
      setOperationError('Error al guardar el horario. Por favor, verifica los datos e intenta nuevamente.');
      throw err;
    }
  };

  const handleDelete = async () => {
    if (!scheduleToDelete) return;
    try {
      setOperationError(null);
      await deleteSchedule(scheduleToDelete.id);
      setScheduleToDelete(null);
    } catch (err) {
      console.error('Error deleting schedule:', err);
      setOperationError('Error al eliminar el horario. Por favor, intenta nuevamente.');
    }
  };

  if (loadingSchedules) {
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
            <h2 className="text-2xl font-bold text-gray-900">Horarios</h2>
            <p className="text-sm text-gray-500">
              {filteredSchedules.length} {filteredSchedules.length === 1 ? 'horario' : 'horarios'}
            </p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 flex-1 sm:flex-auto"
          >
            <Filter className="h-4 w-4" />
            {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
          </Button>
          <Button 
            onClick={() => {
              setEditingSchedule(null);
              setShowForm(true);
              setOperationError(null);
            }}
            className="flex items-center gap-2 flex-1 sm:flex-auto"
          >
            <Plus className="h-4 w-4" />
            Nuevo horario
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar horarios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {showFilters && (
          <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Line Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Línea
                </label>
                <Select value={selectedLine} onValueChange={setSelectedLine}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las líneas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las líneas</SelectItem>
                    {activeLines.map(line => (
                      <SelectItem key={line.id} value={line.id}>
                        {line.code} - {line.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    {activeTypes.map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Origin Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Origen
                </label>
                <Select value={selectedOrigin} onValueChange={setSelectedOrigin}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los orígenes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los orígenes</SelectItem>
                    {activeDestinations.map(destination => (
                      <SelectItem key={destination.id} value={destination.id}>
                        {destination.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Destination Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Destino
                </label>
                <Select value={selectedDestination} onValueChange={setSelectedDestination}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los destinos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los destinos</SelectItem>
                    {activeDestinations.map(destination => (
                      <SelectItem key={destination.id} value={destination.id}>
                        {destination.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Day Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Día
                </label>
                <Select value={selectedDay} onValueChange={setSelectedDay}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los días" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los días</SelectItem>
                    <SelectItem value="monday">Lunes</SelectItem>
                    <SelectItem value="tuesday">Martes</SelectItem>
                    <SelectItem value="wednesday">Miércoles</SelectItem>
                    <SelectItem value="thursday">Jueves</SelectItem>
                    <SelectItem value="friday">Viernes</SelectItem>
                    <SelectItem value="saturday">Sábado</SelectItem>
                    <SelectItem value="sunday">Domingo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters Button */}
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="w-full"
                >
                  Limpiar filtros
                </Button>
              </div>
            </div>
          </div>
        )}
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
            {editingSchedule ? 'Editar horario' : 'Nuevo horario'}
          </h3>
          <BusScheduleForm
            initialData={editingSchedule || undefined}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingSchedule(null);
              setOperationError(null);
            }}
          />
        </div>
      ) : (
        <>
          {/* Mobile View */}
          <div className="lg:hidden space-y-4">
            {filteredSchedules.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-xl shadow-sm">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Clock className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No se encontraron horarios
                </h3>
                <p className="text-gray-500">
                  {searchTerm || selectedLine !== 'all' || selectedType !== 'all' || selectedOrigin !== 'all' || selectedDestination !== 'all' || selectedDay !== 'all'
                    ? 'Intenta con otros filtros de búsqueda'
                    : 'Agrega un nuevo horario para empezar'
                  }
                </p>
              </div>
            ) : (
              filteredSchedules.map(schedule => (
                <ScheduleCard key={schedule.id} schedule={schedule} />
              ))
            )}
          </div>

          {/* Desktop View */}
          <div className="hidden lg:block">
            <DataTable
              columns={[
                {
                  accessorKey: 'departureTime',
                  header: 'Hora',
                  cell: ({ row }) => (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Clock className="h-4 w-4 text-primary" />
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {row.original.departureTime}
                      </div>
                    </div>
                  ),
                },
                {
                  accessorKey: 'routeId',
                  header: 'Línea y Tipo',
                  cell: ({ row }) => {
                    const route = routes.find(r => r.id === row.original.routeId);
                    if (!route) return '-';
                    
                    const line = lines.find(l => l.id === route.lineId);
                    const type = types.find(t => t.id === route.typeId);
                    
                    return (
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {line?.code} - {line?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {type?.name}
                        </div>
                      </div>
                    );
                  },
                },
                {
                  accessorKey: 'route',
                  header: 'Recorrido',
                  cell: ({ row }) => {
                    const route = routes.find(r => r.id === row.original.routeId);
                    if (!route) return '-';
                    
                    const origin = destinations.find(d => d.id === route.originId);
                    const destination = destinations.find(d => d.id === route.destinationId);
                    
                    return (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>{origin?.name}</span>
                        <ArrowRight className="h-4 w-4 text-gray-400 shrink-0" />
                        <span>{destination?.name}</span>
                      </div>
                    );
                  },
                },
                {
                  accessorKey: 'daysOfWeek',
                  header: 'Días',
                  cell: ({ row }) => (
                    <div className="flex flex-wrap gap-1">
                      {Object.entries({
                        monday: 'L',
                        tuesday: 'M',
                        wednesday: 'X',
                        thursday: 'J',
                        friday: 'V',
                        saturday: 'S',
                        sunday: 'D'
                      }).map(([key, label]) => (
                        <span
                          key={key}
                          className={cn(
                            "w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium",
                            row.original.daysOfWeek[key as keyof typeof row.original.daysOfWeek]
                              ? "bg-primary/10 text-primary"
                              : "bg-gray-100 text-gray-400"
                          )}
                        >
                          {label}
                        </span>
                      ))}
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
                    const schedule = row.original;
                    return (
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => handleToggleActive(schedule.id, schedule.isActive)}
                          variant="ghost"
                          size="sm"
                          className={schedule.isActive ? 'text-green-600' : 'text-red-600'}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => {
                            setEditingSchedule(schedule);
                            setShowForm(true);
                          }}
                          variant="ghost"
                          size="sm"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => setScheduleToDelete(schedule)}
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
              data={filteredSchedules}
              searchPlaceholder="Buscar horarios..."
              searchColumn="departureTime"
            >
              <DeleteSettingDialog
                isOpen={scheduleToDelete !== null}
                onClose={() => setScheduleToDelete(null)}
                onConfirm={handleDelete}
                itemName={`${scheduleToDelete?.departureTime || ''}`}
                type="Horario"
              />
            </DataTable>
          </div>
        </>
      )}

      {/* Shared Dialog */}
      <DeleteSettingDialog
        isOpen={scheduleToDelete !== null}
        onClose={() => setScheduleToDelete(null)}
        onConfirm={handleDelete}
        itemName={`${scheduleToDelete?.departureTime || ''}`}
        type="Horario"
      />
    </div>
  );
}