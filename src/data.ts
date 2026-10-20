export interface Subject {
  name: string;
  professor: string;
  aula: string;
  color: string;
}

export type PensionStatus = 'active' | 'pending' | 'paid' | 'none';
export type PensionPlan = 'completa' | 'solo_almuerzo' | 'desayuno_almuerzo' | 'personalizado' | 'sin_pension';
export type PersonRole = 'Estudiante' | 'Trabajador' | 'Docente' | 'Residente' | 'Invitado' | 'Otro';

export interface Student {
  id: string;
  student: string; // Nombre completo
  role?: PersonRole;
  phone?: string;
  breakfastDays?: string[];
  lunchDays?: string[];
  dinnerDays?: string[];
  notes?: string;
  avatarColor?: string;
  isWorker?: boolean;
  subjects?: Record<string, Subject>;
  schedule?: Record<string, Record<string, string>>;
  pensionStatus?: PensionStatus;
  pensionPlan?: PensionPlan;
  pensionPrice?: number;
  pensionDueDate?: string;
}

// Inicialmente vacío para producción sin datos predeterminados
export const STUDENTS_DATA: Student[] = [];
