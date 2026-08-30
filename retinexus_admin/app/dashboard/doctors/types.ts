export interface Doctor {
  id: string;
  name: string;
  email: string;
  hospital: string | null;
  phone: string | null;
  specialization: string | null;
  status: 'PENDING' | 'APPROVED' | 'BLOCKED';
  firebaseUid?: string | null;
  createdAt: string;
  _count?: { patients: number };
}
