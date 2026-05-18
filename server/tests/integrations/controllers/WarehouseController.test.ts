// tests/integrations/controllers/WarehouseController.test.ts
import { WarehouseController } from "../../../src/controllers/WarehouseController";
import { Request, Response } from "express";
import { ValidationError, NotFoundError } from "@shared/service";
import { WarehouseService } from "@/src/services";

jest.mock("@src/services");
jest.mock("../../../src/repositories/WarehouseRepository");
jest.mock("../../../src/repositories/OrganizationRepository");
jest.mock("../../../src/repositories/UserRepository");
jest.mock("../../../src/db", () => ({ pool: {} }));

describe("WarehouseController Integration Tests", () => {
  let controller: WarehouseController;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockWarehouseService: jest.Mocked<WarehouseService>;

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
    };

    controller = new WarehouseController();
    mockWarehouseService = (controller as any).warehouseService;
  });

  describe("getAll", () => {
    test("должен вернуть список складов с пагинацией", async () => {
      const mockResult = {
        data: [
          {
            id: 1,
            name: "Склад 1",
            organization: { id: 1, name: "Организация 1" },
          },
        ],
        total: 1,
      };
      mockReq.query = { page: "1", limit: "20" };
      mockWarehouseService.findAllWithDetails.mockResolvedValue(
        mockResult as any,
      );

      await controller.getAll(mockReq as Request, mockRes as Response);

      expect(mockWarehouseService.findAllWithDetails).toHaveBeenCalledWith(
        20,
        0,
        undefined,
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

    test("должен использовать фильтр по организации", async () => {
      const mockResult = { data: [], total: 0 };
      mockReq.query = { page: "1", limit: "20", organization_id: "5" };
      mockWarehouseService.findAllWithDetails.mockResolvedValue(
        mockResult as any,
      );

      await controller.getAll(mockReq as Request, mockRes as Response);

      expect(mockWarehouseService.findAllWithDetails).toHaveBeenCalledWith(
        20,
        0,
        undefined,
        undefined,
        5,
      );
    });

    test("должен использовать параметры сортировки", async () => {
      const mockResult = { data: [], total: 0 };
      mockReq.query = {
        page: "2",
        limit: "10",
        sortBy: "name",
        sortOrder: "DESC",
      };
      mockWarehouseService.findAllWithDetails.mockResolvedValue(
        mockResult as any,
      );

      await controller.getAll(mockReq as Request, mockRes as Response);

      expect(mockWarehouseService.findAllWithDetails).toHaveBeenCalledWith(
        10,
        10,
        "name",
        "DESC",
        undefined,
      );
    });
  });

  describe("getById", () => {
    test("должен вернуть склад по ID", async () => {
      const mockWarehouse = {
        id: 1,
        name: "Тестовый склад",
        organization: { id: 1, name: "Организация" },
      };
      mockReq.params = { id: "1" };
      mockWarehouseService.findByIdWithDetails.mockResolvedValue(
        mockWarehouse as any,
      );

      await controller.getById(mockReq as Request, mockRes as Response);

      expect(mockWarehouseService.findByIdWithDetails).toHaveBeenCalledWith(1);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockWarehouse,
      });
    });

    test("должен вернуть 404 при несуществующем ID", async () => {
      mockReq.params = { id: "999" };
      mockWarehouseService.findByIdWithDetails.mockResolvedValue(null);

      await controller.getById(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: "Склад с ID 999 не найден",
      });
    });

    test("должен вернуть 400 при неверном формате ID", async () => {
      mockReq.params = { id: "invalid" };

      await controller.getById(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: "Неверный формат ID",
        field: "invalid",
      });
    });
  });

  describe("create", () => {
    test("должен создать склад", async () => {
      const mockWarehouse = { id: 1, name: "Новый склад", organization_id: 1 };
      const mockWarehouseWithDetails = {
        id: 1,
        name: "Новый склад",
        organization: { id: 1, name: "Организация" },
      };
      mockReq.body = {
        name: "Новый склад",
        organization_id: 1,
        latitude: 52.4345,
        longitude: 30.95,
      };
      mockWarehouseService.create.mockResolvedValue(mockWarehouse as any);
      mockWarehouseService.findByIdWithDetails.mockResolvedValue(
        mockWarehouseWithDetails as any,
      );

      await controller.create(mockReq as Request, mockRes as Response);

      expect(mockWarehouseService.create).toHaveBeenCalledWith(mockReq.body);
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockWarehouseWithDetails,
      });
    });
  });

  describe("update", () => {
    test("должен обновить склад", async () => {
      const mockWarehouseWithDetails = {
        id: 1,
        name: "Обновлённый склад",
        organization: { id: 1, name: "Организация" },
      };
      mockReq.params = { id: "1" };
      mockReq.body = {
        name: "Обновлённый склад",
        latitude: 52.4345,
        longitude: 30.95,
      };
      mockWarehouseService.update.mockResolvedValue(undefined);
      mockWarehouseService.findByIdWithDetails.mockResolvedValue(
        mockWarehouseWithDetails as any,
      );

      await controller.update(mockReq as Request, mockRes as Response);

      expect(mockWarehouseService.update).toHaveBeenCalledWith(1, mockReq.body);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockWarehouseWithDetails,
      });
    });
  });

  describe("delete", () => {
    test("должен удалить склад", async () => {
      mockReq.params = { id: "1" };
      mockWarehouseService.delete.mockResolvedValue(undefined);

      await controller.delete(mockReq as Request, mockRes as Response);

      expect(mockWarehouseService.delete).toHaveBeenCalledWith(1);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: "Склад успешно удалён",
      });
    });
  });

  describe("findByManagerId", () => {
    test("должен вернуть склады менеджера", async () => {
      const mockWarehouses = [
        { id: 1, name: "Склад 1", toJSON: () => ({ id: 1, name: "Склад 1" }) },
        { id: 2, name: "Склад 2", toJSON: () => ({ id: 2, name: "Склад 2" }) },
      ];
      mockReq.params = { managerId: "1" };
      mockWarehouseService.findByManagerId.mockResolvedValue(
        mockWarehouses as any,
      );

      await controller.findByManagerId(mockReq as Request, mockRes as Response);

      expect(mockWarehouseService.findByManagerId).toHaveBeenCalledWith(1);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: [
          { id: 1, name: "Склад 1" },
          { id: 2, name: "Склад 2" },
        ],
        count: 2,
      });
    });
  });

  describe("assignManager", () => {
    test("должен назначить менеджера на склад", async () => {
      const mockWarehouseWithDetails = { id: 1, name: "Склад", manager_id: 5 };
      mockReq.params = { id: "1" };
      mockReq.body = { manager_id: 5 };
      mockWarehouseService.assignManager.mockResolvedValue(undefined);
      mockWarehouseService.findByIdWithDetails.mockResolvedValue(
        mockWarehouseWithDetails as any,
      );

      await controller.assignManager(mockReq as Request, mockRes as Response);

      expect(mockWarehouseService.assignManager).toHaveBeenCalledWith(1, 5);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockWarehouseWithDetails,
        message: "Менеджер назначен",
      });
    });

    test("должен открепить менеджера от склада", async () => {
      const mockWarehouseWithDetails = {
        id: 1,
        name: "Склад",
        manager_id: null,
      };
      mockReq.params = { id: "1" };
      mockReq.body = { manager_id: null };
      mockWarehouseService.assignManager.mockResolvedValue(undefined);
      mockWarehouseService.findByIdWithDetails.mockResolvedValue(
        mockWarehouseWithDetails as any,
      );

      await controller.assignManager(mockReq as Request, mockRes as Response);

      expect(mockWarehouseService.assignManager).toHaveBeenCalledWith(1, null);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockWarehouseWithDetails,
        message: "Менеджер откреплён",
      });
    });
  });

  describe("search", () => {
    test("должен найти склады по поисковому запросу", async () => {
      const mockResult = {
        data: [
          {
            id: 1,
            name: "Тестовый склад",
            organization: { id: 1, name: "Организация" },
          },
        ],
        total: 1,
      };
      mockReq.query = { q: "тест", page: "1", limit: "20" };
      mockWarehouseService.search.mockResolvedValue(mockResult as any);

      await controller.search(mockReq as Request, mockRes as Response);

      expect(mockWarehouseService.search).toHaveBeenCalledWith(
        "тест",
        20,
        0,
        undefined,
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
        query: "тест",
      });
    });

    test("должен использовать фильтр по организации при поиске", async () => {
      const mockResult = { data: [], total: 0 };
      mockReq.query = {
        q: "тест",
        page: "1",
        limit: "20",
        organization_id: "5",
      };
      mockWarehouseService.search.mockResolvedValue(mockResult as any);

      await controller.search(mockReq as Request, mockRes as Response);

      expect(mockWarehouseService.search).toHaveBeenCalledWith(
        "тест",
        20,
        0,
        undefined,
        undefined,
        5,
      );
    });

    test("должен вернуть 400 при отсутствии поискового запроса", async () => {
      mockReq.query = {};

      await controller.search(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: "Параметр поиска 'q' обязателен",
      });
    });

    test("должен использовать параметры сортировки при поиске", async () => {
      const mockResult = { data: [], total: 0 };
      mockReq.query = {
        q: "тест",
        page: "2",
        limit: "10",
        sortBy: "name",
        sortOrder: "ASC",
      };
      mockWarehouseService.search.mockResolvedValue(mockResult as any);

      await controller.search(mockReq as Request, mockRes as Response);

      expect(mockWarehouseService.search).toHaveBeenCalledWith(
        "тест",
        10,
        10,
        "name",
        "ASC",
        undefined,
      );
    });
  });
});
