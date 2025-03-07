import { useState } from 'react';
import { usePaymentAccounts } from '../../lib/hooks/usePaymentAccounts';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { DataTable } from '../../components/ui/data-table';
import { Plus, Edit2, Trash2, Power, Save, X, CreditCard } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { PaymentAccount } from '../../types/payment';
import { DeleteSettingDialog } from '../../components/settings/DeleteSettingDialog';

export function PaymentAccountsPage() {
  const { accounts, loading, error, createAccount, updateAccount, deleteAccount } = usePaymentAccounts();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    bank: '',
    accountNumber: '',
    accountName: '',
    accountType: ''
  });
  const [accountToDelete, setAccountToDelete] = useState<PaymentAccount | null>(null);

  const columns: ColumnDef<PaymentAccount>[] = [
    {
      accessorKey: 'bank',
      header: 'Banco',
      cell: ({ row }) => (
        <div className="text-sm font-medium text-gray-900">
          {row.original.bank}
        </div>
      ),
    },
    {
      accessorKey: 'accountNumber',
      header: 'Número de cuenta',
      cell: ({ row }) => (
        <div className="text-sm text-gray-600">
          {row.original.accountNumber}
        </div>
      ),
    },
    {
      accessorKey: 'accountType',
      header: 'Tipo',
      cell: ({ row }) => (
        <div className="text-sm text-gray-600">
          {row.original.accountType}
        </div>
      ),
    },
    {
      accessorKey: 'accountName',
      header: 'Titular',
      cell: ({ row }) => (
        <div className="text-sm text-gray-600">
          {row.original.accountName}
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
          {row.original.isActive ? 'Activa' : 'Inactiva'}
        </span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const account = row.original;
        return (
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => handleToggleActive(account.id, account.isActive)}
              variant="ghost"
              size="sm"
              className={account.isActive ? 'text-green-600' : 'text-red-600'}
            >
              <Power className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => handleEdit(account)}
              variant="ghost"
              size="sm"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => setAccountToDelete(account)}
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
      await updateAccount(id, { isActive: !currentStatus });
    } catch (err) {
      console.error('Error toggling account status:', err);
    }
  };

  const handleEdit = (account: PaymentAccount) => {
    setFormData({
      bank: account.bank,
      accountNumber: account.accountNumber,
      accountName: account.accountName,
      accountType: account.accountType
    });
    setEditingId(account.id);
    setIsAdding(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await updateAccount(editingId, { ...formData });
      } else {
        await createAccount({ ...formData, isActive: true });
      }
      setIsAdding(false);
      setEditingId(null);
      setFormData({
        bank: '',
        accountNumber: '',
        accountName: '',
        accountType: ''
      });
    } catch (err) {
      console.error('Error saving account:', err);
    }
  };

  const handleDelete = async () => {
    if (!accountToDelete) return;
    try {
      await deleteAccount(accountToDelete.id);
      setAccountToDelete(null);
    } catch (err) {
      console.error('Error deleting account:', err);
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
        <h2 className="text-2xl font-bold text-gray-900">Cuentas Bancarias</h2>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Agregar cuenta
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Banco
              </label>
              <Input
                value={formData.bank}
                onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                placeholder="Nombre del banco"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Número de cuenta
              </label>
              <Input
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                placeholder="Número de cuenta"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tipo de cuenta
              </label>
              <Input
                value={formData.accountType}
                onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                placeholder="Ej: Caja de Ahorros"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Titular
              </label>
              <Input
                value={formData.accountName}
                onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                placeholder="Nombre del titular"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
                setFormData({
                  bank: '',
                  accountNumber: '',
                  accountName: '',
                  accountType: ''
                });
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              <Save className="h-4 w-4 mr-2" />
              {editingId ? 'Guardar cambios' : 'Crear cuenta'}
            </Button>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={accounts}
        searchPlaceholder="Buscar cuentas..."
        searchColumn="bank"
      >
        <DeleteSettingDialog
          isOpen={accountToDelete !== null}
          onClose={() => setAccountToDelete(null)}
          onConfirm={handleDelete}
          itemName={accountToDelete?.bank || ''}
          type="Cuenta bancaria"
        />
      </DataTable>
    </div>
  );
}