import { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebase';
import { useSavedSchedules } from '../lib/hooks/useSavedSchedules';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';
import { Bus, ArrowLeft, Heart, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

export function UserBusesPage() {
  const [user] = useAuthState(auth);
  const { savedSchedules, loading, error, unsaveSchedule } = useSavedSchedules(user?.uid);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Calculate total pages
  const totalPages = Math.ceil(savedSchedules.length / ITEMS_PER_PAGE);

  // Get schedules for current page
  const paginatedSchedules = savedSchedules.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleUnsave = async (scheduleId: string) => {
    try {
      await unsaveSchedule(scheduleId);
    } catch (err) {
      console.error('Error removing schedule:', err);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Inicia sesión para ver tus horarios guardados
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
        {/* Header with navigation and actions */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Link 
              to="/profile"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Volver a mi perfil</span>
            </Link>

            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                Mis Horarios de Ómnibus
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Accede rápidamente a tus horarios favoritos
              </p>
            </div>

            <Button 
              asChild 
              size="lg"
              className="w-full sm:w-auto bg-[#d103d1] hover:bg-[#d103d1]/90 text-white"
            >
              <Link to="/schedules" className="whitespace-nowrap">
                <Bus className="h-5 w-5 mr-2" />
                Ver todos los horarios
              </Link>
            </Button>
          </div>
        </div>

        {savedSchedules.length === 0 ? (
          <div className="text-center max-w-md mx-auto">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Bus className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No tienes horarios guardados
            </h2>
            <p className="text-gray-600 mb-6">
              Guarda los horarios que más utilizas para acceder rápidamente a ellos
            </p>
            <Button 
              asChild
              size="lg"
              className="bg-[#d103d1] hover:bg-[#d103d1]/90 text-white"
            >
              <Link to="/schedules">Ver horarios</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedSchedules.map((schedule) => (
              <div
                key={schedule.id}
                className="bg-white rounded-xl shadow-sm border border-gray-250 overflow-hidden hover:shadow-md transition-all duration-200"
              >
                {/* Time and Line Section */}
                <div className="p-4 sm:p-6 border-b bg-gray-50/50">
                  <div className="flex flex-wrap items-center gap-6">
                    {/* Time */}
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#d103d1]/10 rounded-lg">
                        <Clock className="h-5 w-5 text-[#d103d1]" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900">
                          {schedule.departureTime}
                        </div>
                        <div className="text-sm text-gray-500">hrs</div>
                      </div>
                    </div>

                    {/* Line Info */}
                    <div className="flex-1">
                      <div className="text-lg font-semibold text-gray-900">
                        {schedule.routeData.lineCode} {schedule.routeData.typeName}
                      </div>

                    </div>

                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnsave(schedule.scheduleId)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full aspect-square"
                    >
                      <Heart className="h-5 w-5 fill-current" />
                    </Button>
                  </div>
                </div>

                {/* Route and Days Section */}
                <div className="p-4 sm:p-6 space-y-6">
                  {/* Route */}
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-2">Recorrido</div>
                    <div className="flex items-center gap-3 text-gray-900">
                      <span className="font-medium">{schedule.routeData.originName}</span>
                      <ArrowLeft className="h-4 w-4 rotate-180 text-gray-400" />
                      <span className="font-medium">{schedule.routeData.destinationName}</span>
                    </div>
                  </div>

                  {/* Days */}
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-2">Días</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries({
                        monday: 'Lunes',
                        tuesday: 'Martes',
                        wednesday: 'Miércoles',
                        thursday: 'Jueves',
                        friday: 'Viernes',
                        saturday: 'Sábado',
                        sunday: 'Domingo'
                      }).map(([key, label]) => (
                        <span
                          key={key}
                          className={cn(
                            "px-3 py-1 rounded-full text-sm font-medium transition-colors",
                            schedule.daysOfWeek[key as keyof typeof schedule.daysOfWeek]
                              ? "bg-[#d103d1]/10 text-[#d103d1]"
                              : "bg-gray-100 text-gray-400"
                          )}
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Anterior</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-2"
                  >
                    <span className="hidden sm:inline">Siguiente</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-sm text-gray-600">
                  Página {currentPage} de {totalPages}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}