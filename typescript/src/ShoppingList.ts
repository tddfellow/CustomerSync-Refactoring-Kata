export class ShoppingList {
  internalId: string | null = null;
  customerInternalId: string | null = null;
  readonly products: string[];

  constructor(...products: string[]) {
    this.products = products;
  }
}
