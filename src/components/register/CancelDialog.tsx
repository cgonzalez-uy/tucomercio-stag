import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { AlertTriangle } from "lucide-react";

interface CancelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function CancelDialog({ isOpen, onClose, onConfirm }: CancelDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-full bg-yellow-50">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <DialogTitle>¿Cancelar registro?</DialogTitle>
          </div>
          <DialogDescription className="pt-4">
            Si cancelas ahora, perderás los datos ingresados. Podrás volver a registrarte en cualquier momento.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-3 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Continuar registro
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Cancelar registro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}