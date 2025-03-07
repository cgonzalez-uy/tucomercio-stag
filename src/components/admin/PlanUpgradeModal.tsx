import { Dialog } from '@radix-ui/react-dialog';
import { Button } from '../ui/button';
import { X } from 'lucide-react';

interface PlanUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  email: string;
  password: string;
}

export function PlanUpgradeModal({ isOpen, onClose, onConfirm, email, password }: PlanUpgradeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="fixed inset-0 bg-black/50 z-50" />
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Crear acceso al portal
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <p className="text-gray-600">
              Se creará un acceso al portal de comercios con las siguientes credenciales:
            </p>

            <div className="bg-gray-50 p-4 rounded-md space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-700">Email:</span>
                <span className="ml-2 text-sm text-gray-900">{email}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Contraseña temporal:</span>
                <span className="ml-2 text-sm text-gray-900">{password}</span>
              </div>
            </div>

            <p className="text-sm text-gray-500">
              El usuario deberá cambiar su contraseña en el primer inicio de sesión.
            </p>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              onClick={onConfirm}
            >
              Confirmar
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}