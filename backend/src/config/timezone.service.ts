// backend/src/config/timezone.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class TimezoneService {
  private readonly defaultTimezone = 'America/Bogota';

  // ⭐ OBTENER FECHA ACTUAL EN ZONA HORARIA DE COLOMBIA
  getCurrentDateInColombia(): Date {
    const now = new Date();
    
    // Convertir a zona horaria de Colombia
    const colombiaTime = new Date(now.toLocaleString("en-US", {timeZone: this.defaultTimezone}));
    
    console.log('🌍 Fecha actual del servidor:', {
      utc: now.toISOString(),
      colombia: colombiaTime.toISOString(),
      localString: colombiaTime.toLocaleString('es-CO')
    });
    
    return colombiaTime;
  }

  // ⭐ FORMATEAR FECHA PARA BASE DE DATOS (YYYY-MM-DD)
  formatDateForDB(date?: Date): string {
    const targetDate = date || this.getCurrentDateInColombia();
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  // ⭐ OBTENER INICIO Y FIN DEL DÍA EN COLOMBIA
  getDayBounds(date?: Date): { startOfDay: Date; endOfDay: Date } {
    const targetDate = date || this.getCurrentDateInColombia();
    
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    return { startOfDay, endOfDay };
  }

  // ⭐ PARSEAR FECHA DESDE STRING (YYYY-MM-DD) EN ZONA HORARIA COLOMBIA
  parseDate(dateString: string): Date {
    // Asegurar que la fecha se interprete en zona horaria de Colombia
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month - 1 porque Date usa 0-based months
    
    return date;
  }

  // ⭐ VERIFICAR SI UNA FECHA ES HOY EN COLOMBIA
  isToday(date: Date | string): boolean {
    const today = this.formatDateForDB();
    const targetDate = typeof date === 'string' ? date : this.formatDateForDB(date);
    
    return today === targetDate;
  }

  // ⭐ OBTENER INFORMACIÓN COMPLETA DE ZONA HORARIA
  getTimezoneInfo(): {
    timezone: string;
    currentDate: string;
    currentTime: string;
    offset: string;
  } {
    const now = this.getCurrentDateInColombia();
    
    return {
      timezone: this.defaultTimezone,
      currentDate: this.formatDateForDB(now),
      currentTime: now.toLocaleTimeString('es-CO'),
      offset: 'UTC-5' // Colombia está en UTC-5
    };
  }

  // ⭐ CONVERTIR FECHA UTC A COLOMBIA
  utcToColombia(utcDate: Date): Date {
    return new Date(utcDate.toLocaleString("en-US", {timeZone: this.defaultTimezone}));
  }

  // ⭐ VALIDAR SI UNA FECHA ESTÁ EN RANGO VÁLIDO
  isValidDateRange(date: Date | string, maxDaysBack: number = 30, maxDaysForward: number = 7): boolean {
    const targetDate = typeof date === 'string' ? this.parseDate(date) : date;
    const today = this.getCurrentDateInColombia();
    
    const minDate = new Date(today);
    minDate.setDate(today.getDate() - maxDaysBack);
    
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + maxDaysForward);
    
    return targetDate >= minDate && targetDate <= maxDate;
  }
}



