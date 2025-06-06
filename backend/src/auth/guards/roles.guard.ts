// backend/src/auth/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../types/user-role.type';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
  const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
    context.getHandler(),
    context.getClass(),
  ]);
  
  if (!requiredRoles) {
    return true;
  }
  
  const { user } = context.switchToHttp().getRequest();
  console.log('RolesGuard - user:', user);
  console.log('RolesGuard - requiredRoles:', requiredRoles);

  if (!user || !user.role) {
    console.warn('RolesGuard - No user or user.role');
    return false;
  }
  
  const hasRole = requiredRoles.some((role) => user.role.name === role);
  if (!hasRole) {
    console.warn(`RolesGuard - User role "${user.role.name}" not in requiredRoles:`, requiredRoles);
  }
  return hasRole;
}
    
  }
