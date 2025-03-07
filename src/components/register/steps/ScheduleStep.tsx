import { Button } from '../../ui/button';
import { ScheduleEditor } from '../../schedule/ScheduleEditor';

interface ScheduleStepProps {
  data: {
    schedule: any;
  };
  onChange: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ScheduleStep({ data, onChange, onNext, onBack }: ScheduleStepProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Configura tus horarios de atención
        </h3>
        <ScheduleEditor
          value={data.schedule}
          onChange={(schedule) => onChange({ ...data, schedule })}
        />
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Atrás
        </Button>
        <Button type="submit">
          Continuar
        </Button>
      </div>
    </form>
  );
}