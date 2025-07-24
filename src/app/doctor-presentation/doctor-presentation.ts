import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';

import { SafeHtmlPipe } from '../pipes/safe-html.pipe';
import { CommonModule } from '@angular/common';
import { AppointmentForm } from '../appointment-form/appointment-form';
import { AppointmentService } from '../services/appointment-service';
import { Appointment } from '../models/appointment.model';

@Component({
  selector: 'app-doctor-presentation',
  imports: [AppointmentForm, SafeHtmlPipe, CommonModule],
  templateUrl: './doctor-presentation.html',
  styleUrl: './doctor-presentation.scss',
  standalone: true,
})
export class DoctorPresentation implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('servicesSlider') servicesSlider!: ElementRef<HTMLDivElement>;
  @ViewChildren('.animate-on-scroll') animatedElements!: QueryList<ElementRef>;

  @ViewChild(AppointmentForm) appointmentFormComponent!: AppointmentForm;

  private observer!: IntersectionObserver;

  loadingAppointment: boolean = false;
  submitMessage: string | null = null;
  errorMessage: string | null = null;

  doctor = {
    name: 'Dr. Samuel Hernández Lomelí',
    profilePicture: 'assets/images/dr-samuel-hernandez.jpg',
    specialties: ['Ginecología y Obstetricia', 'Salud Reproductiva'],
    experience:
      'El Dr. Samuel Lomelí es un ginecólogo certificado con más de 20 años de experiencia, dedicada a la **salud integral de la mujer**. Su práctica se enfoca en el **cuidado preventivo**, el **manejo de embarazos** de bajo y alto riesgo, y el tratamiento de diversas condiciones ginecológicas. Comprometida con una atención empática y basada en la evidencia, el Dr. Samuel busca educar y empoderar a sus pacientes para que tomen decisiones informadas sobre su bienestar.',
    services: [
      {
        name: 'Consulta Ginecológica Integral',
        description:
          'Evaluación completa de la salud femenina, incluye historial clínico, exploración física y resolución de dudas.',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clipboard-list"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>',
      },
      {
        name: 'Control Prenatal y Embarazo de Alto Riesgo',
        description:
          'Seguimiento médico especializado desde la concepción hasta el parto, velando por la salud y bienestar de madre y bebé.',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart-pulse"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.2 12.8H6a2 2 0 0 0 2 2h3a2 2 0 0 0 2-2h7.8"/></svg>',
      },
      {
        name: 'Detección Oportuna de Cáncer (Papanicolaou)',
        description:
          'Estudios cruciales para la prevención y detección temprana de lesiones cervicales y otros padecimientos.',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
      },
      {
        name: 'Asesoría y Métodos Anticonceptivos',
        description:
          'Orientación personalizada sobre las opciones de planificación familiar más adecuadas para cada paciente.',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-check"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67 0C6.5 20.5 3 18 3 13V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="m9 12 2 2 4-4"/></svg>',
      },
      {
        name: 'Manejo de Menopausia y Climaterio',
        description:
          'Acompañamiento y tratamiento para los síntomas y cambios asociados a esta etapa de la vida de la mujer.',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sun"><circle cx="12" cy="12" r="8"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M4.93 4.93l1.41 1.41"/><path d="M17.66 17.66l1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M4.93 19.07l1.41-1.41"/><path d="M17.66 6.34l1.41-1.41"/></svg>',
      },
      {
        name: 'Cirugía Ginecológica',
        description:
          'Procedimientos quirúrgicos avanzados para el tratamiento de quistes, miomas, y otras condiciones con menor tiempo de recuperación.',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-activity"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
      },
    ],
    contactInfo: {
      phone: '+52 33 3333 3333',
      email: 'Consultorio.lomeli@gmail.com',
      address: 'Querétaro 26 sur centro',
      googleMapsLink:
        'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3712.0923781052247!2d-104.90621499717234!3d21.50410127754228!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x842736faefca6d13%3A0x424c43abe837e67!2sLoma%2042!5e0!3m2!1ses-419!2smx!4v1751754039995!5m2!1ses-419!2smx',
    },
  };

  carouselImages: string[] = [
    'assets/images/carrousele_1.jpeg',
    'assets/images/carrousele_2.jpeg',
    'assets/images/carrousele_3.jpeg',
    'assets/images/carrousele_4.jpeg',
    'assets/images/carrousele_5.jpeg',
  ];

  currentIndex: number = 0;
  private carouselInterval: any;

  constructor(private appointmentService: AppointmentService) {}

  ngOnInit(): void {
    this.startCarouselAutoPlay();
  }

  ngAfterViewInit(): void {
    this.initIntersectionObserver();
  }

  ngOnDestroy(): void {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  initIntersectionObserver(): void {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1,
    };

    this.observer = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, options);

    this.animatedElements.forEach((el) =>
      this.observer.observe(el.nativeElement)
    );
  }

  startCarouselAutoPlay(): void {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }
    this.carouselInterval = setInterval(() => {
      this.nextSlide();
    }, 3000);
  }

  nextSlide(): void {
    this.currentIndex = (this.currentIndex + 1) % this.carouselImages.length;
  }

  goToSlide(index: number): void {
    this.currentIndex = index;
    this.startCarouselAutoPlay();
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

  // --- NUEVO MÉTODO PARA MANEJAR EL ENVÍO DEL FORMULARIO DEL PACIENTE ---
  onFormSubmittedByPatient(event: { isValid: boolean; data: any }): void {
    this.submitMessage = null; // Limpia mensajes anteriores
    this.errorMessage = null; // Limpia mensajes anteriores

    if (!event.isValid) {
      this.errorMessage =
        'Por favor, completa todos los campos requeridos y corrige los errores.';
      return;
    }

    this.loadingAppointment = true;
    const formData: Appointment = event.data;

    this.appointmentService.createAppointment(formData).subscribe({
      next: (res) => {
        console.log('Cita agendada exitosamente (vista pública):', res);
        this.submitMessage =
          '¡Tu cita ha sido agendada exitosamente! Nos pondremos en contacto pronto.';
        this.loadingAppointment = false;
        if (this.appointmentFormComponent) {
          this.appointmentFormComponent.resetForm();
        }
        setTimeout(() => {
          this.submitMessage = null;
        }, 5000); // El mensaje desaparece después de 5 segundos
      },
      error: (err) => {
        console.error('Error al agendar la cita (vista pública):', err);
        if (err.error && err.error.message) {
          if (Array.isArray(err.error.message)) {
            this.errorMessage = err.error.message.join(', ');
          } else {
            this.errorMessage = err.error.message;
          }
        } else {
          this.errorMessage =
            'Hubo un error al agendar tu cita. Por favor, inténtalo de nuevo.';
        }
        this.loadingAppointment = false; // Desactiva el estado de carga
        setTimeout(() => {
          this.errorMessage = null;
        }, 8000);
      },
    });
  }
}
