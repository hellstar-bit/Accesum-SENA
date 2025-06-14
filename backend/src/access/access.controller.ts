// backend/src/access/access.controller.ts - COMPLETO CORREGIDO
import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  Request,
  ParseIntPipe,
  HttpStatus,
  HttpException,
  NotFoundException,
  BadRequestException
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AccessService } from './access.service';

@Controller('access')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AccessController {
  constructor(private readonly accessService: AccessService) {}

  // ⭐ CHECK-IN - ENTRADA AL SISTEMA
  @Post('check-in')
  @Roles('Administrador', 'Instructor', 'Aprendiz')
  @Post('check-in')
@Roles('Administrador', 'Instructor', 'Aprendiz')
async checkIn(@Body() data: { 
  profileId?: number; 
  qrData?: string 
}) {
  try {
    console.log('🌐 POST /access/check-in');
    
    if (!data.profileId && !data.qrData) {
      throw new BadRequestException('Se requiere profileId o qrData');
    }

    const result = await this.accessService.checkIn(data);
    console.log('✅ Check-in exitoso');
    
    // ⭐ RETORNAR DIRECTAMENTE EL RESULTADO (YA TIENE LA ESTRUCTURA CORRECTA)
    return result;
  } catch (error) {
    console.error('❌ Error en check-in:', error);
    throw error;
  }
}

// ⭐ CHECK-OUT - SALIDA DEL SISTEMA (CORREGIDO)
@Post('check-out')
@Roles('Administrador', 'Instructor', 'Aprendiz')
async checkOut(@Body() data: { 
  profileId?: number; 
  qrData?: string 
}) {
  try {
    console.log('🌐 POST /access/check-out');
    
    if (!data.profileId && !data.qrData) {
      throw new BadRequestException('Se requiere profileId o qrData');
    }

    const result = await this.accessService.checkOut(data);
    console.log('✅ Check-out exitoso');
    
    // ⭐ RETORNAR DIRECTAMENTE EL RESULTADO (YA TIENE LA ESTRUCTURA CORRECTA)
    return result;
  } catch (error) {
    console.error('❌ Error en check-out:', error);
    throw error;
  }
}

  // ⭐ OBTENER ESTADÍSTICAS DE ACCESO
  @Get('stats')
  @Roles('Administrador')
  async getStats(@Query() filters: {
    startDate?: string;
    endDate?: string;
    groupBy?: 'day' | 'week' | 'month';
  }) {
    try {
      console.log('🌐 GET /access/stats');
      const stats = await this.accessService.getStats(filters);
      console.log('✅ Estadísticas obtenidas exitosamente');
      return stats;
    } catch (error) {
      console.error('❌ Error al obtener estadísticas:', error);
      throw new HttpException(
        'Error al obtener estadísticas de acceso',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ⭐ OBTENER HISTORIAL DE ACCESOS
  @Get('history')
  @Roles('Administrador')
  async getHistory(@Query() filters: {
    userId?: number;
    startDate?: string;
    endDate?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      console.log('🌐 GET /access/history');
      const history = await this.accessService.getHistory(filters);
      console.log('✅ Historial obtenido exitosamente');
      return history;
    } catch (error) {
      console.error('❌ Error al obtener historial:', error);
      throw new HttpException(
        'Error al obtener historial de accesos',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ⭐ BUSCAR POR NÚMERO DE DOCUMENTO
  @Get('search/:document')
  @Roles('Administrador')
  async searchByDocument(@Param('document') documentNumber: string) {
    try {
      console.log('🌐 GET /access/search/' + documentNumber);
      
      if (!documentNumber || documentNumber.trim().length === 0) {
        throw new BadRequestException('Número de documento requerido');
      }

      const result = await this.accessService.searchByDocument(documentNumber.trim());
      
      if (!result.found) {
        throw new NotFoundException(result.message || 'Usuario no encontrado');
      }
      
      console.log('✅ Búsqueda por documento exitosa');
      return result;
    } catch (error) {
      console.error('❌ Error en búsqueda por documento:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new HttpException(
        'Error al buscar por documento',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ⭐ OBTENER ACCESOS ACTIVOS (USUARIOS DENTRO)
  @Get('active')
  @Roles('Administrador')
  async getActiveAccess() {
    try {
      console.log('🌐 GET /access/active');
      const activeAccess = await this.accessService.getActiveAccess();
      console.log('✅ Accesos activos obtenidos exitosamente');
      return activeAccess;
    } catch (error) {
      console.error('❌ Error al obtener accesos activos:', error);
      throw new HttpException(
        'Error al obtener accesos activos',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ⭐ OBTENER OCUPACIÓN ACTUAL
  @Get('occupancy')
  @Roles('Administrador')
  async getCurrentOccupancy() {
    try {
      console.log('🌐 GET /access/occupancy');
      const occupancy = await this.accessService.getCurrentOccupancy();
      console.log('✅ Ocupación actual obtenida exitosamente');
      return occupancy;
    } catch (error) {
      console.error('❌ Error al obtener ocupación actual:', error);
      throw new HttpException(
        'Error al obtener ocupación actual',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ⭐ VERIFICAR ESTADO DE ACCESO DE UN USUARIO
  @Get('status/:userId')
  @Roles('Administrador')
  async checkUserStatus(@Param('userId', ParseIntPipe) userId: number) {
    try {
      console.log('🌐 GET /access/status/' + userId);
      const status = await this.accessService.checkUserStatus(userId);
      console.log('✅ Estado de usuario obtenido exitosamente');
      return status;
    } catch (error) {
      console.error('❌ Error al verificar estado del usuario:', error);
      throw new HttpException(
        'Error al verificar estado del usuario',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ⭐ FORZAR CHECK-OUT (SOLO ADMINISTRADORES)
  @Post('force-checkout')
  @Roles('Administrador')
  async forceCheckOut(
    @Body() data: { 
      userId?: number; 
      accessRecordId?: number; 
      reason?: string;
    },
    @Request() req: any
  ) {
    try {
      console.log('🌐 POST /access/force-checkout');
      
      if (!data.userId && !data.accessRecordId) {
        throw new BadRequestException('Se requiere userId o accessRecordId');
      }

      const result = await this.accessService.forceCheckOut({
        ...data,
        adminUserId: req.user.id // ID del administrador que fuerza el checkout
      });
      
      console.log('✅ Check-out forzado exitoso');
      return result;
    } catch (error) {
      console.error('❌ Error al forzar check-out:', error);
      throw error;
    }
  }

  // ⭐ OBTENER REPORTE DETALLADO
  @Get('report')
@Roles('Administrador')
async getDetailedReport(@Query() filters: {
  startDate?: string;
  endDate?: string;
  userType?: string;
  includeActive?: string; // ⭐ CAMBIAR A string AQUÍ
}) {
  try {
    console.log('🌐 GET /access/report');
    
    // ⭐ CREAR OBJETO CON TIPO CORRECTO
    const processedFilters = {
      startDate: filters.startDate,
      endDate: filters.endDate,
      userType: filters.userType,
      includeActive: filters.includeActive 
        ? filters.includeActive.toLowerCase() === 'true' 
        : undefined
    };

    const report = await this.accessService.getDetailedReport(processedFilters);
    console.log('✅ Reporte detallado generado exitosamente');
    return report;
  } catch (error) {
    console.error('❌ Error al generar reporte detallado:', error);
    throw new HttpException(
      'Error al generar reporte detallado',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

  // ⭐ LIMPIAR REGISTROS ANTIGUOS (MANTENIMIENTO)
  @Post('cleanup')
  @Roles('Administrador')
  async cleanupOldRecords(@Body() data: { daysToKeep?: number }) {
    try {
      console.log('🌐 POST /access/cleanup');
      
      const daysToKeep = data.daysToKeep || 365;
      
      if (daysToKeep < 30) {
        throw new BadRequestException('No se pueden eliminar registros de menos de 30 días');
      }

      const result = await this.accessService.cleanupOldRecords(daysToKeep);
      console.log('✅ Limpieza de registros completada');
      return result;
    } catch (error) {
      console.error('❌ Error en limpieza de registros:', error);
      throw error;
    }
  }

  // ⭐ OBTENER MI ESTADO DE ACCESO (PARA USUARIOS AUTENTICADOS)
  @Get('my-status')
  @Roles('Administrador', 'Instructor', 'Aprendiz', )
  async getMyStatus(@Request() req: any) {
    try {
      console.log('🌐 GET /access/my-status');
      const status = await this.accessService.checkUserStatus(req.user.id);
      console.log('✅ Mi estado obtenido exitosamente');
      return status;
    } catch (error) {
      console.error('❌ Error al obtener mi estado:', error);
      throw new HttpException(
        'Error al obtener estado personal',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ⭐ OBTENER MIS ÚLTIMOS ACCESOS
  @Get('my-history')
  @Roles('Administrador', 'Instructor', 'Aprendiz', )
  async getMyHistory(
    @Request() req: any,
    @Query() filters: {
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    }
  ) {
    try {
      console.log('🌐 GET /access/my-history');
      
      const history = await this.accessService.getHistory({
        ...filters,
        userId: req.user.id // Filtrar solo por el usuario autenticado
      });
      
      console.log('✅ Mi historial obtenido exitosamente');
      return history;
    } catch (error) {
      console.error('❌ Error al obtener mi historial:', error);
      throw new HttpException(
        'Error al obtener historial personal',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ⭐ ENDPOINT DE SALUD DEL SERVICIO
  @Get('health')
  async healthCheck() {
    try {
      const occupancy = await this.accessService.getCurrentOccupancy();
      return {
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'Access Control',
        currentOccupancy: occupancy.total,
        message: 'Servicio de control de acceso funcionando correctamente'
      };
    } catch (error) {
      throw new HttpException(
        'Servicio de control de acceso no disponible',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  // ⭐ OBTENER ESTADÍSTICAS RÁPIDAS (DASHBOARD)
  @Get('quick-stats')
@Roles('Administrador')
async getQuickStats() {
  try {
    console.log('🌐 GET /access/quick-stats');
    
    // Obtener estadísticas de hoy
    const today = new Date().toISOString().split('T')[0];
    const todayStats = await this.accessService.getStats({
      startDate: today,
      endDate: today
    });

    // Obtener ocupación actual
    const occupancy = await this.accessService.getCurrentOccupancy();

    // ⭐ CORREGIR LLAMADA SIN PARÁMETROS
    const activeAccess = await this.accessService.getActiveAccess();

    console.log('✅ Estadísticas rápidas obtenidas');
    
    return {
      today: {
        totalAccess: todayStats.totalAccess,
        uniqueUsers: todayStats.uniqueUsers,
        peakHour: todayStats.peakHour,
        accessByHour: todayStats.accessByHour
      },
      current: {
        occupancy: occupancy.total,
        byType: occupancy.byType,
        activeRecords: activeAccess.total
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Error al obtener estadísticas rápidas:', error);
    throw new HttpException(
      'Error al obtener estadísticas rápidas',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}
@Post('validate-qr')
@Roles('Administrador', 'Instructor', 'Aprendiz')
async validateQR(@Body() data: { qrData: string }) {
  try {
    console.log('🌐 POST /access/validate-qr');
    
    if (!data.qrData) {
      throw new BadRequestException('Datos QR requeridos');
    }

    const result = await this.accessService.validateQR(data.qrData);
    console.log('✅ Validación QR exitosa');
    return result;
  } catch (error) {
    console.error('❌ Error al validar QR:', error);
    throw error;
  }
}

// ⭐ BÚSQUEDA POR DOCUMENTO (QUERY PARAM)
@Get('search')
@Roles('Administrador', 'Instructor')
async searchByDocumentQuery(@Query('documentNumber') documentNumber: string) {
  try {
    console.log('🌐 GET /access/search?documentNumber=' + documentNumber);
    
    if (!documentNumber || documentNumber.trim().length === 0) {
      return {
        found: false,
        message: 'Número de documento requerido'
      };
    }

    const result = await this.accessService.searchByDocument(documentNumber.trim());
    console.log('✅ Búsqueda por documento exitosa');
    return result;
  } catch (error) {
    console.error('❌ Error en búsqueda por documento:', error);
    return {
      found: false,
      message: 'Error al buscar por documento',
      error: error.message
    };
  }
}

// ⭐ OCUPACIÓN ACTUAL (ALIAS PARA COMPATIBILIDAD)
@Get('current-occupancy')
@Roles('Administrador', 'Instructor')
async getCurrentOccupancyAlias() {
  try {
    console.log('🌐 GET /access/current-occupancy');
    const occupancy = await this.accessService.getCurrentOccupancy();
    
    // Formatear respuesta para compatibilidad con frontend
    return {
      current: occupancy.total,
      capacity: 100, // Capacidad máxima (configurable)
      percentage: Math.round((occupancy.total / 100) * 100),
      total: occupancy.total, // Alias para compatibilidad
      records: occupancy.details
    };
  } catch (error) {
    console.error('❌ Error al obtener ocupación actual:', error);
    throw new HttpException(
      'Error al obtener ocupación actual',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

// ⭐ ESTADÍSTICAS EN TIEMPO REAL
@Get('realtime-stats')
@Roles('Administrador', 'Instructor')
async getRealTimeStats() {
  try {
    console.log('🌐 GET /access/realtime-stats');
    
    // Obtener estadísticas de las últimas 24 horas
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const now = new Date().toISOString();
    
    const stats = await this.accessService.getStats({
      startDate: yesterday,
      endDate: now
    });
    
    const occupancy = await this.accessService.getCurrentOccupancy();
    
    // Obtener usuarios más activos (simulado por ahora)
    const mostActiveUsers = [
      { name: 'Usuario Ejemplo 1', visits: 15 },
      { name: 'Usuario Ejemplo 2', visits: 12 },
      { name: 'Usuario Ejemplo 3', visits: 10 }
    ];
    
    const result = {
      entriesLast24h: stats.totalEntries || 0,
      exitsLast24h: stats.completedSessions || 0,
      currentOccupancy: occupancy.total,
      averageStayTime: stats.averageSessionTime || '0h 0m',
      peakHourToday: stats.peakHour?.hour ? `${stats.peakHour.hour}:00` : 'N/A',
      mostActiveUsers
    };
    
    console.log('✅ Estadísticas en tiempo real obtenidas');
    return result;
  } catch (error) {
    console.error('❌ Error al obtener estadísticas en tiempo real:', error);
    throw new HttpException(
      'Error al obtener estadísticas en tiempo real',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

// ⭐ MÉTRICAS DE ACCESO
@Get('metrics')
@Roles('Administrador', 'Instructor')
async getAccessMetrics(@Query() params: {
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'week' | 'month';
}) {
  try {
    console.log('🌐 GET /access/metrics');
    
    const stats = await this.accessService.getStats({
      startDate: params.startDate,
      endDate: params.endDate,
      groupBy: params.groupBy
    });
    
    // Formatear respuesta para compatibilidad con frontend
    const result = {
      totalToday: stats.totalEntries || 0,
      currentOccupancy: stats.currentlyInside || 0,
      averageStayTime: stats.averageSessionTime || '0h 0m',
      peakHours: stats.peakHour ? [{
        hour: `${stats.peakHour.hour}:00`,
        count: stats.peakHour.count
      }] : [],
      dailyStats: stats.entriesByDay ? Object.entries(stats.entriesByDay).map(([date, entries]) => ({
        date,
        entries: entries as number,
        exits: entries as number, // Simplificado
        maxOccupancy: Math.floor((entries as number) * 0.8) // Estimado
      })) : []
    };
    
    console.log('✅ Métricas de acceso obtenidas');
    return result;
  } catch (error) {
    console.error('❌ Error al obtener métricas:', error);
    throw new HttpException(
      'Error al obtener métricas de acceso',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

// ⭐ REGISTROS DE HOY
@Get('today')
@Roles('Administrador', 'Instructor')
async getTodayRecords() {
  try {
    console.log('🌐 GET /access/today');
    
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const history = await this.accessService.getHistory({
      startDate: today,
      endDate: tomorrow,
      limit: 100
    });
    
    console.log('✅ Registros de hoy obtenidos');
    return history.data;
  } catch (error) {
    console.error('❌ Error al obtener registros de hoy:', error);
    throw new HttpException(
      'Error al obtener registros de hoy',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

// ⭐ PERSONAS ACTUALMENTE DENTRO
@Get('people-inside')
@Roles('Administrador', 'Instructor')
async getPeopleInside() {
  try {
    console.log('🌐 GET /access/people-inside');
    
    const occupancy = await this.accessService.getCurrentOccupancy();
    
    const result = {
      count: occupancy.total,
      people: occupancy.details.map(detail => ({
        id: detail.user?.profile?.id || 0,
        name: detail.user?.profile?.name || 'Sin nombre',
        documentNumber: detail.user?.profile?.documentNumber || 'Sin documento',
        entryTime: detail.entryTime.toISOString(),
        duration: detail.duration || '0h 0m',
        type: detail.user?.profile?.type || 'Desconocido'
      }))
    };
    
    console.log('✅ Personas dentro obtenidas');
    return result;
  } catch (error) {
    console.error('❌ Error al obtener personas dentro:', error);
    throw new HttpException(
      'Error al obtener personas en instalaciones',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}
}
