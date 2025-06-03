// backend/src/import/import.service.ts - ACTUALIZADO CON REGIONAL Y CENTRO
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import * as bcrypt from 'bcrypt';
import * as QRCode from 'qrcode';
import { User } from '../users/entities/user.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { Role } from '../users/entities/role.entity';
import { PersonnelType } from '../config/entities/personnel-type.entity';
import { Regional } from '../config/entities/regional.entity';
import { Center } from '../config/entities/center.entity';
import { Ficha } from '../config/entities/ficha.entity';
import { Program } from '../config/entities/program.entity';
import { ImportLearnersResultDto } from './import-learners.dto';

// Tipo para archivos subidos
interface UploadedFile {
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

// DTO para datos de aprendiz extraídos del Excel
interface ExcelLearnerData {
  tipoDocumento: string;
  numeroDocumento: string;
  nombre: string;
  apellidos: string;
  celular?: string;
  correoElectronico: string;
  estado: string;
}

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

  // ⭐ MÉTODO PRINCIPAL - Importar con datos de formulario ACTUALIZADO
  async importLearnersWithFormData(
    file: UploadedFile, 
    fichaData: FichaFormData
  ): Promise<ImportLearnersResultDto> {
    const result: ImportLearnersResultDto = {
      success: false,
      totalRows: 0,
      importedRows: 0,
      updatedRows: 0,
      fichaInfo: {
        code: fichaData.codigo,
        name: fichaData.nombre,
        status: fichaData.estado,
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
      console.log('🚀 Iniciando importación con datos del formulario...');
      console.log('📋 Datos de ficha:', fichaData);

      // ✅ PROCESAR ARCHIVO EXCEL
      const workbook = await this.loadExcelFile(file);
      const worksheet = workbook.worksheets[0];

      if (!worksheet) {
        throw new BadRequestException('No se encontró hoja de trabajo en el archivo');
      }

      console.log('📊 Excel cargado - Filas:', worksheet.rowCount, 'Columnas:', worksheet.columnCount);

      // ✅ CREAR O ACTUALIZAR FICHA con datos del formulario
      const { ficha, isNew } = await this.createOrUpdateFichaFromForm(fichaData);
      result.fichaInfo.isNew = isNew;

      console.log(`📋 Ficha ${isNew ? 'creada' : 'actualizada'}:`, ficha.code);

      // ✅ OBTENER DATOS DE REFERENCIA INCLUYENDO REGIONAL Y CENTRO
      const referenceData = await this.getReferenceDataWithLocation(fichaData);

      // ✅ PROCESAR FILAS DE APRENDICES
      const dataStartRow = this.findDataStartRow(worksheet);
      console.log(`📊 Datos de aprendices empiezan en fila ${dataStartRow}`);

      let processedRows = 0;

      for (let rowNumber = dataStartRow; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber);

        if (this.isEmptyRow(row)) continue;

        processedRows++;

        try {
          const learnerData = this.extractLearnerDataFromRow(row, rowNumber);
          
          // Validar datos mínimos
          this.validateLearnerData(learnerData, rowNumber);
          
          // Verificar si el usuario ya existe
          const existingProfile = await this.profileRepository.findOne({
            where: { documentNumber: learnerData.numeroDocumento },
            relations: ['user'],
          });

          if (existingProfile) {
            // ✅ ACTUALIZAR USUARIO EXISTENTE CON NUEVA UBICACIÓN
            await this.updateExistingLearner(existingProfile, learnerData, ficha, referenceData);
            result.updatedRows++;
            result.summary.actualizados++;
            console.log(`🔄 Actualizado: ${learnerData.nombre} ${learnerData.apellidos}`);
          } else {
            // ✅ CREAR NUEVO USUARIO CON UBICACIÓN
            await this.createNewLearner(learnerData, ficha, referenceData);
            result.importedRows++;
            result.summary.nuevos++;
            console.log(`✅ Creado: ${learnerData.nombre} ${learnerData.apellidos}`);
          }

        } catch (error: any) {
          console.error(`❌ Error en fila ${rowNumber}:`, error.message);
          result.errors.push({
            row: rowNumber,
            error: error.message,
            data: this.getRowValues(row),
          });
          result.summary.errores++;
        }
      }

      result.totalRows = processedRows;
      result.success = (result.importedRows + result.updatedRows) > 0;

      console.log('🎉 Importación completada:', {
        total: result.totalRows,
        nuevos: result.summary.nuevos,
        actualizados: result.summary.actualizados,
        errores: result.summary.errores
      });

      return result;

    } catch (error: any) {
      console.error('❌ Error general en importación:', error);
      result.errors.push({
        row: 0,
        error: `Error general: ${error.message}`,
      });
      return result;
    }
  }

