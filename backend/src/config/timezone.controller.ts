// ⭐ ENDPOINT PARA SINCRONIZACIÓN DE FECHA
// backend/src/config/
import { Controller, Get } from '@nestjs/common';
import { TimezoneService } from './timezone.service';

@Controller('config/timezone')
export class TimezoneController {
  constructor(private readonly timezoneService: TimezoneService) {}

  @Get('current')
  getCurrentTimezone() {
    return {
      ...this.timezoneService.getTimezoneInfo(),
      serverTime: new Date().toISOString(),
      timestamp: Date.now()
    };
  }

  @Get('colombia-time')
  getColombiaTime() {
    const colombiaTime = this.timezoneService.getCurrentDateInColombia();
    
    return {
      date: this.timezoneService.formatDateForDB(colombiaTime),
      time: colombiaTime.toLocaleTimeString('es-CO'),
      fullDateTime: colombiaTime.toLocaleString('es-CO'),
      iso: colombiaTime.toISOString(),
      timestamp: colombiaTime.getTime()
    };
  }
}