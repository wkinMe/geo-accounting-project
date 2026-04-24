// domain/entities/Agreement.ts
import { AgreementStatus, AGREEMENT_STATUS } from "@shared/constants";

export class Agreement {
  constructor(
    public readonly id: number | undefined,
    private _supplier_id: number,
    private _customer_id: number,
    private _supplier_warehouse_id: number,
    private _customer_warehouse_id: number,
    private _status: AgreementStatus,
    public readonly created_at: Date,
    public updated_at: Date,
  ) {}

  get supplier_id(): number {
    return this._supplier_id;
  }

  get customer_id(): number {
    return this._customer_id;
  }

  get supplier_warehouse_id(): number {
    return this._supplier_warehouse_id;
  }

  get customer_warehouse_id(): number {
    return this._customer_warehouse_id;
  }

  get status(): AgreementStatus {
    return this._status;
  }

  updateSupplier(supplier_id: number): void {
    if (supplier_id <= 0) {
      throw new Error("ID поставщика должен быть положительным числом");
    }
    this._supplier_id = supplier_id;
    this.updated_at = new Date();
  }

  updateCustomer(customer_id: number): void {
    if (customer_id <= 0) {
      throw new Error("ID покупателя должен быть положительным числом");
    }
    this._customer_id = customer_id;
    this.updated_at = new Date();
  }

  updateSupplierWarehouse(supplier_warehouse_id: number): void {
    if (supplier_warehouse_id <= 0) {
      throw new Error("ID склада поставщика должен быть положительным числом");
    }
    this._supplier_warehouse_id = supplier_warehouse_id;
    this.updated_at = new Date();
  }

  updateCustomerWarehouse(customer_warehouse_id: number): void {
    if (customer_warehouse_id <= 0) {
      throw new Error("ID склада покупателя должен быть положительным числом");
    }
    this._customer_warehouse_id = customer_warehouse_id;
    this.updated_at = new Date();
  }

  updateStatus(status: AgreementStatus): void {
    this._status = status;
    this.updated_at = new Date();
  }

  static create(params: {
    supplier_id: number;
    customer_id: number;
    supplier_warehouse_id: number;
    customer_warehouse_id: number;
    status?: AgreementStatus;
  }): Agreement {
    const now = new Date();
    return new Agreement(
      undefined,
      params.supplier_id,
      params.customer_id,
      params.supplier_warehouse_id,
      params.customer_warehouse_id,
      params.status || AGREEMENT_STATUS.DRAFT,
      now,
      now,
    );
  }

  toJSON() {
    return {
      id: this.id,
      supplier_id: this._supplier_id,
      customer_id: this._customer_id,
      supplier_warehouse_id: this._supplier_warehouse_id,
      customer_warehouse_id: this._customer_warehouse_id,
      status: this._status,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}
