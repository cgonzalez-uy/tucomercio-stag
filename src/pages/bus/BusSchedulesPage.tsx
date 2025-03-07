import { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../lib/firebase';
import { useBusSchedules } from '../../lib/hooks/useBusSchedules';
import { useBusRoutes } from '../../lib/hooks/useBusRoutes';
import { useBusLines } from '../../lib/hooks/useBusLines';
import { useBusLineTypes } from '../../lib/hooks/useBusLineTypes';
import { useBusDestinations } from '../../lib/hooks/useBusDestinations';
import { useSavedSchedules } from '../../lib/hooks/useSavedSchedules';
import { Button } from '../../components/ui/button';
import { Bus, Calendar, Clock, ChevronLeft, ChevronRight, Heart, ArrowRight, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import { UserAuthModal } from '../../components/auth/UserAuthModal';
import { Link } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Calendar as CalendarComponent } from '../../components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../components/ui/popover';

const ITEMS_PER_PAGE = 5;

export function BusSchedulesPage() {
  const [user] = useAuthState(auth);
  const [selectedOriginTerminal, setSelectedOriginTerminal] = useState<string>('');
  const [selectedDestinationTerminal, setSelectedDestinationTerminal] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>(format(new Date(), 'HH:mm'));
  const [showResults, setShowResults] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const { schedules, loading: loadingSchedules } = useBusSchedules();
  const { routes } = useBusRoutes();
  const { lines } = useBusLines();
  const { types } = useBusLineTypes();
  const { destinations } = useBusDestinations();
  const { saveSchedule, unsaveSchedule, isScheduleSaved } = useSavedSchedules(user?.uid);

  // Get unique terminals
  const terminals = [...new Set(destinations.map(d => d.terminal))].sort();

  // Get filtered schedules
  const filteredSchedules = schedules.filter(schedule => {
    const route = routes.find(r => r.id === schedule.routeId);
    if (!route) return false;

    const origin = destinations.find(d => d.id === route.originId);
    const destination = destinations.find(d => d.id === route.destinationId);
    if (!origin || !destination) return false;

    // Filter by terminals
    if (selectedOriginTerminal && origin.terminal !== selectedOriginTerminal) return false;
    if (selectedDestinationTerminal && destination.terminal !== selectedDestinationTerminal) return false;

    // Filter by day
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const selectedDay = days[selectedDate.getDay()];
    if (!schedule.daysOfWeek[selectedDay as keyof typeof schedule.daysOfWeek]) return false;

    // Filter out schedules earlier than selected time
    if (schedule.departureTime < selectedTime) return false;

    return true;
  }).sort((a, b) => a.departureTime.localeCompare(b.departureTime));

  // Find the next available schedule
  const nextScheduleTime = filteredSchedules[0]?.departureTime;

  // Calculate pagination
  const totalPages = Math.ceil(filteredSchedules.length / ITEMS_PER_PAGE);
  const paginatedSchedules = filteredSchedules.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to results section
    const resultsElement = document.getElementById('search-results');
    if (resultsElement) {
      resultsElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle favorite toggle
  const handleFavoriteToggle = async (schedule: any) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      const route = routes.find(r => r.id === schedule.routeId);
      if (!route) return;

      const line = lines.find(l => l.id === route.lineId);
      const type = types.find(t => t.id === route.typeId);
      const origin = destinations.find(d => d.id === route.originId);
      const destination = destinations.find(d => d.id === route.destinationId);

      if (!line || !type || !origin || !destination) return;

      const routeData = {
        line,
        type,
        origin,
        destination
      };

      if (isScheduleSaved(schedule.id)) {
        await unsaveSchedule(schedule.id);
      } else {
        await saveSchedule(schedule, routeData);
      }
    } catch (err) {
      console.error('Error toggling schedule favorite:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f1f5]">
      <div className="container mx-auto px-4 py-12 max-w-lg">
        {/* Back button */}
        <div className="mb-8">
          <Link 
            to="/"
            className="inline-flex items-center gap-2 text-[#d103d1] hover:text-[#d103d1]/90 bg-white/90 hover:bg-white px-4 py-2 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver</span>
          </Link>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl p-8 space-y-8">
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Selecciona Tú Destino
          </h1>

          {/* Origin Terminal */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Desde
            </label>
            <Select value={selectedOriginTerminal} onValueChange={setSelectedOriginTerminal}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona terminal de origen" />
              </SelectTrigger>
              <SelectContent>
                {terminals.map(terminal => (
                  <SelectItem 
                    key={terminal} 
                    value={terminal}
                    disabled={terminal === selectedDestinationTerminal}
                  >
                    {terminal}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Destination Terminal */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Hacia
            </label>
            <Select value={selectedDestinationTerminal} onValueChange={setSelectedDestinationTerminal}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona terminal de destino" />
              </SelectTrigger>
              <SelectContent>
                {terminals.map(terminal => (
                  <SelectItem 
                    key={terminal} 
                    value={terminal}
                    disabled={terminal === selectedOriginTerminal}
                  >
                    {terminal}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Selection */}
          <div className="grid grid-cols-2 gap-4">
            {/* Current Date Display */}
            <div className="bg-white rounded-xl p-4 text-center border-2 border-[#d103d1]/20 hover:border-[#d103d1]/30 transition-colors">
              <div className="flex flex-col items-center">
                <div className="text-sm font-medium text-[#d103d1] uppercase tracking-wider mb-1">
                  {format(selectedDate, 'MMMM', { locale: es })}
                </div>
                <div className="text-4xl font-bold text-gray-900 leading-none mb-1">
                  {format(selectedDate, 'd')}
                </div>
                <div className="text-sm font-medium text-gray-500 capitalize">
                  {format(selectedDate, 'EEEE', { locale: es })}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {format(selectedDate, 'yyyy')}
                </div>
              </div>
            </div>

            {/* Date Picker */}
            <div className="space-y-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-full justify-center text-left font-normal",
                      "bg-white hover:bg-gray-50 border-2 border-[#d103d1]/20 hover:border-[#d103d1]/30",
                      "transition-colors rounded-xl"
                    )}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <Calendar className="h-5 w-5 text-[#d103d1]" />
                      <span className="text-sm text-gray-600">Cambiar fecha</span>
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Horario
            </label>
            <div className="relative">
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className={cn(
                  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2",
                  "text-sm ring-offset-background file:border-0 file:bg-transparent",
                  "file:text-sm file:font-medium placeholder:text-muted-foreground",
                  "focus-visible:outline-none focus-visible:ring-2",
                  "focus-visible:ring-ring focus-visible:ring-offset-2"
                )}
              />
              <Clock className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Search Button */}
          <Button
            onClick={() => {
              setShowResults(true);
              setCurrentPage(1);
            }}
            className="w-full bg-[#d103d1] hover:bg-[#d103d1]/90 text-white"
            size="lg"
            disabled={!selectedOriginTerminal || !selectedDestinationTerminal}
          >
           
            Buscar
          </Button>
        </div>

        {/* Results */}
        {showResults && (
          <div id="search-results" className="mt-8 bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {filteredSchedules.length === 0 ? (
                  'No hay horarios disponibles'
                ) : (
                  `Horarios Disponibles (${filteredSchedules.length})`
                )}
              </h2>

              {filteredSchedules.length > 0 && (
                <>
                  <div className="space-y-4">
                    {paginatedSchedules.map(schedule => {
                      const route = routes.find(r => r.id === schedule.routeId);
                      if (!route) return null;

                      const line = lines.find(l => l.id === route.lineId);
                      const type = types.find(t => t.id === route.typeId);
                      const origin = destinations.find(d => d.id === route.originId);
                      const destination = destinations.find(d => d.id === route.destinationId);
                      const isNextSchedule = schedule.departureTime === nextScheduleTime;
                      const isSaved = isScheduleSaved(schedule.id);

                      return (
                        <div 
                          key={schedule.id}
                          className={cn(
                            "bg-white rounded-xl shadow-sm border border-gray-100",
                            "hover:shadow-md transition-all duration-200",
                            isNextSchedule && "ring-2 ring-[#e78be7]"
                          )}
                        >
                          {/* Header with Time, Line and Type */}
                          <div className="p-4 border-b bg-gray-50/50">
                            <div className="flex items-center justify-between">
                              {/* Time */}
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "p-2 rounded-lg",
                                  isNextSchedule ? "bg-[#d103d1]/20" : "bg-[#d103d1]/10"
                                )}>
                                  <Clock className="h-5 w-5 text-[#d103d1]" />
                                </div>
                                <div>
                                  <div className={cn(
                                    "text-2xl font-bold",
                                    isNextSchedule ? "text-[#d103d1]" : "text-gray-900"
                                  )}>
                                    {schedule.departureTime}
                                  </div>
                                  <div className="text-sm text-gray-500">hrs</div>
                                </div>
                              </div>

                              {/* Save Button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleFavoriteToggle(schedule)}
                                className={cn(
                                  "text-gray-500 hover:text-red-500 rounded-full aspect-square",
                                  isSaved && "text-red-500"
                                )}
                              >
                                <Heart className={cn("h-5 w-5", isSaved && "fill-current")} />
                              </Button>
                            </div>
                          </div>

                          {/* Line and Route Info */}
                          <div className="p-4">
                            {/* Line and Type */}
                            <div className="flex items-center gap-2 mb-4">
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-semibold text-gray-900">
                                  {line?.code}
                                </span>
                                <span className="px-2 py-1 bg-primary/10 rounded text-sm font-medium text-primary">
                                  {type?.name}
                                </span>
                              </div>
                            </div>

                            {/* Route */}
                            <div className="flex items-center gap-2 text-gray-700 mb-4">
                              <span className="font-medium">{origin?.name}</span>
                              <ArrowRight className="h-4 w-4 text-gray-400" />
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
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <Button
                        variant="outline"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="flex items-center gap-2"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">Anterior</span>
                      </Button>
                      
                      <div className="text-sm text-gray-600">
                        Página {currentPage} de {totalPages}
                      </div>

                      <Button
                        variant="outline"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-2"
                      >
                        <span className="hidden sm:inline">Siguiente</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Auth Modal */}
        <UserAuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </div>
    </div>
  );
}