import { Directive, HostListener, ElementRef, Input } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appPhoneNumberFormatter]',
  standalone: true,
})
export class PhoneNumberFormatterDirective {
  private _lastValue: string = ''; // Para almacenar el valor sin formato

  constructor(private el: ElementRef, private ngControl: NgControl) {}

  // Escucha el evento 'input' para formatear a medida que el usuario escribe
  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const inputElement = this.el.nativeElement as HTMLInputElement;
    let formattedValue = this.formatPhoneNumber(inputElement.value);

    // Actualiza el valor mostrado en el input
    inputElement.value = formattedValue;

    // Obtiene el valor solo numérico
    const numericValue = formattedValue.replace(/[^0-9]/g, '');

    // Si el valor numérico cambió, actualiza el FormControl
    // Esto es crucial para que el modelo subyacente tenga solo números
    if (
      this.ngControl.control &&
      this.ngControl.control.value !== numericValue
    ) {
      this.ngControl.control.setValue(numericValue, { emitEvent: false }); // No emitir evento para evitar bucle infinito
    }
  }

  // Escucha el evento 'focus' para mostrar solo números al editar
  @HostListener('focus', ['$event'])
  onFocus(event: Event): void {
    const inputElement = this.el.nativeElement as HTMLInputElement;
    const currentNumericValue = inputElement.value.replace(/[^0-9]/g, '');
    inputElement.value = currentNumericValue; // Muestra solo los números
  }

  // Escucha el evento 'blur' para formatear con guiones al salir del campo
  @HostListener('blur', ['$event'])
  onBlur(event: Event): void {
    const inputElement = this.el.nativeElement as HTMLInputElement;
    const currentNumericValue = inputElement.value.replace(/[^0-9]/g, ''); // Obtener el valor numérico actual
    inputElement.value = this.formatPhoneNumber(currentNumericValue); // Volver a formatear con guiones
  }

  // Función de formateo centralizada
  private formatPhoneNumber(value: string): string {
    if (!value) {
      return '';
    }
    // Eliminar cualquier cosa que no sea un dígito
    const numericValue = value.replace(/[^0-9]/g, '');

    // Aplicar el formato XXX-XXX-XXXX
    const match = numericValue.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
    // Si no coincide con el patrón completo, devolver el valor numérico sin formato de guiones.
    // Esto es útil si el usuario está escribiendo y aún no ha completado los 10 dígitos.
    return numericValue;
  }
}
