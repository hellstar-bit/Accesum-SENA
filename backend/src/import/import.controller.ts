// backend/src/import/import.controller.ts - ACTUALIZADO CON VALIDACIÓN DE UBICACIÓN
import { 
  Controller, 
  Post, 
  UseInterceptors, 
  UploadedFile, 
  UseGuards, 
  BadRequestException,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, UserRole } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ImportService } from './import.service';

// Tipo para archivos subidos
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

// ⭐ DTO ACTUALIZADO PARA LOS DATOS DEL FORMULARIO DE FICHA
interface FichaFormData {
  codigo: string;
  nombre: string;
  estado: string;
  fecha: string;
  regionalId: string; // ⭐ NUEVO CAMPO
  centerId: string;   // ⭐ NUEVO CAMPO
}

@Controller('import')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ImportController {
  constructor(private importService: ImportService) {}

  // ⭐ ENDPOINT PRINCIPAL - Importar aprendices con datos de ficha del formulario ACTUALIZADO
  @Post('learners-with-form')
  @UseInterceptors(FileInterceptor('file'))
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR) // Solo Admin e Instructor
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

    // Verificar tamaño del archivo (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('El archivo no debe superar los 10MB');
    }

    try {
      const fichaData: FichaFormData = JSON.parse(fichaDataString);
      
      // ⭐ VALIDAR DATOS DE LA FICHA INCLUYENDO UBICACIÓN
      if (!fichaData.codigo || !fichaData.nombre) {
        throw new BadRequestException('Faltan datos obligatorios de la ficha (código y nombre)');
      }

      if (!fichaData.regionalId || !fichaData.centerId) {
        throw new BadRequestException('Faltan datos de ubicación (regional y centro)');
      }

      // ⭐ VALIDAR QUE LOS IDs SEAN NÚMEROS VÁLIDOS
      const regionalId = parseInt(fichaData.regionalId);
      const centerId = parseInt(fichaData.centerId);

      if (isNaN(regionalId) || regionalId <= 0) {
        throw new BadRequestException('ID de regional inválido');
      }

      if (isNaN(centerId) || centerId <= 0) {
        throw new BadRequestException('ID de centro inválido');
      }

      // ⭐ VALIDAR ESTADOS PERMITIDOS
      const estadosPermitidos = ['EN EJECUCIÓN', 'TERMINADA', 'CANCELADA'];
      if (!estadosPermitidos.includes(fichaData.estado)) {
        throw new BadRequestException('Estado de ficha inválido');
      }

      console.log('📋 Datos de ficha recibidos:', fichaData);
      console.log('📍 Ubicación:', {
        regionalId: regionalId,
        centerId: centerId
      });
      console.log('📄 Archivo recibido:', {
        name: file.originalname,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        type: file.mimetype
      });

      return await this.importService.importLearnersWithFormData(file, fichaData);
    } catch (error: any) {
      if (error instanceof SyntaxError) {
        throw new BadRequestException('Error al parsear los datos de la ficha');
      }
      
      // Si es un error de validación que ya lanzamos, lo pasamos
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      // Para otros errores, los envolvemos
      throw new BadRequestException(`Error al procesar el archivo: ${error.message}`);
    }
  }

  // Endpoint de respaldo - Importación automática (extrae datos del Excel)
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

    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('El archivo no debe superar los 10MB');
    }

    try {
      return await this.importService.importLearnersFromExcel(file);
    } catch (error: any) {
      throw new BadRequestException(`Error al procesar el archivo: ${error.message}`);
    }
  }

  // ⭐ NUEVO ENDPOINT - Validar configuración de ubicación
  @Post('validate-location')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  async validateLocation(@Body() locationData: { regionalId: number; centerId: number }) {
    try {
      const { regionalId, centerId } = locationData;

      if (!regionalId || !centerId) {
        throw new BadRequestException('Regional y centro son requeridos');
      }

      // Aquí puedes agregar validación adicional si es necesario
      // Por ejemplo, verificar que el centro pertenezca a la regional
      
      return {
        valid: true,
        message: 'Configuración de ubicación válida'
      };
    } catch (error: any) {
      throw new BadRequestException(`Error al validar ubicación: ${error.message}`);
    }
  }
}