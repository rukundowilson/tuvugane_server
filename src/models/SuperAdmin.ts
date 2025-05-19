export interface SuperAdmin {
  super_admin_id: number;
  name: string;
  email: string;
  password: string;
  phone?: string;
  created_at?: string;
}

export interface SuperAdminResponse {
  super_admin_id: number;
  name: string;
  email: string;
  phone?: string;
  token: string;
} 