import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBusinesses } from '../../lib/hooks/useBusinesses';
import { useChats } from '../../lib/hooks/useChats';
import { Button } from '../ui/button';
import { DataTable } from '../ui/data-table';
import { Edit2, Trash2, Power, MessageCircle, Store, Search, Filter } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { Business } from '../../types/business';
import { DeleteBusinessDialog } from './DeleteBusinessDialog';
import { ChatWindow } from '../chat/ChatWindow';
import { cn } from '../../lib/utils';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

export function BusinessList() {
  const { businesses, loading, error, deleteBusiness, updateBusiness } = useBusinesses();
  const { createChat } = useChats();
  const [businessToDelete, setBusinessToDelete] = useState<Business | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [loadingChat, setLoadingChat] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPlan, setSelectedPlan] = useState<string>('all');
  const [selectedHasPortal, setSelectedHasPortal] = useState<string>('all');

  const handleStartChat = async (businessId: string) => {
    try {
      setLoadingChat(true);
      const chatId = await createChat(businessId);
      setSelectedChatId(chatId);
    } catch (err) {
      console.error('Error starting chat:', err);
    } finally {
      setLoadingChat(false);
    }
  };

  const handleDeleteBusiness = async () => {
    if (!businessToDelete) return;

    try {
      await deleteBusiness(businessToDelete.id);
      setBusinessToDelete(null);
    } catch (err) {
      console.error('Error deleting business:', err);
    }
  };

  // Filter businesses based on search and filters
  const filteredBusinesses = businesses.filter(business => {
    // Search filter
    const searchMatch = !searchTerm || 
      business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.categories.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()));

    // Status filter
    const statusMatch = selectedStatus === 'all' || 
      (selectedStatus === 'active' && business.isActive) ||
      (selectedStatus === 'inactive' && !business.isActive);

    // Plan filter
    const planMatch = selectedPlan === 'all' || business.planId === selectedPlan;

    // Portal access filter
    const portalMatch = selectedHasPortal === 'all' ||
      (selectedHasPortal === 'yes' && business.hasPortalAccess) ||
      (selectedHasPortal === 'no' && !business.hasPortalAccess);

    return searchMatch && statusMatch && planMatch && portalMatch;
  });

  // Mobile card view for each business
  const BusinessCard = ({ business }: { business: Business }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
      {/* Business Info */}
      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary/10 rounded-lg shrink-0">
          <Store className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-gray-900 truncate">{business.name}</h3>
          <div className="mt-1 flex flex-wrap gap-1">
            {business.categories.map((category) => (
              <span
                key={category}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary"
              >
                {category}
              </span>
            ))}
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
            business.isActive
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          )}
        >
          {business.isActive ? 'Activo' : 'Inactivo'}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-4 border-t">
        <Button
          onClick={() => handleStartChat(business.id)}
          variant="ghost"
          size="sm"
          disabled={loadingChat}
          className="text-primary"
        >
          <MessageCircle className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => updateBusiness(business.id, { isActive: !business.isActive })}
          variant="ghost"
          size="sm"
          className={business.isActive ? 'text-green-600' : 'text-red-600'}
        >
          <Power className="h-4 w-4" />
        </Button>
        <Link to={`${business.id}/edit`}>
          <Button variant="ghost" size="sm">
            <Edit2 className="h-4 w-4" />
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setBusinessToDelete(business)}
          className="text-red-500"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

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
            <div className="flex flex-wrap gap-1 mt-1">
              {row.original.categories.map((category) => (
                <span
                  key={category}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Estado',
      cell: ({ row }) => (
        <span
          className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
            row.original.isActive
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          )}
        >
          {row.original.isActive ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const business = row.original;
        return (
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => handleStartChat(business.id)}
              variant="ghost"
              size="sm"
              disabled={loadingChat}
              className="text-primary"
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => updateBusiness(business.id, { isActive: !business.isActive })}
              variant="ghost"
              size="sm"
              className={business.isActive ? 'text-green-600' : 'text-red-600'}
            >
              <Power className="h-4 w-4" />
            </Button>
            <Link to={`${business.id}/edit`}>
              <Button variant="ghost" size="sm">
                <Edit2 className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setBusinessToDelete(business)}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
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
    <>
      {/* Search and Filters */}
      <div className="space-y-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar comercios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
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

        {showFilters && (
          <div className="grid sm:grid-cols-3 gap-4 bg-white p-4 rounded-lg shadow-sm">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plan
              </label>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los planes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los planes</SelectItem>
                  <SelectItem value="SsziYy1lsmwlineVK8hy">Plan Gratis</SelectItem>
                  <SelectItem value="xqYW474CAcWUszo6RpyK">Plan Básico</SelectItem>
                  <SelectItem value="vcHA0MWiq7nUTpuldkIb">Plan Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Acceso al portal
              </label>
              <Select value={selectedHasPortal} onValueChange={setSelectedHasPortal}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="yes">Con acceso</SelectItem>
                  <SelectItem value="no">Sin acceso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Mobile View */}
      <div className="lg:hidden space-y-4">
        {filteredBusinesses.map(business => (
          <BusinessCard key={business.id} business={business} />
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden lg:block">
        <DataTable
          columns={columns}
          data={filteredBusinesses}
          searchPlaceholder="Buscar comercios..."
          searchColumn="name"
        >
          <DeleteBusinessDialog
            isOpen={businessToDelete !== null}
            onClose={() => setBusinessToDelete(null)}
            onConfirm={handleDeleteBusiness}
            businessName={businessToDelete?.name || ''}
          />
        </DataTable>
      </div>

      {/* Chat Window */}
      {selectedChatId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[600px] overflow-hidden">
            <ChatWindow
              chatId={selectedChatId}
              onClose={() => setSelectedChatId(null)}
              onSelectChat={setSelectedChatId}
            />
          </div>
        </div>
      )}
    </>
  );
}