  // ✅ CARGAR ARCHIVO EXCEL
  private async loadExcelFile(file: UploadedFile): Promise<ExcelJS.Workbook> {
    try {
      const workbook = new ExcelJS.Workbook();
      
      if (!file.buffer || file.buffer.length === 0) {
        throw new BadRequestException('El archivo está vacío');
      }

      // Convertir Buffer a ArrayBuffer para ExcelJS
      const arrayBuffer = file.buffer.buffer.slice(
        file.buffer.byteOffset,
        file.buffer.byteOffset + file.buffer.byteLength
      );
      
      await workbook.xlsx.load(arrayBuffer);
      return workbook;
    } catch (error: any) {
      console.error('❌ Error al cargar Excel:', error);
      throw new BadRequestException('Error al leer el archivo Excel. Verifique que sea un archivo válido.');
    }
  }

  // ✅ CREAR O ACTUALIZAR FICHA CON DATOS DEL FORMULARIO
  private async createOrUpdateFichaFromForm(fichaData: FichaFormData): Promise<{ ficha: Ficha; isNew: boolean }> {
    try {
      // Buscar ficha existente
      let ficha = await this.fichaRepository.findOne({
        where: { code: fichaData.codigo },
      });

      let isNew = false;

      if (ficha) {
        // Actualizar ficha existente
        ficha.name = fichaData.nombre;
        ficha.status = fichaData.estado;
        if (fichaData.fecha) {
          ficha.reportDate = new Date(fichaData.fecha);
        }
        ficha = await this.fichaRepository.save(ficha);
        console.log('🔄 Ficha actualizada:', ficha.code);
      } else {
        // Crear nueva ficha
        isNew = true;
        const defaultProgram = await this.programRepository.findOne({
          where: { name: 'Programa por Defecto' },
        });

        ficha = this.fichaRepository.create({
          code: fichaData.codigo,
          name: fichaData.nombre,
          status: fichaData.estado,
          reportDate: fichaData.fecha ? new Date(fichaData.fecha) : new Date(),
          programId: defaultProgram?.id || 1,
        });

        ficha = await this.fichaRepository.save(ficha);
        console.log('🆕 Nueva ficha creada:', ficha.code);
      }

      return { ficha, isNew };
    } catch (error: any) {
      console.error('❌ Error en createOrUpdateFichaFromForm:', error);
      throw new Error(`Error al procesar ficha ${fichaData.codigo}: ${error.message}`);
    }
  }

  // ⭐ NUEVA FUNCIÓN - Obtener datos de referencia CON ubicación específica
  private async getReferenceDataWithLocation(fichaData: FichaFormData) {
    try {
      const [aprendizRole, aprendizType, selectedRegional, selectedCenter] = await Promise.all([
        this.roleRepository.findOne({ where: { name: 'Aprendiz' } }),
        this.personnelTypeRepository.findOne({ where: { name: 'Aprendiz' } }),
        this.regionalRepository.findOne({ where: { id: parseInt(fichaData.regionalId) } }),
        this.centerRepository.findOne({ where: { id: parseInt(fichaData.centerId) } }),
      ]);

      if (!aprendizRole || !aprendizType) {
        throw new BadRequestException('No se encontraron los tipos básicos de aprendiz en el sistema');
      }

      if (!selectedRegional) {
        throw new BadRequestException(`Regional con ID ${fichaData.regionalId} no encontrada`);
      }

      if (!selectedCenter) {
        throw new BadRequestException(`Centro con ID ${fichaData.centerId} no encontrado`);
      }

      // ⭐ VALIDAR QUE EL CENTRO PERTENEZCA A LA REGIONAL
      if (selectedCenter.regionalId !== selectedRegional.id) {
        throw new BadRequestException(
          `El centro ${selectedCenter.name} no pertenece a la regional ${selectedRegional.name}`
        );
      }

      console.log('📍 Ubicación configurada:', {
        regional: selectedRegional.name,
        center: selectedCenter.name
      });

      return { 
        aprendizRole, 
        aprendizType, 
        selectedRegional, 
        selectedCenter 
      };
    } catch (error: any) {
      console.error('❌ Error en getReferenceDataWithLocation:', error);
      throw error;
    }
  }

  // ✅ ENCONTRAR FILA DONDE EMPIEZAN LOS DATOS
  private findDataStartRow(worksheet: ExcelJS.Worksheet): number {
    // Buscar la fila con headers de tabla
    for (let rowIndex = 1; rowIndex <= 15; rowIndex++) {
      const row = worksheet.getRow(rowIndex);
      const cellA = this.getCellValue(row, 1)?.toString()?.toLowerCase() || '';
      const cellB = this.getCellValue(row, 2)?.toString()?.toLowerCase() || '';
      const cellC = this.getCellValue(row, 3)?.toString()?.toLowerCase() || '';
      
      // Buscar headers típicos basados en la captura
      if (
        cellA.includes('tipo') && cellA.includes('documento') ||
        cellB.includes('numero') && cellB.includes('documento') ||
        cellC.includes('nombre')
      ) {
        console.log(`📊 Headers encontrados en fila ${rowIndex}`);
        return rowIndex + 1; // Los datos empiezan en la siguiente fila
      }
    }
    
    // Fallback: asumir que empiezan en la fila 6 (basado en la captura)
    console.log('⚠️ Headers no encontrados, usando fila 6 por defecto');
    return 6;
  }

