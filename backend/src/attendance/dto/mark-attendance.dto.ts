import { IsNumber, IsEnum, IsOptional, IsString } from 'class-validator';

export class MarkAttendanceDto {
  @IsNumber()
  scheduleId: number;

  @IsNumber()
  learnerId: number;

  @IsEnum(['PRESENT', 'LATE', 'ABSENT'])
  status: 'PRESENT' | 'LATE' | 'ABSENT';

  @IsOptional()
  @IsString()
  notes?: string;
}