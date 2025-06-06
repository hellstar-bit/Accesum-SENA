// backend/src/import/import.controller.ts - CORREGIDO
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
import { ROLES } from '../auth/constants/roles.constant'; // ✅ Importar constantes
import { ImportService } from './import.service';

@Controller('import')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  // ⭐ IMPORTAR ARCHIVO EXCEL GENERAL
  @Post('excel')
  @Roles(ROLES.ADMIN) // ✅ Usar constante en lugar de string
  @UseInterceptors(FileInterceptor('file'))
  async importExcel(@UploadedFile() file: Express.Multer['File']) {
    if (!file) {
      throw new Error('No se ha proporcionado ningún archivo');
    }

    return await this.importService.importFromExcel(file);
  }

  // ⭐ IMPORTAR APRENDICES DESDE REPORTE SENA
  @Post('learners')
  @Roles(ROLES.ADMIN) // ✅ Usar constante en lugar de string
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
  @Roles(ROLES.ADMIN) // ✅ Usar constante en lugar de string
  @UseInterceptors(FileInterceptor('file'))
  async validateFile(@UploadedFile() file: Express.Multer['File']) {
    if (!file) {
      throw new Error('No se ha proporcionado ningún archivo');
    }

    return await this.importService.validateImportFile(file);
  }

  // ⭐ OBTENER PLANTILLA DE IMPORTACIÓN
  @Post('template')
  @Roles(ROLES.ADMIN) // ✅ Usar constante en lugar de string
  async getImportTemplate(@Body() body: { type: 'learners' | 'general' }) {
    return await this.importService.generateTemplate(body.type);
  }
}