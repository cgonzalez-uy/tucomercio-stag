import { Link } from 'react-router-dom';
import { BusinessList } from '../components/admin/BusinessList';
import { Button } from '../components/ui/button';
import { Plus } from 'lucide-react';

export function BusinessesPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Comercios</h2>
        <Link to="new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nuevo comercio
          </Button>
        </Link>
      </div>
      <BusinessList />
    </div>
  );
}