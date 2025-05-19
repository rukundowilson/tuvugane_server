export interface Agency {
  agency_id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  description: string | null;
}

export interface CreateAgencyDto {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  description?: string;
}

export interface UpdateAgencyDto {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  description?: string;
} 