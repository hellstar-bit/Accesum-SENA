// create-assignment.dto.ts
import { IsNumber, IsString, IsOptional } from 'class-validator';

export class CreateAssignmentDto {
  @IsNumber()
  instructorId: number;

  @IsNumber()
  fichaId: number;

  @IsString()
  subject: string;

  @IsOptional()
  @IsString()
  description?: string;
}