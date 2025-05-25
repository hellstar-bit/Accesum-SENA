// frontend/src/services/accessService.ts
import api from './api';

export interface AccessRecord {
  id: number;
  entryTime: string;
  exitTime?: string;
  status: string;
  duration?: string;
  user: {
    id: number;
    email: string;
    profile: {
      firstName: string;
      lastName: string;
      documentNumber: string;
      profileImage?: string;
      type: string;
      center: string;
    };
  };
}

export interface CurrentOccupancy {
  total: number;
  byType: Record<string, number>;
  records: AccessRecord[];
}

export interface AccessHistory {
  data: AccessRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AccessStats {
  totalAccess: number;
  currentlyInside: number;
  accessByHour: Array<{ hour: number; count: number }>;
  averageDurationMinutes: number;
}

export interface SearchResult {
  found: boolean;
  profile?: {
    id: number;
    fullName: string;
    documentNumber: string;
    type: string;
    profileImage?: string;
  };
}

export const accessService = {
  async checkIn(data: { profileId?: number; qrData?: string }): Promise<AccessRecord> {
    const response = await api.post<AccessRecord>('/access/check-in', data);
    return response.data;
  },

  async checkOut(data: { profileId?: number; qrData?: string }): Promise<AccessRecord> {
    const response = await api.post<AccessRecord>('/access/check-out', data);
    return response.data;
  },

  async getCurrentOccupancy(): Promise<CurrentOccupancy> {
    const response = await api.get<CurrentOccupancy>('/access/current');
    return response.data;
  },

  async getHistory(params?: {
    page?: number;
    limit?: number;
    date?: Date;
    userId?: number;
  }): Promise<AccessHistory> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.date) queryParams.append('date', params.date.toISOString());
    if (params?.userId) queryParams.append('userId', params.userId.toString());

    const response = await api.get<AccessHistory>(`/access/history?${queryParams}`);
    return response.data;
  },

  async getStats(date?: Date): Promise<AccessStats> {
    const params = date ? `?date=${date.toISOString()}` : '';
    const response = await api.get<AccessStats>(`/access/stats${params}`);
    return response.data;
  },

  async searchByDocument(documentNumber: string): Promise<SearchResult> {
    const response = await api.get<SearchResult>(`/access/search/${documentNumber}`);
    return response.data;
  },

  async importFromExcel(file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/import/excel', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
},
};