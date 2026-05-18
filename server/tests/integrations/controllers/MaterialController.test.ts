// tests/integrations/controllers/MaterialController.test.ts
import { MaterialController } from "../../../src/controllers/MaterialController";
import { Request, Response } from "express";
import { ValidationError, NotFoundError } from "@shared/service";

jest.mock("../../../src/services/MaterialService");
jest.mock("../../../src/repositories/MaterialRepository");
jest.mock("../../../src/repositories/MaterialImageRepository");
jest.mock("../../../src/db", () => ({ pool: {} }));

import { MaterialService } from "../../../src/services/MaterialService";

describe("MaterialController Integration Tests", () => {
  let controller: MaterialController;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockMaterialService: jest.Mocked<MaterialService>;

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
      send: jest.fn(),
      setHeader: jest.fn(),
    };
    mockReq = {
      params: {},
      body: {},
      query: {},
      file: undefined,
    };

    mockMaterialService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      search: jest.fn(),
      getImage: jest.fn(),
      upsertImage: jest.fn(),
      deleteImage: jest.fn(),
      imageExists: jest.fn(),
    } as any;

    controller = new MaterialController(mockMaterialService);
  });

  describe("getAll", () => {
    test("должен вернуть список материалов с пагинацией", async () => {
      const mockResult = {
        data: [
          {
            id: 1,
            name: "Материал 1",
            unit: "шт",
            toJSON: () => ({ id: 1, name: "Материал 1", unit: "шт" }),
          },
        ],
        total: 1,
      };
      mockReq.query = { page: "1", limit: "20" };
      mockMaterialService.findAll.mockResolvedValue(mockResult as any);

      await controller.getAll(mockReq as Request, mockRes as Response);

      expect(mockMaterialService.findAll).toHaveBeenCalledWith(
        20,
        0,
        undefined,
        undefined,
      );
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: [{ id: 1, name: "Материал 1", unit: "шт" }],
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
      mockMaterialService.findAll.mockResolvedValue(mockResult as any);

      await controller.getAll(mockReq as Request, mockRes as Response);

      expect(mockMaterialService.findAll).toHaveBeenCalledWith(
        10,
        10,
        "name",
        "DESC",
      );
    });
  });

  describe("getById", () => {
    test("должен вернуть материал по ID", async () => {
      const mockMaterial = {
        id: 1,
        name: "Тестовый материал",
        unit: "шт",
        toJSON: () => ({ id: 1, name: "Тестовый материал", unit: "шт" }),
      };
      mockReq.params = { id: "1" };
      mockMaterialService.findById.mockResolvedValue(mockMaterial as any);

      await controller.getById(mockReq as Request, mockRes as Response);

      expect(mockMaterialService.findById).toHaveBeenCalledWith(1);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: { id: 1, name: "Тестовый материал", unit: "шт" },
      });
    });

    test("должен вернуть 404 при несуществующем ID", async () => {
      mockReq.params = { id: "999" };
      mockMaterialService.findById.mockRejectedValue(
        new NotFoundError(
          "Материал с ID 999 не найден",
          "Material",
          "findById",
          999,
        ),
      );

      await controller.getById(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: "Материал с ID 999 не найден",
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
    test("должен создать материал без изображения", async () => {
      const mockMaterial = {
        id: 1,
        name: "Новый материал",
        unit: "кг",
        toJSON: () => ({ id: 1, name: "Новый материал", unit: "кг" }),
      };
      mockReq.body = { name: "Новый материал", unit: "кг" };
      mockMaterialService.create.mockResolvedValue(mockMaterial as any);

      await controller.create(mockReq as Request, mockRes as Response);

      expect(mockMaterialService.create).toHaveBeenCalledWith({
        name: "Новый материал",
        unit: "кг",
        image: undefined,
      });
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: { id: 1, name: "Новый материал", unit: "кг" },
      });
    });

    test("должен создать материал с изображением", async () => {
      const mockMaterial = {
        id: 1,
        name: "Материал с картинкой",
        unit: "шт",
        toJSON: () => ({ id: 1, name: "Материал с картинкой", unit: "шт" }),
      };
      mockReq.body = { name: "Материал с картинкой", unit: "шт" };
      mockReq.file = { buffer: Buffer.from("image data") } as any;
      mockMaterialService.create.mockResolvedValue(mockMaterial as any);

      await controller.create(mockReq as Request, mockRes as Response);

      expect(mockMaterialService.create).toHaveBeenCalledWith({
        name: "Материал с картинкой",
        unit: "шт",
        image: expect.any(Buffer),
      });
      expect(mockStatus).toHaveBeenCalledWith(201);
    });
  });

  describe("update", () => {
    test("должен обновить материал", async () => {
      const mockMaterial = {
        id: 1,
        name: "Обновлённый материал",
        unit: "л",
        toJSON: () => ({ id: 1, name: "Обновлённый материал", unit: "л" }),
      };
      mockReq.params = { id: "1" };
      mockReq.body = { name: "Обновлённый материал", unit: "л" };
      mockMaterialService.update.mockResolvedValue(mockMaterial as any);

      await controller.update(mockReq as Request, mockRes as Response);

      expect(mockMaterialService.update).toHaveBeenCalledWith(1, {
        name: "Обновлённый материал",
        unit: "л",
      });
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: { id: 1, name: "Обновлённый материал", unit: "л" },
      });
    });

    test("должен обновить материал с новым изображением", async () => {
      const mockMaterial = {
        id: 1,
        name: "Материал",
        unit: "шт",
        toJSON: () => ({ id: 1, name: "Материал", unit: "шт" }),
      };
      mockReq.params = { id: "1" };
      mockReq.body = { name: "Материал", unit: "шт" };
      mockReq.file = { buffer: Buffer.from("new image") } as any;
      mockMaterialService.update.mockResolvedValue(mockMaterial as any);

      await controller.update(mockReq as Request, mockRes as Response);

      expect(mockMaterialService.update).toHaveBeenCalledWith(1, {
        name: "Материал",
        unit: "шт",
        image: expect.any(Buffer),
      });
    });

    test("должен удалить изображение при image=null", async () => {
      const mockMaterial = {
        id: 1,
        name: "Материал",
        unit: "шт",
        toJSON: () => ({ id: 1, name: "Материал", unit: "шт" }),
      };
      mockReq.params = { id: "1" };
      mockReq.body = { name: "Материал", unit: "шт", image: "null" };
      mockMaterialService.update.mockResolvedValue(mockMaterial as any);

      await controller.update(mockReq as Request, mockRes as Response);

      expect(mockMaterialService.update).toHaveBeenCalledWith(1, {
        name: "Материал",
        unit: "шт",
        image: null,
      });
    });
  });

  describe("delete", () => {
    test("должен удалить материал", async () => {
      mockReq.params = { id: "1" };
      mockMaterialService.delete.mockResolvedValue(undefined);

      await controller.delete(mockReq as Request, mockRes as Response);

      expect(mockMaterialService.delete).toHaveBeenCalledWith(1);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: "Материал успешно удалён",
      });
    });
  });

  describe("search", () => {
    test("должен найти материалы по поисковому запросу", async () => {
      const mockResult = {
        data: [
          {
            id: 1,
            name: "Тестовый материал",
            unit: "шт",
            toJSON: () => ({ id: 1, name: "Тестовый материал", unit: "шт" }),
          },
        ],
        total: 1,
      };
      mockReq.query = { q: "тест", page: "1", limit: "20" };
      mockMaterialService.search.mockResolvedValue(mockResult as any);

      await controller.search(mockReq as Request, mockRes as Response);

      expect(mockMaterialService.search).toHaveBeenCalledWith(
        "тест",
        20,
        0,
        undefined,
        undefined,
      );
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: [{ id: 1, name: "Тестовый материал", unit: "шт" }],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
        query: "тест",
      });
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

  describe("getImage", () => {
    test("должен вернуть изображение материала", async () => {
      const mockImage = Buffer.from("image data");
      mockReq.params = { id: "1" };
      mockMaterialService.getImage.mockResolvedValue(mockImage);

      await controller.getImage(mockReq as Request, mockRes as Response);

      expect(mockMaterialService.getImage).toHaveBeenCalledWith(1);
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        "Content-Type",
        "image/jpeg",
      );
      expect(mockRes.send).toHaveBeenCalledWith(mockImage);
    });

    test("должен вернуть 404 если изображение не найдено", async () => {
      mockReq.params = { id: "1" };
      mockMaterialService.getImage.mockResolvedValue(null);

      await controller.getImage(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: "Изображение не найдено",
      });
    });
  });

  describe("uploadImage", () => {
    test("должен загрузить изображение", async () => {
      mockReq.params = { id: "1" };
      mockReq.file = { buffer: Buffer.from("image data") } as any;
      mockMaterialService.upsertImage.mockResolvedValue(undefined);

      await controller.uploadImage(mockReq as Request, mockRes as Response);

      expect(mockMaterialService.upsertImage).toHaveBeenCalledWith(
        1,
        expect.any(Buffer),
      );
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: "Изображение успешно загружено",
      });
    });

    test("должен вернуть 400 если файл не предоставлен", async () => {
      mockReq.params = { id: "1" };
      mockReq.file = undefined;

      await controller.uploadImage(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: "Файл изображения не предоставлен",
      });
    });
  });

  describe("deleteImage", () => {
    test("должен удалить изображение", async () => {
      mockReq.params = { id: "1" };
      mockMaterialService.deleteImage.mockResolvedValue(undefined);

      await controller.deleteImage(mockReq as Request, mockRes as Response);

      expect(mockMaterialService.deleteImage).toHaveBeenCalledWith(1);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: "Изображение успешно удалено",
      });
    });
  });
});
