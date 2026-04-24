// domain/entities/AgreementMaterial.ts
export class AgreementMaterial {
  constructor(
    public readonly agreement_id: number,
    public readonly material_id: number,
    public amount: number,
    public item_price: number | null,
  ) {}

  updateAmount(amount: number): void {
    if (amount <= 0) {
      throw new Error("Количество должно быть положительным");
    }
    this.amount = amount;
  }

  updateItemPrice(price: number | null): void {
    if (price !== null && price < 0) {
      throw new Error("Цена не может быть отрицательной");
    }
    this.item_price = price;
  }

  static create(params: {
    agreement_id: number;
    material_id: number;
    amount: number;
    item_price?: number | null;
  }): AgreementMaterial {
    return new AgreementMaterial(
      params.agreement_id,
      params.material_id,
      params.amount,
      params.item_price || null,
    );
  }

  toJSON() {
    return {
      agreement_id: this.agreement_id,
      material_id: this.material_id,
      amount: this.amount,
      item_price: this.item_price,
    };
  }
}