  // ✅ EXTRAER DATOS DE APRENDIZ DE UNA FILA
  private extractLearnerDataFromRow(row: ExcelJS.Row, rowNumber: number): ExcelLearnerData {
    // Basado en la captura del Excel:
    // A: Tipo de Documento, B: Número, C: Nombre, D: Apellidos, E: Celular, F: Correo, G: Estado
    
    const rawData = {
      tipoDocumento: this.getCellValue(row, 1)?.toString()?.trim() || '',
      numeroDocumento: this.getCellValue(row, 2)?.toString()?.trim() || '',
      nombre: this.getCellValue(row, 3)?.toString()?.trim() || '',
      apellidos: this.getCellValue(row, 4)?.toString()?.trim() || '',
      celular: this.getCellValue(row, 5)?.toString()?.trim() || '',
      correoElectronico: this.getCellValue(row, 6)?.toString()?.trim() || '',
      estado: this.getCellValue(row, 7)?.toString()?.trim() || '',
    };

    // Normalizar datos
    const result: ExcelLearnerData = {
      tipoDocumento: this.normalizeDocumentType(rawData.tipoDocumento),
      numeroDocumento: rawData.numeroDocumento,
      nombre: rawData.nombre,
      apellidos: rawData.apellidos,
      celular: rawData.celular || undefined,
      correoElectronico: rawData.correoElectronico,
      estado: this.normalizeLearnerStatus(rawData.estado),
    };

    console.log(`📝 Fila ${rowNumber}:`, result);
    return result;
  }

  // ✅ VALIDAR DATOS DE APRENDIZ
  private validateLearnerData(data: ExcelLearnerData, rowNumber: number) {
    if (!data.numeroDocumento) {
      throw new Error(`Número de documento requerido en fila ${rowNumber}`);
    }
    if (!data.nombre) {
      throw new Error(`Nombre requerido en fila ${rowNumber}`);
    }
    if (!data.apellidos) {
      throw new Error(`Apellidos requeridos en fila ${rowNumber}`);
    }
    if (!data.correoElectronico) {
      throw new Error(`Correo electrónico requerido en fila ${rowNumber}`);
    }
    if (!data.correoElectronico.includes('@')) {
      throw new Error(`Correo electrónico inválido en fila ${rowNumber}`);
    }
  }

  // ⭐ CREAR NUEVO APRENDIZ CON UBICACIÓN ESPECÍFICA
  private async createNewLearner(
    learnerData: ExcelLearnerData,
    ficha: Ficha,
    referenceData: any,
  ) {
    // Generar contraseña temporal: sena + número de documento
    const tempPassword = `sena${learnerData.numeroDocumento}`;
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Crear usuario
    const newUser = await this.userRepository.save({
      email: learnerData.correoElectronico,
      password: hashedPassword,
      roleId: referenceData.aprendizRole.id,
      isActive: learnerData.estado === 'EN FORMACION',
    });

    // ⭐ CREAR PERFIL CON UBICACIÓN ESPECÍFICA
    const profileData: Partial<Profile> = {
      documentType: learnerData.tipoDocumento,
      documentNumber: learnerData.numeroDocumento,
      firstName: learnerData.nombre,
      lastName: learnerData.apellidos,
      phoneNumber: learnerData.celular,
      learnerStatus: learnerData.estado,
      userId: newUser.id,
      typeId: referenceData.aprendizType.id,
      regionalId: referenceData.selectedRegional.id, // ⭐ USAR REGIONAL SELECCIONADA
      centerId: referenceData.selectedCenter.id,     // ⭐ USAR CENTRO SELECCIONADO
      fichaId: ficha.id,
    };

    const profile = await this.profileRepository.save(profileData);

    console.log('📍 Aprendiz creado en:', {
      regional: referenceData.selectedRegional.name,
      center: referenceData.selectedCenter.name,
      student: `${learnerData.nombre} ${learnerData.apellidos}`
    });

    // ✅ GENERAR QR AUTOMÁTICAMENTE
    await this.generateQRForProfile(profile);
  }

