// tests/integrations/controllers/WarehouseHistoryController.test.ts
import { WarehouseHistoryController } from "../../../src/controllers/WarehouseHistoryController";
import { Request, Response } from "express";
import { ValidationError, NotFoundError } from "@shared/service";

jest.mock("../../../src/services/WarehouseHistoryService");
jest.mock("../../../src/repositories/WarehouseHistoryRepository");
jest.mock("../../../src/repositories/WarehouseRepository");
jest.mock("../../../src/repositories/MaterialRepository");
jest.mock("../../../src/db", () => ({ pool: {} }));

import { WarehouseHistoryService } from "../../../src/services/WarehouseHistoryService";

describe("WarehouseHistoryController Integration Tests", () => {
  let controller: WarehouseHistoryController;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockHistoryService: jest.Mocked<WarehouseHistoryService>;

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
      query: {},
    };

    controller = new WarehouseHistoryController();
    mockHistoryService = (controller as any).warehouseHistoryService;
  });

  describe("getByWarehouseId", () => {
    test("должен вернуть историю склада с пагинацией", async () => {
      const mockResult = {
        data: [
          {
            id: 1,
            warehouse_id: 1,
            material_id: 1,
            operation_type: "MANUAL_ADD",
            old_amount: 0,
            new_amount: 100,
            delta: 100,
            description: "Тестовое добавление",
            created_at: new Date().toISOString(),
            material: { id: 1, name: "Материал 1" },
            user: { id: 1, name: "Пользователь" },
          },
        ],
        total: 1,
      };
      mockReq.params = { warehouseId: "1" };
      mockReq.query = { page: "1", limit: "20" };
      mockHistoryService.getHistory.mockResolvedValue(mockResult as any);

      await controller.getByWarehouseId(
        mockReq as Request,
        mockRes as Response,
      );

      expect(mockHistoryService.getHistory).toHaveBeenCalledWith(
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

    test("должен использовать параметры сортировки", async () => {
      const mockResult = { data: [], total: 0 };
      mockReq.params = { warehouseId: "1" };
      mockReq.query = {
        page: "2",
        limit: "10",
        sortBy: "created_at",
        sortOrder: "DESC",
      };
      mockHistoryService.getHistory.mockResolvedValue(mockResult as any);

      await controller.getByWarehouseId(
        mockReq as Request,
        mockRes as Response,
      );

      expect(mockHistoryService.getHistory).toHaveBeenCalledWith(
        1,
        10,
        10,
        "created_at",
        "DESC",
      );
    });

    test("должен вернуть 404 при несуществующем складе", async () => {
      mockReq.params = { warehouseId: "999" };
      mockHistoryService.getHistory.mockRejectedValue(
        new NotFoundError(
          "Склад с ID 999 не найден",
          "Warehouse",
          "getHistoryByWarehouse",
          999,
        ),
      );

      await controller.getByWarehouseId(
        mockReq as Request,
        mockRes as Response,
      );

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: "Склад с ID 999 не найден",
      });
    });

    test("должен вернуть 400 при неверном формате ID", async () => {
      mockReq.params = { warehouseId: "invalid" };

      await controller.getByWarehouseId(
        mockReq as Request,
        mockRes as Response,
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: "Неверный формат ID",
        field: "invalid",
      });
    });
  });

  describe("search", () => {
    test("должен найти записи в истории по поисковому запросу", async () => {
      const mockResult = {
        data: [
          {
            id: 1,
            warehouse_id: 1,
            material_id: 1,
            operation_type: "MANUAL_ADD",
            old_amount: 0,
            new_amount: 50,
            delta: 50,
            description: "Уникальное описание",
            created_at: new Date().toISOString(),
            material: { id: 1, name: "Материал 1" },
            user: { id: 1, name: "Пользователь" },
          },
        ],
        total: 1,
      };
      mockReq.params = { warehouseId: "1" };
      mockReq.query = { q: "уникальное", page: "1", limit: "20" };
      mockHistoryService.search.mockResolvedValue(mockResult as any);

      await controller.search(mockReq as Request, mockRes as Response);

      expect(mockHistoryService.search).toHaveBeenCalledWith(
        1,
        "уникальное",
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
        query: "уникальное",
      });
    });

    test("должен использовать параметры сортировки при поиске", async () => {
      const mockResult = { data: [], total: 0 };
      mockReq.params = { warehouseId: "1" };
      mockReq.query = {
        q: "тест",
        page: "2",
        limit: "10",
        sortBy: "delta",
        sortOrder: "ASC",
      };
      mockHistoryService.search.mockResolvedValue(mockResult as any);

      await controller.search(mockReq as Request, mockRes as Response);

      expect(mockHistoryService.search).toHaveBeenCalledWith(
        1,
        "тест",
        10,
        10,
        "delta",
        "ASC",
      );
    });

    test("должен вернуть 400 при отсутствии поискового запроса", async () => {
      mockReq.params = { warehouseId: "1" };
      mockReq.query = {};

      await controller.search(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: "Параметр поиска 'q' обязателен",
      });
    });

    test("должен вернуть 404 при поиске для несуществующего склада", async () => {
      mockReq.params = { warehouseId: "999" };
      mockReq.query = { q: "тест" };
      mockHistoryService.search.mockRejectedValue(
        new NotFoundError(
          "Склад с ID 999 не найден",
          "Warehouse",
          "searchHistoryByWarehouse",
          999,
        ),
      );

      await controller.search(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: "Склад с ID 999 не найден",
      });
    });

    test("должен вернуть 400 при неверном формате ID склада", async () => {
      mockReq.params = { warehouseId: "invalid" };
      mockReq.query = { q: "тест" };

      await controller.search(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: "Неверный формат ID",
        field: "invalid",
      });
    });
  });
});
