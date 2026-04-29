// domain/entities/InventoryItem.ts
export class InventoryItem {
  constructor(
    public readonly id: number | undefined,
    public readonly warehouse_id: number,
    public readonly material_id: number,
    public amount: number,
    public readonly created_at: Date,
    public updated_at: Date,
  ) {}

  addAmount(value: number): void {
    if (value <= 0) {
      throw new Error("Количество для добавления должно быть положительным");
    }
    this.amount += value;
    this.updated_at = new Date();
  }

  subtractAmount(value: number): void {
    if (value <= 0) {
      throw new Error("Количество для списания должно быть положительным");
    }
    if (this.amount < value) {
      throw new Error(
        `Недостаточно материала. Доступно: ${this.amount}, требуется: ${value}`,
      );
    }
    this.amount -= value;
    this.updated_at = new Date();
  }

  setAmount(newAmount: number): void {
    if (newAmount < 0) {
      throw new Error("Количество не может быть отрицательным");
    }
    this.amount = newAmount;
    this.updated_at = new Date();
  }

  static create(
    warehouse_id: number,
    material_id: number,
    amount: number,
  ): InventoryItem {
    const now = new Date();
    return new InventoryItem(
      undefined,
      warehouse_id,
      material_id,
      amount,
      now,
      now,
    );
  }

  toJSON() {
    return {
      id: this.id,
      warehouse_id: this.warehouse_id,
      material_id: this.material_id,
      amount: this.amount,
      created_at: this.created_at.toISOString(),
      updated_at: this.updated_at.toISOString(),
    };
  }
}
