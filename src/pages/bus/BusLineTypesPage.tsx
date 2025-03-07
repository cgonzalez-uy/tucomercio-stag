import { useState } from 'react';
import { useBusLineTypes } from '../../lib/hooks/useBusLineTypes';
import { Button } from '../../components/ui/button';
import { DataTable } from '../../components/ui/data-table';
import { Plus, Edit2, Trash2, Power } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { BusLineType } from '../../types/bus';
import { BusLineTypeForm } from '../../components/admin/bus/BusLineTypeForm';
import { DeleteSettingDialog } from '../../components/settings/DeleteSettingDialog';

export function BusLineTypesPage() {
  const { types, loading, error, createType, updateType, deleteType } = useBusLineTypes();
  const [showForm, setShowForm] = useState(false);
  const [editingType, setEditingType] = useState<BusLineType | null>(null);
  const [typeToDelete, setTypeToDelete] = useState<BusLineType | null>(null);

  const columns: ColumnDef<BusLineType>[] = [
    {
      accessorKey: 'code',
      header: 'Código',
      cell: ({ row }) => (
        <div className="text-sm font-medium text-gray-900">
          {row.original.code}
        </div>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Nombre',
      cell: ({ row }) => (
        <div className="text-sm text-gray-600">
          {row.original.name}
        </div>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Descripción',
      cell: ({ row }) => (
        <div className="text-sm text-gray-600 max-w-[300px] truncate">
          {row.original.description || '-'}
        </div>
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
        const type = row.original;
        return (
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => handleToggleActive(type.id, type.isActive)}
              variant="ghost"
              size="sm"
              className={type.isActive ? 'text-green-600' : 'text-red-600'}
            >
              <Power className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => {
                setEditingType(type);
                setShowForm(true);
              }}
              variant="ghost"
              size="sm"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => setTypeToDelete(type)}
              variant="ghost"
              size="sm"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        );
      },
    },
  ];

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateType(id, { isActive: !currentStatus });
    } catch (err) {
      console.error('Error toggling type status:', err);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      if (editingType) {
        await updateType(editingType.id, data);
      } else {
        await createType(data);
      }
      setShowForm(false);
      setEditingType(null);
    } catch (err) {
      throw err;
    }
  };

  const handleDelete = async () => {
    if (!typeToDelete) return;
    try {
      await deleteType(typeToDelete.id);
      setTypeToDelete(null);
    } catch (err) {
      console.error('Error deleting type:', err);
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
        <h2 className="text-2xl font-bold text-gray-900">Tipos de Línea</h2>
        <Button 
          onClick={() => {
            setEditingType(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nuevo tipo
        </Button>
      </div>

      {showForm ? (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            {editingType ? 'Editar tipo' : 'Nuevo tipo'}
          </h3>
          <BusLineTypeForm
            initialData={editingType || undefined}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingType(null);
            }}
          />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={types}
          searchPlaceholder="Buscar tipos..."
          searchColumn="name"
        >
          <DeleteSettingDialog
            isOpen={typeToDelete !== null}
            onClose={() => setTypeToDelete(null)}
            onConfirm={handleDelete}
            itemName={typeToDelete?.name || ''}
            type="Tipo de línea"
          />
        </DataTable>
      )}
    </div>
  );
}