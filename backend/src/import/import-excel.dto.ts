// src/import/dto/import-excel.dto.ts
import { IsString, IsEmail, IsOptional, IsIn } from 'class-validator';

export class ExcelRowDto {
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
  @IsIn(['Activo', 'Inactivo'])
  estado: string;
}

export class ImportResultDto {
  success: boolean;
  totalRows: number;
  importedRows: number;
  errors: Array<{
    row: number;
    error: string;
    data?: any;
  }>;
  summary: {
    funcionarios: number;
    contratistas: number;
    aprendices: number;
    visitantes: number;
  };
}