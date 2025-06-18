// backend/src/dashboard/dashboard.controller.ts - VERSIÓN CORREGIDA CON DATOS 100% REALES
import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardService, type DashboardFilters } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // ===== ENDPOINTS CON DATOS 100% REALES =====

  @Get('enhanced-activity')
  async getEnhancedActivity(
  @Query('days') days?: string,
  @Query('activityType') activityType?: 'entry' | 'exit' | 'all',
  @Query('fichaIds') fichaIds?: string,
  @Query('userIds') userIds?: string,
  @Query('limit') limit?: string,
  @Query('offset') offset?: string,
) {
  const filters: any = {
    days: days ? parseInt(days) : 7,
    activityType: activityType || 'all',
    limit: limit ? parseInt(limit) : 50,
    offset: offset ? parseInt(offset) : 0,
  };

  if (fichaIds) {
    filters.fichaIds = fichaIds.split(',').map(id => parseInt(id));
  }
  if (userIds) {
    filters.userIds = userIds.split(',').map(id => parseInt(id));
  }

  return await this.dashboardService.getEnhancedRecentActivity(filters);
}

@Get('fichas')
async getFichas() {
  return await this.dashboardService.getFichas();
}

  @Get('stats')
  async getStats() {
    console.log('📊 Endpoint: Obteniendo estadísticas básicas REALES');
    return await this.dashboardService.getDashboardStats();
  }

  @Get('enhanced-stats')
  async getEnhancedStats(
    @Query('timeRange') timeRange?: '1d' | '7d' | '30d' | '90d',
    @Query('regionalId') regionalIdStr?: string,
    @Query('centerId') centerIdStr?: string,
    @Query('personnelTypeId') personnelTypeIdStr?: string,
  ) {
    console.log('📊 Endpoint: Construyendo estadísticas mejoradas REALES');
    
    try {
      // ⭐ PARSEAR PARÁMETROS DE FILTRO
      const filters: DashboardFilters = {
        timeRange: timeRange || '7d',
        regionalId: regionalIdStr ? parseInt(regionalIdStr) : undefined,
        centerId: centerIdStr ? parseInt(centerIdStr) : undefined,
        personnelTypeId: personnelTypeIdStr ? parseInt(personnelTypeIdStr) : undefined,
      };
      
      console.log('🔍 Filtros aplicados:', filters);
      
      // ⭐ OBTENER DATOS REALES DE LA BASE DE DATOS
      const enhancedStats = await this.dashboardService.getEnhancedDashboardStats(filters);
      
      console.log('✅ Estadísticas mejoradas REALES calculadas exitosamente');
      return enhancedStats;
      
    } catch (error) {
      console.error('❌ Error en enhanced-stats:', error);
      throw error;
    }
  }

  @Get('access-trends')
  async getAccessTrends(
    @Query('timeRange') timeRange?: '1d' | '7d' | '30d' | '90d',
    @Query('regionalId') regionalIdStr?: string,
    @Query('centerId') centerIdStr?: string,
  ) {
    console.log('📈 Endpoint: Generando tendencias de acceso REALES');
    
    try {
      const filters: DashboardFilters = {
        timeRange: timeRange || '7d',
        regionalId: regionalIdStr ? parseInt(regionalIdStr) : undefined,
        centerId: centerIdStr ? parseInt(centerIdStr) : undefined,
      };

      console.log('🔍 Filtros para tendencias:', filters);
      
      // ⭐ OBTENER TENDENCIAS REALES DE LA BASE DE DATOS
      const trends = await this.dashboardService.getAccessTrends(filters);
      
      console.log(`✅ Tendencias REALES generadas para ${trends.length} días`);
      return trends;
      
    } catch (error) {
      console.error('❌ Error en access-trends:', error);
      throw error;
    }
  }

  @Get('regional-stats')
  async getRegionalStats(
    @Query('timeRange') timeRange?: '1d' | '7d' | '30d' | '90d',
  ) {
    console.log('🌍 Endpoint: Obteniendo estadísticas regionales REALES');
    
    try {
      const filters: DashboardFilters = {
        timeRange: timeRange || '7d',
      };
      
      // ⭐ OBTENER DATOS REGIONALES REALES
      const regionalStats = await this.dashboardService.getRegionalStats(filters);
      
      console.log(`✅ Estadísticas regionales REALES para ${regionalStats.length} regionales`);
      return regionalStats;
      
    } catch (error) {
      console.error('❌ Error en regional-stats:', error);
      throw error;
    }
  }

  @Get('center-stats')
  async getCenterStats(
    @Query('regionalId') regionalIdStr?: string,
  ) {
    console.log('🏢 Endpoint: Obteniendo estadísticas de centros REALES');
    
    try {
      const filters: DashboardFilters = {
        regionalId: regionalIdStr ? parseInt(regionalIdStr) : undefined,
      };
      
      // ⭐ OBTENER DATOS DE CENTROS REALES
      const centerStats = await this.dashboardService.getCenterStats(filters);
      
      console.log(`✅ Estadísticas de centros REALES para ${centerStats.length} centros`);
      return centerStats;
      
    } catch (error) {
      console.error('❌ Error en center-stats:', error);
      throw error;
    }
  }

  @Get('user-type-distribution')
  async getUserTypeDistribution(
    @Query('regionalId') regionalIdStr?: string,
    @Query('centerId') centerIdStr?: string,
  ) {
    console.log('👥 Endpoint: Obteniendo distribución por tipo REAL');
    
    try {
      const filters: DashboardFilters = {
        regionalId: regionalIdStr ? parseInt(regionalIdStr) : undefined,
        centerId: centerIdStr ? parseInt(centerIdStr) : undefined,
      };
      
      // ⭐ OBTENER DISTRIBUCIÓN REAL DE LA BASE DE DATOS
      const distribution = await this.dashboardService.getUserTypeDistribution(filters);
      
      console.log(`✅ Distribución REAL calculada para ${distribution.length} tipos`);
      return distribution;
      
    } catch (error) {
      console.error('❌ Error en user-type-distribution:', error);
      throw error;
    }
  }

  @Get('recent-activity')
  async getRecentActivity(
    @Query('limit') limitStr?: string,
    @Query('regionalId') regionalIdStr?: string,
    @Query('centerId') centerIdStr?: string,
  ) {
    console.log('🕐 Endpoint: Obteniendo actividad reciente REAL');
    
    try {
      let limit = 10;
      if (limitStr) {
        const parsed = parseInt(limitStr);
        if (!isNaN(parsed) && parsed > 0 && parsed <= 100) {
          limit = parsed;
        }
      }
      
      const filters: DashboardFilters = {
        regionalId: regionalIdStr ? parseInt(regionalIdStr) : undefined,
        centerId: centerIdStr ? parseInt(centerIdStr) : undefined,
      };
      
      // ⭐ OBTENER ACTIVIDAD REAL DE LA BASE DE DATOS
      const activity = await this.dashboardService.getRecentActivity(limit, filters);
      
      console.log(`✅ Actividad reciente REAL: ${activity.length} registros`);
      return activity;
      
    } catch (error) {
      console.error('❌ Error en recent-activity:', error);
      throw error;
    }
  }

  @Get('quick-summary')
  async getQuickSummary(
    @Query('regionalId') regionalIdStr?: string,
  ) {
    console.log('⚡ Endpoint: Obteniendo resumen rápido REAL');
    
    try {
      const filters: DashboardFilters = {
        regionalId: regionalIdStr ? parseInt(regionalIdStr) : undefined,
      };
      
      // ⭐ OBTENER RESUMEN REAL DE LA BASE DE DATOS
      const summary = await this.dashboardService.getQuickSummary(filters);
      
      console.log('✅ Resumen rápido REAL generado');
      return summary;
      
    } catch (error) {
      console.error('❌ Error en quick-summary:', error);
      throw error;
    }
  }

  @Get('alerts')
  async getDashboardAlerts() {
    console.log('🚨 Endpoint: Generando alertas REALES del dashboard');
    
    try {
      // ⭐ OBTENER ALERTAS BASADAS EN DATOS REALES
      const alerts = await this.dashboardService.getDashboardAlerts();
      
      console.log(`✅ Alertas REALES generadas: ${alerts.length}`);
      return alerts;
      
    } catch (error) {
      console.error('❌ Error en alerts:', error);
      throw error;
    }
  }

  @Get('realtime-metrics')
  async getRealtimeMetrics() {
    console.log('⏱️ Endpoint: Obteniendo métricas en tiempo real');
    
    try {
      // ⭐ OBTENER MÉTRICAS REALES EN TIEMPO REAL
      const metrics = await this.dashboardService.getRealtimeMetrics();
      
      console.log('✅ Métricas en tiempo real REALES obtenidas');
      return metrics;
      
    } catch (error) {
      console.error('❌ Error en realtime-metrics:', error);
      throw error;
    }
  }

  @Get('export-data')
  async exportDashboardData(
    @Query('timeRange') timeRange?: string,
    @Query('format') format?: 'json' | 'csv',
  ) {
    console.log('📤 Endpoint: Exportando datos REALES del dashboard');
    
    try {
      const exportData = await this.dashboardService.exportDashboardData(
        timeRange || '30d',
        format || 'json'
      );
      
      console.log('✅ Datos REALES exportados exitosamente');
      return exportData;
      
    } catch (error) {
      console.error('❌ Error en export-data:', error);
      throw error;
    }
  }

  @Get('validate-integrity')
  async validateDataIntegrity() {
    console.log('🔍 Endpoint: Validando integridad de datos');
    
    try {
      const validation = await this.dashboardService.validateDataIntegrity();
      
      console.log('✅ Validación de integridad completada');
      return validation;
      
    } catch (error) {
      console.error('❌ Error en validate-integrity:', error);
      throw error;
    }
  }

  // ===== ENDPOINTS LEGACY PARA COMPATIBILIDAD =====

  @Get('user-growth')
  async getUserGrowth() {
    console.log('📈 Endpoint legacy: Obteniendo crecimiento de usuarios REAL');
    return await this.dashboardService.getUserGrowth();
  }

  @Get('users-by-role')
  async getUsersByRole() {
    console.log('👔 Endpoint legacy: Obteniendo usuarios por rol REAL');
    return await this.dashboardService.getUsersByRole();
  }

  // ===== ENDPOINT PRINCIPAL PARA CARGAR TODO EL DASHBOARD =====

  @Get('complete-data')
  async getCompleteData(
    @Query('timeRange') timeRange?: '1d' | '7d' | '30d' | '90d',
    @Query('regionalId') regionalIdStr?: string,
    @Query('centerId') centerIdStr?: string,
  ) {
    console.log('🔄 Endpoint: Cargando TODOS los datos del dashboard REALES...');
    
    try {
      const filters: DashboardFilters = {
        timeRange: timeRange || '7d',
        regionalId: regionalIdStr ? parseInt(regionalIdStr) : undefined,
        centerId: centerIdStr ? parseInt(centerIdStr) : undefined,
      };

      console.log('🔍 Filtros para datos completos:', filters);

      // ⭐ CARGAR TODOS LOS DATOS EN PARALELO DESDE LA BASE DE DATOS
      const [
        stats,
        trends,
        regionalStats,
        centerStats,
        userTypeDistribution,
        recentActivity,
        alerts,
        realtimeMetrics
      ] = await Promise.all([
        this.dashboardService.getEnhancedDashboardStats(filters),
        this.dashboardService.getAccessTrends(filters),
        this.dashboardService.getRegionalStats(filters),
        this.dashboardService.getCenterStats(filters),
        this.dashboardService.getUserTypeDistribution(filters),
        this.dashboardService.getRecentActivity(10, filters),
        this.dashboardService.getDashboardAlerts(),
        this.dashboardService.getRealtimeMetrics()
      ]);

      const completeData = {
        metadata: {
          timestamp: new Date().toISOString(),
          filters,
          dataSource: 'real_database',
          recordCounts: {
            trends: trends.length,
            regionals: regionalStats.length,
            centers: centerStats.length,
            userTypes: userTypeDistribution.length,
            recentActivity: recentActivity.length,
            alerts: alerts.length,
          }
        },
        stats,
        trends,
        regionalStats,
        centerStats,
        userTypeDistribution,
        recentActivity,
        alerts,
        realtimeMetrics,
      };

      console.log('✅ Dashboard completo con datos 100% REALES cargado exitosamente!');
      console.log('📊 Resumen de datos:', completeData.metadata.recordCounts);
      
      return completeData;
      
    } catch (error) {
      console.error('❌ Error al cargar datos completos del dashboard:', error);
      throw error;
    }
  }

  // ===== ENDPOINT DE SALUD DEL SISTEMA =====

  @Get('health')
  async getHealthStatus() {
    console.log('🏥 Endpoint: Verificando salud del sistema de dashboard');
    
    try {
      const [stats, validation] = await Promise.all([
        this.dashboardService.getDashboardStats(),
        this.dashboardService.validateDataIntegrity()
      ]);

      const health = {
        status: validation.isValid ? 'healthy' : 'warning',
        timestamp: new Date().toISOString(),
        database: {
          connected: true,
          totalUsers: stats.totalUsers,
          activeUsers: stats.activeUsers,
          totalProfiles: stats.totalProfiles,
        },
        dataIntegrity: validation,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      };

      console.log('✅ Verificación de salud completada');
      return health;
      
    } catch (error) {
      console.error('❌ Error en verificación de salud:', error);
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: {
          connected: false,
          error: error.message,
        },
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      };
    }
  }
}