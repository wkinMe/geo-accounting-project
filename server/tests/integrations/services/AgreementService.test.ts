// tests/integrations/AgreementService.test.ts
import { AgreementService } from "../../../src/services/AgreementService";
import { AgreementRepository } from "../../../src/repositories/AgreementRepository";
import { AgreementMaterialRepository } from "../../../src/repositories/AgreementMaterialRepository";
import { UserRepository } from "../../../src/repositories/UserRepository";
import { WarehouseRepository } from "../../../src/repositories/WarehouseRepository";
import { MaterialRepository } from "../../../src/repositories/MaterialRepository";
import { InventoryService } from "../../../src/services/InventoryService";
import { WarehouseHistoryService } from "../../../src/services/WarehouseHistoryService";
import { InventoryRepository } from "../../../src/repositories/InventoryRepository";
import { WarehouseHistoryRepository } from "../../../src/repositories/WarehouseHistoryRepository";
import { OrganizationRepository } from "../../../src/repositories/OrganizationRepository";
import { testPool } from "../../../src/db";
import { AGREEMENT_STATUS } from "@shared/constants";
import { User } from "../../../src/domain/entities/User";
import { Warehouse } from "../../../src/domain/entities/Warehouse";
import { Material } from "../../../src/domain/entities/Material";
import { InventoryItem } from "../../../src/domain/entities/InventoryItem";
import { Organization } from "../../../src/domain/entities/Organization";

