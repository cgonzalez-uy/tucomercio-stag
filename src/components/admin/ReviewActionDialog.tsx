import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { AlertTriangle, Check, X } from "lucide-react";

interface ReviewActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  type: 'approve' | 'reject';
  businessName: string;
}

export function ReviewActionDialog({ isOpen, onClose, onConfirm, type, businessName }: ReviewActionDialogProps) {
  const config = {
    approve: {
      icon: Check,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
      title: 'Aprobar reporte',
      description: 'Al aprobar este reporte, la reseña será eliminada permanentemente.',
      confirmText: 'Aprobar',
      confirmVariant: 'default' as const,
    },
    reject: {
      icon: X,
      iconColor: 'text-red-600',
      bgColor: 'bg-red-50',
      title: 'Rechazar reporte',
      description: 'Al rechazar este reporte, la reseña se mantendrá visible en el comercio.',
      confirmText: 'Rechazar',
      confirmVariant: 'destructive' as const,
    }
  };

  const { icon: Icon, iconColor, bgColor, title, description, confirmText, confirmVariant } = config[type];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded-full ${bgColor}`}>
              <Icon className={`h-6 w-6 ${iconColor}`} />
            </div>
            <DialogTitle>{title}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-gray-500">{description}</p>
          <p className="mt-2 text-sm font-medium text-gray-900">
            Comercio: {businessName}
          </p>
        </div>

        <DialogFooter className="gap-3 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm}>
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}