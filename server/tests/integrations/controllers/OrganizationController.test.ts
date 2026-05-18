// tests/integrations/controllers/OrganizationController.test.ts
import { OrganizationController } from "../../../src/controllers/OrganizationController";
import { Request, Response } from "express";
import { ValidationError, NotFoundError } from "@shared/service";

jest.mock("../../../src/services/OrganizationService");
jest.mock("../../../src/repositories/OrganizationRepository");
jest.mock("../../../src/db", () => ({ pool: {} }));

import { OrganizationService } from "../../../src/services/OrganizationService";

describe("OrganizationController Integration Tests", () => {
  let controller: OrganizationController;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockOrganizationService: jest.Mocked<OrganizationService>;

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

    mockOrganizationService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      search: jest.fn(),
      canAssignAdminRole: jest.fn(),
      canRemoveSuperAdmin: jest.fn(),
      getSuperAdminCount: jest.fn(),
    } as any;

    controller = new OrganizationController(mockOrganizationService);
  });

  describe("getAll", () => {
    test("должен вернуть список организаций с пагинацией", async () => {
      const mockResult = {
        data: [
          {
            id: 1,
            name: "Организация 1",
            toJSON: () => ({ id: 1, name: "Организация 1" }),
          },
        ],
        total: 1,
      };
      mockReq.query = { page: "1", limit: "20" };
      mockOrganizationService.findAll.mockResolvedValue(mockResult as any);

      await controller.getAll(mockReq as Request, mockRes as Response);

      expect(mockOrganizationService.findAll).toHaveBeenCalledWith(
        20,
        0,
        undefined,
        undefined,
      );
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: [{ id: 1, name: "Организация 1" }],
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
      mockReq.query = {
        page: "2",
        limit: "10",
        sortBy: "name",
        sortOrder: "DESC",
      };
      mockOrganizationService.findAll.mockResolvedValue(mockResult as any);

      await controller.getAll(mockReq as Request, mockRes as Response);

      expect(mockOrganizationService.findAll).toHaveBeenCalledWith(
        10,
        10,
        "name",
        "DESC",
      );
    });
  });

  describe("getById", () => {
    test("должен вернуть организацию по ID", async () => {
      const mockOrganization = {
        id: 1,
        name: "Тестовая организация",
        toJSON: () => ({ id: 1, name: "Тестовая организация" }),
      };
      mockReq.params = { id: "1" };
      mockOrganizationService.findById.mockResolvedValue(
        mockOrganization as any,
      );

      await controller.getById(mockReq as Request, mockRes as Response);

      expect(mockOrganizationService.findById).toHaveBeenCalledWith(1);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: { id: 1, name: "Тестовая организация" },
      });
    });

    test("должен вернуть 404 при несуществующем ID", async () => {
      mockReq.params = { id: "999" };
      mockOrganizationService.findById.mockRejectedValue(
        new NotFoundError(
          "Организация с ID 999 не найдена",
          "Organization",
          "findById",
          999,
        ),
      );

      await controller.getById(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: "Организация с ID 999 не найдена",
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
        operation: "parseId",
      });
    });
  });

  describe("create", () => {
    test("должен создать организацию", async () => {
      const mockOrganization = {
        id: 1,
        name: "Новая организация",
        toJSON: () => ({ id: 1, name: "Новая организация" }),
      };
      mockReq.body = {
        name: "Новая организация",
        latitude: 52.4345,
        longitude: 30.95,
      };
      mockOrganizationService.create.mockResolvedValue(mockOrganization as any);

      await controller.create(mockReq as Request, mockRes as Response);

      expect(mockOrganizationService.create).toHaveBeenCalledWith({
        name: "Новая организация",
        latitude: 52.4345,
        longitude: 30.95,
      });
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: { id: 1, name: "Новая организация" },
      });
    });

    test("должен вернуть 400 при ошибке валидации", async () => {
      mockReq.body = { name: "", latitude: 52.4345, longitude: 30.95 };
      mockOrganizationService.create.mockRejectedValue(
        new ValidationError(
          "Название организации обязательно",
          "create",
          "name",
          "",
        ),
      );

      await controller.create(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: "Название организации обязательно",
        field: "",
        operation: "create",
      });
    });
  });

  describe("update", () => {
    test("должен обновить организацию", async () => {
      const mockOrganization = {
        id: 1,
        name: "Обновлённая организация",
        toJSON: () => ({ id: 1, name: "Обновлённая организация" }),
      };
      mockReq.params = { id: "1" };
      mockReq.body = { id: 1, name: "Обновлённая организация" };
      mockOrganizationService.update.mockResolvedValue(mockOrganization as any);

      await controller.update(mockReq as Request, mockRes as Response);

      expect(mockOrganizationService.update).toHaveBeenCalledWith(1, {
        id: 1,
        name: "Обновлённая организация",
      });
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: { id: 1, name: "Обновлённая организация" },
      });
    });

    test("должен обновить координаты организации", async () => {
      const mockOrganization = {
        id: 1,
        name: "Организация",
        latitude: 53.0,
        longitude: 31.5,
        toJSON: () => ({
          id: 1,
          name: "Организация",
          latitude: 53.0,
          longitude: 31.5,
        }),
      };
      mockReq.params = { id: "1" };
      mockReq.body = { id: 1, latitude: 53.0, longitude: 31.5 };
      mockOrganizationService.update.mockResolvedValue(mockOrganization as any);

      await controller.update(mockReq as Request, mockRes as Response);

      expect(mockOrganizationService.update).toHaveBeenCalledWith(1, {
        id: 1,
        latitude: 53.0,
        longitude: 31.5,
      });
    });
  });

  describe("delete", () => {
    test("должен удалить организацию", async () => {
      mockReq.params = { id: "1" };
      mockOrganizationService.delete.mockResolvedValue(undefined);

      await controller.delete(mockReq as Request, mockRes as Response);

      expect(mockOrganizationService.delete).toHaveBeenCalledWith(1);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: "Организация успешно удалена",
      });
    });

    test("должен вернуть 404 при удалении несуществующей организации", async () => {
      mockReq.params = { id: "999" };
      mockOrganizationService.delete.mockRejectedValue(
        new NotFoundError(
          "Организация с ID 999 не найдена",
          "Organization",
          "delete",
          999,
        ),
      );

      await controller.delete(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: "Организация с ID 999 не найдена",
      });
    });
  });

  describe("search", () => {
    test("должен найти организации по поисковому запросу", async () => {
      const mockResult = {
        data: [
          {
            id: 1,
            name: "Тестовая организация",
            toJSON: () => ({ id: 1, name: "Тестовая организация" }),
          },
        ],
        total: 1,
      };
      mockReq.query = { q: "тест", page: "1", limit: "20" };
      mockOrganizationService.search.mockResolvedValue(mockResult as any);

      await controller.search(mockReq as Request, mockRes as Response);

      expect(mockOrganizationService.search).toHaveBeenCalledWith(
        "тест",
        20,
        0,
        undefined,
        undefined,
      );
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: [{ id: 1, name: "Тестовая организация" }],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
        query: "тест",
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
      mockOrganizationService.search.mockResolvedValue(mockResult as any);

      await controller.search(mockReq as Request, mockRes as Response);

      expect(mockOrganizationService.search).toHaveBeenCalledWith(
        "тест",
        10,
        10,
        "name",
        "ASC",
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
  });
});
