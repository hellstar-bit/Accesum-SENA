// backend/src/import/import.controller.ts
import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, UserRole } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ImportService } from './import.service';

type UploadedFileType = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  destination?: string;
  filename?: string;
  path?: string;
};

@Controller('import')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ImportController {
  constructor(private importService: ImportService) {}

  @Post('learners-excel')
  @UseInterceptors(FileInterceptor('file'))
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR) // 👨‍💼 Solo Admin e Instructor
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

  @Post('excel')
  @UseInterceptors(FileInterceptor('file'))
  @Roles(UserRole.ADMIN) // 👨‍💼 Solo Admin para importación general
  async importExcel(@UploadedFile() file: UploadedFileType) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    if (!file.originalname.match(/\.(xlsx|xls)$/)) {
      throw new BadRequestException('Solo se permiten archivos Excel (.xlsx, .xls)');
    }

    try {
      return await this.importService.importFromExcel(file);
    } catch (error: any) {
      throw new BadRequestException(`Error al procesar el archivo: ${error.message}`);
    }
  }
}