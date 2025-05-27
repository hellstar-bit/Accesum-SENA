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

// ✅ Si tienes instalado @types/multer, descomenta esta línea:
import { Express } from 'express';

// Usar el tipo correcto para Multer - alternativa más robusta
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

// ✅ Alternativa si tienes problemas de tipos, descomenta y usa esta línea:
// type UploadedFile = Express.Multer.File;

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
      
      // Intentar cargar el archivo con conversión de buffer más segura
      try {
        // Método 1: Convertir a ArrayBuffer para compatibilidad con ExcelJS
        const arrayBuffer = file.buffer.buffer.slice(
          file.buffer.byteOffset,
          file.buffer.byteOffset + file.buffer.byteLength
        );
        
        await workbook.xlsx.load(arrayBuffer);
      } catch (xlsxError) {
        console.log('❌ Error con método 1, intentando método alternativo...');
        
        try {
          // Método 2: Usar Uint8Array
          const uint8Array = new Uint8Array(file.buffer);
          await workbook.xlsx.load(uint8Array.buffer);
        } catch (secondError) {
          console.log('❌ Error con ambos métodos:', xlsxError, secondError);
          throw new BadRequestException('Error al leer el archivo Excel. Asegúrate de que sea un archivo Excel válido (.xlsx o .xls)');
        }
      }
      
      const worksheet = workbook.worksheets[0];

      if (!worksheet) {
        throw new BadRequestException('No se encontró hoja de trabajo');
      }

      console.log('📊 Información de la hoja:');
      console.log('- Número de filas:', worksheet.rowCount);
      console.log('- Número de columnas:', worksheet.columnCount);

      // 🔍 DEBUG: Mostrar estructura del Excel (comentar en producción)
      this.debugExcelStructure(worksheet);

      // ✅ EXTRAER INFORMACIÓN DEL HEADER
      const fichaInfo = await this.extractHeaderInfo(worksheet);
      
      if (!fichaInfo.code) {
        throw new BadRequestException('No se pudo extraer el código de la ficha');
      }
      
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

      // ✅ PROCESAR FILAS DE DATOS - Usar detección dinámica
      const dataStartRow = this.findDataStartRow(worksheet);
      console.log(`📊 Datos de aprendices empiezan en fila ${dataStartRow}`);
      let processedRows = 0;

      for (let rowNumber = dataStartRow; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber);

        if (this.isEmptyRow(row)) continue;

        processedRows++;

        try {
          const learnerData = this.extractLearnerData(row, rowNumber);
          
          // Validar datos mínimos requeridos
          if (!learnerData.numeroDocumento || !learnerData.nombre || !learnerData.apellidos || !learnerData.correoElectronico) {
            throw new Error(`Faltan datos requeridos en fila ${rowNumber}`);
          }
          
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
          console.error(`Error en fila ${rowNumber}:`, error.message);
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

      console.log('✅ Importación completada:', result);
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

  // 🔍 MÉTODO DE DEBUG PARA VER LA ESTRUCTURA DEL EXCEL
  private debugExcelStructure(worksheet: ExcelJS.Worksheet) {
    console.log('🔍 === DEBUG COMPLETO DEL EXCEL ===');
    console.log('Total de filas:', worksheet.rowCount);
    console.log('Total de columnas:', worksheet.columnCount);
    
    // Mostrar las primeras 15 filas con más detalle
    for (let rowIndex = 1; rowIndex <= Math.min(15, worksheet.rowCount); rowIndex++) {
      const row = worksheet.getRow(rowIndex);
      const rowData: any = {};
      
      // Leer hasta 10 columnas
      for (let colIndex = 1; colIndex <= 10; colIndex++) {
        const cellValue = this.getCellValue(row, colIndex);
        if (cellValue && cellValue.toString().trim()) {
          rowData[`Col${colIndex}`] = cellValue.toString().trim();
        }
      }
      
      if (Object.keys(rowData).length > 0) {
        console.log(`Fila ${rowIndex}:`, rowData);
      }
    }
    
    console.log('🔍 === FIN DEBUG EXCEL ===');
  }

  // ✅ MÉTODO MEJORADO PARA EXTRAER INFORMACIÓN DEL HEADER
  private async extractHeaderInfo(worksheet: ExcelJS.Worksheet) {
    console.log('🔍 Debug - Leyendo header del Excel...');
    
    // Buscar dinámicamente las filas que contienen la información
    let fichaInfo = { code: '', name: '', status: 'EN EJECUCIÓN', reportDate: null };

    // Buscar en las primeras 10 filas
    for (let rowIndex = 1; rowIndex <= 10; rowIndex++) {
      const row = worksheet.getRow(rowIndex);
      const cellA = this.getCellValue(row, 1)?.toString()?.trim() || '';
      const cellB = this.getCellValue(row, 2)?.toString()?.trim() || '';
      const cellC = this.getCellValue(row, 3)?.toString()?.trim() || '';

      // Buscar "Ficha de Caracterización"
      if (cellA.toLowerCase().includes('ficha') && cellA.toLowerCase().includes('caracterizaci')) {
        const fichaValue = cellB || cellC; // Probar columna B y C
        console.log(`📋 Encontrada ficha en fila ${rowIndex}:`, fichaValue);
        
        if (fichaValue && fichaValue.toString().trim()) {
          const fichaText = fichaValue.toString().trim();
          
          // Parsear: "2853176 - ANÁLISIS Y DESARROLLO DE SOFTWARE"
          if (fichaText.includes(' - ')) {
            const [code, ...nameParts] = fichaText.split(' - ');
            fichaInfo.code = code.trim();
            fichaInfo.name = nameParts.join(' - ').trim();
          } else if (fichaText.match(/^\d+/)) {
            // Si solo hay números
            const match = fichaText.match(/^(\d+)/);
            fichaInfo.code = match ? match[1] : fichaText;
            fichaInfo.name = fichaText.replace(/^\d+\s*-?\s*/, '').trim() || 'Programa sin nombre';
          } else {
            fichaInfo.code = fichaText;
            fichaInfo.name = 'Programa sin nombre';
          }
        }
      }

      // Buscar "Estado"
      if (cellA.toLowerCase().includes('estado')) {
        const estadoValue = cellB || cellC;
        console.log(`📊 Encontrado estado en fila ${rowIndex}:`, estadoValue);
        
        if (estadoValue) {
          const estadoText = estadoValue.toString().trim().toUpperCase();
          if (estadoText.includes('EJECUCIÓN') || estadoText.includes('EJECUCION')) {
            fichaInfo.status = 'EN EJECUCIÓN';
          } else if (estadoText.includes('TERMINADA') || estadoText.includes('FINALIZADA')) {
            fichaInfo.status = 'TERMINADA';
          } else if (estadoText.includes('CANCELADA')) {
            fichaInfo.status = 'CANCELADA';
          }
        }
      }

      // Buscar "Fecha del Reporte"
      if (cellA.toLowerCase().includes('fecha') && cellA.toLowerCase().includes('reporte')) {
        const fechaValue = cellB || cellC;
        console.log(`📅 Encontrada fecha en fila ${rowIndex}:`, fechaValue);
        
        if (fechaValue) {
          try {
            const fechaText = fechaValue.toString().trim();
            if (fechaText.includes('/')) {
              const [day, month, year] = fechaText.split('/');
              let fichaInfo: { code: string; name: string; status: string; reportDate: Date | null } = { 
              code: '', 
              name: '', 
              status: 'EN EJECUCIÓN', 
              reportDate: null 
};
            }
          } catch (error) {
            console.warn('No se pudo parsear la fecha:', fechaValue);
          }
        }
      }
    }

    console.log('✅ Información extraída del header:', fichaInfo);

    // Validar que se extrajo información mínima
    if (!fichaInfo.code) {
      console.error('❌ No se pudo extraer el código de ficha');
      console.error('Estructura del archivo no reconocida. Verifique que:');
      console.error('1. Existe una fila con "Ficha de Caracterización:"');
      console.error('2. El código de ficha está en la columna siguiente');
      console.error('3. El formato sea: "CODIGO - NOMBRE DEL PROGRAMA"');
      
      throw new BadRequestException(
        'No se encontró código de ficha en el archivo. Verifique el formato. ' +
        'Debe existir una fila con "Ficha de Caracterización:" seguida del código en el formato "NUMERO - NOMBRE"'
      );
    }

    return fichaInfo;
  }

  // ✅ MÉTODO PARA ENCONTRAR DÓNDE EMPIEZAN LOS DATOS DE APRENDICES
  private findDataStartRow(worksheet: ExcelJS.Worksheet): number {
    // Buscar la fila que contiene los headers de la tabla
    // Esperamos algo como: "Tipo de Documento", "Número de Documento", "Nombre", etc.
    
    for (let rowIndex = 1; rowIndex <= 15; rowIndex++) {
      const row = worksheet.getRow(rowIndex);
      const cellA = this.getCellValue(row, 1)?.toString()?.toLowerCase() || '';
      const cellB = this.getCellValue(row, 2)?.toString()?.toLowerCase() || '';
      const cellC = this.getCellValue(row, 3)?.toString()?.toLowerCase() || '';
      
      // Buscar headers típicos de la tabla de datos
      if (
        (cellA.includes('tipo') && cellA.includes('documento')) ||
        cellA.includes('documento') ||
        cellB.includes('documento') ||
        cellC.includes('nombre')
      ) {
        console.log(`📊 Headers de tabla encontrados en fila ${rowIndex}`);
        return rowIndex + 1; // Los datos empiezan en la siguiente fila
      }
    }
    
    // Si no encuentra headers, asumir que empiezan en la fila 7 (fallback)
    console.log('⚠️ No se encontraron headers de tabla, usando fila 7 por defecto');
    return 7;
  }

  // ✅ MÉTODO MEJORADO PARA LEER CELDAS
  private getCellValue(row: ExcelJS.Row, columnNumber: number): any {
    try {
      const cell = row.getCell(columnNumber);
      if (cell && cell.value !== null && cell.value !== undefined) {
        // Manejar diferentes tipos de valores
        if (cell.value instanceof Date) {
          return cell.value.toLocaleDateString('es-CO');
        }
        if (typeof cell.value === 'object' && cell.value !== null) {
          // Manejar rich text y fórmulas
          if ('text' in cell.value) {
            return (cell.value as any).text;
          }
          if ('result' in cell.value) {
            return (cell.value as any).result;
          }
          if ('richText' in cell.value) {
            // Manejar texto enriquecido
            const richText = (cell.value as any).richText;
            return richText.map((rt: any) => rt.text || '').join('');
          }
          return cell.value.toString();
        }
        return cell.value;
      }
      return '';
    } catch (error) {
      console.warn(`Error al leer celda ${columnNumber}:`, error);
      return '';
    }
  }

  // ✅ MÉTODO MEJORADO PARA DETECTAR FILAS VACÍAS
  private isEmptyRow(row: ExcelJS.Row): boolean {
    // Verificar si la fila está completamente vacía o solo tiene datos irrelevantes
    const cellA = this.getCellValue(row, 1)?.toString()?.trim() || '';
    const cellB = this.getCellValue(row, 2)?.toString()?.trim() || '';
    const cellC = this.getCellValue(row, 3)?.toString()?.trim() || '';
    const cellD = this.getCellValue(row, 4)?.toString()?.trim() || '';
    
    // Si no hay datos en las primeras 4 columnas, considerar vacía
    if (!cellA && !cellB && !cellC && !cellD) {
      return true;
    }
    
    // Ignorar filas que parecen ser headers o separadores
    const combinedText = (cellA + cellB + cellC + cellD).toLowerCase();
    if (
      combinedText.includes('tipo') ||
      combinedText.includes('documento') ||
      combinedText.includes('nombre') ||
      combinedText.includes('apellido') ||
      combinedText.includes('correo') ||
      combinedText.includes('estado') ||
      combinedText === '' ||
      combinedText.length < 3
    ) {
      return true;
    }
    
    return false;
  }

  // ✅ MÉTODO MEJORADO PARA EXTRAER DATOS DE APRENDICES
  private extractLearnerData(row: ExcelJS.Row, rowNumber: number): ExcelLearnerRowDto {
    const rawData = {
      col1: this.getCellValue(row, 1)?.toString()?.trim() || '',
      col2: this.getCellValue(row, 2)?.toString()?.trim() || '',
      col3: this.getCellValue(row, 3)?.toString()?.trim() || '',
      col4: this.getCellValue(row, 4)?.toString()?.trim() || '',
      col5: this.getCellValue(row, 5)?.toString()?.trim() || '',
      col6: this.getCellValue(row, 6)?.toString()?.trim() || '',
      col7: this.getCellValue(row, 7)?.toString()?.trim() || '',
    };

    console.log(`📝 Fila ${rowNumber} - Datos raw:`, rawData);

    const result = {
      tipoDocumento: this.normalizeDocumentType(rawData.col1),
      numeroDocumento: rawData.col2,
      nombre: rawData.col3,
      apellidos: rawData.col4,
      celular: rawData.col5,
      correoElectronico: rawData.col6,
      estado: this.normalizeStatus(rawData.col7)
    };

    console.log(`📝 Fila ${rowNumber} - Datos procesados:`, result);

    // Validar datos mínimos
    if (!result.numeroDocumento || !result.nombre || !result.apellidos || !result.correoElectronico) {
      console.warn(`⚠️ Fila ${rowNumber} - Faltan datos requeridos:`, {
        tieneDocumento: !!result.numeroDocumento,
        tieneNombre: !!result.nombre,
        tieneApellidos: !!result.apellidos,
        tieneEmail: !!result.correoElectronico,
      });
    }

    return result;
  }

  private async createOrUpdateFicha(fichaInfo: any): Promise<{ ficha: Ficha; isNew: boolean }> {
  try {
    // Buscar ficha existente con manejo de errores
    let ficha = await this.fichaRepository.findOne({
      where: { code: fichaInfo.code },
    });

    let isNew = false;

    if (ficha) {
      // Actualizar ficha existente
      ficha.name = fichaInfo.name;
      ficha.status = fichaInfo.status;
      if (fichaInfo.reportDate) {
        ficha.reportDate = fichaInfo.reportDate;
      }
      ficha = await this.fichaRepository.save(ficha);
      console.log('🔄 Ficha actualizada:', ficha.code);
    } else {
      // Crear nueva ficha con manejo de duplicados
      isNew = true;
      const defaultProgram = await this.programRepository.findOne({
        where: { name: 'Programa por Defecto' },
      });

      try {
        ficha = this.fichaRepository.create({
          code: fichaInfo.code,
          name: fichaInfo.name,
          status: fichaInfo.status,
          reportDate: fichaInfo.reportDate,
          programId: defaultProgram?.id || 1,
        });

        ficha = await this.fichaRepository.save(ficha);
        console.log('🆕 Nueva ficha creada:', ficha.code);
      } catch (duplicateError: any) {
        // Si hay error de duplicado, intentar buscar la ficha nuevamente
        if (duplicateError.message.includes('Entrada duplicada') || duplicateError.code === 'ER_DUP_ENTRY') {
          console.log('⚠️ Ficha duplicada detectada, buscando existente...');
          ficha = await this.fichaRepository.findOne({
            where: { code: fichaInfo.code },
          });
          
          if (ficha) {
            // Actualizar la ficha encontrada
            ficha.name = fichaInfo.name;
            ficha.status = fichaInfo.status;
            if (fichaInfo.reportDate) {
              ficha.reportDate = fichaInfo.reportDate;
            }
            ficha = await this.fichaRepository.save(ficha);
            isNew = false;
            console.log('🔄 Ficha duplicada actualizada:', ficha.code);
          } else {
            throw new Error(`Error al crear/encontrar ficha ${fichaInfo.code}: ${duplicateError.message}`);
          }
        } else {
          throw duplicateError;
        }
      }
    }

    return { ficha, isNew };
  } catch (error: any) {
    console.error('❌ Error en createOrUpdateFicha:', error);
    throw new Error(`Error al procesar ficha ${fichaInfo.code}: ${error.message}`);
  }
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

    console.log(`✅ Nuevo aprendiz creado: ${learnerData.nombre} ${learnerData.apellidos}`);
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

    console.log(`🔄 Aprendiz actualizado: ${learnerData.nombre} ${learnerData.apellidos}`);
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

  private getRowValues(row: ExcelJS.Row): string[] {
    const values: string[] = [];
    for (let i = 1; i <= 7; i++) {
      const cellValue = this.getCellValue(row, i);
      values.push(cellValue?.toString() || '');
    }
    return values;
  }

  // Mantener el método existente para compatibilidad
  async importFromExcel(file: UploadedFile): Promise<any> {
    // Método existente para otros tipos de importación...
    // (mantener la implementación actual)
    throw new BadRequestException('Método no implementado aún');
  }
}