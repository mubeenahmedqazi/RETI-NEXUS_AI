export interface Patient {
  id: string;
  name: string;
  phone: string;
  age: number | null;
  gender: string | null;
  address: string | null;
  diabetesLevel: string | null;
  doctorId: string | null;
  createdAt: string;
  doctor: { id: string; name: string } | null;
}

export interface DoctorOption {
  id: string;
  name: string;
}
