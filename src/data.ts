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
  // Campos antiguos opcionales para compatibilidad
  pensionStatus?: PensionStatus;
  pensionPlan?: PensionPlan;
  pensionPrice?: number;
  pensionDueDate?: string;
}

export const STUDENTS_DATA: Student[] = [
  {
    "id": "1",
    "student": "SUAREZ MENDOZA BREIDY DAVID",
    "breakfastDays": ["MARTES", "JUEVES"],
    "lunchDays": ["LUNES", "JUEVES"],
    "subjects": {
      "422131-A1": {
        "name": "BIOLOGIA Y MICROBIOLOGIA",
        "professor": "PENDIENTE",
        "aula": "AULA 4409 / LAB BIOLOGIA",
        "color": "bg-cyan-100 text-cyan-900 border-cyan-300"
      },
      "3102-A3": {
        "name": "INGLES II",
        "professor": "PENDIENTE",
        "aula": "AULA 6203 / AULA 1203",
        "color": "bg-gray-100 text-gray-900 border-gray-300"
      },
      "422132-A1": {
        "name": "BIOLOGIA GENERAL",
        "professor": "PENDIENTE",
        "aula": "AULA 3106 / BIOLOGIA GENERAL",
        "color": "bg-green-100 text-green-900 border-green-300"
      },
      "422135-A2": {
        "name": "QUIMICA I",
        "professor": "PENDIENTE",
        "aula": "LAB QUIMICA I / AULA 3106",
        "color": "bg-blue-100 text-blue-900 border-blue-300"
      },
      "422134-A1": {
        "name": "FISICA MECANICA",
        "professor": "PENDIENTE",
        "aula": "AULA 3106",
        "color": "bg-yellow-100 text-yellow-900 border-yellow-300"
      },
      "422538-A1": {
        "name": "MATERIA_PENDIENTE_3105",
        "professor": "PENDIENTE",
        "aula": "AULA 3105",
        "color": "bg-orange-100 text-orange-900 border-orange-300"
      },
      "422133-A1": {
        "name": "MATERIA_PENDIENTE_3106",
        "professor": "PENDIENTE",
        "aula": "AULA 3106",
        "color": "bg-lime-100 text-lime-900 border-lime-300"
      },
      "422336-A1": {
        "name": "MATERIA_PENDIENTE_3308",
        "professor": "PENDIENTE",
        "aula": "AULA 3308",
        "color": "bg-red-100 text-red-900 border-red-300"
      }
    },
    "schedule": {
      "06:30-07:14": { "MARTES": "422131-A1", "JUEVES": "422132-A1" },
      "07:15-07:59": { "MARTES": "422131-A1", "JUEVES": "422132-A1" },
      "08:00-08:44": { "LUNES": "422135-A2", "MARTES": "3102-A3", "MIERCOLES": "3102-A3", "JUEVES": "422132-A1" },
      "08:45-09:29": { "LUNES": "422135-A2", "MARTES": "3102-A3", "MIERCOLES": "3102-A3", "JUEVES": "422135-A2" },
      "09:30-10:14": { "MIERCOLES": "422132-A1", "JUEVES": "422135-A2" },
      "10:15-10:59": { "MIERCOLES": "422132-A1", "JUEVES": "422135-A2" },
      "12:30-13:14": { "JUEVES": "422131-A1" },
      "13:30-14:14": { "LUNES": "422134-A1", "JUEVES": "422131-A1" },
      "14:15-14:59": { "LUNES": "422134-A1", "JUEVES": "422131-A1" },
      "15:00-15:44": { "LUNES": "422134-A1" },
      "15:45-16:29": { "LUNES": "422134-A1" },
      "16:30-17:14": { "LUNES": "422134-A1", "MIERCOLES": "422336-A1", "VIERNES": "422133-A1" },
      "17:15-17:59": { "LUNES": "422538-A1", "MARTES": "422133-A1", "MIERCOLES": "422336-A1", "VIERNES": "422133-A1" },
      "18:00-18:44": { "LUNES": "422538-A1", "MARTES": "422133-A1", "MIERCOLES": "422336-A1", "VIERNES": "422133-A1" }
    }
  },
  {
    "id": "2",
    "student": "GONZALEZ MONTERO JUAN ESTEBAN",
    "breakfastDays": ["JUEVES"],
    "lunchDays": [],
    "subjects": {
      "791113-A1": {
        "name": "QUIMICA II / MATERIA_PENDIENTE_2104",
        "professor": "PENDIENTE",
        "aula": "Aula 2104 / LAB QUIMICA II",
        "color": "bg-red-100 text-red-900 border-red-300"
      },
      "791416-A1": {
        "name": "MATERIA_PENDIENTE_4203",
        "professor": "PENDIENTE",
        "aula": "AULA 4203",
        "color": "bg-orange-100 text-orange-900 border-orange-300"
      },
      "791112-A2": {
        "name": "BIOLOGIA GENERAL",
        "professor": "PENDIENTE",
        "aula": "BIOLOGIA GENERAL / AULA 2102",
        "color": "bg-green-100 text-green-900 border-green-300"
      },
      "791415-A1": {
        "name": "MATERIA_PENDIENTE_5103_4401",
        "professor": "PENDIENTE",
        "aula": "AULA 5103 / AULA 4401",
        "color": "bg-teal-100 text-teal-900 border-teal-300"
      },
      "791111-A2": {
        "name": "MATERIA_PENDIENTE_2101_2203",
        "professor": "PENDIENTE",
        "aula": "AULA 2101 / AULA 2203",
        "color": "bg-blue-100 text-blue-900 border-blue-300"
      },
      "791214-A1": {
        "name": "MATERIA_PENDIENTE_3308",
        "professor": "PENDIENTE",
        "aula": "AULA 3308",
        "color": "bg-yellow-100 text-yellow-900 border-yellow-300"
      }
    },
    "schedule": {
      "06:30-07:14": { "JUEVES": "791113-A1" },
      "07:15-07:59": { "JUEVES": "791113-A1" },
      "08:00-08:44": { "MARTES": "791416-A1", "JUEVES": "791113-A1" },
      "08:45-09:29": { "MARTES": "791416-A1", "JUEVES": "791113-A1", "VIERNES": "791112-A2" },
      "09:30-10:14": { "LUNES": "791415-A1", "VIERNES": "791112-A2" },
      "10:15-10:59": { "LUNES": "791415-A1", "VIERNES": "791112-A2" },
      "11:00-11:44": { "MARTES": "791415-A1", "MIERCOLES": "791111-A2", "JUEVES": "791111-A2" },
      "11:45-12:29": { "MARTES": "791415-A1", "MIERCOLES": "791111-A2", "JUEVES": "791111-A2" },
      "14:15-14:59": { "MARTES": "791112-A2", "JUEVES": "791113-A1" },
      "15:00-15:44": { "LUNES": "791214-A1", "MARTES": "791112-A2", "JUEVES": "791113-A1" },
      "15:45-16:29": { "LUNES": "791214-A1", "MARTES": "791112-A2" },
      "16:30-17:14": { "LUNES": "791214-A1", "MARTES": "791112-A2" }
    }
  },
  {
    "id": "3",
    "student": "RUBEN",
    "breakfastDays": [],
    "lunchDays": ["MARTES", "MIERCOLES", "JUEVES"],
    "subjects": {
      "732416-B1": { "name": "PENDIENTE", "professor": "PENDIENTE", "aula": "AULA 1204", "color": "bg-slate-100 text-slate-900 border-slate-300" },
      "732215-B1": { "name": "PENDIENTE", "professor": "PENDIENTE", "aula": "AULA 1204 / AULA 1302", "color": "bg-cyan-100 text-cyan-900 border-cyan-300" },
      "732118-B1": { "name": "PENDIENTE", "professor": "PENDIENTE", "aula": "AULA 1203 / AULA 1201", "color": "bg-green-100 text-green-900 border-green-300" },
      "732117-B1": { "name": "PENDIENTE", "professor": "PENDIENTE", "aula": "No", "color": "bg-red-100 text-red-900 border-red-300" },
      "732214-B1": { "name": "PENDIENTE", "professor": "PENDIENTE", "aula": "AULA 1302", "color": "bg-lime-100 text-lime-900 border-lime-300" },
      "732111-B1": { "name": "PENDIENTE", "professor": "PENDIENTE", "aula": "AULA 1303 / AULA 1107", "color": "bg-yellow-100 text-yellow-900 border-yellow-300" },
      "732112-B1": { "name": "PENDIENTE", "professor": "PENDIENTE", "aula": "AULA 1305 / AULA 3106", "color": "bg-orange-100 text-orange-900 border-orange-300" },
      "732113-B1": { "name": "PENDIENTE", "professor": "PENDIENTE", "aula": "AULA 3107 / AULA 1103", "color": "bg-blue-100 text-blue-900 border-blue-300" }
    },
    "schedule": {
      "12:30-13:14": { "MIERCOLES": "732416-B1" },
      "13:30-14:14": { "MARTES": "732215-B1", "MIERCOLES": "732416-B1", "JUEVES": "732215-B1" },
      "14:15-14:59": { "MARTES": "732215-B1", "MIERCOLES": "732416-B1", "JUEVES": "732215-B1" },
      "15:00-15:44": { "MARTES": "732118-B1", "MIERCOLES": "732117-B1", "JUEVES": "732118-B1", "VIERNES": "732117-B1" },
      "15:45-16:29": { "MARTES": "732118-B1", "MIERCOLES": "732117-B1", "JUEVES": "732118-B1", "VIERNES": "732117-B1" },
      "16:30-17:14": { "LUNES": "732214-B1", "MARTES": "732111-B1", "MIERCOLES": "732214-B1", "VIERNES": "732111-B1" },
      "17:15-17:59": { "LUNES": "732214-B1", "MARTES": "732111-B1", "MIERCOLES": "732214-B1", "VIERNES": "732111-B1" },
      "18:00-18:44": { "LUNES": "732112-B1", "MIERCOLES": "732112-B1" },
      "18:45-19:29": { "LUNES": "732112-B1", "MIERCOLES": "732112-B1" },
      "19:30-20:14": { "LUNES": "732113-B1", "MIERCOLES": "732113-B1" },
      "20:15-20:59": { "LUNES": "732113-B1", "MIERCOLES": "732113-B1" }
    }
  },
  {
    "id": "4",
    "student": "GARCÍA QUINTERO WINMILETH YINETH",
    "breakfastDays": ["LUNES"],
    "lunchDays": ["LUNES", "MARTES", "MIERCOLES"],
    "subjects": {
      "516252-B1": { "name": "TRABAJO SOCIAL CON FAMILIA", "professor": "ARIADNE JUDITH MANOTAS LOPEZ", "aula": "AULA 2203 / AULA 3106", "color": "bg-yellow-100 text-yellow-900 border-yellow-300" },
      "516455-B1": { "name": "PEDAGOGÍA SOCIA", "professor": "NOLENYS BEATRIZ MENDOZA BOLIVAR", "aula": "AULA 3105", "color": "bg-teal-100 text-teal-900 border-teal-300" },
      "3103-A7": { "name": "INGLES III", "professor": "JUAN CARLOS ALARCON JIMENEZ", "aula": "AULA 2104 / AULA 5308", "color": "bg-green-100 text-green-900 border-green-300" },
      "516456-F1": { "name": "MATERIA 516456", "professor": "PENDIENTE", "aula": "AULA 4410", "color": "bg-orange-100 text-orange-900 border-orange-300" },
      "516253-F1": { "name": "PROYECTO SOCIAL", "professor": "LINDA DE LA HOZ LINDO", "aula": "AULA 1109", "color": "bg-red-100 text-red-900 border-red-300" },
      "516151-A1": { "name": "DERECHO DE FAMILIA", "professor": "RUTH FIDELIA BARROS IGUARAN", "aula": "AULA 3202", "color": "bg-blue-100 text-blue-900 border-blue-300" },
      "516354-B1": { "name": "INVESTIGACIÓN CUALITATIVA", "professor": "LIMEDIS DE JESUS CASTILLO MENDOZA", "aula": "AULA 3203", "color": "bg-lime-100 text-lime-900 border-lime-300" }
    },
    "schedule": {
      "06:30-07:14": { "LUNES": "516252-B1" },
      "07:15-07:59": { "LUNES": "516252-B1" },
      "08:00-08:44": { "MIERCOLES": "516253-F1", "JUEVES": "516455-B1" },
      "08:45-09:29": { "MIERCOLES": "516253-F1", "JUEVES": "516455-B1" },
      "09:30-10:14": { "MARTES": "3103-A7", "JUEVES": "3103-A7" },
      "10:15-10:59": { "MARTES": "3103-A7", "JUEVES": "3103-A7" },
      "12:30-13:14": { "MIERCOLES": "516151-A1" },
      "13:30-14:14": { "LUNES": "516456-F1", "MARTES": "516252-B1", "MIERCOLES": "516151-A1" },
      "14:15-14:59": { "LUNES": "516456-F1", "MARTES": "516252-B1" },
      "16:30-17:14": { "VIERNES": "516354-B1" },
      "17:15-17:59": { "VIERNES": "516354-B1" },
      "18:00-18:44": { "VIERNES": "516354-B1" }
    }
  },
  {
    "id": "5",
    "student": "IPUANA ATENCIO ELIANIS SARAY",
    "breakfastDays": ["VIERNES"],
    "lunchDays": ["MIERCOLES", "JUEVES"],
    "subjects": {
      "225E23-A1": { "name": "PENDIENTE", "professor": "PENDIENTE", "aula": "AULA 6301", "color": "bg-yellow-100 text-yellow-900 border-yellow-300" },
      "225113L-A5": { "name": "LAB BIOLOGIA Y MICROBIOLOGIA", "professor": "PENDIENTE", "aula": "LAB BIOLOGIA Y MICROBIOLOGIA", "color": "bg-slate-200 text-slate-900 border-slate-400" },
      "225114-B1": { "name": "DIBUJO 6104", "professor": "PENDIENTE", "aula": "AULA: DIBUJO 6104", "color": "bg-green-100 text-green-900 border-green-300" },
      "225121-A1": { "name": "PENDIENTE", "professor": "PENDIENTE", "aula": "AULA 4110", "color": "bg-cyan-100 text-cyan-900 border-cyan-300" },
      "3101-C3": { "name": "PENDIENTE", "professor": "PENDIENTE", "aula": "AULA 1308 / AULA 5103", "color": "bg-red-100 text-red-900 border-red-300" },
      "225122L-A1": { "name": "FISICA MECANICA", "professor": "PENDIENTE", "aula": "AULA: FISICA MECANICA", "color": "bg-blue-100 text-blue-900 border-blue-300" },
      "225123T-A1": { "name": "PENDIENTE", "professor": "PENDIENTE", "aula": "AULA 4205", "color": "bg-lime-100 text-lime-900 border-lime-300" },
      "225113T-A1": { "name": "PENDIENTE", "professor": "PENDIENTE", "aula": "AULA 4101", "color": "bg-orange-100 text-orange-900 border-orange-300" },
      "225122T-A1": { "name": "PENDIENTE", "professor": "PENDIENTE", "aula": "AULA 4110", "color": "bg-rose-100 text-rose-900 border-rose-300" },
      "225123L-A1": { "name": "LAB QUIMICA I", "professor": "PENDIENTE", "aula": "LAB QUIMICA I", "color": "bg-amber-100 text-amber-900 border-amber-300" }
    },
    "schedule": {
      "06:30-07:14": { "VIERNES": "225E23-A1" },
      "07:15-07:59": { "VIERNES": "225E23-A1" },
      "08:00-08:44": { "MARTES": "225121-A1", "VIERNES": "225113L-A5" },
      "08:45-09:29": { "MARTES": "225121-A1", "VIERNES": "225113L-A5" },
      "11:00-11:44": { "VIERNES": "225114-B1" },
      "11:45-12:29": { "VIERNES": "225114-B1" },
      "12:30-13:14": { "VIERNES": "225114-B1" },
      "13:30-14:14": { "MIERCOLES": "3101-C3", "JUEVES": "225122L-A1", "VIERNES": "3101-C3" },
      "14:15-14:59": { "MIERCOLES": "3101-C3", "JUEVES": "225122L-A1", "VIERNES": "3101-C3" },
      "15:00-15:44": { "LUNES": "225123T-A1", "MARTES": "225113T-A1", "MIERCOLES": "225123T-A1", "JUEVES": "225122T-A1", "VIERNES": "225123L-A1" },
      "15:45-16:29": { "LUNES": "225123T-A1", "MARTES": "225113T-A1", "MIERCOLES": "225123T-A1", "JUEVES": "225122T-A1", "VIERNES": "225123L-A1" },
      "16:30-17:14": { "LUNES": "225122T-A1", "MIERCOLES": "225121-A1", "JUEVES": "225113T-A1" },
      "17:15-17:59": { "LUNES": "225122T-A1", "MIERCOLES": "225121-A1", "JUEVES": "225113T-A1" }
    }
  },
  {
    "id": "6",
    "student": "ATENCIO IPUANA TEMISTOCLE EISYANIOR",
    "breakfastDays": ["LUNES", "MIERCOLES"],
    "lunchDays": ["MIERCOLES", "JUEVES", "VIERNES"],
    "subjects": {
      "273335-C1": { "name": "PENDIENTE", "professor": "PENDIENTE", "aula": "AULA 6305", "color": "bg-blue-100 text-blue-900 border-blue-300" },
      "273243-B1": { "name": "PENDIENTE", "professor": "PENDIENTE", "aula": "AULA 6301", "color": "bg-lime-100 text-lime-900 border-lime-300" },
      "273244-B1": { "name": "PENDIENTE", "professor": "PENDIENTE", "aula": "AULA 6304", "color": "bg-cyan-100 text-cyan-900 border-cyan-300" },
      "273556-A1": { "name": "PENDIENTE", "professor": "PENDIENTE", "aula": "AULA 4205", "color": "bg-orange-100 text-orange-900 border-orange-300" },
      "273354-A1": { "name": "PENDIENTE", "professor": "PENDIENTE", "aula": "No", "color": "bg-green-100 text-green-900 border-green-300" },
      "3103-E8": { "name": "PENDIENTE", "professor": "PENDIENTE", "aula": "AULA 5305 / AULA 4402", "color": "bg-slate-200 text-slate-900 border-slate-400" },
      "273132L-A4": { "name": "FISICA ONDA ELECTRICA", "professor": "PENDIENTE", "aula": "FISICA ONDA ELECTRICA", "color": "bg-red-100 text-red-900 border-red-300" },
      "273132T-A1": { "name": "PENDIENTE", "professor": "PENDIENTE", "aula": "AULA 4203", "color": "bg-rose-100 text-rose-900 border-rose-300" },
      "273141-B1": { "name": "PENDIENTE", "professor": "PENDIENTE", "aula": "AULA 4203", "color": "bg-yellow-100 text-yellow-900 border-yellow-300" }
    },
    "schedule": {
      "06:30-07:14": { "LUNES": "273335-C1", "MIERCOLES": "273335-C1" },
      "07:15-07:59": { "LUNES": "273335-C1", "MIERCOLES": "273335-C1" },
      "09:30-10:14": { "LUNES": "273243-B1" },
      "10:15-10:59": { "LUNES": "273243-B1" },
      "11:00-11:44": { "LUNES": "273243-B1" },
      "12:30-13:14": { "MIERCOLES": "273244-B1", "VIERNES": "273354-A1" },
      "13:30-14:14": { "MIERCOLES": "273244-B1", "JUEVES": "273556-A1", "VIERNES": "273354-A1" },
      "14:15-14:59": { "MIERCOLES": "273244-B1", "JUEVES": "273556-A1", "VIERNES": "273354-A1" },
      "15:00-15:44": { "MARTES": "3103-E8", "VIERNES": "3103-E8" },
      "15:45-16:29": { "MARTES": "3103-E8", "VIERNES": "3103-E8" },
      "16:30-17:14": { "MIERCOLES": "273132L-A4", "VIERNES": "273132T-A1" },
      "17:15-17:59": { "MIERCOLES": "273132L-A4", "VIERNES": "273132T-A1" },
      "18:00-18:44": { "LUNES": "273141-B1", "MIERCOLES": "273141-B1", "VIERNES": "273132T-A1" },
      "18:45-19:29": { "LUNES": "273141-B1", "MIERCOLES": "273141-B1" }
    }
  },
  {
    "id": "7",
    "student": "RAMIRO CAMPO",
    "breakfastDays": [],
    "lunchDays": ["MARTES", "JUEVES"],
    "subjects": {
      "273251-B1": { "name": "METODOS NUMERICO", "professor": "YISSET ANDREA PIMIENTA ZAPATA", "aula": "AULA 6101", "color": "bg-teal-100 text-teal-900 border-teal-300" },
      "273345-B1": { "name": "PROGRAMACION AVANZADA", "professor": "EDUARDO LUIS SIERRA FRAGOZO", "aula": "AULA 6401", "color": "bg-cyan-100 text-cyan-900 border-cyan-300" },
      "273346-A1": { "name": "ESTRUCTURA DE DATOS II", "professor": "DAVID FERNANDEZ PEREZ", "aula": "AULA 6305", "color": "bg-red-100 text-red-900 border-red-300" },
      "273352-A1": { "name": "ARQUITECTURA DEL COMPUTADOR", "professor": "ASLIN GONZALO BOTELLO PLATA", "aula": "AULA 6306", "color": "bg-orange-100 text-orange-900 border-orange-300" },
      "273365-A1": { "name": "INGENIERIA DE SOFTWARE I", "professor": "ROBERT DAMIAN QUINTERO LAVERDE", "aula": "AULA 6106", "color": "bg-yellow-100 text-yellow-900 border-yellow-300" },
      "3104-B2": { "name": "INGLES IV", "professor": "YEFFERSON ZULETA ESPINOSA", "aula": "No", "color": "bg-lime-100 text-lime-900 border-lime-300" }
    },
    "schedule": {
      "08:00-08:44": { "LUNES": "273346-A1", "MIERCOLES": "273346-A1" },
      "08:45-09:29": { "LUNES": "273346-A1", "MIERCOLES": "273346-A1" },
      "09:30-10:14": { "LUNES": "273352-A1" },
      "10:15-10:59": { "LUNES": "273352-A1" },
      "11:00-11:44": { "LUNES": "273352-A1" },
      "12:30-13:14": { "MARTES": "273345-B1" },
      "13:30-14:14": { "MARTES": "273345-B1", "MIERCOLES": "273365-A1", "JUEVES": "273365-A1" },
      "14:15-14:59": { "MARTES": "273345-B1", "MIERCOLES": "273365-A1", "JUEVES": "273365-A1" },
      "15:00-15:44": { "LUNES": "3104-B2", "MIERCOLES": "273251-B1", "JUEVES": "3104-B2" },
      "15:45-16:29": { "LUNES": "3104-B2", "MIERCOLES": "273251-B1", "JUEVES": "3104-B2" },
      "16:30-17:14": { "MIERCOLES": "273251-B1" }
    }
  },
  {
    "id": "8",
    "student": "SARAZA RUMBO CAMILO ANDRES",
    "breakfastDays": ["LUNES", "MARTES", "VIERNES"],
    "lunchDays": [],
    "subjects": {
      "393518-A1": { "name": "PENDIENTE", "professor": "PENDIENTE", "aula": "AULA 6406", "color": "bg-amber-100 text-amber-900 border-amber-300" },
      "393111-A1": { "name": "PENDIENTE", "professor": "PENDIENTE", "aula": "AULA 3203", "color": "bg-green-100 text-green-900 border-green-300" },
      "393417-A1": { "name": "PENDIENTE", "professor": "PENDIENTE", "aula": "AULA 4107", "color": "bg-cyan-100 text-cyan-900 border-cyan-300" },
      "393215-A1": { "name": "PENDIENTE", "professor": "PENDIENTE", "aula": "AULA 3306", "color": "bg-red-100 text-red-900 border-red-300" },
      "393213-A1": { "name": "PENDIENTE", "professor": "PENDIENTE", "aula": "No", "color": "bg-yellow-100 text-yellow-900 border-yellow-300" },
      "393214-A1": { "name": "PENDIENTE", "professor": "PENDIENTE", "aula": "No", "color": "bg-slate-200 text-slate-900 border-slate-400" },
      "393112-A1": { "name": "PENDIENTE", "professor": "PENDIENTE", "aula": "AULA 4107", "color": "bg-lime-100 text-lime-900 border-lime-300" },
      "393316-A1": { "name": "PENDIENTE", "professor": "PENDIENTE", "aula": "AULA 4104", "color": "bg-blue-100 text-blue-900 border-blue-300" }
    },
    "schedule": {
      "06:30-07:14": { "LUNES": "393518-A1", "MARTES": "393111-A1", "VIERNES": "393417-A1" },
      "07:15-07:59": { "LUNES": "393518-A1", "MARTES": "393111-A1", "VIERNES": "393417-A1" },
      "08:00-08:44": { "LUNES": "393215-A1", "MARTES": "393213-A1", "MIERCOLES": "393214-A1", "VIERNES": "393214-A1" },
      "08:45-09:29": { "LUNES": "393215-A1", "MARTES": "393213-A1", "MIERCOLES": "393214-A1", "VIERNES": "393214-A1" },
      "09:30-10:14": { "LUNES": "393213-A1", "MARTES": "393213-A1", "MIERCOLES": "393214-A1", "VIERNES": "393214-A1" },
      "10:15-10:59": { "LUNES": "393213-A1", "MIERCOLES": "393112-A1" },
      "11:00-11:44": { "LUNES": "393213-A1", "MIERCOLES": "393112-A1", "VIERNES": "393316-A1" },
      "11:45-12:29": { "VIERNES": "393316-A1" }
    }
  },
  {
    "id": "9",
    "student": "GUTIERREZ HERNANDEZ LUZ ANGELA",
    "breakfastDays": [],
    "lunchDays": [],
    "subjects": {
      "225152-A": { "name": "HIDRÁULICA APLICADA", "professor": "TOMAS / MIGUEL", "aula": "AULA 458 / 010", "color": "bg-cyan-100 text-cyan-900 border-cyan-300" },
      "225153-B1": { "name": "TERMODINÁMICA", "professor": "JOSE FABIO MUÑOZ MANCERA", "aula": "AULA 017", "color": "bg-rose-100 text-rose-900 border-rose-300" },
      "225155-A": { "name": "MICROBIOLOGÍA AMBIENTAL", "professor": "EDWIN / KRISTEL", "aula": "AULA 1 / 018", "color": "bg-emerald-100 text-emerald-900 border-emerald-300" },
      "225161-B1": { "name": "HIDROLOGÍA", "professor": "JOSE MIGUEL FRAGOZO AREVALO", "aula": "AULA 020", "color": "bg-blue-100 text-blue-900 border-blue-300" },
      "225466-B1": { "name": "ANTROPOLOGÍA", "professor": "ILIA GOMEZ ARCHIBOLD", "aula": "AULA 011", "color": "bg-amber-100 text-amber-900 border-amber-300" },
      "225467-B1": { "name": "LEGISLACIÓN LABORAL", "professor": "LULIA PAULINA FUENTES SANCHEZ", "aula": "AULA 001", "color": "bg-orange-100 text-orange-900 border-orange-300" },
      "3105-D3": { "name": "INGLÉS V", "professor": "SARA MILENA TERAN GULLO", "aula": "AULA 010", "color": "bg-purple-100 text-purple-900 border-purple-300" }
    },
    "schedule": {
      "08:00-08:44": { "LUNES": "225155-A" },
      "08:45-09:29": { "LUNES": "225155-A" },
      "09:30-10:14": { "MIERCOLES": "225161-B1", "VIERNES": "225467-B1" },
      "10:15-10:59": { "MIERCOLES": "225161-B1", "VIERNES": "225467-B1" },
      "11:00-11:44": { "MIERCOLES": "225161-B1", "VIERNES": "225467-B1" },
      "11:45-12:29": { "MIERCOLES": "225161-B1" },
      "15:00-15:44": { "LUNES": "225466-B1", "MARTES": "225155-A", "JUEVES": "225155-A", "VIERNES": "225152-A" },
      "15:45-16:29": { "LUNES": "225466-B1", "MARTES": "225155-A", "JUEVES": "225155-A", "VIERNES": "225152-A" },
      "16:30-17:14": { "LUNES": "225466-B1", "JUEVES": "225153-B1" },
      "17:15-17:59": { "JUEVES": "225153-B1" },
      "18:00-18:44": { "MIERCOLES": "225152-A", "JUEVES": "225153-B1" },
      "18:45-19:29": { "MARTES": "3105-D3", "MIERCOLES": "225152-A", "JUEVES": "3105-D3" },
      "19:30-20:14": { "MARTES": "3105-D3", "JUEVES": "3105-D3" }
    }
  }
];
