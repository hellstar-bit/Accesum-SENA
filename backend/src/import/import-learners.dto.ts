// backend/src/import/dto/import-learners.dto.ts
import { IsString, IsEmail, IsOptional, IsIn, IsDateString } from 'class-validator';

export class ImportLearnersDto {
  @IsString()
  fichaCode: string; // "2856502"

  @IsString()
  fichaName: string; // "GESTIÓN DE REDES DE DATOS"

  @IsString()
  @IsIn(['EN EJECUCIÓN', 'TERMINADA', 'CANCELADA'])
  fichaStatus: string;

  @IsDateString()
  @IsOptional()
  reportDate?: string;

  @IsOptional()
  learners?: ExcelLearnerRowDto[];
}

export class ExcelLearnerRowDto {
  @IsString()
  @IsIn(['CC', 'CE', 'TI', 'PA', 'RC', 'PEP'])
  tipoDocumento: string;

  @IsString()
  numeroDocumento: string;

  @IsString()
  nombre: string;

  @IsString()
  apellidos: string;

  @IsString()
  @IsOptional()
  celular?: string;

  @IsEmail()
  correoElectronico: string;

  @IsString()
  @IsIn(['EN FORMACION', 'CANCELADO', 'RETIRO VOLUNTARIO', 'APLAZADO'])
  estado: string;
}

export class ImportLearnersResultDto {
  success: boolean;
  totalRows: number;
  importedRows: number;
  updatedRows: number;
  fichaInfo: {
    code: string;
    name: string;
    status: string;
    isNew: boolean;
  };
  errors: Array<{
    row: number;
    error: string;
    data?: any;
  }>;
  summary: {
    nuevos: number;
    actualizados: number;
    errores: number;
  };
}