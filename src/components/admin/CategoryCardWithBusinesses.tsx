import { useState, useMemo, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { CampaignCategory } from '../../types/campaign-category';
import type { Business } from '../../types/business';

interface CategoryCardWithBusinessesProps {
  category: CampaignCategory;
  selectedBusinesses: string[];
  availableBusinesses: Business[];
  onBusinessesAssigned: (businessIds: string[]) => void;
  onDeleteCategory?: (categoryId: string) => void;
}

export function CategoryCardWithBusinesses({
  category,
  selectedBusinesses,
  availableBusinesses,
  onBusinessesAssigned,
  onDeleteCategory
}: CategoryCardWithBusinessesProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [liveCategory, setLiveCategory] = useState<CampaignCategory>(category);
  const [isLoading, setIsLoading] = useState(false);
  
  // Set up real-time listener for category changes
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onSnapshot(
      doc(db, 'campaign-categories', category.id),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const updatedCategory = {
            id: docSnapshot.id,
            ...docSnapshot.data()
          } as CampaignCategory;
          setLiveCategory(updatedCategory);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error('Error listening to category updates:', error);
        setIsLoading(false);
      }
    );
    
    // Clean up listener on unmount
    return () => unsubscribe();
  }, [category.id]);

  const handleToggleBusiness = (businessId: string) => {
    const newSelectedBusinesses = selectedBusinesses.includes(businessId)
      ? selectedBusinesses.filter(id => id !== businessId)
      : [...selectedBusinesses, businessId];
    
    onBusinessesAssigned(newSelectedBusinesses);
  };

  const handleLoadMore = () => {
    setItemsPerPage(prev => prev + 5);
  };

  const paginatedBusinesses = useMemo(() => {
    return availableBusinesses.slice(0, itemsPerPage);
  }, [availableBusinesses, itemsPerPage]);
  
  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };
  
  const totalPages = Math.ceil(availableBusinesses.length / itemsPerPage);

  // Function to handle category deletion with confirmation
  const handleDeleteCategory = () => {
    if (window.confirm(`¿Estás seguro de eliminar la categoría "${liveCategory.name}"?`)) {
      onDeleteCategory?.(category.id);
    }
  };

  return (
    <div
      className="overflow-hidden rounded-lg shadow-md transition-all duration-300 border border-gray-200 relative"
      style={{
        backgroundColor: liveCategory.backgroundColor || '#f3f4f6',
        color: liveCategory.textColor || '#1f2937'
      }}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}
      
      {/* Delete button */}
      {onDeleteCategory && (
        <button
          type="button"
          onClick={handleDeleteCategory}
          className="absolute top-2 right-2 p-1 bg-red-100 rounded-full shadow-sm hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 z-20"
          aria-label="Eliminar categoría"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </button>
      )}
      <div className="aspect-[16/9] overflow-hidden">
        <img
          src={liveCategory.imageUrl}
          alt={liveCategory.name}
          className="w-full h-full object-cover transition-opacity duration-300"
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-1">{liveCategory.name}</h3>
        {liveCategory.description && (
          <p className="text-sm opacity-90 mb-2">{liveCategory.description}</p>
        )}
        
        <div className="mt-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">
              {selectedBusinesses.length} comercios seleccionados
            </span>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {isExpanded ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
          
          {isExpanded && (
            <div className="mt-3 space-y-2 max-h-72 overflow-y-auto bg-white bg-opacity-90 p-3 rounded-md shadow-inner">
              {availableBusinesses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-gray-500">No hay comercios disponibles</p>
                </div>
              ) : (
                <>
                  <div className="mb-2 pb-2 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-500">NOMBRE DEL COMERCIO</span>
                      <span className="text-xs font-medium text-gray-500">SELECCIONAR</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {paginatedBusinesses.map(business => (
                      <div key={business.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md transition-colors">
                        <label
                          htmlFor={`business-${liveCategory.id}-${business.id}`}
                          className="flex-1 block text-sm cursor-pointer"
                        >
                          {business.name}
                        </label>
                        <input
                          type="checkbox"
                          id={`business-${liveCategory.id}-${business.id}`}
                          checked={selectedBusinesses.includes(business.id)}
                          onChange={() => handleToggleBusiness(business.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 flex justify-between items-center">
                    {totalPages > 1 && (
                      <div className="flex space-x-1">
                        {Array.from({ length: Math.min(totalPages, 3) }).map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => handlePageChange(idx + 1)}
                            className={`w-7 h-7 text-xs rounded-md ${currentPage === idx + 1 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                          >
                            {idx + 1}
                          </button>
                        ))}
                        {totalPages > 3 && <span className="text-gray-500 self-center">...</span>}
                      </div>
                    )}
                    
                    {availableBusinesses.length > itemsPerPage && (
                      <button
                        type="button"
                        onClick={handleLoadMore}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium px-3 py-1 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors ml-auto"
                      >
                        Ver más ({availableBusinesses.length - itemsPerPage})
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}