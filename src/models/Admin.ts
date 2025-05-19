export interface Admin {
  admin_id: number;
  name: string | null;
  email: string | null;
  password_hash: string | null;
  agency_id: number | null;
  created_at: string | null;
}

export interface CreateAdminDto {
  name: string;
  email: string;
  password: string;
  agency_id: number;
}

export interface UpdateAdminDto {
  name?: string;
  email?: string;
  password?: string;
  agency_id?: number;
}

export interface AdminResponse {
  admin_id: number;
  name: string;
  email: string;
  agency_id: number;
  created_at: string | null;
  token: string;
  role?: string;
} 