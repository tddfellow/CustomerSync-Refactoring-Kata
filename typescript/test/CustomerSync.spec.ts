import {ExternalCustomer} from "@/ExternalCustomer";
import {Address} from "@/Address";
import {ShoppingList} from "@/ShoppingList";
import {Customer} from "@/Customer";
import {CustomerType} from "@/CustomerType";
import {expect} from 'chai';
import {CustomerDataLayer} from "@/CustomerDataLayer";
import {CustomerSync} from "@/CustomerSync";
import {FakeCustomerDataLayer} from "./support/FakeCustomerDataLayer";

const approvals = require("approvals");
approvals.configure({
  errorOnStaleApprovedFiles: false
});
approvals.mocha();

describe("CustomerSync", () => {
  it("syncs company by external id", async () => {
    // ARRANGE
    const externalId = "12345";

    const externalCustomer = createExternalCompany();
    externalCustomer.externalId = externalId;

    const customer = createCustomerWithSameCompanyAs(externalCustomer);
    customer.externalId = externalId;

    const db: CustomerDataLayer = new FakeCustomerDataLayer();
    await db.createCustomerRecord(customer);
    const sut = CustomerSync.fromDataLayer(db);

    // ACT
    const created = await sut.syncWithDataLayer(externalCustomer);

    // ASSERT
    expect(created).to.eql(false);
    const updatedCustomer = (await db.findByExternalId(externalId))!;
    expect(updatedCustomer).to.exist;
    expect(updatedCustomer.name).to.eql(externalCustomer.name);
    expect(updatedCustomer.externalId).to.eql(externalCustomer.externalId);
    expect(updatedCustomer.masterExternalId).to.eql(null);
    expect(updatedCustomer.companyNumber).to.eql(externalCustomer.companyNumber);
    expect(updatedCustomer.address).to.eql(externalCustomer.postalAddress);
    expect(updatedCustomer.shoppingLists.map(l => l.products))
      .to.eql(externalCustomer.shoppingLists.map(l => l.products));
    expect(updatedCustomer.customerType).to.eql(CustomerType.COMPANY);
    expect(updatedCustomer.preferredStore).to.eql(null);
  });

  const createExternalCompany = () =>
    new ExternalCustomer(
      new Address("123 main st", "Helingborg", "SE-123 45"),
      "Acme Inc.",
      null,
      [new ShoppingList("lipstick", "blusher")],
      "12345",
      "470813-8895"
    )

  const createCustomerWithSameCompanyAs = (externalCustomer: ExternalCustomer) => {
    const customer = new Customer(null, null);
    customer.companyNumber = externalCustomer.companyNumber;
    customer.customerType = CustomerType.COMPANY;
    customer.internalId = "45435";
    return customer;
  }
});
