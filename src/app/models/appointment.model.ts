export interface Appointment {
  _id: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  reason: string;
  preferredDateTime: Date; // Se recomienda que sea string (ISO) para consistencia con el backend, luego se convierte a Date en el componente si es necesario
  scheduledDateTime: Date; // Date se maneja como string ISO en la red, luego se convierte a Date en JS
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'; // Tipos específicos de estados
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentsResponse {
  data: Appointment[];
  total: number;
  page: number;
  limit: number;
}
