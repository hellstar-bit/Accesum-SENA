// backend/src/auth/strategies/jwt.strategy.ts - CON JWT_SECRET DEL .ENV
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'accesum_secret_key', // ✅ USAR EL DEL .ENV
    });
    
    console.log('🔑 JWT Strategy inicializada con secret del .env:', process.env.JWT_SECRET || 'accesum_secret_key');
  }

  async validate(payload: any) {
  console.log('🔍 JWT Strategy - validando payload:', {
    sub: payload.sub,
    email: payload.email,
    role: payload.role,
    iat: payload.iat,
    exp: payload.exp,
    currentTime: new Date().toISOString()
  });
  
  // Verificar si el token está expirado
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) {
    console.log('❌ Token EXPIRADO:', {
      exp: payload.exp,
      now: now,
      diff: now - payload.exp
    });
    throw new UnauthorizedException('Token expirado');
  }

  try {
    const user = await this.authService.validateUser(payload.sub);
    
    if (!user) {
      console.log('❌ Usuario no encontrado para ID:', payload.sub);
      throw new UnauthorizedException('Usuario no válido');
    }

    console.log('✅ Usuario validado correctamente:', {
      id: user.id,
      email: user.email,
      role: user.role?.name
    });

    return user;
    
  } catch (error) {
    console.error('❌ Error en JWT validation:', error);
    throw new UnauthorizedException('Token inválido');
  }
}
}