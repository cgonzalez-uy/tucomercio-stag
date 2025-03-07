import { useState } from 'react';
import { Plus, Minus, Clock, Copy, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Tooltip } from '../ui/tooltip';
import type { BusinessSchedule, DaySchedule, TimeRange } from '../../types/business';
import { cn } from '../../lib/utils';

interface ScheduleEditorProps {
  value: BusinessSchedule;
  onChange: (schedule: BusinessSchedule) => void;
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

// Plantillas predefinidas
const TEMPLATES = {
  comercial: {
    name: 'Horario Comercial',
    schedule: {
      monday: { isOpen: true, ranges: [{ open: "09:00", close: "18:00" }] },
      tuesday: { isOpen: true, ranges: [{ open: "09:00", close: "18:00" }] },
      wednesday: { isOpen: true, ranges: [{ open: "09:00", close: "18:00" }] },
      thursday: { isOpen: true, ranges: [{ open: "09:00", close: "18:00" }] },
      friday: { isOpen: true, ranges: [{ open: "09:00", close: "18:00" }] },
      saturday: { isOpen: true, ranges: [{ open: "09:00", close: "13:00" }] },
      sunday: { isOpen: false, ranges: [] }
    }
  },
  "24/7": {
    name: '24 horas',
    schedule: {
      monday: { isOpen: true, ranges: [{ open: "00:00", close: "23:59" }] },
      tuesday: { isOpen: true, ranges: [{ open: "00:00", close: "23:59" }] },
      wednesday: { isOpen: true, ranges: [{ open: "00:00", close: "23:59" }] },
      thursday: { isOpen: true, ranges: [{ open: "00:00", close: "23:59" }] },
      friday: { isOpen: true, ranges: [{ open: "00:00", close: "23:59" }] },
      saturday: { isOpen: true, ranges: [{ open: "00:00", close: "23:59" }] },
      sunday: { isOpen: true, ranges: [{ open: "00:00", close: "23:59" }] }
    }
  },
  "finDeSemana": {
    name: 'Fin de Semana',
    schedule: {
      monday: { isOpen: false, ranges: [] },
      tuesday: { isOpen: false, ranges: [] },
      wednesday: { isOpen: false, ranges: [] },
      thursday: { isOpen: false, ranges: [] },
      friday: { isOpen: true, ranges: [{ open: "18:00", close: "23:59" }] },
      saturday: { isOpen: true, ranges: [{ open: "11:00", close: "23:59" }] },
      sunday: { isOpen: true, ranges: [{ open: "11:00", close: "20:00" }] }
    }
  }
};

export function ScheduleEditor({ value, onChange }: ScheduleEditorProps) {
  const [selectedDay, setSelectedDay] = useState<keyof BusinessSchedule | null>(null);
  const [showCopyOptions, setShowCopyOptions] = useState(false);

  const updateDay = (
    day: keyof BusinessSchedule,
    updates: Partial<DaySchedule>
  ) => {
    onChange({
      ...value,
      [day]: { ...value[day], ...updates }
    });
  };

  const addRange = (day: keyof BusinessSchedule) => {
    const ranges = [...value[day].ranges];
    
    // Encontrar un hueco disponible
    let start = "09:00";
    let end = "18:00";
    
    if (ranges.length > 0) {
      const lastRange = ranges[ranges.length - 1];
      const [lastHour] = lastRange.close.split(':');
      const nextHour = parseInt(lastHour) + 1;
      if (nextHour < 23) {
        start = `${nextHour.toString().padStart(2, '0')}:00`;
        end = `${(nextHour + 1).toString().padStart(2, '0')}:00`;
      }
    }

    ranges.push({ open: start, close: end });
    updateDay(day, { ranges });
  };

  const removeRange = (day: keyof BusinessSchedule, index: number) => {
    const ranges = value[day].ranges.filter((_, i) => i !== index);
    updateDay(day, { ranges });
  };

  const updateRange = (
    day: keyof BusinessSchedule,
    index: number,
    updates: Partial<TimeRange>
  ) => {
    const ranges = value[day].ranges.map((range, i) =>
      i === index ? { ...range, ...updates } : range
    );

    // Validar y ordenar rangos
    const sortedRanges = ranges.sort((a, b) => a.open.localeCompare(b.open));
    
    // Validar superposiciones
    for (let i = 0; i < sortedRanges.length - 1; i++) {
      if (sortedRanges[i].close > sortedRanges[i + 1].open) {
        // Ajustar automáticamente
        sortedRanges[i].close = sortedRanges[i + 1].open;
      }
    }

    updateDay(day, { ranges: sortedRanges });
  };

  const copyDaySchedule = (fromDay: keyof BusinessSchedule, toDays: (keyof BusinessSchedule)[]) => {
    const updates = toDays.reduce((acc, day) => ({
      ...acc,
      [day]: { ...value[fromDay] }
    }), {});

    onChange({ ...value, ...updates });
    setShowCopyOptions(false);
    setSelectedDay(null);
  };

  const applyTemplate = (template: keyof typeof TEMPLATES) => {
    onChange(TEMPLATES[template].schedule as BusinessSchedule);
  };

  return (
    <div className="space-y-6">
      {/* Plantillas rápidas */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(TEMPLATES).map(([key, template]) => (
          <Button
            key={key}
            variant="outline"
            size="sm"
            onClick={() => applyTemplate(key as keyof typeof TEMPLATES)}
            className="flex items-center gap-2"
          >
            <Clock className="h-4 w-4" />
            {template.name}
          </Button>
        ))}
      </div>

      {/* Editor de horarios */}
      <div className="space-y-4">
        {(Object.entries(DAYS) as [keyof BusinessSchedule, string][]).map(([day, label]) => (
          <div key={day} className="bg-white p-4 rounded-lg border">
            {/* Day header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
              <label className="flex items-center gap-2 min-w-[150px]">
                <input
                  type="checkbox"
                  checked={value[day].isOpen}
                  onChange={(e) => updateDay(day, { isOpen: e.target.checked })}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium text-gray-900">{label}</span>
              </label>

              {value[day].isOpen && (
                <div className="flex flex-wrap gap-2">
                  <Tooltip content="Copiar este horario">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedDay(day);
                        setShowCopyOptions(true);
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </Tooltip>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addRange(day)}
                    className="text-xs"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar horario
                  </Button>
                </div>
              )}
            </div>

            {/* Time ranges */}
            {value[day].isOpen && (
              <div className="space-y-3">
                {value[day].ranges.map((range, index) => (
                  <div key={index} className="flex flex-wrap items-center gap-3">
                    <Clock className="h-4 w-4 text-gray-400 shrink-0" />
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="time"
                        value={range.open}
                        onChange={(e) => updateRange(day, index, { open: e.target.value })}
                        className="rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20 text-sm"
                      />
                      <span className="text-gray-500">a</span>
                      <input
                        type="time"
                        value={range.close}
                        onChange={(e) => updateRange(day, index, { close: e.target.value })}
                        className="rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20 text-sm"
                      />
                    </div>
                    {value[day].ranges.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRange(day, index)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal de copiar horario */}
      {showCopyOptions && selectedDay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Copiar horario del {DAYS[selectedDay]}
            </h3>
            <div className="space-y-4">
              <Button
                onClick={() => copyDaySchedule(
                  selectedDay,
                  ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
                )}
                className="w-full justify-start"
              >
                <Check className="h-4 w-4 mr-2" />
                Copiar a días laborables
              </Button>
              <Button
                onClick={() => copyDaySchedule(
                  selectedDay,
                  ['saturday', 'sunday']
                )}
                className="w-full justify-start"
              >
                <Check className="h-4 w-4 mr-2" />
                Copiar a fin de semana
              </Button>
              <Button
                onClick={() => copyDaySchedule(
                  selectedDay,
                  Object.keys(DAYS) as (keyof BusinessSchedule)[]
                )}
                className="w-full justify-start"
              >
                <Check className="h-4 w-4 mr-2" />
                Copiar a todos los días
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCopyOptions(false);
                  setSelectedDay(null);
                }}
                className="w-full"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}