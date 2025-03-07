import { useState } from 'react';
import { usePlanExpirations } from '../../lib/hooks/usePlanExpirations';
import { Button } from '../../components/ui/button';
import { DataTable } from '../../components/ui/data-table';
import { Crown, Check, X, AlertCircle, Search } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { Business } from '../../types/business';
import { Input } from '../../components/ui/input';

export function PlanExpirationsPage() {
  const { expiringBusinesses, loading, error, renewPlan, downgradeToFree, refresh } = usePlanExpirations();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter businesses based on search term
  const filteredBusinesses = expiringBusinesses.filter(business => 
    !searchTerm || business.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: ColumnDef<Business>[] = [
    {
      accessorKey: 'name',
      header: 'Comercio',
      cell: ({ row }) => (
        <div className="text-sm font-medium text-gray-900">{row.original.name}</div>
      ),
    },
    {
      accessorKey: 'planStartDate',
      header: 'Inicio del Plan',
      cell: ({ row }) => (
        <div className="text-sm text-gray-600">
          {row.original.planStartDate.toLocaleDateString()}
        </div>
      ),
      meta: {
        hiddenOnMobile: true
      }
    },
    {
      accessorKey: 'expirationDate',
      header: 'Vence',
      cell: ({ row }) => {
        const expirationDate = new Date(row.original.planStartDate);
        expirationDate.setMonth(expirationDate.getMonth() + 1);
        const daysLeft = Math.ceil((expirationDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        
        return (
          <div className="space-y-1">
            <div className="text-sm text-gray-600">
              {expirationDate.toLocaleDateString()}
            </div>
            <div className="text-xs font-medium text-yellow-600">
              En {daysLeft} días
            </div>
          </div>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const business = row.original;
        const isProcessing = processingId === business.id;

        return (
          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <Button
              onClick={async () => {
                try {
                  setProcessingId(business.id);
                  await renewPlan(business.id);
                  await refresh(); // Refresh data after action
                } finally {
                  setProcessingId(null);
                }
              }}
              variant="outline"
              size="sm"
              disabled={isProcessing}
              className="text-green-600 hover:text-green-700 whitespace-nowrap"
            >
              <Check className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Renovar</span>
            </Button>
            <Button
              onClick={async () => {
                try {
                  setProcessingId(business.id);
                  await downgradeToFree(business.id);
                  await refresh(); // Refresh data after action
                } finally {
                  setProcessingId(null);
                }
              }}
              variant="outline"
              size="sm"
              disabled={isProcessing}
              className="text-red-500 hover:text-red-600 whitespace-nowrap"
            >
              <X className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Pasar a gratuito</span>
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
      <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Crown className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Vencimientos de Planes</h2>
            <p className="text-sm text-gray-500">
              {expiringBusinesses.length} {expiringBusinesses.length === 1 ? 'comercio' : 'comercios'} con plan próximo a vencer
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar - Visible on both mobile and desktop */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar comercios..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Mobile View */}
      <div className="block lg:hidden space-y-4">
        {filteredBusinesses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No se encontraron comercios
          </div>
        ) : (
          filteredBusinesses.map(business => {
            const expirationDate = new Date(business.planStartDate);
            expirationDate.setMonth(expirationDate.getMonth() + 1);
            const daysLeft = Math.ceil((expirationDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            const isProcessing = processingId === business.id;

            return (
              <div key={business.id} className="bg-white p-4 rounded-lg shadow-sm space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900">{business.name}</h3>
                  <div className="mt-2 space-y-1">
                    <div className="text-sm text-gray-600">
                      Vence el {expirationDate.toLocaleDateString()}
                    </div>
                    <div className="text-sm font-medium text-yellow-600">
                      En {daysLeft} días
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={async () => {
                      try {
                        setProcessingId(business.id);
                        await renewPlan(business.id);
                        await refresh();
                      } finally {
                        setProcessingId(null);
                      }
                    }}
                    variant="outline"
                    size="sm"
                    disabled={isProcessing}
                    className="flex-1 text-green-600 hover:text-green-700"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Renovar
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        setProcessingId(business.id);
                        await downgradeToFree(business.id);
                        await refresh();
                      } finally {
                        setProcessingId(null);
                      }
                    }}
                    variant="outline"
                    size="sm"
                    disabled={isProcessing}
                    className="flex-1 text-red-500 hover:text-red-600"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Pasar a gratuito
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop View */}
      <div className="hidden lg:block">
        <DataTable
          columns={columns}
          data={filteredBusinesses}
          searchPlaceholder="Buscar comercios..."
          searchColumn="name"
        />
      </div>
    </div>
  );
}