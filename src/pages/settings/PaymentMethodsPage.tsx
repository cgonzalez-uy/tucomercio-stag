import { useState } from 'react';
import { useSettings } from '../../lib/hooks/useSettings';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { DataTable } from '../../components/ui/data-table';
import { Plus, Edit2, Trash2, Power, CreditCard, Search, Check, X } from 'lucide-react';
import { DeleteSettingDialog } from '../../components/settings/DeleteSettingDialog';

interface Setting {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function PaymentMethodsPage() {
  const { settings, loading, error, createSetting, updateSetting, deleteSetting } = useSettings('payment-methods');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [itemToDelete, setItemToDelete] = useState<Setting | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter settings based on search term
  const filteredSettings = settings.filter(setting =>
    !searchTerm || setting.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateSetting(id, { isActive: !currentStatus });
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  const handleAdd = async () => {
    if (!newItemName.trim()) return;
    try {
      await createSetting(newItemName.trim(), newItemName.trim());
      setNewItemName('');
      setIsAdding(false);
    } catch (err) {
      console.error('Error adding item:', err);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editingName.trim()) return;
    try {
      await updateSetting(id, { name: editingName.trim() });
      setEditingId(null);
      setEditingName('');
    } catch (err) {
      console.error('Error updating item:', err);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteSetting(itemToDelete.id);
      setItemToDelete(null);
    } catch (err) {
      console.error('Error deleting item:', err);
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
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Métodos de Pago</h2>
            <p className="text-sm text-gray-500">
              {filteredSettings.length} {filteredSettings.length === 1 ? 'método' : 'métodos'} de pago
            </p>
          </div>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Agregar
          </Button>
        )}
      </div>

      {/* Search Bar - Visible on both mobile and desktop */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar métodos de pago..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {isAdding && (
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 w-full">
              <Input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Nombre del método de pago"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button onClick={handleAdd} className="flex-1 sm:flex-none">
                Guardar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAdding(false);
                  setNewItemName('');
                }}
                className="flex-1 sm:flex-none"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile View */}
      <div className="block lg:hidden space-y-4">
        {filteredSettings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No se encontraron métodos de pago
          </div>
        ) : (
          filteredSettings.map(setting => (
            <div key={setting.id} className="bg-white p-4 rounded-lg shadow-sm space-y-4">
              {editingId === setting.id ? (
                <div className="flex flex-col gap-4">
                  <Input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="flex-1"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleUpdate(setting.id)}
                      className="flex-1"
                    >
                      Guardar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingId(null);
                        setEditingName('');
                      }}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-primary/10 rounded-lg">
                        <CreditCard className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium text-gray-900">{setting.name}</span>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        setting.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {setting.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleToggleActive(setting.id, setting.isActive)}
                      variant="outline"
                      size="sm"
                      className={`flex-1 ${setting.isActive ? 'text-green-600' : 'text-red-600'}`}
                    >
                      <Power className="h-4 w-4 mr-2" />
                      {setting.isActive ? 'Desactivar' : 'Activar'}
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingId(setting.id);
                        setEditingName(setting.name);
                      }}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      onClick={() => setItemToDelete(setting)}
                      variant="outline"
                      size="sm"
                      className="flex-1 text-red-500"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Desktop View */}
      <div className="hidden lg:block">
        <DataTable
          columns={[
            {
              accessorKey: 'name',
              header: 'Nombre',
              cell: ({ row }) => (
                editingId === row.original.id ? (
                  <Input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="max-w-md"
                  />
                ) : (
                  <div className="text-sm font-medium text-gray-900">{row.original.name}</div>
                )
              ),
            },
            {
              accessorKey: 'isActive',
              header: 'Estado',
              cell: ({ row }) => (
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    row.original.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {row.original.isActive ? 'Activo' : 'Inactivo'}
                </span>
              ),
            },
            {
              id: 'actions',
              cell: ({ row }) => {
                const setting = row.original;
                return (
                  <div className="flex justify-end gap-2">
                    {editingId === setting.id ? (
                      <>
                        <Button
                          onClick={() => handleUpdate(setting.id)}
                          variant="ghost"
                          size="sm"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => {
                            setEditingId(null);
                            setEditingName('');
                          }}
                          variant="ghost"
                          size="sm"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          onClick={() => handleToggleActive(setting.id, setting.isActive)}
                          variant="ghost"
                          size="sm"
                          className={setting.isActive ? 'text-green-600' : 'text-red-600'}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => {
                            setEditingId(setting.id);
                            setEditingName(setting.name);
                          }}
                          variant="ghost"
                          size="sm"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => setItemToDelete(setting)}
                          variant="ghost"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </>
                    )}
                  </div>
                );
              },
            },
          ]}
          data={filteredSettings}
          searchPlaceholder="Buscar métodos de pago..."
          searchColumn="name"
        >
          <DeleteSettingDialog
            isOpen={itemToDelete !== null}
            onClose={() => setItemToDelete(null)}
            onConfirm={handleDelete}
            itemName={itemToDelete?.name || ''}
            type="Método de pago"
          />
        </DataTable>
      </div>
    </div>
  );
}