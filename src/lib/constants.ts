export const APP_NAME = "Mono Pardo - Gran Cierre de Campaña";

export const LOCALIDADES = [
  "Usaquén",
  "Chapinero",
  "Santa Fe",
  "San Cristóbal",
  "Usme",
  "Tunjuelito",
  "Bosa",
  "Kennedy",
  "Fontibón",
  "Engativá",
  "Suba",
  "Barrios Unidos",
  "Teusaquillo",
  "Los Mártires",
  "Antonio Nariño",
  "Puente Aranda",
  "La Candelaria",
  "Rafael Uribe Uribe",
  "Ciudad Bolívar",
  "Sumapaz",
] as const;

export enum Roles {
  ADMIN = "ADMIN",
  COLABORADOR = "COLABORADOR",
}

export enum EstadoGestion {
  NUEVO = "NUEVO",
  WHATSAPP_ENVIADO = "WHATSAPP_ENVIADO",
  LLAMADO = "LLAMADO",
  CONFIRMADO = "CONFIRMADO",
  NO_RESPONDE = "NO_RESPONDE",
  RECHAZA = "RECHAZA",
  NUMERO_INVALIDO = "NUMERO_INVALIDO",
  DUPLICADO = "DUPLICADO",
  PENDIENTE_SEGUIMIENTO = "PENDIENTE_SEGUIMIENTO",
}

export const ESTADO_COLORS: Record<EstadoGestion, string> = {
  [EstadoGestion.NUEVO]: "bg-blue-100 text-blue-800",
  [EstadoGestion.WHATSAPP_ENVIADO]: "bg-purple-100 text-purple-800",
  [EstadoGestion.LLAMADO]: "bg-yellow-100 text-yellow-800",
  [EstadoGestion.CONFIRMADO]: "bg-green-100 text-green-800",
  [EstadoGestion.NO_RESPONDE]: "bg-gray-100 text-gray-800",
  [EstadoGestion.RECHAZA]: "bg-red-100 text-red-800",
  [EstadoGestion.NUMERO_INVALIDO]: "bg-red-200 text-red-900",
  [EstadoGestion.DUPLICADO]: "bg-orange-100 text-orange-800",
  [EstadoGestion.PENDIENTE_SEGUIMIENTO]: "bg-indigo-100 text-indigo-800",
};

export enum TipoActividad {
  WHATSAPP = "WHATSAPP",
  LLAMADA = "LLAMADA",
  ESTADO = "ESTADO",
  NOTA = "NOTA",
  REASIGNACION = "REASIGNACION",
  CREACION = "CREACION",
  LOGIN = "LOGIN",
}

export const EVENTO_INFO = {
  fecha: "10 de febrero",
  hora: "5:00 pm",
  direccion: "Calle 63 # 36 26",
  lugar: "Auditorio El Pacto",
  motivo: "Gran cierre de campaña",
  convoca: "El Mono Pardo",
  candidatos: {
    senado: { nombre: "Horacio José Serpa", numero: "9" },
    camara: { nombre: "Bleidy Pérez", numero: "118" },
    presidencia: "Pipe Córdoba",
  },
};

export const PLANTILLA_WSP_DEFAULT = `Hola {NOMBRE}, te saluda el equipo del Mono Pardo. Queremos invitarte a nuestro Gran Cierre de Campaña este {FECHA_EVENTO} a las {HORA_EVENTO} en el {LUGAR_EVENTO} ({DIRECCION_EVENTO}). Apoyamos a Horacio José Serpa (Senado Liberal 9) y Bleidy Pérez (Cámara Liberal 118). a la presidencia Pipe Cordoba ¡Contamos contigo!`;

export const GUION_LLAMADA_DEFAULT = `Hola, hablo con {NOMBRE}?
Te llamamos del equipo del Mono Pardo. Queremos invitarte personalmente al Gran Cierre de Campaña.
Es este 10 de febrero a las 5pm en el Auditorio El Pacto (Calle 63 # 36 26).
Estaremos con Horacio José Serpa y Bleidy Pérez.
¿Podemos contar con tu asistencia?`;
