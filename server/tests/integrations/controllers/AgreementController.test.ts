// tests/integrations/controllers/AgreementController.test.ts
import { AgreementController } from "../../../src/controllers/AgreementController";
import { Request, Response } from "express";
import { ValidationError, NotFoundError } from "@shared/service";
import { AGREEMENT_STATUS } from "@shared/constants";

jest.mock("../../../src/services/AgreementService");
jest.mock("../../../src/repositories/AgreementRepository");
jest.mock("../../../src/repositories/AgreementMaterialRepository");
jest.mock("../../../src/repositories/UserRepository");
jest.mock("../../../src/repositories/WarehouseRepository");
jest.mock("../../../src/repositories/MaterialRepository");
jest.mock("../../../src/services/InventoryService");
jest.mock("../../../src/services/WarehouseHistoryService");
jest.mock("../../../src/repositories/InventoryRepository");
jest.mock("../../../src/repositories/WarehouseHistoryRepository");
jest.mock("../../../src/db", () => ({ pool: {} }));

import { AgreementService } from "../../../src/services/AgreementService";

interface RequestWithUser extends Request {
  user?: {
    id: number;
    name: string;
    organization_id: number;
    role: string;
  };
}

describe("AgreementController Integration Tests", () => {
  let controller: AgreementController;
  let mockReq: Partial<RequestWithUser>;
  let mockRes: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockAgreementService: jest.Mocked<AgreementService>;

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
      user: { id: 1, name: "testuser", organization_id: 1, role: "admin" },
    };

    controller = new AgreementController();
    mockAgreementService = (controller as any).agreementService;
  });

  describe("getAll", () => {
    test("должен вернуть список договоров с деталями", async () => {
      const mockAgreements = [
        {
          id: 1,
          status: AGREEMENT_STATUS.DRAFT,
          supplier: { id: 1 },
          customer: { id: 2 },
        },
        {
          id: 2,
          status: AGREEMENT_STATUS.ACTIVE,
          supplier: { id: 3 },
          customer: { id: 4 },
        },
      ];
      mockAgreementService.findAllWithDetails.mockResolvedValue(mockAgreements);

      await controller.getAll(mockReq as Request, mockRes as Response);

      expect(mockAgreementService.findAllWithDetails).toHaveBeenCalledWith(
        mockReq.user,
      );
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockAgreements,
        count: mockAgreements.length,
      });
    });

    test("должен обработать ошибку сервиса", async () => {
      mockAgreementService.findAllWithDetails.mockRejectedValue(
        new Error("DB Error"),
      );

      await controller.getAll(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: "Внутренняя ошибка сервера",
      });
    });
  });

  describe("getById", () => {
    test("должен вернуть договор по ID", async () => {
      const mockAgreement = { id: 1, status: AGREEMENT_STATUS.DRAFT };
      mockReq.params = { id: "1" };
      mockAgreementService.findByIdWithDetails.mockResolvedValue(mockAgreement);

      await controller.getById(mockReq as Request, mockRes as Response);

      expect(mockAgreementService.findByIdWithDetails).toHaveBeenCalledWith(1);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockAgreement,
      });
    });

    test("должен вернуть 404 при несуществующем ID", async () => {
      mockReq.params = { id: "999" };
      mockAgreementService.findByIdWithDetails.mockRejectedValue(
        new NotFoundError(
          "Договор с ID 999 не найден",
          "Agreement",
          "findByIdWithDetails",
          999,
        ),
      );

      await controller.getById(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: "Договор с ID 999 не найден",
      });
    });

    test("должен вернуть 400 при неверном формате ID", async () => {
      const invalidId = "invalid";
      mockReq.params = { id: invalidId };

      await controller.getById(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: "Неверный формат ID",
        field: invalidId,
      });
    });
  });

  describe("create", () => {
    test("должен создать договор", async () => {
      const mockAgreement = { id: 1, toJSON: () => ({ id: 1 }) };
      mockReq.body = {
        supplier_id: 1,
        customer_id: 2,
        supplier_warehouse_id: 1,
        customer_warehouse_id: 2,
      };
      mockAgreementService.create.mockResolvedValue(mockAgreement as any);

      await controller.create(mockReq as Request, mockRes as Response);

      expect(mockAgreementService.create).toHaveBeenCalledWith(mockReq.body);
      expect(mockStatus).toHaveBeenCalledWith(201);
    });
  });

  describe("update", () => {
    test("должен обновить договор", async () => {
      const mockAgreement = {
        id: 1,
        toJSON: () => ({ id: 1, status: AGREEMENT_STATUS.ACTIVE }),
      };
      mockReq.params = { id: "1" };
      mockReq.body = { status: AGREEMENT_STATUS.ACTIVE };
      mockAgreementService.update.mockResolvedValue(mockAgreement as any);

      await controller.update(mockReq as Request, mockRes as Response);

      expect(mockAgreementService.update).toHaveBeenCalledWith({
        id: 1,
        status: AGREEMENT_STATUS.ACTIVE,
      });
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: { id: 1, status: AGREEMENT_STATUS.ACTIVE },
      });
    });
  });

  describe("delete", () => {
    test("должен удалить договор", async () => {
      mockReq.params = { id: "1" };
      mockAgreementService.delete.mockResolvedValue(undefined);

      await controller.delete(mockReq as Request, mockRes as Response);

      expect(mockAgreementService.delete).toHaveBeenCalledWith(1);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: "Договор успешно удалён",
      });
    });
  });
});
