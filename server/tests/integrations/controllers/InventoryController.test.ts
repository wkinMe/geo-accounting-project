// tests/integrations/controllers/InventoryController.test.ts
import { InventoryController } from "../../../src/controllers/InventoryController";
import { Request, Response } from "express";

jest.mock("../../../src/services/InventoryService");
jest.mock("../../../src/repositories/InventoryRepository");
jest.mock("../../../src/repositories/WarehouseRepository");
jest.mock("../../../src/repositories/MaterialRepository");
jest.mock("../../../src/services/WarehouseHistoryService");
jest.mock("../../../src/repositories/WarehouseHistoryRepository");
jest.mock("../../../src/db", () => ({ pool: {} }));

import { InventoryService } from "../../../src/services/InventoryService";

interface RequestWithUser extends Request {
  user?: {
    id: number;
    name: string;
    organization_id: number;
    role: string;
  };
}

describe("InventoryController Integration Tests", () => {
  let controller: InventoryController;
  let mockReq: Partial<RequestWithUser>;
  let mockRes: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockInventoryService: jest.Mocked<InventoryService>;

  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockRes = {
      status: mockStatus,
      json: mockJson,
    };
    mockReq = {
      params: {},
      body: {},
      query: {},
      user: { id: 1, name: "testuser", organization_id: 1, role: "manager" },
    };

    controller = new InventoryController();
    mockInventoryService = (controller as any).inventoryService;
  });

  describe("getWarehouseStock", () => {
    test("должен вернуть список товаров на складе с пагинацией", async () => {
      const mockResult = {
        data: [
          {
            id: 1,
            warehouse_id: 1,
            material_id: 1,
            amount: 100,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            material: {
              id: 1,
              name: "Тест",
              unit: "шт",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          },
        ],
        total: 1,
      };
      mockReq.params = { warehouseId: "1" };
      mockReq.query = { page: "1", limit: "20" };
      mockInventoryService.getWarehouseStock.mockResolvedValue(
        mockResult as any,
      );

      await controller.getWarehouseStock(
        mockReq as Request,
        mockRes as Response,
      );

      expect(mockInventoryService.getWarehouseStock).toHaveBeenCalledWith(
        1,
        20,
        0,
        undefined,
        undefined,
      );
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockResult.data,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      });
    });
  });

  describe("getMaterialDistribution", () => {
    test("должен вернуть распределение материала", async () => {
      const mockDistribution = {
        total_amount: 1000,
        warehouses_count: 5,
        items: [
          {
            warehouse_id: 1,
            warehouse_name: "Склад 1",
            amount: 500,
            percentage: 50,
          },
        ],
      };
      mockReq.params = { materialId: "1" };
      mockInventoryService.getMaterialDistribution.mockResolvedValue(
        mockDistribution as any,
      );

      await controller.getMaterialDistribution(
        mockReq as Request,
        mockRes as Response,
      );

      expect(mockInventoryService.getMaterialDistribution).toHaveBeenCalledWith(
        1,
      );
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockDistribution,
      });
    });
  });

  describe("findWarehouseWithMaxMaterial", () => {
    test("должен вернуть склад с максимальным количеством материала", async () => {
      const mockResult = { warehouse_id: 1, amount: 500 };
      mockReq.params = { materialId: "1" };
      mockInventoryService.findWarehouseWithMaxMaterial.mockResolvedValue(
        mockResult,
      );

      await controller.findWarehouseWithMaxMaterial(
        mockReq as Request,
        mockRes as Response,
      );

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
      });
    });

    test("должен вернуть null если материал не найден", async () => {
      mockReq.params = { materialId: "999" };
      mockInventoryService.findWarehouseWithMaxMaterial.mockResolvedValue(null);

      await controller.findWarehouseWithMaxMaterial(
        mockReq as Request,
        mockRes as Response,
      );

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: null,
        message: "Материал не найден ни на одном складе",
      });
    });
  });

  describe("addMaterial", () => {
    test("должен добавить материал на склад", async () => {
      const mockResult = {
        id: 1,
        warehouse_id: 1,
        material_id: 1,
        amount: 50,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        material: {
          id: 1,
          name: "Тест",
          unit: "шт",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };
      mockReq.params = { warehouseId: "1" };
      mockReq.body = { material_id: "1", amount: 50 };
      mockInventoryService.addMaterial.mockResolvedValue(mockResult as any);

      await controller.addMaterial(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
      });
    });

    test("должен вернуть 400 при отсутствии material_id", async () => {
      mockReq.params = { warehouseId: "1" };
      mockReq.body = { amount: 50 };

      await controller.addMaterial(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: "ID материала обязателен",
        field: undefined,
      });
    });

    test("должен вернуть 400 при отрицательном количестве", async () => {
      const invalidAmount = -10;
      mockReq.params = { warehouseId: "1" };
      mockReq.body = { material_id: "1", amount: invalidAmount };

      await controller.addMaterial(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: "Количество должно быть положительным",
        field: invalidAmount,
      });
    });
  });

  describe("removeMaterial", () => {
    test("должен списать материал со склада", async () => {
      const mockResult = {
        id: 1,
        warehouse_id: 1,
        material_id: 1,
        amount: 30,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        material: {
          id: 1,
          name: "Тест",
          unit: "шт",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };
      mockReq.params = { warehouseId: "1", materialId: "1" };
      mockReq.body = { amount: 20 };
      mockInventoryService.removeMaterial.mockResolvedValue(mockResult as any);

      await controller.removeMaterial(mockReq as Request, mockRes as Response);

      expect(mockInventoryService.removeMaterial).toHaveBeenCalled();
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
      });
    });

    test("должен вернуть 400 при отрицательном количестве", async () => {
      const invalidAmount = -5;
      mockReq.params = { warehouseId: "1", materialId: "1" };
      mockReq.body = { amount: invalidAmount };

      await controller.removeMaterial(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: "Количество должно быть положительным",
        field: invalidAmount,
      });
    });
  });

  describe("setAmount", () => {
    test("должен установить точное количество материала", async () => {
      const mockResult = {
        id: 1,
        warehouse_id: 1,
        material_id: 1,
        amount: 100,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        material: {
          id: 1,
          name: "Тест",
          unit: "шт",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };
      mockReq.params = { warehouseId: "1", materialId: "1" };
      mockReq.body = { amount: 100 };
      mockInventoryService.setAmount.mockResolvedValue(mockResult as any);

      await controller.setAmount(mockReq as Request, mockRes as Response);

      expect(mockInventoryService.setAmount).toHaveBeenCalled();
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
      });
    });

    test("должен вернуть сообщение при удалении материала", async () => {
      mockReq.params = { warehouseId: "1", materialId: "1" };
      mockReq.body = { amount: 0 };
      mockInventoryService.setAmount.mockResolvedValue(null);

      await controller.setAmount(mockReq as Request, mockRes as Response);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: null,
        message: "Материал удалён со склада",
      });
    });

    test("должен вернуть 400 при отрицательном количестве", async () => {
      const invalidAmount = -50;
      mockReq.params = { warehouseId: "1", materialId: "1" };
      mockReq.body = { amount: invalidAmount };

      await controller.setAmount(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: "Количество не может быть отрицательным",
        field: invalidAmount,
      });
    });
  });

  describe("checkAvailability", () => {
    test("должен проверить доступность товаров", async () => {
      mockReq.params = { warehouseId: "1" };
      mockReq.body = {
        requirements: [{ material_id: 1, required_amount: 10 }],
      };
      mockInventoryService.checkAvailability.mockResolvedValue(true);

      await controller.checkAvailability(
        mockReq as Request,
        mockRes as Response,
      );

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: { is_available: true },
      });
    });

    test("должен вернуть false при недостаточности товаров", async () => {
      mockReq.params = { warehouseId: "1" };
      mockReq.body = {
        requirements: [{ material_id: 1, required_amount: 1000 }],
      };
      mockInventoryService.checkAvailability.mockResolvedValue(false);

      await controller.checkAvailability(
        mockReq as Request,
        mockRes as Response,
      );

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: { is_available: false },
      });
    });
  });

  describe("searchMaterials", () => {
    test("должен найти материалы на складе", async () => {
      const mockResult = {
        data: [
          {
            id: 1,
            warehouse_id: 1,
            material_id: 1,
            amount: 100,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            material: {
              id: 1,
              name: "Тест",
              unit: "шт",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          },
        ],
        total: 1,
      };
      mockReq.params = { warehouseId: "1" };
      mockReq.query = { q: "тест", page: "1", limit: "20" };
      mockInventoryService.searchMaterials.mockResolvedValue(mockResult as any);

      await controller.searchMaterials(mockReq as Request, mockRes as Response);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockResult.data,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
        query: "тест",
      });
    });
  });
});
