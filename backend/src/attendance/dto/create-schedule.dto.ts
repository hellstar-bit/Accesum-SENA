import { IsNumber, IsDateString, IsString, IsOptional } from 'class-validator';

export class CreateScheduleDto {
  @IsNumber()
  assignmentId: number;

  @IsDateString()
  date: string; // "2025-06-05"

  @IsString()
  startTime: string; // "08:00"

  @IsString()
  endTime: string; // "12:00"

  @IsOptional()
  @IsString()
  classroom?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  lateToleranceMinutes?: number;
}
