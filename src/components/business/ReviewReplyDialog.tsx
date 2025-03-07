import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { AlertCircle } from "lucide-react";

interface ReviewReplyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (content: string) => Promise<void>;
  existingReply?: string;
  isEditing?: boolean;
}

export function ReviewReplyDialog({ 
  isOpen, 
  onClose, 
  onSubmit, 
  existingReply = '',
  isEditing = false 
}: ReviewReplyDialogProps) {
  const [content, setContent] = useState(existingReply);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (!content.trim()) {
        throw new Error('La respuesta no puede estar vacía');
      }

      setLoading(true);
      await onSubmit(content.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la respuesta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar respuesta' : 'Responder reseña'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tu respuesta
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full min-h-[120px] rounded-md border border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20 p-4 text-sm text-gray-900 resize-y"
              placeholder="Escribe tu respuesta..."
              style={{ lineHeight: '1.5' }}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-md">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

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
              {loading ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Publicar respuesta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}