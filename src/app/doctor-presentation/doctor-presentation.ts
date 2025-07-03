import { Component } from '@angular/core';

import { SafeHtmlPipe } from '../pipes/safe-html.pipe';
import { CommonModule } from '@angular/common';
import { AppointmentForm } from '../appointment-form/appointment-form';

@Component({
  selector: 'app-doctor-presentation',
  imports: [AppointmentForm, SafeHtmlPipe, CommonModule,  ],
  templateUrl: './doctor-presentation.html',
  styleUrl: './doctor-presentation.scss',
  standalone: true,
})
export class DoctorPresentation {

  doctor = {
    name: 'Dra. Ana García',
    specialties: ['Cardiología', 'Medicina General'],
    experience: 'La Dra. Ana García cuenta con más de 15 años de experiencia en el campo de la cardiología y la medicina general. Ha dedicado su carrera a brindar atención de calidad, enfocándose en la prevención y el tratamiento integral de enfermedades cardiovasculares y crónicas. Su compromiso con el bienestar de sus pacientes la impulsa a mantenerse actualizada con los últimos avances médicos.',
    services: [
      { name: 'Consulta General', description: 'Revisión médica completa y diagnóstico de diversas afecciones.' },
      { name: 'Electrocardiograma', description: 'Estudio no invasivo para evaluar la actividad eléctrica del corazón.' },
      { name: 'Control de Presión Arterial', description: 'Seguimiento y manejo de pacientes con hipertensión.' },
      { name: 'Chequeo Cardiovascular Preventivo', description: 'Evaluación de riesgos y recomendaciones para la salud del corazón.' }
    ],
    contactInfo: {
      phone: '+52 33 1234 5678',
      email: 'ana.garcia@consultorio.com',
      address: 'Av. Siempre Viva #123, Col. Centro, Guadalajara, Jalisco, México',
      googleMapsLink: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3733.0039243048995!2d-103.34918738507346!3d20.6729999861614!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8428b1e4f4a3a6b5%3A0x6a0a2a0a2a0a2a0a!2sAv.%20Siempre%20Viva%20123!5e0!3m2!1ses-419!2smx!4v1678901234567!5m2!1ses-419!2smx' // Ejemplo de embed map
    }
  };

}
