import { Clock } from 'lucide-react';
import type { BusinessSchedule } from '../../types/business';
import { DEFAULT_SCHEDULE } from '../../types/business';

interface ScheduleDisplayProps {
  schedule?: BusinessSchedule;
  className?: string;
}

const DAYS = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo'
} as const;

export function ScheduleDisplay({ schedule = DEFAULT_SCHEDULE, className = '' }: ScheduleDisplayProps) {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  };

  const formatRanges = (ranges: { open: string; close: string }[]) => {
    return ranges.map((range, index) => (
      <span key={index}>
        {formatTime(range.open)} a {formatTime(range.close)}
        {index < ranges.length - 1 && ' y '}
      </span>
    ));
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {(Object.entries(DAYS) as [keyof BusinessSchedule, string][]).map(([day, label]) => (
        <div key={day} className="flex items-start gap-3">
          <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
          <div>
            <span className="font-medium text-gray-700">{label}:</span>{' '}
            <span className="text-gray-600">
              {schedule[day].isOpen ? (
                formatRanges(schedule[day].ranges)
              ) : (
                'Cerrado'
              )}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}