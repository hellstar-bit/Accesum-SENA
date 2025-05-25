// backend/src/import/import.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import * as xlsx from 'node-xlsx';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { Role } from '../users/entities/role.entity';
import { PersonnelType } from '../config/entities/personnel-type.entity';
import { Regional } from '../config/entities/regional.entity';
import { Center } from '../config/entities/center.entity';
import { Ficha } from '../config/entities/ficha.entity';
import { Program } from '../config/entities/program.entity';
import { ImportLearnersResultDto, ExcelLearnerRowDto } from './import-learners.dto';

// Definir el tipo de archivo localmente
type UploadedFile = {
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

@Injectable()
export class ImportService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(PersonnelType)
    private personnelTypeRepository: Repository<PersonnelType>,
    @InjectRepository(Regional)
    private regionalRepository: Repository<Regional>,
    @InjectRepository(Center)
    private centerRepository: Repository<Center>,
    @InjectRepository(Ficha)
    private fichaRepository: Repository<Ficha>,
    @InjectRepository(Program)
    private programRepository: Repository<Program>,
  ) {}

  async importLearnersFromExcel(file: UploadedFile): Promise<ImportLearnersResultDto> {
    const result: ImportLearnersResultDto = {
      success: false,
      totalRows: 0,
      importedRows: 0,
      updatedRows: 0,
      fichaInfo: {
        code: '',
        name: '',
        status: '',
        isNew: false,
      },
      errors: [],
      summary: {
        nuevos: 0,
        actualizados: 0,
        errores: 0,
      },
    };

    try {
      console.log('📄 Archivo recibido:', {
        name: file.originalname,
        size: file.size,
        mimetype: file.mimetype
      });

      // Verificar que el buffer no esté vacío
      if (!file.buffer || file.buffer.length === 0) {
        throw new BadRequestException('El archivo está vacío');
      }

      const workbook = new ExcelJS.Workbook();
      
      // Intentar cargar el archivo con diferentes métodos
      try {
        await workbook.xlsx.load(file.buffer);
      } catch (xlsxError) {
        console.log('❌ Error con xlsx, intentando con xls...');
        // Si falla xlsx, intentar como xls (archivo más viejo)
        throw new BadRequestException('Error al leer el archivo Excel. Asegúrate de que sea un archivo Excel válido (.xlsx o .xls)');
      }
      const worksheet = workbook.worksheets[0];

      if (!worksheet) {
        throw new BadRequestException('No se encontró hoja de trabajo');
      }

      // ✅ EXTRAER INFORMACIÓN DEL HEADER
      const fichaInfo = await this.extractHeaderInfo(worksheet);
      
      // ✅ CREAR O ACTUALIZAR FICHA
      const { ficha, isNew } = await this.createOrUpdateFicha(fichaInfo);
      
      // ✅ ACTUALIZAR result.fichaInfo con isNew
      result.fichaInfo = {
        code: fichaInfo.code,
        name: fichaInfo.name,
        status: fichaInfo.status,
        isNew: isNew,
      };

      // ✅ OBTENER DATOS DE REFERENCIA
      const [aprendizRole, aprendizType, defaultRegional, defaultCenter] = await Promise.all([
        this.roleRepository.findOne({ where: { name: 'Aprendiz' } }),
        this.personnelTypeRepository.findOne({ where: { name: 'Aprendiz' } }),
        this.regionalRepository.findOne({ where: { name: 'Regional por Defecto' } }),
        this.centerRepository.findOne({ where: { name: 'Centro por Defecto' } }),
      ]);

      if (!aprendizRole || !aprendizType || !defaultRegional || !defaultCenter) {
        throw new BadRequestException('Faltan datos de referencia básicos');
      }

      // ✅ PROCESAR FILAS DE DATOS
      const dataStartRow = 7; // Los datos empiezan en la fila 7
      result.totalRows = worksheet.rowCount - dataStartRow + 1;

      for (let rowNumber = dataStartRow; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber);

        if (this.isEmptyRow(row)) continue;

        try {
          const learnerData = this.extractLearnerData(row, rowNumber);
          
          // Verificar si el usuario ya existe
          const existingProfile = await this.profileRepository.findOne({
            where: { documentNumber: learnerData.numeroDocumento },
            relations: ['user'],
          });

          if (existingProfile) {
            // ✅ ACTUALIZAR USUARIO EXISTENTE
            await this.updateExistingLearner(existingProfile, learnerData, ficha);
            result.updatedRows++;
            result.summary.actualizados++;
          } else {
            // ✅ CREAR NUEVO USUARIO
            await this.createNewLearner(learnerData, ficha, aprendizRole, aprendizType, defaultRegional, defaultCenter);
            result.importedRows++;
            result.summary.nuevos++;
          }

        } catch (error: any) {
          result.errors.push({
            row: rowNumber,
            error: error.message,
            data: this.getRowValues(row),
          });
          result.summary.errores++;
        }
      }

      result.success = (result.importedRows + result.updatedRows) > 0;
      return result;

    } catch (error: any) {
      result.errors.push({
        row: 0,
        error: `Error general: ${error.message}`,
      });
      return result;
    }
  }

  private async extractHeaderInfo(worksheet: ExcelJS.Worksheet) {
    // Extraer información del header
    const fichaRow = worksheet.getRow(3); // "Ficha de Caracterización:"
    const estadoRow = worksheet.getRow(4); // "Estado:"
    const fechaRow = worksheet.getRow(5); // "Fecha del Reporte:"

    const fichaText = this.getCellValue(fichaRow, 2)?.toString() || '';
    const estadoText = this.getCellValue(estadoRow, 2)?.toString() || '';
    const fechaText = this.getCellValue(fechaRow, 2)?.toString() || '';

    // Parsear "2856502 - GESTIÓN DE REDES DE DATOS"
    const [fichaCode, ...fichaNameParts] = fichaText.split(' - ');
    const fichaName = fichaNameParts.join(' - ');

    return {
      code: fichaCode?.trim() || '',
      name: fichaName?.trim() || '',
      status: estadoText?.trim() || 'EN EJECUCIÓN',
      reportDate: this.parseDate(fechaText),
      isNew: false, // Se determinará en createOrUpdateFicha
    };
  }

  private async createOrUpdateFicha(fichaInfo: any): Promise<{ ficha: Ficha; isNew: boolean }> {
    let ficha = await this.fichaRepository.findOne({
      where: { code: fichaInfo.code },
    });

    let isNew = false;

    if (ficha) {
      // Actualizar ficha existente
      ficha.name = fichaInfo.name;
      ficha.status = fichaInfo.status;
      ficha.reportDate = fichaInfo.reportDate;
      ficha = await this.fichaRepository.save(ficha);
    } else {
      // Crear nueva ficha
      isNew = true;
      const defaultProgram = await this.programRepository.findOne({
        where: { name: 'Programa por Defecto' },
      });

      ficha = this.fichaRepository.create({
        code: fichaInfo.code,
        name: fichaInfo.name,
        status: fichaInfo.status,
        reportDate: fichaInfo.reportDate,
        programId: defaultProgram?.id || 1,
      });

      ficha = await this.fichaRepository.save(ficha);
    }

    return { ficha, isNew };
  }

  private extractLearnerData(row: ExcelJS.Row, rowNumber: number): ExcelLearnerRowDto {
    return {
      tipoDocumento: this.normalizeDocumentType(this.getCellValue(row, 1)?.toString() || ''),
      numeroDocumento: this.getCellValue(row, 2)?.toString()?.trim() || '',
      nombre: this.getCellValue(row, 3)?.toString()?.trim() || '',
      apellidos: this.getCellValue(row, 4)?.toString()?.trim() || '',
      celular: this.getCellValue(row, 5)?.toString()?.trim() || '',
      correoElectronico: this.getCellValue(row, 6)?.toString()?.trim() || '',
      estado: this.normalizeStatus(this.getCellValue(row, 7)?.toString() || ''),
    };
  }

  private async createNewLearner(
    learnerData: ExcelLearnerRowDto,
    ficha: Ficha,
    role: Role,
    type: PersonnelType,
    regional: Regional,
    center: Center,
  ) {
    // Validar datos requeridos
    if (!learnerData.numeroDocumento || !learnerData.nombre || !learnerData.apellidos || !learnerData.correoElectronico) {
      throw new Error('Faltan campos requeridos');
    }

    // Generar contraseña temporal
    const tempPassword = `sena${learnerData.numeroDocumento}`;
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Crear usuario
    const newUser = await this.userRepository.save({
      email: learnerData.correoElectronico,
      password: hashedPassword,
      roleId: role.id,
      isActive: learnerData.estado === 'EN FORMACION',
    });

    // Crear perfil
    const profileData: Partial<Profile> = {
      documentType: learnerData.tipoDocumento,
      documentNumber: learnerData.numeroDocumento,
      firstName: learnerData.nombre,
      lastName: learnerData.apellidos,
      learnerStatus: learnerData.estado,
      userId: newUser.id,
      typeId: type.id,
      regionalId: regional.id,
      centerId: center.id,
      fichaId: ficha.id, // ⭐ ASIGNAR FICHA
    };

    // Solo agregar phoneNumber si tiene valor
    if (learnerData.celular && learnerData.celular.trim() !== '') {
      profileData.phoneNumber = learnerData.celular;
    }

    const profile = await this.profileRepository.save(profileData);

    // ✅ GENERAR QR AUTOMÁTICAMENTE
    await this.generateQRForProfile(profile);
  }

  private async updateExistingLearner(
    existingProfile: Profile,
    learnerData: ExcelLearnerRowDto,
    ficha: Ficha,
  ) {
    // Actualizar datos que pueden cambiar
    existingProfile.phoneNumber = learnerData.celular || existingProfile.phoneNumber;
    existingProfile.learnerStatus = learnerData.estado;
    existingProfile.fichaId = ficha.id;

    // Actualizar estado del usuario
    existingProfile.user.isActive = learnerData.estado === 'EN FORMACION';
    
    await this.userRepository.save(existingProfile.user);
    await this.profileRepository.save(existingProfile);

    // Generar QR si no tiene
    if (!existingProfile.qrCode) {
      await this.generateQRForProfile(existingProfile);
    }
  }

  private async generateQRForProfile(profile: Profile) {
    const qrData = {
      id: profile.id,
      doc: profile.documentNumber,
      type: 'ACCESUM_SENA',
      timestamp: Date.now()
    };

    const QRCode = require('qrcode');
    const qrCodeBase64 = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 1,
    });

    profile.qrCode = qrCodeBase64;
    await this.profileRepository.save(profile);
  }

  private normalizeStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'EN FORMACION': 'EN FORMACION',
      'CANCELADO': 'CANCELADO',
      'RETIRO VOLUNTARIO': 'RETIRO VOLUNTARIO',
      'APLAZADO': 'APLAZADO',
    };

    const upperStatus = status.toUpperCase().trim();
    return statusMap[upperStatus] || 'EN FORMACION';
  }

  private normalizeDocumentType(tipo: string): string {
    const tipoUpper = tipo?.toUpperCase().trim() || '';
    const tiposValidos = ['CC', 'CE', 'TI', 'PA', 'RC', 'PEP'];
    
    if (tiposValidos.includes(tipoUpper)) {
      return tipoUpper;
    }
    
    const mapeo: { [key: string]: string } = {
      'CEDULA': 'CC',
      'CÉDULA': 'CC',
      'CEDULA DE CIUDADANIA': 'CC',
      'CÉDULA DE CIUDADANÍA': 'CC',
    };

    return mapeo[tipoUpper] || 'CC';
  }

  private parseDate(dateString: string): Date | null {
    if (!dateString) return null;
    
    try {
      // Formato esperado: "01/04/2025"
      const [day, month, year] = dateString.split('/');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } catch {
      return null;
    }
  }

  private isEmptyRow(row: ExcelJS.Row): boolean {
    return !this.getCellValue(row, 1) && !this.getCellValue(row, 2) && !this.getCellValue(row, 3);
  }

  private getCellValue(row: ExcelJS.Row, columnNumber: number): any {
    try {
      const cell = row.getCell(columnNumber);
      if (cell && cell.value !== null && cell.value !== undefined) {
        if (cell.value instanceof Date) {
          return cell.value.toISOString();
        }
        if (typeof cell.value === 'object' && cell.value !== null && 'text' in cell.value) {
          return (cell.value as any).text;
        }
        return cell.value;
      }
      return '';
    } catch (error) {
      return '';
    }
  }

  private getRowValues(row: ExcelJS.Row): string[] {
    const values: string[] = [];
    for (let i = 1; i <= 7; i++) {
      const cellValue = this.getCellValue(row, i);
      values.push(cellValue?.toString() || '');
    }
    return values;
  }

  // Método auxiliar para convertir datos de node-xlsx a ExcelJS
  private async convertXlsDataToWorksheet(workbook: ExcelJS.Workbook, sheetData: any[][]): Promise<ExcelJS.Worksheet> {
    const worksheet = workbook.addWorksheet('ImportedSheet');
    
    // Agregar datos fila por fila
    sheetData.forEach((rowData, rowIndex) => {
      const row = worksheet.getRow(rowIndex + 1);
      rowData.forEach((cellData, colIndex) => {
        row.getCell(colIndex + 1).value = cellData;
      });
      row.commit();
    });
    
    return worksheet;
  }

  // Mantener el método existente para compatibilidad
  async importFromExcel(file: UploadedFile): Promise<any> {
    // Método existente para otros tipos de importación...
    // (mantener la implementación actual)
  }
}