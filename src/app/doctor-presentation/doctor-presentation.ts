import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';

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
export class DoctorPresentation implements AfterViewInit {
  @ViewChild('servicesSlider') servicesSlider!: ElementRef<HTMLDivElement>;


  doctor = {
    name: 'Dr. Samuel Hernández Lomelí',
    specialties: ['Ginecología y Obstetricia', 'Salud Reproductiva'],
    experience: 'El Dr. Samuel Lomelí es una ginecólogo certificado con más de 30 años de experiencia, dedicada a la **salud integral de la mujer**. Su práctica se enfoca en el **cuidado preventivo**, el **manejo de embarazos** de bajo y alto riesgo, y el tratamiento de diversas condiciones ginecológicas. Comprometida con una atención empática y basada en la evidencia, el Dr. Samuel busca educar y empoderar a sus pacientes para que tomen decisiones informadas sobre su bienestar.',
    services: [
      {
        name: 'Consulta Ginecológica Integral',
        description:
          'Evaluación completa de la salud femenina, incluye historial clínico, exploración física y resolución de dudas.',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-stethoscope"><path d="M7.9 11.9 4 16l4 4 4-4"/><path d="m17 12-4 4 4 4 4-4"/><path d="M12 14v7"/><path d="M12 12V3"/><path d="M12 3a2 2 0 0 1 2 2v10"/><path d="M12 3a2 2 0 0 0-2 2v10"/></svg>'
      },
      {
        name: 'Control Prenatal y Embarazo',
        description:
          'Seguimiento médico especializado desde la concepción hasta el parto, garantizando la salud de madre y bebé.',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-baby"><path d="M9 12H7a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-2"/><path d="M12 2v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7c0-2.2 1.8-4 4-4h2c2.2 0 4 1.8 4 4v3h-2"/><path d="M15 22v-3"/><path d="M9 22v-3"/></svg>'
      },
      {
        name: 'Detección Oportuna de Cáncer (Papanicolaou y Colposcopia)',
        description:
          'Estudios cruciales para la prevención y detección temprana de lesiones cervicales y otros padecimientos.',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-microscope"><path d="M6 18h4"/><path d="M14 18h4"/><path d="M17 14h-4"/><path d="M10 14h-4"/><path d="M13 22V2l6 6-6 6"/><path d="M19 12v6"/><path d="M12 6H4"/></svg>'
      },
      {
        name: 'Asesoría y Métodos Anticonceptivos',
        description:
          'Orientación personalizada sobre las opciones de planificación familiar más adecuadas para cada paciente.',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pill"><path d="m10.5 20.5 9-9a4.24 4.24 0 0 0-6-6l-9 9a4.24 4.24 0 0 0 6 6Z"/><path d="m8 14 6-6"/></svg>'
      },
      {
        name: 'Manejo de Menopausia y Climaterio',
        description:
          'Acompañamiento y tratamiento para los síntomas y cambios asociados a esta etapa de la vida de la mujer.',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-thermometer"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/></svg>'
      },
      {
        name: 'Cirugía Ginecológica (mínimamente invasiva)',
        description:
          'Procedimientos quirúrgicos avanzados para el tratamiento de quistes, miomas, y otras condiciones con menor tiempo de recuperación.',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-scalpel"><path d="M12 2L2 12l10 10 10-10L12 2z"/><path d="M12 6l-4 4"/><path d="M16 10l-4 4"/></svg>'
      },
    ],
    contactInfo: {
      phone: '+52 33 1234 5678',
      email: 'ana.garcia@consultorio.com',
      address: 'Av. Siempre Viva #123, Col. Centro, Guadalajara, Jalisco, México',
      googleMapsLink: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3712.0923781052247!2d-104.90621499717234!3d21.50410127754228!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x842736faefca6d13%3A0x424c43abe837e67!2sLoma%2042!5e0!3m2!1ses-419!2smx!4v1751754039995!5m2!1ses-419!2smx'
    }
  };

  ngAfterViewInit(): void {

  }

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

  scrollServices(direction: 'left' | 'right'): void {
    const slider = this.servicesSlider.nativeElement;
    const scrollAmount = slider.clientWidth / 2;
    if (direction === 'left') {
      slider.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      slider.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }

}


