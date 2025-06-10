// backend/src/config/timezone.module.ts
import { Module } from '@nestjs/common';
import { TimezoneService } from './timezone.service';

@Module({
  providers: [TimezoneService],
  exports: [TimezoneService], // ⭐ IMPORTANTE: Exportar el servicio
})
export class TimezoneModule {}
