// backend/src/auth/auth.controller.ts - COMPLETO
import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  UseGuards, 
  Request,
  HttpCode,
  HttpStatus, 
  UnauthorizedException
} from '@nestjs/common';
import { AuthService, LoginDto } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ⭐ LOGIN
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  // ⭐ OBTENER PERFIL ACTUAL (este es el endpoint que falta)
 @Get('profile')
@UseGuards(JwtAuthGuard)
async getProfile(@Request() req: any) {
  const user = await this.authService.getProfile(req.user.id);
  if (!user) {
    // Si el usuario no existe o está inactivo
    throw new UnauthorizedException('Usuario no encontrado o inactivo');
  }
  // Opcional: eliminar campos sensibles si los hay
  // delete user.password;
  return user;
}

  // ⭐ CAMBIAR CONTRASEÑA
  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Request() req: any,
    @Body() data: { currentPassword: string; newPassword: string }
  ) {
    await this.authService.changePassword(
      req.user.id,
      data.currentPassword,
      data.newPassword
    );
    return { message: 'Contraseña actualizada correctamente' };
  }

  // ⭐ LOGOUT
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Request() req: any) {
    await this.authService.logout(req.user.id);
    return { message: 'Sesión cerrada correctamente' };
  }

  // ⭐ VERIFICAR TOKEN (opcional)
  @Get('verify')
  @UseGuards(JwtAuthGuard)
  async verify(@Request() req: any) {
    return { 
      valid: true, 
      user: req.user 
    };
  }
  @Get('debug-token')
@UseGuards(JwtAuthGuard)
async debugToken(@Request() req: any) {
  return { user: req.user };
}
}