declare global {
  namespace Express {
    interface Request {
      user?: { id: number; role?: string; agency_id?: number };
    }
  }
}
