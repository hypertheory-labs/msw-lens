import { Component, input, model } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormValueControl } from '@angular/forms/signals';

/**
 * A reusable form input component that works with Angular Signal Forms.
 *
 * @example
 * ```html
 * <app-ui-form-input
 *   label="First Name"
 *   [control]="firstNameControl"
 *   placeholder="Enter your first name"
 *   type="text"
 * />
 * ```
 */
@Component({
  selector: 'app-ui-form-input',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  template: `
    <div class="form-control">
      @if (label()) {
        <label class="label" [for]="id()">
          <span class="label-text font-medium">{{ label() }}</span>
        </label>
      }
      <input
        [value]="value()"
        (input)="onChange($any($event.target).value)"
        (focusin)="touched.set(true)"
        type="text"
        [id]="id()"
        [placeholder]="placeholder()"
        [autocomplete]="autocomplete()"
        [disabled]="disabled()"
        [readonly]="readonly()"
        [hidden]="hidden()"
        [required]="required()"
        [class.input-error]="invalid() && (dirty() || touched())"
        [class.input-success]="!invalid() && (dirty() || touched())"
        class="input input-bordered w-full"
      />
      @if (hint()) {
        <label class="label">
          <span class="label-text-alt">{{ hint() }}</span>
        </label>
      }
    </div>
  `,
  host: {
    class: ' w-full',
  },
})
export class FormInputComponent implements FormValueControl<string> {
  // Input properties
  id = input.required<string>();
  value = model<string>('');
  label = input<string>('');
  placeholder = input<string>('');
  touched = model<boolean>(false);
  dirty = model<boolean>(false);
  invalid = input<boolean>(false);
  type = input<'text' | 'email' | 'password' | 'number' | 'tel' | 'url'>('text');
  onChange(value: string): void {
    this.value.set(value);
    this.touched.set(true);
    console.log('blurry');
  }
  autocomplete = input<string>('');
  hint = input<string>('');
  containerClass = input<string>('');

  disabled = input<boolean>(false);
  required = input<boolean>(false);
  readonly = input<boolean>(false);
  hidden = input<boolean>(false);
}
