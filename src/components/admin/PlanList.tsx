import { useState } from 'react';
import { usePlans } from '../../lib/hooks/usePlans';
import { Button } from '../ui/button';
import { DataTable } from '../ui/data-table';
import { Plus, Edit2, Trash2, Power, Eye } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { Plan } from '../../types/subscription';
import { PlanForm } from './PlanForm';
import { DeletePlanDialog } from './DeletePlanDialog';
import { PlanPreviewDialog } from './PlanPreviewDialog';
import { Tooltip } from '../ui/tooltip';

export function PlanList() {
  const { plans, loading, error, createPlan, updatePlan, deletePlan } = usePlans();
  const [isAdding, setIsAdding] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const columns: ColumnDef<Plan>[] = [
    {
      accessorKey: 'name',
      header: 'Nombre',
      cell: ({ row }) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {row.original.name}
          </div>
          <div className="text-sm text-gray-500">
            ${row.original.price.toFixed(2)}
            <span className="text-gray-400">
              /{row.original.billingPeriod === 'monthly' ? 'mes' : 'año'}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Estado',
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
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
        const plan = row.original;
        return (
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => updatePlan(plan.id, { isActive: !plan.isActive })}
              variant="ghost"
              size="sm"
              className={plan.isActive ? 'text-green-600' : 'text-red-600'}
            >
              <Power className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => setEditingPlan(plan)}
              variant="ghost"
              size="sm"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPlanToDelete(plan)}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        );
      },
    },
  ];

  const handleDeletePlan = async () => {
    if (planToDelete) {
      await deletePlan(planToDelete.id);
      setPlanToDelete(null);
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
        <h2 className="text-2xl font-bold text-gray-900">Planes de Suscripción</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <Tooltip content="Ver cómo se ven los planes">
            <Button
              variant="outline"
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Eye className="h-4 w-4" />
              <span>Ver preview</span>
            </Button>
          </Tooltip>

          {!isAdding && !editingPlan && (
            <Button 
              onClick={() => setIsAdding(true)} 
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Agregar Plan
            </Button>
          )}
        </div>
      </div>

      {isAdding && (
        <PlanForm
          onSubmit={createPlan}
          onCancel={() => setIsAdding(false)}
        />
      )}

      {editingPlan && (
        <PlanForm
          initialData={editingPlan}
          onSubmit={(data) => updatePlan(editingPlan.id, data)}
          onCancel={() => setEditingPlan(null)}
        />
      )}

      {!isAdding && !editingPlan && (
        <DataTable
          columns={columns}
          data={plans}
          searchPlaceholder="Buscar planes..."
          searchColumn="name"
        >
          <DeletePlanDialog
            isOpen={planToDelete !== null}
            onClose={() => setPlanToDelete(null)}
            onConfirm={handleDeletePlan}
            planName={planToDelete?.name || ''}
          />

          <PlanPreviewDialog
            isOpen={showPreview}
            onClose={() => setShowPreview(false)}
            plans={plans}
          />
        </DataTable>
      )}
    </div>
  );
}