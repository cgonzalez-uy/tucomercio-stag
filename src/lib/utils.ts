import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { BusinessSchedule } from "../types/business"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatWhatsAppNumber(number: string): string {
  // Eliminar espacios, guiones y paréntesis
  let cleaned = number.replace(/[\s\-()]/g, '');
  
  // Si empieza con 0, eliminarlo
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  // Si no empieza con +598, agregarlo
  if (!cleaned.startsWith('+598')) {
    cleaned = '+598' + cleaned;
  }
  
  return cleaned;
}

type BusinessStatus = 'open' | 'closed' | 'opening-soon';

export function getBusinessStatus(schedule: BusinessSchedule): BusinessStatus {
  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
  const currentDay = days[now.getDay()];
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const daySchedule = schedule[currentDay];

  if (!daySchedule.isOpen || daySchedule.ranges.length === 0) {
    // Verificar si abre pronto en el mismo día
    if (daySchedule.isOpen && daySchedule.ranges.length > 0) {
      const nextOpening = daySchedule.ranges.find(range => range.open > currentTime);
      if (nextOpening) {
        const [openHour, openMinute] = nextOpening.open.split(':').map(Number);
        const [currentHour, currentMinute] = currentTime.split(':').map(Number);
        const minutesUntilOpen = (openHour - currentHour) * 60 + (openMinute - currentMinute);
        if (minutesUntilOpen <= 60) {
          return 'opening-soon';
        }
      }
    }

    // Verificar si abre pronto en el próximo día
    let nextDayIndex = (now.getDay() + 1) % 7;
    const nextDay = days[nextDayIndex];
    const nextDaySchedule = schedule[nextDay];

    if (nextDaySchedule.isOpen && nextDaySchedule.ranges.length > 0) {
      const [firstOpenHour, firstOpenMinute] = nextDaySchedule.ranges[0].open.split(':').map(Number);
      const [currentHour, currentMinute] = currentTime.split(':').map(Number);
      const minutesUntilOpen = (24 - currentHour + firstOpenHour) * 60 - currentMinute + firstOpenMinute;
      if (minutesUntilOpen <= 60) {
        return 'opening-soon';
      }
    }

    return 'closed';
  }

  const isCurrentlyOpen = daySchedule.ranges.some(range => {
    return currentTime >= range.open && currentTime <= range.close;
  });

  if (isCurrentlyOpen) {
    return 'open';
  }

  // Verificar si abre pronto
  const nextOpening = daySchedule.ranges.find(range => range.open > currentTime);
  if (nextOpening) {
    const [openHour, openMinute] = nextOpening.open.split(':').map(Number);
    const [currentHour, currentMinute] = currentTime.split(':').map(Number);
    const minutesUntilOpen = (openHour - currentHour) * 60 + (openMinute - currentMinute);
    if (minutesUntilOpen <= 60) {
      return 'opening-soon';
    }
  }

  return 'closed';
}

export function isBusinessOpen(schedule: BusinessSchedule): boolean {
  return getBusinessStatus(schedule) === 'open';
}