describe("AgreementService Integration Tests", () => {
  let agreementService: AgreementService;
  let agreementRepo: AgreementRepository;
  let agreementMaterialRepo: AgreementMaterialRepository;
  let userRepo: UserRepository;
  let warehouseRepo: WarehouseRepository;
  let materialRepo: MaterialRepository;
  let inventoryRepo: InventoryRepository;
  let historyRepo: WarehouseHistoryRepository;
  let organizationRepo: OrganizationRepository;
  let testOrganizationId: number;
  let testSupplierId: number;
  let testCustomerId: number;
  let testSupplierWarehouseId: number;
  let testCustomerWarehouseId: number;
  let testMaterialId: number;

  beforeAll(async () => {
    agreementRepo = new AgreementRepository(testPool);
    agreementMaterialRepo = new AgreementMaterialRepository(testPool);
    userRepo = new UserRepository(testPool);
    warehouseRepo = new WarehouseRepository(testPool);
    materialRepo = new MaterialRepository(testPool);
    inventoryRepo = new InventoryRepository(testPool);
    historyRepo = new WarehouseHistoryRepository(testPool);
    organizationRepo = new OrganizationRepository(testPool);

    const historyService = new WarehouseHistoryService(
      historyRepo,
      warehouseRepo,
      materialRepo,
    );
    const inventoryService = new InventoryService(
      inventoryRepo,
      warehouseRepo,
      materialRepo,
      historyService,
    );

    agreementService = new AgreementService(
      agreementRepo,
      agreementMaterialRepo,
      userRepo,
      warehouseRepo,
      materialRepo,
      inventoryService,
      historyService,
    );

    const org = Organization.create(
      "Тестовая организация для договоров",
      52.4345,
      30.95,
    );
    const savedOrg = await organizationRepo.save(org);
    testOrganizationId = savedOrg.id!;

    const supplier = User.create(
      "supplier_test",
      "hashed",
      "user",
      testOrganizationId,
    );
    const customer = User.create(
      "customer_test",
      "hashed",
      "user",
      testOrganizationId,
    );
    const savedSupplier = await userRepo.save(supplier);
    const savedCustomer = await userRepo.save(customer);
    testSupplierId = savedSupplier.id!;
    testCustomerId = savedCustomer.id!;

    const supplierWarehouse = Warehouse.create(
      "supplier_wh",
      testOrganizationId,
      52.0,
      31.0,
    );
    const customerWarehouse = Warehouse.create(
      "customer_wh",
      testOrganizationId,
      52.1,
      31.1,
    );
    const savedSupplierWh = await warehouseRepo.save(supplierWarehouse);
    const savedCustomerWh = await warehouseRepo.save(customerWarehouse);
    testSupplierWarehouseId = savedSupplierWh.id!;
    testCustomerWarehouseId = savedCustomerWh.id!;

    const material = Material.create("test_material", "шт");
    const savedMaterial = await materialRepo.save(material);
    testMaterialId = savedMaterial.id!;

    await inventoryRepo.save(
      InventoryItem.create(testSupplierWarehouseId, testMaterialId, 100),
    );
  });

  afterAll(async () => {
    await testPool.query("DELETE FROM warehouse_material_history CASCADE");
    await testPool.query("DELETE FROM agreement_material CASCADE");
    await testPool.query("DELETE FROM warehouse_material CASCADE");
    await testPool.query("DELETE FROM agreements CASCADE");
    await testPool.query("DELETE FROM materials CASCADE");
    await testPool.query("DELETE FROM warehouses CASCADE");
    await testPool.query("DELETE FROM app_users CASCADE");
    await testPool.query("DELETE FROM organizations CASCADE");
    await testPool.end();
  });

  test("создание договора в статусе DRAFT", async () => {
    const result = await agreementService.create({
      supplier_id: testSupplierId,
      customer_id: testCustomerId,
      supplier_warehouse_id: testSupplierWarehouseId,
      customer_warehouse_id: testCustomerWarehouseId,
      materials: [{ material_id: testMaterialId, amount: 10, item_price: 100 }],
    });
    expect(result.status).toBe(AGREEMENT_STATUS.DRAFT);
    expect(result.id).toBeDefined();
  });

  test("создание договора с несуществующим поставщиком вызывает ошибку", async () => {
    await expect(
      agreementService.create({
        supplier_id: 99999,
        customer_id: testCustomerId,
        supplier_warehouse_id: testSupplierWarehouseId,
        customer_warehouse_id: testCustomerWarehouseId,
      }),
    ).rejects.toThrow("Пользователь с ID 99999 не найден");
  });

  test("создание договора с одинаковыми складами вызывает ошибку", async () => {
    await expect(
      agreementService.create({
        supplier_id: testSupplierId,
        customer_id: testCustomerId,
        supplier_warehouse_id: testSupplierWarehouseId,
        customer_warehouse_id: testSupplierWarehouseId,
      }),
    ).rejects.toThrow(
      "Склад поставщика и склад покупателя не могут быть одинаковыми",
    );
  });

  test("создание договора с отрицательным количеством материала вызывает ошибку", async () => {
    await expect(
      agreementService.create({
        supplier_id: testSupplierId,
        customer_id: testCustomerId,
        supplier_warehouse_id: testSupplierWarehouseId,
        customer_warehouse_id: testCustomerWarehouseId,
        materials: [
          { material_id: testMaterialId, amount: -5, item_price: 100 },
        ],
      }),
    ).rejects.toThrow("Количество материала должно быть положительным");
  });

  test("активация договора списывает товары со склада поставщика", async () => {
    const beforeStock = await inventoryRepo.findByWarehouseAndMaterial(
      testSupplierWarehouseId,
      testMaterialId,
    );
    const beforeAmount = beforeStock?.amount || 0;

    const agreement = await agreementService.create({
      supplier_id: testSupplierId,
      customer_id: testCustomerId,
      supplier_warehouse_id: testSupplierWarehouseId,
      customer_warehouse_id: testCustomerWarehouseId,
      materials: [{ material_id: testMaterialId, amount: 20, item_price: 100 }],
      status: AGREEMENT_STATUS.ACTIVE,
    });

    const afterStock = await inventoryRepo.findByWarehouseAndMaterial(
      testSupplierWarehouseId,
      testMaterialId,
    );
    expect(afterStock?.amount).toBe(beforeAmount - 20);
    expect(agreement.status).toBe(AGREEMENT_STATUS.ACTIVE);
  });

  test("активация договора при недостатке товаров вызывает ошибку", async () => {
    await expect(
      agreementService.create({
        supplier_id: testSupplierId,
        customer_id: testCustomerId,
        supplier_warehouse_id: testSupplierWarehouseId,
        customer_warehouse_id: testCustomerWarehouseId,
        materials: [
          { material_id: testMaterialId, amount: 200, item_price: 100 },
        ],
        status: AGREEMENT_STATUS.ACTIVE,
      }),
    ).rejects.toThrow("Недостаточно материала");
  });

  test("завершение договора зачисляет товары на склад покупателя", async () => {
    const beforeCustomerStock = await inventoryRepo.findByWarehouseAndMaterial(
      testCustomerWarehouseId,
      testMaterialId,
    );
    const beforeAmount = beforeCustomerStock?.amount || 0;

    const agreement = await agreementService.create({
      supplier_id: testSupplierId,
      customer_id: testCustomerId,
      supplier_warehouse_id: testSupplierWarehouseId,
      customer_warehouse_id: testCustomerWarehouseId,
      materials: [{ material_id: testMaterialId, amount: 15, item_price: 100 }],
      status: AGREEMENT_STATUS.COMPLETED,
    });

    const afterStock = await inventoryRepo.findByWarehouseAndMaterial(
      testCustomerWarehouseId,
      testMaterialId,
    );
    expect(afterStock?.amount).toBe(beforeAmount + 15);
  });

  test("отмена активного договора возвращает товары поставщику", async () => {
    const beforeAllStock = await inventoryRepo.findByWarehouseAndMaterial(
      testSupplierWarehouseId,
      testMaterialId,
    );
    const beforeAmount = beforeAllStock?.amount || 0;

    const agreement = await agreementService.create({
      supplier_id: testSupplierId,
      customer_id: testCustomerId,
      supplier_warehouse_id: testSupplierWarehouseId,
      customer_warehouse_id: testCustomerWarehouseId,
      materials: [{ material_id: testMaterialId, amount: 10, item_price: 100 }],
      status: AGREEMENT_STATUS.PENDING,
    });

    await agreementService.update({
      id: agreement.id,
      status: AGREEMENT_STATUS.CANCELLED,
    });

    const afterRollback = await inventoryRepo.findByWarehouseAndMaterial(
      testSupplierWarehouseId,
      testMaterialId,
    );

    expect(afterRollback?.amount).toBe(beforeAmount);
  });

  test("поиск договора по ID возвращает корректные данные", async () => {
    const created = await agreementService.create({
      supplier_id: testSupplierId,
      customer_id: testCustomerId,
      supplier_warehouse_id: testSupplierWarehouseId,
      customer_warehouse_id: testCustomerWarehouseId,
    });
    const found = await agreementService.findByIdWithDetails(created.id!);
    expect(found).not.toBeNull();
    expect(found.id).toBe(created.id);
  });

  test("поиск несуществующего договора вызывает ошибку", async () => {
    await expect(agreementService.findById(99999)).rejects.toThrow(
      "Договор с ID 99999 не найден",
    );
  });

  test("удаление договора удаляет связанные материалы", async () => {
    const agreement = await agreementService.create({
      supplier_id: testSupplierId,
      customer_id: testCustomerId,
      supplier_warehouse_id: testSupplierWarehouseId,
      customer_warehouse_id: testCustomerWarehouseId,
      materials: [{ material_id: testMaterialId, amount: 5, item_price: 100 }],
    });
    await agreementService.delete(agreement.id!);
    const materials = await agreementMaterialRepo.findByAgreement(
      agreement.id!,
    );
    expect(materials.length).toBe(0);
  });
});
