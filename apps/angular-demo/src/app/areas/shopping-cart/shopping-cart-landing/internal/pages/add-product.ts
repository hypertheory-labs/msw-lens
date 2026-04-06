import { Component, inject, signal } from '@angular/core';
import { PageLayout } from '@ht/shared/ui-common/layouts/page';
import { ProductCreateModel, productStore } from '../../data/product-store';
import { form, required, validate, FormRoot, FormField } from '@angular/forms/signals';

@Component({
  selector: 'app-shopping-cart-pages-add-product',
  imports: [PageLayout, FormRoot, FormField],
  template: `<app-ui-page title="Add A Product">
    <p>We Have {{ store.entities().length }} products in our store.</p>
    <form [formRoot]="form">
      <div class="form-control p-4 ">
        <label class="label validator" for="name"
          ><span class="label-text font-medium">Name</span></label
        >
        <input
          class="input input-sm "
          [class.input-error]="
            form.name().invalid() && (form.name().dirty() || form.name().touched())
          "
          [formField]="form.name"
          id="name"
          type="text"
        />
        @if (form.name().invalid() && (form.name().dirty() || form.name().touched())) {
          @for (e of form.name().errors(); track e) {
            <p class="text-sm text-error ml-24 pt-4">{{ e.message }}</p>
          }
        }
      </div>
      <div class="form-control p-4 ">
        <label class="label validator" for="description"
          ><span class="label-text font-medium">Description</span></label
        >
        <input
          class="input input-sm "
          [class.input-error]="
            form.description().invalid() &&
            (form.description().dirty() || form.description().touched())
          "
          [formField]="form.description"
          id="description"
          type="text"
        />
        @if (
          form.description().invalid() &&
          (form.description().dirty() || form.description().touched())
        ) {
          @for (e of form.description().errors(); track e) {
            <p class="text-sm text-error ml-24 pt-4">{{ e.message }}</p>
          }
        }
      </div>
      <div class="form-control p-4 ">
        <label class="label validator" for="price"
          ><span class="label-text font-medium">Price</span></label
        >
        <input
          class="input input-sm "
          [class.input-error]="
            form.price().invalid() && (form.price().dirty() || form.price().touched())
          "
          [formField]="form.price"
          id="price"
          type="number"
        />
        @if (form.price().invalid() && (form.price().dirty() || form.price().touched())) {
          @for (e of form.price().errors(); track e) {
            <p class="text-sm text-error ml-24 pt-4">{{ e.message }}</p>
          }
        }
      </div>
      <div class="form-control p-4 ">
        <label class="label validator" for="cost"
          ><span class="label-text font-medium">Cost</span></label
        >
        <input
          class="input input-sm "
          [class.input-error]="
            form.cost().invalid() && (form.cost().dirty() || form.cost().touched())
          "
          [formField]="form.cost"
          id="cost"
          type="number"
        />
        @if (form.cost().invalid() && (form.cost().dirty() || form.cost().touched())) {
          @for (e of form.cost().errors(); track e) {
            <p class="text-sm text-error ml-24 pt-4">{{ e.message }}</p>
          }
        }
      </div>
      <button class="btn btn-primary m-4" type="submit">Create Product</button>
    </form>
  </app-ui-page>`,
  styles: `
    .form-control {
      label {
        padding-right: 2rem;
      }
    }
  `,
})
export class AddProductPage {
  protected readonly store = inject(productStore);
  model = signal<ProductCreateModel>({
    name: '',
    description: '',
    price: 0,
    cost: 0,
  });
  form = form(
    this.model,
    (m) => {
      required(m.name);
      required(m.description);
      validate(m.price, ({ value, valueOf }) => {
        const price = value();
        const cost = valueOf(m.cost);

        if (price < cost)
          return {
            kind: 'priceTooLow',
            message: 'Price must be greater than cost',
          };
        return null;
      });
    },
    {
      submission: {
        action: async (form) => {
          await this.store.createProduct(form().value());
          form().reset();
        },
        onInvalid: (form) => {
          form().errorSummary()[0]?.fieldTree().focusBoundControl();
        },
      },
    },
  );
}
