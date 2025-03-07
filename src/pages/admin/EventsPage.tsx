import { useState } from 'react';
import { useEvents } from '../../lib/hooks/useEvents';
import { Button } from '../../components/ui/button';
import { DataTable } from '../../components/ui/data-table';
import { Plus, Edit2, Trash2, Power, Calendar, AlertCircle, Search, MapPin, Clock, Users } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { Event } from '../../types/event';
import { EVENT_CATEGORIES } from '../../types/event';
import { EventForm } from '../../components/admin/events/EventForm';
import { DeleteSettingDialog } from '../../components/settings/DeleteSettingDialog';
import { Input } from '../../components/ui/input';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function EventsPage() {
  const { events, loading, error: eventsError, createEvent, updateEvent, deleteEvent } = useEvents();
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter events based on search term
  const filteredEvents = events.filter(event => 
    !searchTerm || 
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Mobile card view for each event
  const EventCard = ({ event }: { event: Event }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
      {/* Event Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{event.title}</h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary mt-1">
              {EVENT_CATEGORIES[event.category as keyof typeof EVENT_CATEGORIES]}
            </span>
          </div>
        </div>
        <span
          className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
            event.isActive
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          )}
        >
          {event.isActive ? 'Activo' : 'Inactivo'}
        </span>
      </div>

      {/* Event Details */}
      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-400" />
          <span>
            {format(new Date(event.startDate.seconds * 1000), "d 'de' MMMM, yyyy", { locale: es })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-gray-400" />
          <span>{event.location}</span>
        </div>
        {event.capacity && (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-400" />
            <span>
              {event.registeredUsers?.length || 0} / {event.capacity} asistentes
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-4 border-t">
        <Button
          onClick={() => handleToggleActive(event.id, event.isActive)}
          variant="ghost"
          size="sm"
          className={event.isActive ? 'text-green-600' : 'text-red-600'}
        >
          <Power className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => {
            setEditingEvent(event);
            setShowForm(true);
          }}
          variant="ghost"
          size="sm"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => setEventToDelete(event)}
          variant="ghost"
          size="sm"
          className="text-red-500"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const columns: ColumnDef<Event>[] = [
    {
      accessorKey: 'title',
      header: 'Título',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {row.original.title}
            </div>
            <div className="text-sm text-gray-500">
              {EVENT_CATEGORIES[row.original.category as keyof typeof EVENT_CATEGORIES]}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'startDate',
      header: 'Fecha',
      cell: ({ row }) => {
        const startDate = new Date(row.original.startDate.seconds * 1000);
        const endDate = new Date(row.original.endDate.seconds * 1000);
        return (
          <div className="text-sm text-gray-600">
            {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
          </div>
        );
      },
      meta: {
        hiddenOnMobile: true
      }
    },
    {
      accessorKey: 'location',
      header: 'Ubicación',
      cell: ({ row }) => (
        <div className="text-sm text-gray-600">
          {row.original.location}
        </div>
      ),
      meta: {
        hiddenOnMobile: true
      }
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
        const event = row.original;
        return (
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => handleToggleActive(event.id, event.isActive)}
              variant="ghost"
              size="sm"
              className={event.isActive ? 'text-green-600' : 'text-red-600'}
            >
              <Power className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => {
                setEditingEvent(event);
                setShowForm(true);
              }}
              variant="ghost"
              size="sm"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => setEventToDelete(event)}
              variant="ghost"
              size="sm"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        );
      },
    },
  ];

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      setOperationError(null);
      await updateEvent(id, { isActive: !currentStatus });
    } catch (err) {
      console.error('Error toggling event status:', err);
      setOperationError('Error al cambiar el estado del evento. Por favor, intenta nuevamente.');
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      setOperationError(null);
      if (editingEvent) {
        await updateEvent(editingEvent.id, data);
      } else {
        await createEvent(data);
      }
      setShowForm(false);
      setEditingEvent(null);
    } catch (err) {
      console.error('Error submitting event:', err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Error al guardar el evento. Por favor, verifica los datos e intenta nuevamente.';
      throw new Error(errorMessage);
    }
  };

  const handleDelete = async () => {
    if (!eventToDelete) return;
    
    try {
      setOperationError(null);
      await deleteEvent(eventToDelete.id);
      setEventToDelete(null);
    } catch (err) {
      console.error('Error deleting event:', err);
      setOperationError('Error al eliminar el evento. Por favor, intenta nuevamente.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (eventsError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{eventsError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Eventos</h2>
            <p className="text-sm text-gray-500">
              {filteredEvents.length} {filteredEvents.length === 1 ? 'evento' : 'eventos'}
            </p>
          </div>
        </div>
        <Button 
          onClick={() => {
            setEditingEvent(null);
            setShowForm(true);
            setOperationError(null);
          }}
          className="w-full sm:w-auto flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nuevo evento
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar eventos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Operation Error Message */}
      {operationError && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{operationError}</p>
        </div>
      )}

      {showForm ? (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            {editingEvent ? 'Editar evento' : 'Nuevo evento'}
          </h3>
          <EventForm
            initialData={editingEvent || undefined}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingEvent(null);
              setOperationError(null);
            }}
          />
        </div>
      ) : (
        <>
          {/* Mobile View */}
          <div className="lg:hidden space-y-4">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-xl shadow-sm">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Calendar className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No se encontraron eventos
                </h3>
                <p className="text-gray-500">
                  {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Agrega un nuevo evento para empezar'}
                </p>
              </div>
            ) : (
              filteredEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))
            )}
          </div>

          {/* Desktop View */}
          <div className="hidden lg:block">
            <DataTable
              columns={columns}
              data={filteredEvents}
              searchPlaceholder="Buscar eventos..."
              searchColumn="title"
            >
              <DeleteSettingDialog
                isOpen={eventToDelete !== null}
                onClose={() => setEventToDelete(null)}
                onConfirm={handleDelete}
                itemName={eventToDelete?.title || ''}
                type="Evento"
              />
            </DataTable>
          </div>
        </>
      )}

      {/* Shared Dialog */}
      <DeleteSettingDialog
        isOpen={eventToDelete !== null}
        onClose={() => setEventToDelete(null)}
        onConfirm={handleDelete}
        itemName={eventToDelete?.title || ''}
        type="Evento"
      />
    </div>
  );
}