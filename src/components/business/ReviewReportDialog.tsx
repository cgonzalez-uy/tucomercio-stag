import { useState } from 'react';
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

interface ReviewReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, details: string) => void;
}

const REPORT_REASONS = [
  'Contenido ofensivo o inapropiado',
  'Información falsa',
  'Spam o publicidad',
  'No relacionado con el comercio',
  'Otro'
];

export function ReviewReportDialog({ isOpen, onClose, onConfirm }: ReviewReportDialogProps) {
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onConfirm(selectedReason, details);
      onClose();
    } catch (err) {
      console.error('Error reporting review:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-full bg-yellow-50">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <DialogTitle>Reportar reseña</DialogTitle>
          </div>
          <DialogDescription>
            Esta reseña será revisada por nuestro equipo. Por favor, indícanos el motivo del reporte.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20"
            >
              {REPORT_REASONS.map(reason => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Detalles adicionales <span className="text-gray-500">(opcional)</span>
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20"
              rows={4}
              placeholder="Proporciona más información sobre el motivo del reporte..."
            />
          </div>

          <DialogFooter className="gap-3 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Enviar reporte'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}