  // ⭐ ACTUALIZAR APRENDIZ EXISTENTE CON NUEVA UBICACIÓN
  private async updateExistingLearner(
    existingProfile: Profile,
    learnerData: ExcelLearnerData,
    ficha: Ficha,
    referenceData: any,
  ) {
    // Actualizar datos que pueden cambiar
    existingProfile.phoneNumber = learnerData.celular || existingProfile.phoneNumber;
    existingProfile.learnerStatus = learnerData.estado;
    existingProfile.fichaId = ficha.id;
    
    // ⭐ ACTUALIZAR UBICACIÓN CON LOS DATOS SELECCIONADOS
    existingProfile.regionalId = referenceData.selectedRegional.id;
    existingProfile.centerId = referenceData.selectedCenter.id;

    // Actualizar estado del usuario
    existingProfile.user.isActive = learnerData.estado === 'EN FORMACION';
    
    await this.userRepository.save(existingProfile.user);
    await this.profileRepository.save(existingProfile);

    console.log('📍 Aprendiz actualizado en:', {
      regional: referenceData.selectedRegional.name,
      center: referenceData.selectedCenter.name,
      student: `${learnerData.nombre} ${learnerData.apellidos}`
    });

    // Generar QR si no tiene
    if (!existingProfile.qrCode) {
      await this.generateQRForProfile(existingProfile);
    }
  }

  // ✅ GENERAR CÓDIGO QR PARA PERFIL
  private async generateQRForProfile(profile: Profile) {
    try {
      const qrData = {
        id: profile.id,
        doc: profile.documentNumber,
        type: 'ACCESUM_SENA',
        timestamp: Date.now()
      };

      const qrCodeBase64 = await QRCode.toDataURL(JSON.stringify(qrData), {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 300,
        margin: 1,
      });

      profile.qrCode = qrCodeBase64;
      await this.profileRepository.save(profile);
    } catch (error) {
      console.error('Error generando QR para perfil', profile.id, ':', error);
    }
  }

  // ✅ MÉTODOS UTILITARIOS

  private getCellValue(row: ExcelJS.Row, columnNumber: number): any {
    try {
      const cell = row.getCell(columnNumber);
      if (cell && cell.value !== null && cell.value !== undefined) {
        if (cell.value instanceof Date) {
          return cell.value.toLocaleDateString('es-CO');
        }
        if (typeof cell.value === 'object' && cell.value !== null) {
          if ('text' in cell.value) return (cell.value as any).text;
          if ('result' in cell.value) return (cell.value as any).result;
          if ('richText' in cell.value) {
            const richText = (cell.value as any).richText;
            return richText.map((rt: any) => rt.text || '').join('');
          }
          return cell.value.toString();
        }
        return cell.value;
      }
      return '';
    } catch (error) {
      return '';
    }
  }

  private isEmptyRow(row: ExcelJS.Row): boolean {
    const cellA = this.getCellValue(row, 1)?.toString()?.trim() || '';
    const cellB = this.getCellValue(row, 2)?.toString()?.trim() || '';
    const cellC = this.getCellValue(row, 3)?.toString()?.trim() || '';
    
    return !cellA && !cellB && !cellC;
  }

  private normalizeDocumentType(tipo: string): string {
    const tipoUpper = tipo?.toUpperCase().trim() || '';
    const tiposValidos = ['CC', 'CE', 'TI', 'PA', 'RC', 'PEP'];
    
    if (tiposValidos.includes(tipoUpper)) {
      return tipoUpper;
    }
    
    // Mapeos comunes
    const mapeo: { [key: string]: string } = {
      'CEDULA': 'CC',
      'CÉDULA': 'CC',
      'CEDULA DE CIUDADANIA': 'CC',
      'CÉDULA DE CIUDADANÍA': 'CC',
    };

    return mapeo[tipoUpper] || 'CC';
  }

  private normalizeLearnerStatus(status: string): string {
    const statusUpper = status?.toUpperCase().trim() || '';
    
    const statusMap: { [key: string]: string } = {
      'EN FORMACION': 'EN FORMACION',
      'EN FORMACIÓN': 'EN FORMACION',
      'CANCELADO': 'CANCELADO',
      'RETIRO VOLUNTARIO': 'RETIRO VOLUNTARIO',
      'APLAZADO': 'APLAZADO',
    };

    return statusMap[statusUpper] || 'EN FORMACION';
  }

  private getRowValues(row: ExcelJS.Row): string[] {
    const values: string[] = [];
    for (let i = 1; i <= 7; i++) {
      const cellValue = this.getCellValue(row, i);
      values.push(cellValue?.toString() || '');
    }
    return values;
  }

  // ✅ MÉTODO EXISTENTE - Mantener para compatibilidad
  async importLearnersFromExcel(file: UploadedFile): Promise<ImportLearnersResultDto> {
    // Este método extrae los datos de la ficha desde el Excel (método original)
    // Lo mantenemos para compatibilidad, pero usaremos el método principal arriba
    throw new BadRequestException('Usar el método importLearnersWithFormData para nuevas importaciones');
  }
}