// frontend/src/types/user.types.ts
export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions?: string;
}

export interface PersonnelType {
  id: number;
  name: string;
}

export interface Regional {
  id: number;
  name: string;
}

export interface Center {
  id: number;
  name: string;
  regional?: Regional;
}

export interface Coordination {
  id: number;
  name: string;
  center?: Center;
}

export interface Program {
  id: number;
  name: string;
  coordination?: Coordination;
}

export interface Ficha {
  id: number;
  code: string;
  name: string;
  status: string;
  startDate?: Date;
  endDate?: Date;
  program?: Program;
}

export interface Profile {
  id: number;
  documentType: string;
  documentNumber: string;
  firstName: string;
  lastName: string;
  bloodType?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  maritalStatus?: string;
  sex?: string;
  vaccine?: string;
  profileImage?: string;
  qrCode?: string;
  learnerStatus?: string;
  type: PersonnelType;
  regional: Regional;
  center: Center;
  coordination?: Coordination;
  program?: Program;
  ficha?: Ficha;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: number;
  email: string;
  isActive: boolean;
  role: Role;
  profile: Profile;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthUser {
  user: User;
  token: string;
}
// iduhfusdfhsdfgus

// frontend/src/types/user.types.ts


export interface PersonnelType {
  id: number;
  name: string;
  description?: string;
}

export interface Regional {
  id: number;
  name: string;
  code?: string;
}

export interface Center {
  id: number;
  name: string;
  code?: string;
  regional?: Regional;
}



export interface CreateUserData {
  email: string;
  password: string;
  roleId: number;
  isActive?: boolean;
  profile?: {
    documentType: string;
    documentNumber: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    address?: string;
    city?: string;
    bloodType?: string;
    maritalStatus?: string;
    vaccine?: string;
    typeId: number;
    regionalId: number;
    centerId: number;
  };
}

export interface UpdateUserData {
  email?: string;
  isActive?: boolean;
  roleId?: number;
}

export interface UpdateProfileData {
  documentType?: string;
  documentNumber?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  bloodType?: string;
  maritalStatus?: string;
  vaccine?: string;
  typeId?: number;
  regionalId?: number;
  centerId?: number;
}

export interface UsersResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}