import { useState, useMemo } from 'react';
import { useSettings } from '../../lib/hooks/useSettings';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { DataTable } from '../ui/data-table';
import { Plus, Edit2, Trash2, Loader2, Save, X, Power } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import type { ColumnDef } from '@tanstack/react-table';
import { DeleteSettingDialog } from './DeleteSettingDialog';

interface Category {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function CategoryTable() {
  const { settings, loading, error, createSetting, updateSetting, deleteSetting } = useSettings('categories');
  const [newItemName, setNewItemName] = useState('');
  const [newItemColor, setNewItemColor] = useState('#3B82F6');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingColor, setEditingColor] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const columns = useMemo<ColumnDef<Category>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Nombre',
      cell: ({ row }) => {
        const category = row.original;
        return editingId === category.id ? (
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            <Input
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              className="max-w-[200px]"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowColorPicker(category.id);
              }}
              className="w-8 h-8 rounded border shrink-0"
              style={{ backgroundColor: editingColor }}
              aria-label="Cambiar color"
            />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded-full shrink-0" 
              style={{ backgroundColor: category.color }}
            />
            <span className="text-sm font-medium text-gray-900">{category.name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Estado',
      cell: ({ row }) => {
        const category = row.original;
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              category.isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {category.isActive ? 'Activo' : 'Inactivo'}
          </span>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const category = row.original;
        return (
          <div className="flex justify-end gap-2">
            {editingId === category.id ? (
              <>
                <Button
                  onClick={() => handleUpdate(category.id)}
                  variant="ghost"
                  size="sm"
                >
                  <Save className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => {
                    setEditingId(null);
                    setEditingName('');
                    setEditingColor('');
                    setShowColorPicker(null);
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
                  onClick={() => handleToggleActive(category.id, category.isActive)}
                  variant="ghost"
                  size="sm"
                  className={category.isActive ? 'text-green-600' : 'text-red-600'}
                >
                  <Power className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => {
                    setEditingId(category.id);
                    setEditingName(category.name);
                    setEditingColor(category.color || '#3B82F6');
                  }}
                  variant="ghost"
                  size="sm"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => setCategoryToDelete(category)}
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
  ], [editingId, editingName, editingColor]);

  const handleAdd = async () => {
    if (!newItemName.trim()) return;
    try {
      await createSetting(newItemName.trim(), newItemColor);
      setNewItemName('');
      setNewItemColor('#3B82F6');
      setIsAdding(false);
      setShowColorPicker(null);
    } catch (err) {
      console.error('Error adding category:', err);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editingName.trim()) return;
    try {
      await updateSetting(id, { 
        name: editingName.trim(),
        color: editingColor 
      });
      setEditingId(null);
      setEditingName('');
      setEditingColor('');
      setShowColorPicker(null);
    } catch (err) {
      console.error('Error updating category:', err);
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteSetting(categoryToDelete.id);
      setCategoryToDelete(null);
    } catch (err) {
      console.error('Error deleting category:', err);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateSetting(id, { isActive: !currentStatus });
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  const ColorPickerPopover = ({ id, color, onChange }: { id: string, color: string, onChange: (color: string) => void }) => (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 touch-none"
      onClick={(e) => {
        e.stopPropagation();
        setShowColorPicker(null);
      }}
    >
      <div 
        className="bg-white p-6 rounded-lg shadow-lg max-w-[300px] w-full"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Seleccionar color
        </h3>
        <div className="mb-6">
          <HexColorPicker 
            color={color} 
            onChange={onChange}
            aria-label="Selector de color"
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded border"
              style={{ backgroundColor: color }}
            />
            <span className="text-sm font-medium text-gray-900">
              {color.toUpperCase()}
            </span>
          </div>
          <Button
            size="sm"
            onClick={() => setShowColorPicker(null)}
          >
            Aceptar
          </Button>
        </div>
      </div>
    </div>
  );

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Categorías</h2>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} className="flex items-center gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Agregar
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="space-y-4 bg-white p-4 rounded-lg shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1 w-full">
              <Input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Nombre de la categoría"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowColorPicker('new');
                }}
                className="w-10 h-10 rounded border"
                style={{ backgroundColor: newItemColor }}
                aria-label="Seleccionar color"
              />
              <Button onClick={handleAdd} variant="default" size="icon" className="shrink-0">
                <Save className="h-4 w-4" />
              </Button>
              <Button onClick={() => {
                setIsAdding(false);
                setShowColorPicker(null);
              }} variant="ghost" size="icon" className="shrink-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={settings}
        searchPlaceholder="Buscar categorías..."
        searchColumn="name"
      >
        <DeleteSettingDialog
          isOpen={categoryToDelete !== null}
          onClose={() => setCategoryToDelete(null)}
          onConfirm={handleDelete}
          itemName={categoryToDelete?.name || ''}
          type="Categoría"
        />
      </DataTable>

      {showColorPicker === 'new' && (
        <ColorPickerPopover
          id="new"
          color={newItemColor}
          onChange={setNewItemColor}
        />
      )}

      {showColorPicker && showColorPicker !== 'new' && (
        <ColorPickerPopover
          id={showColorPicker}
          color={editingColor}
          onChange={setEditingColor}
        />
      )}
    </div>
  );
}