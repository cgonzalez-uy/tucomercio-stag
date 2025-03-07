import { useState } from 'react';
import { usePointsOfInterest } from '../lib/hooks/usePointsOfInterest';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';
import { Search, MapPin, ArrowLeft, Phone, Clock, Landmark, Building2, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { POI_TYPES } from '../types/poi';
import { cn } from '../lib/utils';
import { Navbar } from '../components/Navbar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

const ITEMS_PER_PAGE = 9; // Show 9 POIs initially (3x3 grid)

export function PointsOfInterestPage() {
  const { pois, loading, error } = usePointsOfInterest();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSchedules, setExpandedSchedules] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');

  // Filter POIs based on search term and filters
  const filteredPois = pois.filter(poi => {
    if (!poi.isActive) return false;

    // Search filter
    const searchMatch = !searchTerm || 
      poi.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      poi.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      poi.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      poi.phones.some(phone => phone.includes(searchTerm));

    // Type filter
    const typeMatch = selectedType === 'all' || poi.type === selectedType;

    // Status filter
    const isOpen = Object.values(poi.schedule).some(day => 
      day.isOpen && day.hours.toLowerCase().includes('24 horas')
    );
    const statusMatch = statusFilter === 'all' || 
      (statusFilter === 'open' && isOpen) ||
      (statusFilter === 'closed' && !isOpen);

    return searchMatch && typeMatch && statusMatch;
  });

  // Get POIs to display based on current display count
  const displayedPois = filteredPois.slice(0, displayCount);
  const hasMore = displayCount < filteredPois.length;

  const loadMore = () => {
    setDisplayCount(prev => prev + ITEMS_PER_PAGE);
  };

  const toggleSchedule = (poiId: string) => {
    setExpandedSchedules(prev => 
      prev.includes(poiId)
        ? prev.filter(id => id !== poiId)
        : [...prev, poiId]
    );
  };

  // Reset display count when filters change
  const handleFilterChange = () => {
    setDisplayCount(ITEMS_PER_PAGE);
  };

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
            <Navbar />
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#3cbed0] to-[#2193a3] text-white pt-16">
        <div className="container mx-auto px-4 py-16 max-w-7xl">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-full">
                <Landmark className="h-8 w-8" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Puntos de Interés
            </h1>
            <p className="text-lg text-white/90 md:text-xl">
              Encuentra información útil sobre servicios públicos, emergencias, bancos y más en tu ciudad.
              Todo lo que necesitas saber en un solo lugar.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 max-w-7xl">

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 space-y-6">
          {/* Search */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por nombre, dirección o teléfono..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  handleFilterChange();
                }}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
            </Button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <Select 
                  value={selectedType} 
                  onValueChange={(value) => {
                    setSelectedType(value);
                    handleFilterChange();
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    {Object.entries(POI_TYPES).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <Select 
                  value={statusFilter} 
                  onValueChange={(value: 'all' | 'open' | 'closed') => {
                    setStatusFilter(value);
                    handleFilterChange();
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="open">Abierto 24h</SelectItem>
                    <SelectItem value="closed">Cerrado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* POI List */}
        {filteredPois.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No se encontraron resultados
            </h2>
            <p className="text-gray-600">
              {searchTerm || selectedType !== 'all' || statusFilter !== 'all'
                ? 'Intenta ajustando los filtros de búsqueda'
                : 'No hay puntos de interés disponibles'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedPois.map((poi) => (
                <div
                  key={poi.id}
                  className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-primary/20 hover:-translate-y-1"
                >
                  {/* Header */}
                  <div className="p-6 border-b bg-gradient-to-br from-primary/5 to-primary/10">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                        <MapPin className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                          {poi.name}
                        </h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white text-primary mt-1 shadow-sm">
                          {POI_TYPES[poi.type as keyof typeof POI_TYPES]}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-5">
                    {/* Description */}
                    {poi.description && (
                      <div className="flex items-start gap-3">
                        <div className="p-1 bg-primary/5 rounded-lg">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {poi.description}
                        </p>
                      </div>
                    )}

                    {/* Address */}
                    <div className="flex items-start gap-3">
                      <div className="p-1 bg-primary/5 rounded-lg">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{poi.address}</p>
                    </div>

                    {/* Phones */}
                    {poi.phones.length > 0 && (
                      <div className="flex items-start gap-3">
                        <div className="p-1 bg-primary/5 rounded-lg">
                          <Phone className="h-4 w-4 text-primary" />
                        </div>
                        <div className="space-y-1">
                          {poi.phones.map((phone, index) => (
                            <a
                              key={index}
                              href={`tel:${phone.replace(/\s/g, '')}`}
                              className="block text-sm text-gray-600 hover:text-primary transition-colors"
                            >
                              {phone}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Schedule */}
                    <div className="border-t pt-4 mt-4">
                      <button
                        onClick={() => toggleSchedule(poi.id)}
                        className="flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-primary transition-colors w-full group/schedule"
                      >
                        <div className="p-1 bg-primary/5 rounded-lg">
                          <Clock className="h-4 w-4 text-primary" />
                        </div>
                        <span className="flex-1 text-left">Horarios</span>
                        <div className="p-1 bg-primary/5 rounded-lg group-hover/schedule:bg-primary/10 transition-colors">
                          {expandedSchedules.includes(poi.id) ? (
                            <ChevronUp className="h-4 w-4 text-primary" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      </button>

                      {expandedSchedules.includes(poi.id) && (
                        <div className="mt-3 pl-10 space-y-2">
                          {Object.entries({
                            monday: 'Lunes',
                            tuesday: 'Martes',
                            wednesday: 'Miércoles',
                            thursday: 'Jueves',
                            friday: 'Viernes',
                            saturday: 'Sábado',
                            sunday: 'Domingo'
                          }).map(([day, label]) => {
                            const schedule = poi.schedule[day as keyof typeof poi.schedule];
                            const is24Hours = schedule.hours.toLowerCase().includes('24 horas');
                            return (
                              <div key={day} className={cn(
                                "flex justify-between gap-4 text-sm rounded-lg p-2 transition-colors",
                                schedule.isOpen 
                                  ? "bg-primary/5" 
                                  : "bg-gray-50 text-gray-400",
                                is24Hours && "bg-green-50"
                              )}>
                                <span className="font-medium">{label}</span>
                                <span className={cn(
                                  "font-medium",
                                  is24Hours && "text-green-600"
                                )}>
                                  {schedule.isOpen ? schedule.hours : 'Cerrado'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={loadMore}
                  className="group"
                >
                  <ChevronDown className="h-4 w-4 mr-2 group-hover:translate-y-0.5 transition-transform" />
                  Mostrar más lugares
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}