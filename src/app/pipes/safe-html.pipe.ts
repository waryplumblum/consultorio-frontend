import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml, SafeResourceUrl, SafeScript, SafeStyle, SafeUrl } from '@angular/platform-browser';

@Pipe({
  name: 'safeHtml',
  standalone: true 
})
export class SafeHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  /**
   * Transforma un valor en un tipo seguro de Angular para evitar problemas de seguridad.
   * @param value El valor a sanitizar.
   * @param type El tipo de valor seguro ('html', 'style', 'script', 'url', 'resourceUrl').
   * @returns El valor sanitizado como un tipo seguro de Angular.
   */
  transform(value: string, type: string = 'html'): SafeHtml | SafeResourceUrl | SafeScript | SafeStyle | SafeUrl {
    switch (type) {
      case 'html': return this.sanitizer.bypassSecurityTrustHtml(value);
      case 'style': return this.sanitizer.bypassSecurityTrustStyle(value);
      case 'script': return this.sanitizer.bypassSecurityTrustScript(value);
      case 'url': return this.sanitizer.bypassSecurityTrustUrl(value);
      case 'resourceUrl': return this.sanitizer.bypassSecurityTrustResourceUrl(value);
      default: throw new Error(`Tipo de seguridad inválido especificado: ${type}`);
    }
  }
}
