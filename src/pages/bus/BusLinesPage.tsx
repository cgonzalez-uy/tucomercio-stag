import { useState } from 'react';
import { useBusLines } from '../../lib/hooks/useBusLines';
import { Button } from '../../components/ui/button';
import { DataTable } from '../../components/ui/data-table';
import { Plus, Edit2, Trash2, Power, Bus, Search, AlertCircle } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { BusLine } from '../../types/bus';
import { BusLineForm } from '../../components/admin/bus/BusLineForm';
import { DeleteSettingDialog } from '../../components/settings/DeleteSettingDialog';
import { Input } from '../../components/ui/input';
import { cn } from '../../lib/utils';

export function BusLinesPage() {
  const { lines, loading, error: linesError, createLine, updateLine, deleteLine } = useBusLines();
  const [showForm, setShowForm] = useState(false);
  const [editingLine, setEditingLine] = useState<BusLine | null>(null);
  const [lineToDelete, setLineToDelete] = useState<BusLine | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [operationError, setOperationError] = useState<string | null>(null);

  // Filter lines based on search term
  const filteredLines = lines.filter(line => 
    !searchTerm || 
    line.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    line.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    line.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Mobile card view for each line
  const LineCard = ({ line }: { line: BusLine }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
      {/* Line Info */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bus className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-medium text-gray-900">{line.code}</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-900">{line.name}</span>
            </div>
            {line.description && (
              <p className="text-sm text-gray-600 mt-1">{line.description}</p>
            )}
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
            line.isActive
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          )}
        >
          {line.isActive ? 'Activa' : 'Inactiva'}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-4 border-t">
        <Button
          onClick={() => handleToggleActive(line.id, line.isActive)}
          variant="ghost"
          size="sm"
          className={line.isActive ? 'text-green-600' : 'text-red-600'}
        >
          <Power className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => {
            setEditingLine(line);
            setShowForm(true);
          }}
          variant="ghost"
          size="sm"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => setLineToDelete(line)}
          variant="ghost"
          size="sm"
          className="text-red-500"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      setOperationError(null);
      await updateLine(id, { isActive: !currentStatus });
    } catch (err) {
      console.error('Error toggling line status:', err);
      setOperationError('Error al cambiar el estado de la línea. Por favor, intenta nuevamente.');
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      setOperationError(null);
      if (editingLine) {
        await updateLine(editingLine.id, data);
      } else {
        await createLine(data);
      }
      setShowForm(false);
      setEditingLine(null);
    } catch (err) {
      console.error('Error saving line:', err);
      setOperationError('Error al guardar la línea. Por favor, verifica los datos e intenta nuevamente.');
      throw err;
    }
  };

  const handleDelete = async () => {
    if (!lineToDelete) return;
    try {
      setOperationError(null);
      await deleteLine(lineToDelete.id);
      setLineToDelete(null);
    } catch (err) {
      console.error('Error deleting line:', err);
      setOperationError('Error al eliminar la línea. Por favor, intenta nuevamente.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (linesError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{linesError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bus className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Líneas de Ómnibus</h2>
            <p className="text-sm text-gray-500">
              {filteredLines.length} {filteredLines.length === 1 ? 'línea' : 'líneas'}
            </p>
          </div>
        </div>
        <Button 
          onClick={() => {
            setEditingLine(null);
            setShowForm(true);
            setOperationError(null);
          }}
          className="w-full sm:w-auto flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nueva línea
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar líneas..."
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
            {editingLine ? 'Editar línea' : 'Nueva línea'}
          </h3>
          <BusLineForm
            initialData={editingLine || undefined}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingLine(null);
              setOperationError(null);
            }}
          />
        </div>
      ) : (
        <>
          {/* Mobile View */}
          <div className="lg:hidden space-y-4">
            {filteredLines.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No se encontraron líneas
              </div>
            ) : (
              filteredLines.map(line => (
                <LineCard key={line.id} line={line} />
              ))
            )}
          </div>

          {/* Desktop View */}
          <div className="hidden lg:block">
            <DataTable
              columns={[
                {
                  accessorKey: 'code',
                  header: 'Código',
                  cell: ({ row }) => (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Bus className="h-4 w-4 text-primary" />
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {row.original.code}
                      </div>
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
                      className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        row.original.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      )}
                    >
                      {row.original.isActive ? 'Activa' : 'Inactiva'}
                    </span>
                  ),
                },
                {
                  id: 'actions',
                  cell: ({ row }) => {
                    const line = row.original;
                    return (
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => handleToggleActive(line.id, line.isActive)}
                          variant="ghost"
                          size="sm"
                          className={line.isActive ? 'text-green-600' : 'text-red-600'}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => {
                            setEditingLine(line);
                            setShowForm(true);
                          }}
                          variant="ghost"
                          size="sm"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => setLineToDelete(line)}
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
              data={filteredLines}
              searchPlaceholder="Buscar líneas..."
              searchColumn="name"
            >
              <DeleteSettingDialog
                isOpen={lineToDelete !== null}
                onClose={() => setLineToDelete(null)}
                onConfirm={handleDelete}
                itemName={lineToDelete?.name || ''}
                type="Línea"
              />
            </DataTable>
          </div>
        </>
      )}

      {/* Shared Dialog */}
      <DeleteSettingDialog
        isOpen={lineToDelete !== null}
        onClose={() => setLineToDelete(null)}
        onConfirm={handleDelete}
        itemName={lineToDelete?.name || ''}
        type="Línea"
      />
    </div>
  );
}