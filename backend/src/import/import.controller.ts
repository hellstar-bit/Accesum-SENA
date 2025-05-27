// backend/src/import/import.controller.ts
import { 
  Controller, 
  Post, 
  UseInterceptors, 
  UploadedFile, 
  UseGuards, 
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, UserRole } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ImportService } from './import.service';

// Tipo correcto para archivos subidos
interface UploadedFileType {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  destination?: string;
  filename?: string;
  path?: string;
}

// Agrega este endpoint a backend/src/import/import.controller.ts

@Controller('import')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ImportController {
  constructor(private importService: ImportService) {}

  // ⭐ NUEVO ENDPOINT - Con formulario manual
  @Post('learners-with-form')
  @UseInterceptors(FileInterceptor('file'))
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR) // 👨‍💼 Solo Admin e Instructor
  async importLearnersWithForm(
    @UploadedFile() file: UploadedFileType,
    @Body('fichaData') fichaDataString: string
  ) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    if (!file.originalname.match(/\.(xlsx|xls)$/)) {
      throw new BadRequestException('Solo se permiten archivos Excel (.xlsx, .xls)');
    }

    if (!fichaDataString) {
      throw new BadRequestException('No se proporcionaron los datos de la ficha');
    }

    try {
      const fichaData = JSON.parse(fichaDataString);
      return await this.importService.importLearnersWithForm(file, fichaData);
    } catch (error: any) {
      throw new BadRequestException(`Error al procesar el archivo: ${error.message}`);
    }
  }

  // Endpoint existente (mantener para compatibilidad)
  @Post('learners-excel')
  @UseInterceptors(FileInterceptor('file'))
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  async importLearnersExcel(@UploadedFile() file: UploadedFileType) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    if (!file.originalname.match(/\.(xlsx|xls)$/)) {
      throw new BadRequestException('Solo se permiten archivos Excel (.xlsx, .xls)');
    }

    try {
      return await this.importService.importLearnersFromExcel(file);
    } catch (error: any) {
      throw new BadRequestException(`Error al procesar el archivo: ${error.message}`);
    }
  }

  // ... resto del controller
}
