import { Component } from '@angular/core';

import { SafeHtmlPipe } from '../pipes/safe-html.pipe';
import { CommonModule } from '@angular/common';
import { AppointmentForm } from '../appointment-form/appointment-form';

@Component({
  selector: 'app-doctor-presentation',
  imports: [AppointmentForm, SafeHtmlPipe, CommonModule,],
  templateUrl: './doctor-presentation.html',
  styleUrl: './doctor-presentation.scss',
  standalone: true,
})
export class DoctorPresentation {

  doctor = {
    name: 'Dra. Samuel Hernández Lomelí',
    specialties: ['Ginecología', 'Medicina General'],
    experience: 'El Dr. Samuel Lomelí cuenta con más de 15 años de experiencia en el campo de la ginecología y la medicina general. Ha dedicado su carrera a brindar atención de calidad, enfocándose en la prevención y el tratamiento integral de enfermedades cardiovasculares y crónicas. Su compromiso con el bienestar de sus pacientes la impulsa a mantenerse actualizada con los últimos avances médicos.',
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
      googleMapsLink: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3712.0923781052247!2d-104.90621499717234!3d21.50410127754228!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x842736faefca6d13%3A0x424c43abe837e67!2sLoma%2042!5e0!3m2!1ses-419!2smx!4v1751754039995!5m2!1ses-419!2smx'
    }
  };

  scrollToAppointmentForm(): void {
    const element = document.getElementById('appointment-form-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => {
        const firstInput = element.querySelector('input, select, textarea');
        if (firstInput) {
          (firstInput as HTMLElement).focus();
        }
      }, 300);
    }
  }

}


