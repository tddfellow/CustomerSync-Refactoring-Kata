import {CustomerDataLayer} from "@/CustomerDataLayer";
import {Customer} from "@/Customer";
import {ShoppingList} from "@/ShoppingList";
import {Address} from "@/Address";
import {CustomerType} from "@/CustomerType";

interface CustomerRecord {
  externalId: string | null;
  masterExternalId: string | null;
  address: AddressRecord | null;
  preferredStore: string | null;
  internalId: string | null;
  name: string | null;
  customerType: CustomerType | null;
  companyNumber: string | null;
}

interface AddressRecord {
  street: string;
  city: string;
  postalCode: string;
}

interface ShoppingListRecord {
  internalId: string;
  customerId: string;
  products: string[];
}

export class FakeCustomerDataLayer implements CustomerDataLayer {
  private customerRecords: CustomerRecord[] = [];

  private shoppingLists: ShoppingListRecord[] = [];

  async createCustomerRecord(customer: Customer): Promise<Customer> {
    const record = this.toCustomerRecord(customer);
    this.customerRecords.push(record);

    for (const shoppingList of customer.shoppingLists) {
      this.createNewShoppingListRecord(record, shoppingList);
    }

    return this.loadCustomerEntity(record);
  }

  async findByCompanyNumber(companyNumber: string | null): Promise<Customer | null> {
    const found = this.customerRecords.find(record => record.companyNumber === companyNumber);
    if (!found) return null;

    return this.loadCustomerEntity(found);
  }

  async findByExternalId(externalId: string): Promise<Customer | null> {
    const found = this.customerRecords.find(record => record.externalId === externalId);
    if (!found) return null;

    return this.loadCustomerEntity(found);
  }

  async findByMasterExternalId(externalId: string): Promise<Customer | null> {
    const found = this.customerRecords.find(record => record.masterExternalId === externalId);
    if (!found) return null;

    return this.loadCustomerEntity(found);
  }

  async updateCustomerRecord(customer: Customer): Promise<Customer | null> {
    const found = this.customerRecords.find(record => record.internalId === customer.internalId);
    if (!found) return null;

    const update = this.toCustomerRecord(customer);

    Object.assign(found, update);

    return this.loadCustomerEntity(found);
  }

  async updateShoppingList(consumerShoppingList: ShoppingList): Promise<void> {
    const found = this.shoppingLists
      .find(record => record.internalId === consumerShoppingList.internalId);

    const customerRecord = this.customerRecords
      .find(record => record.internalId === consumerShoppingList.customerInternalId);
    if (!customerRecord) {
      throw new Error(`FakeCustomerDataLayer: expected to find customer record ${consumerShoppingList.customerInternalId} but didn't find it.`)
    }

    if (found) {
      this.updateShoppingListRecord(found, consumerShoppingList);
    } else {
      this.createNewShoppingListRecord(customerRecord, consumerShoppingList);
    }
  }

  private updateShoppingListRecord(record: ShoppingListRecord, shoppingList: ShoppingList) {
    record.customerId = shoppingList.customerInternalId!;
    record.products = shoppingList.products;
  }

  private createNewShoppingListRecord(customerRecord: CustomerRecord, shoppingList: ShoppingList) {
    shoppingList.internalId = this.shoppingLists.length.toString();
    const shoppingListRecord: ShoppingListRecord = {
      internalId: shoppingList.internalId,
      customerId: customerRecord.internalId!,
      products: shoppingList.products
    };
    shoppingList.customerInternalId = customerRecord.internalId;
    this.shoppingLists.push(shoppingListRecord);
  }

  private toCustomerRecord(customer: Customer) {
    return {
      address: this.clone(customer.address),
      companyNumber: customer.companyNumber,
      customerType: customer.customerType,
      externalId: customer.externalId,
      internalId: customer.internalId,
      masterExternalId: customer.masterExternalId,
      name: customer.name,
      preferredStore: customer.preferredStore
    };
  }

  private loadCustomerEntity(found) {
    const address = found.address
      ? new Address(found.address.street, found.address.city, found.address.postalCode)
      : null;

    const shoppingLists = this.shoppingLists
      .filter(record => record.customerId === found.internalId)
      .map(record => new ShoppingList(...record.products));

    return new Customer(
      found.externalId,
      found.masterExternalId,
      address,
      found.preferredStore,
      found.internalId,
      found.name,
      found.customerType,
      found.companyNumber,
      shoppingLists
    );
  }

  private clone(data: any) {
    return JSON.parse(JSON.stringify(data));
  }
}
