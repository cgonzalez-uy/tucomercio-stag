import { useState, useMemo } from 'react';
import { useSettings } from '../../lib/hooks/useSettings';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { DataTable } from '../ui/data-table';
import { Plus, Edit2, Trash2, Loader2, Save, X, Power } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { DeleteSettingDialog } from './DeleteSettingDialog';

interface SettingsTableProps {
  type: 'payment-methods' | 'shipping-methods' | 'categories';
  title: string;
}

interface Setting {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function SettingsTable({ type, title }: SettingsTableProps) {
  const { settings, loading, error, createSetting, updateSetting, deleteSetting } = useSettings(type);
  const [newItemName, setNewItemName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Setting | null>(null);

  const columns = useMemo<ColumnDef<Setting>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Nombre',
      cell: ({ row }) => {
        const setting = row.original;
        return editingId === setting.id ? (
          <Input
            type="text"
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            className="max-w-md"
          />
        ) : (
          <div className="text-sm font-medium text-gray-900">{setting.name}</div>
        );
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Estado',
      cell: ({ row }) => {
        const setting = row.original;
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              setting.isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {setting.isActive ? 'Activo' : 'Inactivo'}
          </span>
        );
      },
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
                  <Save className="h-4 w-4" />
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
  ], [editingId, editingName]);

  const handleAdd = async () => {
    if (!newItemName.trim()) return;
    try {
      await createSetting(newItemName.trim());
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

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateSetting(id, { isActive: !currentStatus });
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Agregar
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="space-y-4 bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Nombre del nuevo elemento"
              />
            </div>
            <Button onClick={handleAdd} variant="default" size="icon">
              <Save className="h-4 w-4" />
            </Button>
            <Button onClick={() => setIsAdding(false)} variant="ghost" size="icon">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={settings}
        searchPlaceholder={`Buscar ${title.toLowerCase()}...`}
        searchColumn="name"
      >
        <DeleteSettingDialog
          isOpen={itemToDelete !== null}
          onClose={() => setItemToDelete(null)}
          onConfirm={handleDelete}
          itemName={itemToDelete?.name || ''}
          type={title.slice(0, -1)} // Remove plural 's'
        />
      </DataTable>
    </div>
  );
}