import { Request, Response } from "express";
import {
  jest,
  expect,
  describe,
  it,
  beforeAll,
  beforeEach,
  afterAll,
} from "@jest/globals";

import { Material } from "@src/models";
import { MaterialController } from "@src/controllers";
import { pool } from "@src/db";
import { isSuccessResponse } from "@t/guards";
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from "@src/constants/messages";
import { SuccessResponse, ErrorResponse } from "@t/api";

describe("Material controller edge cases", () => {
  let materialController: MaterialController;
  const entityName = "material";

  beforeAll(() => {
    materialController = new MaterialController(pool);
  });

  beforeEach(async () => {
    await pool.query("DELETE FROM materials");
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("CREATE edge cases", () => {
    it("should reject creation with empty string name", async () => {
      const req = {
        body: { name: "" },
      } as Request;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await materialController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(errorResponse?.message).toBe(
        ERROR_MESSAGES.REQUIRED_FIELD("Material name"),
      );
    });

    it("should reject creation with whitespace-only name", async () => {
      const req = {
        body: { name: "   " },
      } as Request;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await materialController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(errorResponse?.message).toBe(
        ERROR_MESSAGES.REQUIRED_FIELD("Material name"),
      );
    });

    it("should reject creation with null name", async () => {
      const req = {
        body: { name: null },
      } as Request;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await materialController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(errorResponse?.message).toBe(
        ERROR_MESSAGES.REQUIRED_FIELD("Material name"),
      );
    });

    it("should reject creation with undefined name", async () => {
      const req = {
        body: {},
      } as Request;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await materialController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(errorResponse?.message).toBe(
        ERROR_MESSAGES.REQUIRED_FIELD("Material name"),
      );
    });

    it("should handle extremely long material names (1000+ characters)", async () => {
      const longName = "a".repeat(5000);

      const req = {
        body: { name: longName },
      } as Request;

      let successResponse: SuccessResponse<Material> | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation((data: SuccessResponse<Material>) => {
            successResponse = data;
          }),
      } as unknown as Response;

      await materialController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(successResponse?.data.name).toBe(longName);
      expect(successResponse?.message).toBe(
        SUCCESS_MESSAGES.CREATE(entityName),
      );
    });

    it("should reject duplicate material names", async () => {
      // Создаем первый материал
      const createReq1 = {
        body: { name: "Unique Material" },
      } as Request;

      const createRes1 = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await materialController.create(createReq1, createRes1);
      expect(createRes1.status).toHaveBeenCalledWith(201);

      // Пытаемся создать с таким же именем
      const createReq2 = {
        body: { name: "Unique Material" },
      } as Request;

      let errorResponse: ErrorResponse | undefined;
      const createRes2 = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await materialController.create(createReq2, createRes2);

      expect(createRes2.status).toHaveBeenCalledWith(400);
      expect(errorResponse?.message).toContain("already exists");
    });

    it("should handle special characters in material names", async () => {
      const specialNames = [
        "!@#$%^&*()",
        "材料テスト",
        "😊🎉🚀",
        "'; DROP TABLE materials; --",
        "<script>alert('xss')</script>",
        "Имя на русском",
        "name with\nnewline",
        "name\twith\ttabs",
        "name with emoji 🎨",
      ];

      for (const specialName of specialNames) {
        const req = {
          body: { name: specialName },
        } as Request;

        let successResponse: SuccessResponse<Material> | undefined;
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest
            .fn()
            .mockImplementation((data: SuccessResponse<Material>) => {
              successResponse = data;
            }),
        } as unknown as Response;

        await materialController.create(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(successResponse?.data.name).toBe(specialName);
        expect(successResponse?.message).toBe(
          SUCCESS_MESSAGES.CREATE(entityName),
        );
      }
    });
  });

  describe("FIND BY ID edge cases", () => {
    let createdMaterial: Material;

    beforeEach(async () => {
      const createReq = {
        body: { name: "Test Material" },
      } as Request;

      const createRes = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation((data: SuccessResponse<Material>) => {
            if (isSuccessResponse<Material>(data)) {
              createdMaterial = data.data;
            }
          }),
      } as unknown as Response;

      await materialController.create(createReq, createRes);
    });

    it("should handle non-existent ID", async () => {
      const req = {
        params: { id: "999999" },
      } as Request<{ id: string }>;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await materialController.findById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(errorResponse?.message).toContain("not found");
    });

    it("should handle negative IDs", async () => {
      const req = {
        params: { id: "-5" },
      } as Request<{ id: string }>;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await materialController.findById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(errorResponse?.message).toBe(
        ERROR_MESSAGES.INVALID_ID_FORMAT(entityName),
      );
    });

    it("should handle zero ID", async () => {
      const req = {
        params: { id: "0" },
      } as Request<{ id: string }>;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await materialController.findById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(errorResponse?.message).toBe(
        ERROR_MESSAGES.INVALID_ID_FORMAT(entityName),
      );
    });

    it("should handle non-numeric ID", async () => {
      const req = {
        params: { id: "abc" },
      } as Request<{ id: string }>;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await materialController.findById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(errorResponse?.message).toBe(
        ERROR_MESSAGES.INVALID_ID_FORMAT(entityName),
      );
    });

    it("should handle extremely large ID", async () => {
      const req = {
        params: { id: "999999999" },
      } as Request<{ id: string }>;

      let errorResponse: ErrorResponse;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await materialController.findById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should return material by ID", async () => {
      const req = {
        params: { id: String(createdMaterial.id) },
      } as Request<{ id: string }>;

      let successResponse: SuccessResponse<Material> | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation((data: SuccessResponse<Material>) => {
            successResponse = data;
          }),
      } as unknown as Response;

      await materialController.findById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(successResponse?.data.id).toBe(createdMaterial.id);
      expect(successResponse?.data.name).toBe(createdMaterial.name);
      expect(successResponse?.message).toBe(
        SUCCESS_MESSAGES.FIND_BY_ID(entityName, createdMaterial.id),
      );
    });
  });

  describe("UPDATE edge cases", () => {
    let createdMaterial: Material;

    beforeEach(async () => {
      const createReq = {
        body: { name: "Original Name" },
      } as Request;

      const createRes = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation((data: SuccessResponse<Material>) => {
            if (isSuccessResponse<Material>(data)) {
              createdMaterial = data.data;
            }
          }),
      } as unknown as Response;

      await materialController.create(createReq, createRes);
    });

    it("should reject update with empty name", async () => {
      const updateReq = {
        params: { id: String(createdMaterial.id) },
        body: { name: "" },
      } as unknown as Request<{ id: string }, {}, { name: string }>;

      let errorResponse: ErrorResponse | undefined;
      const updateRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await materialController.update(updateReq, updateRes);

      expect(updateRes.status).toHaveBeenCalledWith(400);
      expect(errorResponse?.message).toBe(
        ERROR_MESSAGES.EMPTY_FIELD("Material name"),
      );
    });

    it("should reject update with whitespace-only name", async () => {
      const updateReq = {
        params: { id: String(createdMaterial.id) },
        body: { name: "   " },
      } as unknown as Request<{ id: string }, {}, { name: string }>;

      let errorResponse: ErrorResponse | undefined;
      const updateRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await materialController.update(updateReq, updateRes);

      expect(updateRes.status).toHaveBeenCalledWith(400);
      expect(errorResponse?.message).toBe(
        ERROR_MESSAGES.EMPTY_FIELD("Material name"),
      );
    });

    it("should reject update to existing name (duplicate)", async () => {
      const createReq2 = {
        body: { name: "Second Material" },
      } as Request;

      const createRes2 = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await materialController.create(createReq2, createRes2);

      const updateReq = {
        params: { id: String(createdMaterial.id) },
        body: { name: "Second Material" },
      } as unknown as Request<{ id: string }, {}, { name: string }>;

      let errorResponse: ErrorResponse | undefined;
      const updateRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await materialController.update(updateReq, updateRes);

      expect(updateRes.status).toHaveBeenCalledWith(400);
      expect(errorResponse?.message).toContain("already exists");
    });

    it("should handle update of non-existent material", async () => {
      const updateReq = {
        params: { id: "999999" },
        body: { name: "New Name" },
      } as unknown as Request<{ id: string }, {}, { name: string }>;

      let errorResponse: ErrorResponse | undefined;
      const updateRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await materialController.update(updateReq, updateRes);

      expect(updateRes.status).toHaveBeenCalledWith(404);
      expect(errorResponse?.message).toContain("not found");
    });

    it("should successfully update material name", async () => {
      const newName = "Updated Name";
      const updateReq = {
        params: { id: String(createdMaterial.id) },
        body: { name: newName },
      } as unknown as Request<{ id: string }, {}, { name: string }>;

      let successResponse: SuccessResponse<Material> | undefined;
      const updateRes = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation((data: SuccessResponse<Material>) => {
            successResponse = data;
          }),
      } as unknown as Response;

      await materialController.update(updateReq, updateRes);

      expect(updateRes.status).toHaveBeenCalledWith(200);
      expect(successResponse?.data.name).toBe(newName);
      expect(successResponse?.message).toBe(
        SUCCESS_MESSAGES.UPDATE(entityName),
      );
    });
  });

  describe("DELETE edge cases", () => {
    let createdMaterial: Material;

    beforeEach(async () => {
      const createReq = {
        body: { name: "To Be Deleted" },
      } as Request;

      const createRes = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation((data: SuccessResponse<Material>) => {
            if (isSuccessResponse<Material>(data)) {
              createdMaterial = data.data;
            }
          }),
      } as unknown as Response;

      await materialController.create(createReq, createRes);
    });

    it("should handle deletion of non-existent material", async () => {
      const deleteReq = {
        params: { id: "999999" },
      } as Request<{ id: string }, {}, {}>;

      let errorResponse: ErrorResponse | undefined;
      const deleteRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await materialController.delete(deleteReq, deleteRes);

      expect(deleteRes.status).toHaveBeenCalledWith(404);
      expect(errorResponse?.message).toContain("not found");
    });

    it("should handle negative ID in delete", async () => {
      const deleteReq = {
        params: { id: "-5" },
      } as Request<{ id: string }, {}, {}>;

      let errorResponse: ErrorResponse | undefined;
      const deleteRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await materialController.delete(deleteReq, deleteRes);

      expect(deleteRes.status).toHaveBeenCalledWith(400);
      expect(errorResponse?.message).toBe(
        ERROR_MESSAGES.INVALID_ID_FORMAT(entityName),
      );
    });

    it("should allow double deletion (second should fail)", async () => {
      // Первое удаление
      const deleteReq1 = {
        params: { id: String(createdMaterial.id) },
      } as Request<{ id: string }, {}, {}>;

      let successResponse: SuccessResponse<Material> | undefined;
      const deleteRes1 = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation((data: SuccessResponse<Material>) => {
            successResponse = data;
          }),
      } as unknown as Response;

      await materialController.delete(deleteReq1, deleteRes1);
      expect(deleteRes1.status).toHaveBeenCalledWith(200);
      expect(successResponse?.message).toBe(
        SUCCESS_MESSAGES.DELETE(entityName),
      );

      // Второе удаление того же ID
      const deleteReq2 = {
        params: { id: String(createdMaterial.id) },
      } as Request<{ id: string }, {}, {}>;

      let errorResponse: ErrorResponse | undefined;
      const deleteRes2 = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await materialController.delete(deleteReq2, deleteRes2);

      expect(deleteRes2.status).toHaveBeenCalledWith(404);
      expect(errorResponse?.message).toContain("not found");
    });
  });

  describe("SEARCH edge cases", () => {
    beforeEach(async () => {
      const materials = [
        "Test Material 1",
        "Test Material 2",
        "Special @#$ Material",
        "Материал на русском",
        "Material with emoji 🎨",
      ];

      for (const name of materials) {
        const req = { body: { name } } as Request;
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        } as unknown as Response;
        await materialController.create(req, res);
      }
    });

    it("should handle empty search string", async () => {
      const req = {
        params: { search: "" },
      } as Request<{ search: string }, {}, {}>;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await materialController.search(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(errorResponse?.message).toBe(ERROR_MESSAGES.SEARCH_QUERY_REQUIRED);
    });

    it("should handle whitespace-only search", async () => {
      const req = {
        params: { search: "   " },
      } as Request<{ search: string }, {}, {}>;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await materialController.search(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(errorResponse?.message).toBe(ERROR_MESSAGES.SEARCH_QUERY_REQUIRED);
    });

    it("should return empty array for non-matching search", async () => {
      const req = {
        params: { search: "NonexistentPattern123!@#" },
      } as Request<{ search: string }, {}, {}>;

      let successResponse: SuccessResponse<Material[]> | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation((data: SuccessResponse<Material[]>) => {
            successResponse = data;
          }),
      } as unknown as Response;

      await materialController.search(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(successResponse?.data.length).toBe(0);
      expect(successResponse?.message).toBe(
        SUCCESS_MESSAGES.SEARCH(entityName, 0),
      );
    });

    it("should handle very long search string", async () => {
      const longSearch = "a".repeat(1000);

      const req = {
        params: { search: longSearch },
      } as Request<{ search: string }, {}, {}>;

      let successResponse: SuccessResponse<Material[]> | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation((data: SuccessResponse<Material[]>) => {
            successResponse = data;
          }),
      } as unknown as Response;

      await materialController.search(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(successResponse?.message).toBe(
        SUCCESS_MESSAGES.SEARCH(entityName, 0),
      );
    });

    it("should handle search with special regex characters", async () => {
      const specialSearches = [
        ".*",
        "[a-z]",
        "^test$",
        "|",
        "?",
        "*",
        "+",
        "\\",
      ];

      for (const search of specialSearches) {
        const req = {
          params: { search },
        } as Request<{ search: string }, {}, {}>;

        let successResponse: SuccessResponse<Material[]> | undefined;
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest
            .fn()
            .mockImplementation((data: SuccessResponse<Material[]>) => {
              successResponse = data;
            }),
        } as unknown as Response;

        await materialController.search(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(successResponse?.message).toBe(
          SUCCESS_MESSAGES.SEARCH(
            entityName,
            successResponse?.data.length || 0,
          ),
        );
      }
    });

    it("should return materials matching search query", async () => {
      const req = {
        params: { search: "Test" },
      } as Request<{ search: string }, {}, {}>;

      let successResponse: SuccessResponse<Material[]> | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation((data: SuccessResponse<Material[]>) => {
            successResponse = data;
          }),
      } as unknown as Response;

      await materialController.search(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(successResponse?.data.length).toBe(2);
      expect(successResponse?.message).toBe(
        SUCCESS_MESSAGES.SEARCH(entityName, 2),
      );
    });
  });

  describe("FIND ALL edge cases", () => {
    it("should return empty array when no materials exist", async () => {
      const req = {} as Request;

      let successResponse: SuccessResponse<Material[]> | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation((data: SuccessResponse<Material[]>) => {
            successResponse = data;
          }),
      } as unknown as Response;

      await materialController.findAll(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(successResponse?.data.length).toBe(0);
      expect(successResponse?.message).toBe(
        SUCCESS_MESSAGES.FIND_ALL(entityName),
      );
    });

    it("should return all created materials", async () => {
      // Создаем несколько материалов
      const materials = ["Material 1", "Material 2", "Material 3"];
      for (const name of materials) {
        const req = { body: { name } } as Request;
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        } as unknown as Response;
        await materialController.create(req, res);
      }

      const req = {} as Request;
      let successResponse: SuccessResponse<Material[]> | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation((data: SuccessResponse<Material[]>) => {
            successResponse = data;
          }),
      } as unknown as Response;

      await materialController.findAll(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(successResponse?.data.length).toBe(3);
      expect(successResponse?.data.map((m) => m.name)).toEqual(
        expect.arrayContaining(materials),
      );
      expect(successResponse?.message).toBe(
        SUCCESS_MESSAGES.FIND_ALL(entityName),
      );
    });
  });

  describe("CONCURRENCY edge cases", () => {
    it("should handle multiple simultaneous creations", async () => {
      const createPromises = [];
      const names = [];

      for (let i = 0; i < 10; i++) {
        const name = `Concurrent Material ${i}`;
        names.push(name);

        const req = { body: { name } } as Request;
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        } as unknown as Response;

        createPromises.push(materialController.create(req, res));
      }

      await Promise.all(createPromises);

      const findAllReq = {} as Request;
      let allMaterials: Material[] = [];
      const findAllRes = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation((data: SuccessResponse<Material[]>) => {
            if (isSuccessResponse<Material[]>(data)) {
              allMaterials = data.data;
            }
          }),
      } as unknown as Response;

      await materialController.findAll(findAllReq, findAllRes);

      expect(allMaterials.length).toBe(10);
      names.forEach((name) => {
        expect(allMaterials.some((m) => m.name === name)).toBeTruthy();
      });
    });

    it("should handle concurrent updates to same material", async () => {
      const createReq = {
        body: { name: "Concurrent Update Test" },
      } as Request;

      let createdMaterial: Material;
      const createRes = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation((data: SuccessResponse<Material>) => {
            if (isSuccessResponse<Material>(data)) {
              createdMaterial = data.data;
            }
          }),
      } as unknown as Response;

      await materialController.create(createReq, createRes);

      const updatePromises = [];
      for (let i = 0; i < 5; i++) {
        const updateReq = {
          params: { id: String(createdMaterial!.id) },
          body: { name: `Updated Name ${i}` },
        } as unknown as Request<{ id: string }, {}, { name: string }>;

        const updateRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        } as unknown as Response;

        updatePromises.push(materialController.update(updateReq, updateRes));
      }

      await expect(Promise.all(updatePromises)).resolves.not.toThrow();
    });
  });
});
