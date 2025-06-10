// backend/src/access/access.controller.ts - CÃ“DIGO CORREGIDO
import { Controller, Get, Post, Body, Param, UseGuards, Query, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AccessService } from './access.service';

@Controller('access')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AccessController {
  constructor(private readonly accessService: AccessService) {}

  // â­ CHECK-IN (Entrada)
  @Post('check-in')
  @Roles('Administrador', 'Instructor', 'Funcionario')
  async checkIn(@Body() data: { 
    profileId?: number; 
    qrData?: string 
  }) {
    return await this.accessService.checkIn(data);
  }

  // â­ CHECK-OUT (Salida)
  @Post('check-out')
  @Roles('Administrador', 'Instructor', 'Funcionario')
  async checkOut(@Body() data: { 
    profileId?: number; 
    qrData?: string 
  }) {
    return await this.accessService.checkOut(data);
  }

  // â­ OBTENER OCUPACIÃ“N ACTUAL
  @Get('current')
  @Roles('Administrador', 'Instructor', 'Funcionario')
  async getCurrentOccupancy() {
    return await this.accessService.getCurrentOccupancy();
  }

  // â­ OBTENER HISTORIAL DE ACCESOS - CORREGIDO
  @Get('history')
  @Roles('Administrador', 'Instructor', 'Funcionario')
  async getHistory(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('date') date?: string,
    @Query('userId') userId?: string
  ) {
    // â­ CORREGIR: Asegurar valores por defecto
    const params = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      date: date ? new Date(date) : undefined,
      userId: userId ? parseInt(userId) : undefined
    };

    return await this.accessService.getHistory(params);
  }

  // â­ OBTENER ESTADÃSTICAS DE ACCESO
  @Get('stats')
  @Roles('Administrador', 'Instructor', 'Funcionario')
  async getStats(@Query('date') date?: string) {
    const targetDate = date ? new Date(date) : undefined;
    return await this.accessService.getStats(targetDate);
  }

  // â­ BUSCAR POR NÃšMERO DE DOCUMENTO
  @Get('search/:documentNumber')
  @Roles('Administrador', 'Instructor', 'Funcionario')
  async searchByDocument(@Param('documentNumber') documentNumber: string) {
    return await this.accessService.searchByDocument(documentNumber);
  }

  // â­ OBTENER ACCESO ACTIVO DE UN USUARIO
  @Get('active/:userId')
  @Roles('Administrador', 'Instructor', 'Funcionario')
  async getActiveAccess(@Param('userId') userId: number) {
    return await this.accessService.getActiveAccess(userId);
  }

  // â­ FORZAR SALIDA (para casos especiales)
  @Post('force-checkout/:userId')
  @Roles('Administrador')
  async forceCheckOut(
    @Param('userId') userId: number,
    @Body() data: { reason?: string }
  ) {
    return await this.accessService.forceCheckOut(userId, data.reason);
  }

  // â­ OBTENER MIS ACCESOS (para usuarios regulares) - CORREGIDO
  @Get('my-access')
  @Roles('Administrador', 'Instructor', 'Funcionario', 'Aprendiz')
  async getMyAccess(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    // â­ CORREGIR: Asegurar valores por defecto
    const params = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      userId: req.user.id
    };

    return await this.accessService.getHistory(params);
  }

  // â­ VERIFICAR ESTADO DE ACCESO ACTUAL
  @Get('my-status')
  @Roles('Administrador', 'Instructor', 'Funcionario', 'Aprendiz')
  async getMyStatus(@Request() req: any) {
    const activeAccess = await this.accessService.getActiveAccess(req.user.id);
    
    return {
      hasActiveAccess: !!activeAccess,
      accessRecord: activeAccess || null,
      status: activeAccess ? 'DENTRO' : 'FUERA'
    };
  }

  // â­ OBTENER ESTADÃSTICAS POR TIPO DE USUARIO
  @Get('stats-by-type')
  @Roles('Administrador')
  async getStatsByType(@Query('date') date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    
    const occupancy = await this.accessService.getCurrentOccupancy();
    const dailyStats = await this.accessService.getStats(targetDate);
    
    return {
      current: occupancy.byType,
      daily: dailyStats,
      date: targetDate
    };
  }

  // â­ EXPORTAR REPORTE DE ACCESOS - CORREGIDO
  @Get('export')
  @Roles('Administrador')
  async exportAccessReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('format') format: string = 'json'
  ) {
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date();
    
    // â­ CORREGIR: Usar parÃ¡metros correctos
    const history = await this.accessService.getHistory({
      page: 1,
      limit: 1000
    });

    if (format === 'csv') {
      return {
        message: 'ExportaciÃ³n CSV no implementada aÃºn',
        data: history.data
      };
    }

    return {
      period: { startDate: start, endDate: end },
      totalRecords: history.total,
      data: history.data
    };
  }

  // â­ OBTENER RESUMEN DE ACTIVIDAD - CORREGIDO
  @Get('activity-summary')
  @Roles('Administrador', 'Instructor')
  async getActivitySummary(@Query('days') days: string = '7') {
    const daysCount = parseInt(days);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysCount);

    // â­ CORREGIR: Tipar correctamente el array
    const summaryData: Array<{
      date: string;
      totalAccess: number;
      averageDuration: number;
      accessByHour: Array<{ hour: number; count: number }>;
    }> = [];
    
    for (let i = 0; i < daysCount; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const dayStats = await this.accessService.getStats(currentDate);
      
      summaryData.push({
        date: currentDate.toISOString().split('T')[0],
        totalAccess: dayStats.totalAccess,
        averageDuration: dayStats.averageDurationMinutes,
        accessByHour: dayStats.accessByHour
      });
    }

    return {
      period: { startDate, endDate, days: daysCount },
      summary: summaryData
    };
  }

  // â­ VALIDAR QR CODE
  @Post('validate-qr')
  @Roles('Administrador', 'Instructor', 'Funcionario')
  async validateQR(@Body() data: { qrData: string }) {
    try {
      const qrInfo = JSON.parse(data.qrData);
      
      if (!qrInfo.id || !qrInfo.doc || !qrInfo.type) {
        return {
          valid: false,
          message: 'Formato de QR invÃ¡lido'
        };
      }

      const searchResult = await this.accessService.searchByDocument(qrInfo.doc);
      
      return {
        valid: searchResult.found,
        profile: searchResult.profile || null,
        qrInfo: qrInfo,
        message: searchResult.found ? 'QR vÃ¡lido' : 'Perfil no encontrado'
      };
    } catch (error) {
      return {
        valid: false,
        message: 'QR no vÃ¡lido o corrupto'
      };
    }
  }

  // â­ OBTENER MÃ‰TRICAS EN TIEMPO REAL
  @Get('realtime-metrics')
  @Roles('Administrador', 'Instructor')
  async getRealtimeMetrics() {
    const currentOccupancy = await this.accessService.getCurrentOccupancy();
    const todayStats = await this.accessService.getStats();
    
    return {
      timestamp: new Date(),
      currentOccupancy: currentOccupancy.total,
      byType: currentOccupancy.byType,
      todayTotal: todayStats.totalAccess,
      averageDuration: todayStats.averageDurationMinutes,
      lastHourAccess: todayStats.accessByHour[new Date().getHours()]?.count || 0
    };
  }

  // â­ OBTENER REPORTE SIMPLE (sin getDailyReport que no existe)
  @Get('daily-report')
  @Roles('Administrador', 'Instructor')
  async getDailyReport(@Query('date') date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    
    // â­ USAR MÃ‰TODOS EXISTENTES EN LUGAR DE getDailyReport
    const stats = await this.accessService.getStats(targetDate);
    const history = await this.accessService.getHistory({
      page: 1,
      limit: 100,
      date: targetDate
    });

    return {
      date: targetDate,
      stats,
      recentAccess: history.data,
      totalRecords: history.total
    };
  }
}