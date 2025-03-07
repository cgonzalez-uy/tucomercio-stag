import { useState } from 'react';
import { useBusinesses } from '../lib/hooks/useBusinesses';
import { usePlans } from '../lib/hooks/usePlans';
import { Button } from '../components/ui/button';
import { DataTable } from '../components/ui/data-table';
import { Check, X, Eye, Store, Search, AlertCircle } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { Business } from '../types/business';
import { Link } from 'react-router-dom';
import { createBusinessUser } from '../lib/business-auth';
import { Input } from '../components/ui/input';
import { cn } from '../lib/utils';

export function RequestsPage() {
  const { businesses, loading, error, updateBusiness } = useBusinesses();
  const { plans } = usePlans();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [operationError, setOperationError] = useState<string | null>(null);

  // Filter only pending requests (inactive businesses)
  const pendingRequests = businesses
    .filter(b => !b.isActive)
    .filter(b => 
      !searchTerm || 
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Mobile card view for each request
  const RequestCard = ({ business }: { business: Business }) => {
    const isProcessing = processingId === business.id;
    const plan = plans.find(p => p.id === business.planId);

    return (
      <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
        {/* Business Info */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg shrink-0">
            <Store className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-gray-900 truncate">{business.name}</h3>
            {business.email && (
              <p className="text-sm text-gray-500 truncate">{business.email}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Registrado el {new Date(business.createdAt).toLocaleDateString()}
            </p>
            {plan && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary mt-2">
                {plan.name}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t">
          <Link to={`/superadmin/businesses/${business.id}/edit`}>
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            onClick={() => handleApprove(business.id)}
            variant="ghost"
            size="sm"
            disabled={isProcessing}
            className="text-green-600"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const handleApprove = async (id: string) => {
    try {
      setProcessingId(id);
      setOperationError(null);
      const business = businesses.find(b => b.id === id);
      
      if (!business) {
        throw new Error('Comercio no encontrado');
      }

      // Update business status
      await updateBusiness(id, { isActive: true });

      // If business has email and paid plan, create user
      const plan = plans.find(p => p.id === business.planId);
      if (business.email && plan && plan.price > 0) {
        try {
          const credentials = await createBusinessUser(business.email, id);
          alert(`Usuario creado exitosamente. Contraseña temporal: ${credentials.password}`);
        } catch (error) {
          console.error('Error creating business user:', error);
          alert('El comercio fue aprobado pero hubo un error al crear el usuario');
        }
      }
    } catch (err) {
      console.error('Error approving request:', err);
      setOperationError('Error al aprobar la solicitud. Por favor, intenta nuevamente.');
    } finally {
      setProcessingId(null);
    }
  };

  const columns: ColumnDef<Business>[] = [
    {
      accessorKey: 'name',
      header: 'Nombre',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Store className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">
              {row.original.name}
            </div>
            {row.original.email && (
              <div className="text-sm text-gray-500 truncate">
                {row.original.email}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Fecha',
      cell: ({ row }) => (
        <div className="text-sm text-gray-500">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const business = row.original;
        const isProcessing = processingId === business.id;

        return (
          <div className="flex justify-end gap-2">
            <Link to={`/superadmin/businesses/${business.id}/edit`}>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              onClick={() => handleApprove(business.id)}
              variant="ghost"
              size="sm"
              disabled={isProcessing}
              className="text-green-600"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  if (loading) {
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
            <Store className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Solicitudes Pendientes</h2>
            <p className="text-sm text-gray-500">
              {pendingRequests.length} {pendingRequests.length === 1 ? 'solicitud' : 'solicitudes'} pendientes
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar solicitudes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Operation Error */}
      {operationError && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{operationError}</p>
        </div>
      )}
      
      {/* Mobile View */}
      <div className="lg:hidden space-y-4">
        {pendingRequests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay solicitudes pendientes
          </div>
        ) : (
          pendingRequests.map(business => (
            <RequestCard key={business.id} business={business} />
          ))
        )}
      </div>

      {/* Desktop View */}
      <div className="hidden lg:block">
        <DataTable
          columns={columns}
          data={pendingRequests}
          searchPlaceholder="Buscar solicitudes..."
          searchColumn="name"
        />
      </div>
    </div>
  );
}