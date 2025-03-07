import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebase';
import { useFavorites } from '../lib/hooks/useFavorites';
import { useBusinesses } from '../lib/hooks/useBusinesses';
import { useSettings } from '../lib/hooks/useSettings';
import { BusinessCard } from '../components/BusinessCard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Link } from 'react-router-dom';
import { Store, ArrowLeft, Search } from 'lucide-react';
import { useState } from 'react';

export function FavoritesPage() {
  const [user] = useAuthState(auth);
  const { favorites, loading: loadingFavorites } = useFavorites(user?.uid);
  const { businesses, loading: loadingBusinesses } = useBusinesses();
  const { settings: categories } = useSettings('categories');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter favorite businesses based on search term
  const favoriteBusinesses = businesses
    .filter(b => favorites.includes(b.id))
    .filter(b => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        b.name.toLowerCase().includes(term) ||
        b.description.toLowerCase().includes(term) ||
        b.shortDescription.toLowerCase().includes(term) ||
        b.categories.some(cat => cat.toLowerCase().includes(term))
      );
    });

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Inicia sesión para ver tus favoritos
          </h2>
          <Button asChild>
            <Link to="/">Volver al inicio</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (loadingFavorites || loadingBusinesses) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center gap-4 mb-8">
          <Link 
            to="/profile"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver a mi perfil</span>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Mis Favoritos
          </h1>

          {/* Search box */}
          {favorites.length > 0 && (
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar en favoritos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-[300px]"
              />
            </div>
          )}
        </div>

        {favoriteBusinesses.length === 0 ? (
          <div className="text-center max-w-md mx-auto">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Store className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {searchTerm ? 'No se encontraron resultados' : 'No tienes favoritos'}
            </h2>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? 'Intenta con otros términos de búsqueda'
                : 'Explora los comercios y guarda tus favoritos para acceder rápidamente a ellos'
              }
            </p>
            <Button asChild>
              <Link to="/">Explorar comercios</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoriteBusinesses.map((business) => (
              <BusinessCard
                key={business.id}
                id={business.id}
                name={business.name}
                shortDescription={business.shortDescription}
                categories={business.categories.map(categoryName => {
                  const category = categories.find(c => c.name === categoryName);
                  return {
                    name: categoryName,
                    color: category?.color || '#3B82F6'
                  };
                })}
                address={business.address}
                phone={business.phone}
                image={business.image}
                website={business.website}
                instagram={business.instagram}
                facebook={business.facebook}
                whatsapp={business.whatsapp}
                shippingMethods={business.shippingMethods}
                schedule={business.schedule}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}