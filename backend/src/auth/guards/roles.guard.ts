// backend/src/auth/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

export enum UserRole {
  ADMIN = 'Administrador',
  INSTRUCTOR = 'Instructor', 
  APRENDIZ = 'Aprendiz',
  ESCANER = 'Escaner',
  FUNCIONARIO = 'Funcionario',
  CONTRATISTA = 'Contratista',
  VISITANTE = 'Visitante',
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // Si no hay roles requeridos, permitir acceso
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user || !user.role) {
      return false;
    }

    // El admin siempre tiene acceso
    if (user.role.name === UserRole.ADMIN) {
      return true;
    }

    // Verificar si el usuario tiene uno de los roles requeridos
    return requiredRoles.some((role) => user.role.name === role);
  }
}