import { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { Business } from '../../types/business';

interface BusinessSelectorProps {
  selectedBusinesses: string[];
  onBusinessSelect: (businessId: string) => void;
  onBusinessDeselect: (businessId: string) => void;
  categoryId?: string;
}

export function BusinessSelector({
  selectedBusinesses,
  onBusinessSelect,
  onBusinessDeselect,
  categoryId
}: BusinessSelectorProps) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [businessCategories, setBusinessCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(9);

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const businessesQuery = query(collection(db, 'businesses'));
        const snapshot = await getDocs(businessesQuery);
        const businessesList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Business[];
        setBusinesses(businessesList);
        
        // Extract unique business categories
        const categories = new Set<string>();
        businessesList.forEach(business => {
          if (business.categories && Array.isArray(business.categories)) {
            business.categories.forEach(cat => categories.add(cat));
          }
        });
        setBusinessCategories(Array.from(categories).sort());
      } catch (err) {
        console.error('Error fetching businesses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinesses();
  }, []);

  useEffect(() => {
    setSelectedCount(selectedBusinesses.length);
  }, [selectedBusinesses]);

  const filteredBusinesses = businesses.filter(business => {
    const matchesSearch = business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (business.description && business.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategories = selectedCategories.length === 0 ||
      (business.categories && business.categories.some(cat => selectedCategories.includes(cat)));

    return matchesSearch && matchesCategories;
  });

  const handleBusinessToggle = (businessId: string) => {
    if (selectedBusinesses.includes(businessId)) {
      onBusinessDeselect(businessId);
    } else {
      onBusinessSelect(businessId);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Buscar comercios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* Category dropdown button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            className="w-full sm:w-auto px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between"
          >
            <span>{selectedCategories.length > 0 ? `${selectedCategories.length} categorías seleccionadas` : 'Selecciona categorías'}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          
          {/* Category dropdown */}
          {showCategoryDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-96 overflow-y-auto">
              <div className="p-2 border-b border-gray-200 sticky top-0 bg-white z-20">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Categorías</span>
                  {selectedCategories.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedCategories([])}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>
              </div>
              <div className="p-2">
                {businessCategories.map(category => (
                  <div key={category} className="py-1">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={() => {
                          setSelectedCategories(prev => 
                            prev.includes(category) 
                              ? prev.filter(c => c !== category) 
                              : [...prev, category]
                          );
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">{category}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selected categories display */}
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 pb-2">
          {selectedCategories.map(category => (
            <span 
              key={category}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              {category}
              <button
                type="button"
                onClick={() => setSelectedCategories(prev => prev.filter(c => c !== category))}
                className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-600 focus:outline-none"
              >
                <span className="sr-only">Remove</span>
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Selected count */}
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">
          {selectedCount} comercios seleccionados
        </span>
      </div>

      {/* Business list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBusinesses.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500">No se encontraron comercios</p>
          </div>
        ) : (
          <>
            {filteredBusinesses.slice(0, itemsPerPage).map(business => (
              <div
                key={business.id}
                className={`p-4 border rounded-lg ${selectedBusinesses.includes(business.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className="flex items-start">
                  {business.logoUrl && (
                    <div className="flex-shrink-0 mr-3">
                      <img
                        src={business.logoUrl}
                        alt={business.name}
                        className="w-12 h-12 object-cover rounded-full"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium">{business.name}</h3>
                    {business.description && (
                      <p className="text-sm text-gray-500 line-clamp-2">{business.description}</p>
                    )}
                    {business.categories && business.categories.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {business.categories.map(category => (
                          <span
                            key={category}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <input
                      type="checkbox"
                      id={`business-${business.id}`}
                      checked={selectedBusinesses.includes(business.id)}
                      onChange={() => handleBusinessToggle(business.id)}
                      className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>
            ))}
            
            {filteredBusinesses.length > itemsPerPage && (
              <div className="col-span-full text-center mt-6">
                <button
                  type="button"
                  onClick={() => setItemsPerPage(prev => prev + 9)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Ver más comercios ({filteredBusinesses.length - itemsPerPage} restantes)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}