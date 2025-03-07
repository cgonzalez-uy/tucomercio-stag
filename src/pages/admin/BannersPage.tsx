import { useState } from 'react';
import { useBanners } from '../../lib/hooks/useBanners';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { DataTable } from '../../components/ui/data-table';
import { Plus, Edit2, Trash2, Power, Image, Search, AlertCircle, Calendar, Link as LinkIcon } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { Banner } from '../../types/banner';
import { BannerForm } from '../../components/admin/BannerForm';
import { DeleteSettingDialog } from '../../components/settings/DeleteSettingDialog';
import { cn } from '../../lib/utils';

export function BannersPage() {
  const { banners, loading, error, createBanner, updateBanner, deleteBanner } = useBanners();
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [bannerToDelete, setBannerToDelete] = useState<Banner | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [operationError, setOperationError] = useState<string | null>(null);

  // Filter banners based on search term
  const filteredBanners = banners.filter(banner => 
    !searchTerm || 
    banner.altText.toLowerCase().includes(searchTerm.toLowerCase()) ||
    banner.buttonLink?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Mobile card view for each banner
  const BannerCard = ({ banner }: { banner: Banner }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
      {/* Banner Image */}
      <div className="aspect-[21/9] rounded-lg overflow-hidden bg-gray-100">
        <img
          src={banner.image}
          alt={banner.altText}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Banner Info */}
      <div className="space-y-3">
        {/* Alt Text */}
        <p className="text-sm text-gray-600 line-clamp-2">
          {banner.altText}
        </p>

        {/* Status and Dates */}
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
              banner.isActive
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            )}
          >
            {banner.isActive ? 'Activo' : 'Inactivo'}
          </span>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>
              {new Date(banner.startDate.seconds * 1000).toLocaleDateString()} - {new Date(banner.endDate.seconds * 1000).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Link */}
        {banner.buttonLink && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <LinkIcon className="h-4 w-4" />
            <span className="truncate">{banner.buttonLink}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t">
          <Button
            onClick={() => handleToggleActive(banner.id, banner.isActive)}
            variant="ghost"
            size="sm"
            className={banner.isActive ? 'text-green-600' : 'text-red-600'}
          >
            <Power className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => {
              setEditingBanner(banner);
              setShowForm(true);
            }}
            variant="ghost"
            size="sm"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => setBannerToDelete(banner)}
            variant="ghost"
            size="sm"
            className="text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      setOperationError(null);
      await updateBanner(id, { isActive: !currentStatus });
    } catch (err) {
      console.error('Error toggling banner status:', err);
      setOperationError('Error al cambiar el estado del banner. Por favor, intenta nuevamente.');
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      setOperationError(null);
      if (editingBanner) {
        await updateBanner(editingBanner.id, data);
      } else {
        await createBanner(data);
      }
      setShowForm(false);
      setEditingBanner(null);
    } catch (err) {
      console.error('Error saving banner:', err);
      setOperationError('Error al guardar el banner. Por favor, verifica los datos e intenta nuevamente.');
      throw err;
    }
  };

  const handleDelete = async () => {
    if (!bannerToDelete) return;
    try {
      setOperationError(null);
      await deleteBanner(bannerToDelete.id);
      setBannerToDelete(null);
    } catch (err) {
      console.error('Error deleting banner:', err);
      setOperationError('Error al eliminar el banner. Por favor, intenta nuevamente.');
    }
  };

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
            <Image className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Banners</h2>
            <p className="text-sm text-gray-500">
              {filteredBanners.length} {filteredBanners.length === 1 ? 'banner' : 'banners'}
            </p>
          </div>
        </div>
        <Button 
          onClick={() => {
            setEditingBanner(null);
            setShowForm(true);
            setOperationError(null);
          }}
          className="w-full sm:w-auto flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nuevo banner
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar por texto alternativo o enlace..."
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

      {showForm ? (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            {editingBanner ? 'Editar banner' : 'Nuevo banner'}
          </h3>
          <BannerForm
            initialData={editingBanner || undefined}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingBanner(null);
              setOperationError(null);
            }}
          />
        </div>
      ) : (
        <>
          {/* Mobile View */}
          <div className="lg:hidden space-y-4">
            {filteredBanners.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-xl shadow-sm">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Image className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No se encontraron banners
                </h3>
                <p className="text-gray-500">
                  {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Agrega un nuevo banner para empezar'}
                </p>
              </div>
            ) : (
              filteredBanners.map(banner => (
                <BannerCard key={banner.id} banner={banner} />
              ))
            )}
          </div>

          {/* Desktop View */}
          <div className="hidden lg:block">
            <DataTable
              columns={[
                {
                  accessorKey: 'image',
                  header: 'Imagen',
                  cell: ({ row }) => (
                    <div className="flex items-center gap-3">
                      <div className="w-32 aspect-[21/9] rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={row.original.image}
                          alt={row.original.altText}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  ),
                },
                {
                  accessorKey: 'altText',
                  header: 'Texto alternativo',
                  cell: ({ row }) => (
                    <div className="text-sm text-gray-600 max-w-[200px] truncate">
                      {row.original.altText}
                    </div>
                  ),
                },
                {
                  accessorKey: 'buttonLink',
                  header: 'Enlace',
                  cell: ({ row }) => (
                    <div className="text-sm text-gray-600 max-w-[200px] truncate">
                      {row.original.buttonLink || '-'}
                    </div>
                  ),
                },
                {
                  accessorKey: 'startDate',
                  header: 'Fecha inicio',
                  cell: ({ row }) => (
                    <div className="text-sm text-gray-600">
                      {new Date(row.original.startDate.seconds * 1000).toLocaleDateString()}
                    </div>
                  ),
                },
                {
                  accessorKey: 'endDate',
                  header: 'Fecha fin',
                  cell: ({ row }) => (
                    <div className="text-sm text-gray-600">
                      {new Date(row.original.endDate.seconds * 1000).toLocaleDateString()}
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
                    const banner = row.original;
                    return (
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => handleToggleActive(banner.id, banner.isActive)}
                          variant="ghost"
                          size="sm"
                          className={banner.isActive ? 'text-green-600' : 'text-red-600'}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => {
                            setEditingBanner(banner);
                            setShowForm(true);
                          }}
                          variant="ghost"
                          size="sm"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => setBannerToDelete(banner)}
                          variant="ghost"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    );
                  },
                },
              ]}
              data={filteredBanners}
              searchPlaceholder="Buscar banners..."
              searchColumn="altText"
            >
              <DeleteSettingDialog
                isOpen={bannerToDelete !== null}
                onClose={() => setBannerToDelete(null)}
                onConfirm={handleDelete}
                itemName="este banner"
                type="Banner"
              />
            </DataTable>
          </div>
        </>
      )}
    </div>
  );
}