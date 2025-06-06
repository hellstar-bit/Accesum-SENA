// backend/src/auth/constants/roles.constant.ts
export const ROLES = {
  ADMIN: 'Administrador',
  INSTRUCTOR: 'Instructor', 
  LEARNER: 'Aprendiz',
  EMPLOYEE: 'Funcionario',
  CONTRACTOR: 'Contratista',
  VISITOR: 'Visitante'
} as const;

export type RoleType = typeof ROLES[keyof typeof ROLES];