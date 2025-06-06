// backend/src/auth/jwt.config.ts - CONFIGURACIÓN JWT
import { JwtModuleOptions } from '@nestjs/jwt';

export const jwtConfig: JwtModuleOptions = {
  secret: process.env.JWT_SECRET || 'your-secret-key',
  signOptions: {
    expiresIn: '24h', // Token válido por 24 horas
  },
};

console.log('🔑 JWT Config cargada:', {
  secret: (process.env.JWT_SECRET || 'your-secret-key').substring(0, 10) + '...',
  expiresIn: '24h'
});