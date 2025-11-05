import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'sanitize'
})
export class SanitizePipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}
  transform(value: string): SafeHtml {
    if (!value) return '';
    // replace newlines with <br> and escape HTML special chars
    const esc = (str: string) => str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const withBr = esc(value).replace(/\r?\n/g, '<br>');
    return this.sanitizer.bypassSecurityTrustHtml(withBr);
  }
}
