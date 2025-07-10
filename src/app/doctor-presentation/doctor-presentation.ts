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
      },
      {
        name: 'Control Prenatal y Embarazo',
        description:
          'Seguimiento médico especializado desde la concepción hasta el parto, garantizando la salud de madre y bebé.',
      },
      {
        name: 'Detección Oportuna de Cáncer (Papanicolaou y Colposcopia)',
        description:
          'Estudios cruciales para la prevención y detección temprana de lesiones cervicales y otros padecimientos.',
      },
      {
        name: 'Asesoría y Métodos Anticonceptivos',
        description:
          'Orientación personalizada sobre las opciones de planificación familiar más adecuadas para cada paciente.',
      },
      {
        name: 'Manejo de Menopausia y Climaterio',
        description:
          'Acompañamiento y tratamiento para los síntomas y cambios asociados a esta etapa de la vida de la mujer.',
      },
      {
        name: 'Cirugía Ginecológica (mínimamente invasiva)',
        description:
          'Procedimientos quirúrgicos avanzados para el tratamiento de quistes, miomas, y otras condiciones con menor tiempo de recuperación.',
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


