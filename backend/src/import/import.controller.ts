// backend/src/import/import.controller.ts - ACTUALIZADO CON ENDPOINT FALTANTE
import { 
  Controller, 
  Post, 
  UseInterceptors, 
  UploadedFile, 
  Body,
  UseGuards 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ROLES } from '../auth/constants/roles.constant';
import { ImportService } from './import.service';

@Controller('import')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  // ⭐ NUEVO: IMPORTAR APRENDICES CON DATOS DE FORMULARIO
  @Post('learners-with-form')
  @Roles(ROLES.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async importLearnersWithForm(
    @UploadedFile() file: Express.Multer['File'],
    @Body() body: any
  ) {
    if (!file) {
      throw new Error('No se ha proporcionado ningún archivo');
    }

    // Parsear datos del formulario
    let fichaData;
    try {
      fichaData = JSON.parse(body.fichaData);
    } catch (error) {
      throw new Error('Datos de ficha inválidos');
    }

    // Validar datos requeridos
    if (!fichaData.codigo || !fichaData.nombre || !fichaData.regionalId || !fichaData.centerId) {
      throw new Error('Faltan datos requeridos: código, nombre, regionalId o centerId');
    }

    return await this.importService.importLearnersWithForm(file, fichaData);
  }

  // ⭐ IMPORTAR ARCHIVO EXCEL GENERAL
  @Post('excel')
  @Roles(ROLES.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async importExcel(@UploadedFile() file: Express.Multer['File']) {
    if (!file) {
      throw new Error('No se ha proporcionado ningún archivo');
    }

    return await this.importService.importFromExcel(file);
  }

  // ⭐ IMPORTAR APRENDICES DESDE REPORTE SENA
  @Post('learners')
  @Roles(ROLES.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async importLearners(
    @UploadedFile() file: Express.Multer['File'],
    @Body() body: any
  ) {
    if (!file) {
      throw new Error('No se ha proporcionado ningún archivo');
    }

    const options = {
      generateQR: body.generateQR === 'true' || body.generateQR === true,
      createUsers: body.createUsers === 'true' || body.createUsers === true,
      updateExisting: body.updateExisting === 'true' || body.updateExisting === true,
    };

    return await this.importService.importLearners(file, options);
  }

  // ⭐ VALIDAR ARCHIVO ANTES DE IMPORTAR
  @Post('validate')
  @Roles(ROLES.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async validateFile(@UploadedFile() file: Express.Multer['File']) {
    if (!file) {
      throw new Error('No se ha proporcionado ningún archivo');
    }

    return await this.importService.validateImportFile(file);
  }

  // ⭐ VALIDAR UBICACIÓN (REGIONAL Y CENTRO)
  @Post('validate-location')
  @Roles(ROLES.ADMIN)
  async validateLocation(@Body() body: { regionalId: number; centerId: number }) {
    return await this.importService.validateLocation(body.regionalId, body.centerId);
  }

  // ⭐ VISTA PREVIA DE ARCHIVO EXCEL
  @Post('preview-excel')
  @Roles(ROLES.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async previewExcel(@UploadedFile() file: Express.Multer['File']) {
    if (!file) {
      throw new Error('No se ha proporcionado ningún archivo');
    }

    return await this.importService.previewExcelFile(file);
  }

  // ⭐ OBTENER PLANTILLA DE IMPORTACIÓN
  @Post('template')
  @Roles(ROLES.ADMIN)
  async getImportTemplate(@Body() body: { type: 'learners' | 'general' }) {
    return await this.importService.generateTemplate(body.type);
  }

  // ⭐ VERIFICAR SI UNA FICHA EXISTE
  @Post('check-ficha/:codigo')
  @Roles(ROLES.ADMIN)
  async checkFicha(@Body() body: { codigo: string }) {
    return await this.importService.checkFichaExists(body.codigo);
  }

  // ⭐ OBTENER ESTADÍSTICAS DE IMPORTACIÓN
  @Post('statistics')
  @Roles(ROLES.ADMIN)
  async getStatistics(@Body() body: { fichaCode?: string }) {
    return await this.importService.getImportStatistics(body.fichaCode);
  }
}