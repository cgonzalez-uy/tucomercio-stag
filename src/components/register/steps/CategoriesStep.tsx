import { useSettings } from '../../../lib/hooks/useSettings';
import { Button } from '../../ui/button';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface CategoriesStepProps {
  data: {
    categories: string[];
  };
  onChange: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
  onCancel: () => void;
}

export function CategoriesStep({ data, onChange, onNext, onBack, onCancel }: CategoriesStepProps) {
  const { settings: categories } = useSettings('categories');
  const activeCategories = categories.filter(cat => cat.isActive);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (data.categories.length === 0) {
      // Mostrar mensaje de error personalizado
      const errorDiv = document.getElementById('categories-error');
      if (errorDiv) {
        errorDiv.style.display = 'flex';
        // Ocultar el mensaje después de 3 segundos
        setTimeout(() => {
          errorDiv.style.display = 'none';
        }, 3000);
      }
      return;
    }
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl mx-auto" noValidate>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Selecciona hasta 3 categorías que mejor describan tu comercio <span className="text-red-500">*</span>
        </label>

        {/* Mensaje de error */}
        <div 
          id="categories-error" 
          className="hidden items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-md text-red-600"
          role="alert"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="text-sm">Por favor selecciona al menos una categoría</span>
        </div>

        {/* Grid de categorías */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {activeCategories.map((category) => (
            <label 
              key={category.id} 
              className={cn(
                "flex items-center gap-3 p-4 border rounded-lg transition-colors",
                "hover:bg-gray-50 cursor-pointer",
                !data.categories.includes(category.name) && data.categories.length >= 3 && "opacity-50"
              )}
            >
              <input
                type="checkbox"
                checked={data.categories.includes(category.name)}
                onChange={(e) => {
                  const newCategories = e.target.checked
                    ? [...data.categories, category.name]
                    : data.categories.filter((c) => c !== category.name);
                  
                  if (newCategories.length <= 3) {
                    onChange({ ...data, categories: newCategories });
                  }
                }}
                className="rounded border-gray-300 text-primary focus:ring-primary"
                disabled={!data.categories.includes(category.name) && data.categories.length >= 3}
              />
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm text-gray-700 truncate">{category.name}</span>
                <div 
                  className="w-4 h-4 rounded-full shrink-0" 
                  style={{ backgroundColor: category.color }}
                />
              </div>
            </label>
          ))}
        </div>

        {data.categories.length >= 3 && (
          <p className="mt-3 text-sm text-amber-600">
            Has alcanzado el máximo de 3 categorías permitidas
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
        <Button type="submit">
          Continuar
        </Button>
          <Button type="button" variant="outline" onClick={onBack}>
            Atrás
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
       
      </div>
    </form>
  );
}