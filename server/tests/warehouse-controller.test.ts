// tests/warehouse-controller.test.ts

import { Request, Response } from "express";
import { WarehouseController } from "@src/controllers/WarehouseController";
import { pool } from "@src/db";
import {
  jest,
  expect,
  describe,
  it,
  beforeAll,
  beforeEach,
  afterAll,
} from "@jest/globals";
import {
  Warehouse,
  Organization,
  User,
  WarehouseWithMaterialsAndOrganization,
  Material,
  WarehouseMaterial,
} from "@shared/models";
import { isSuccessResponse, isErrorResponse } from "@shared/types";
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from "@shared/constants";
import { SuccessResponse, ErrorResponse } from "@shared/types";

describe("Warehouse Controller", () => {
  let warehouseController: WarehouseController;
  let testOrganization: Organization;
  let secondOrganization: Organization;
  let testManager: User;
  let testWarehouse: Warehouse;
  let testMaterial: Material;
  let secondMaterial: Material;

  beforeAll(async () => {
    warehouseController = new WarehouseController(pool);
  });

  beforeEach(async () => {
    // Очищаем таблицы в правильном порядке
    await pool.query("DELETE FROM warehouse_material");
    await pool.query("DELETE FROM agreements");
    await pool.query("DELETE FROM warehouses");
    await pool.query("DELETE FROM materials");
    await pool.query("DELETE FROM app_users");
    await pool.query("DELETE FROM organizations");

    // Создаем тестовые организации
    const orgResult = await pool.query<Organization>(
      "INSERT INTO organizations (name, latitude, longitude) VALUES ($1, $2, $3) RETURNING *",
      ["Test Organization", 55.7558, 37.6176],
    );
    testOrganization = orgResult.rows[0];

    const secondOrgResult = await pool.query<Organization>(
      "INSERT INTO organizations (name, latitude, longitude) VALUES ($1, $2, $3) RETURNING *",
      ["Second Organization", 40.7128, -74.006],
    );
    secondOrganization = secondOrgResult.rows[0];

    // Создаем тестового менеджера
    const managerResult = await pool.query<User>(
      `INSERT INTO app_users (name, organization_id, password, is_admin)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      ["Test Manager", testOrganization.id, "hashedpassword123", false],
    );
    testManager = managerResult.rows[0];

    // Создаем тестовые материалы
    const materialResult = await pool.query<Material>(
      `INSERT INTO materials (name) VALUES ($1) RETURNING *`,
      ["Test Material"],
    );
    testMaterial = materialResult.rows[0];

    const secondMaterialResult = await pool.query<Material>(
      `INSERT INTO materials (name) VALUES ($1) RETURNING *`,
      ["Second Material"],
    );
    secondMaterial = secondMaterialResult.rows[0];
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("CREATE", () => {
    it("should create a warehouse successfully", async () => {
      const req = {
        body: {
          name: "New Warehouse",
          organization_id: testOrganization.id,
          manager_id: testManager.id,
          latitude: 55.7558,
          longitude: 37.6176,
        },
      } as Request;

      let successResponse: SuccessResponse<Warehouse> | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation((data: SuccessResponse<Warehouse>) => {
            successResponse = data;
          }),
      } as unknown as Response;

      await warehouseController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(isSuccessResponse(successResponse)).toBe(true);
      if (isSuccessResponse(successResponse)) {
        expect(successResponse.data.name).toBe("New Warehouse");
        expect(successResponse.data.organization_id).toBe(testOrganization.id);
        expect(successResponse.data.manager_id).toBe(testManager.id);
        expect(successResponse.data.latitude).toBe(55.7558);
        expect(successResponse.data.longitude).toBe(37.6176);
      }
    });

    it("should create warehouse without manager", async () => {
      const req = {
        body: {
          name: "Warehouse No Manager",
          organization_id: testOrganization.id,
          latitude: 55.7558,
          longitude: 37.6176,
        },
      } as Request;

      let successResponse: SuccessResponse<Warehouse> | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation((data: SuccessResponse<Warehouse>) => {
            successResponse = data;
          }),
      } as unknown as Response;

      await warehouseController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(isSuccessResponse(successResponse)).toBe(true);
      if (isSuccessResponse(successResponse)) {
        expect(successResponse.data.manager_id).toBeNull();
      }
    });

    it("should reject creation with empty name", async () => {
      const req = {
        body: {
          name: "",
          organization_id: testOrganization.id,
          latitude: 55.7558,
          longitude: 37.6176,
        },
      } as Request;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await warehouseController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
    });

    it("should reject creation with missing organization_id", async () => {
      const req = {
        body: {
          name: "Test Warehouse",
          latitude: 55.7558,
          longitude: 37.6176,
        },
      } as Request;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await warehouseController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
    });

    it("should reject creation with non-existent organization", async () => {
      const req = {
        body: {
          name: "Test Warehouse",
          organization_id: 999999,
          latitude: 55.7558,
          longitude: 37.6176,
        },
      } as Request;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await warehouseController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(isErrorResponse(errorResponse)).toBe(true);
    });

    it("should reject creation with invalid latitude", async () => {
      const req = {
        body: {
          name: "Test Warehouse",
          organization_id: testOrganization.id,
          latitude: 100,
          longitude: 37.6176,
        },
      } as Request;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await warehouseController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
    });

    it("should reject creation with invalid longitude", async () => {
      const req = {
        body: {
          name: "Test Warehouse",
          organization_id: testOrganization.id,
          latitude: 55.7558,
          longitude: 200,
        },
      } as Request;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await warehouseController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
    });
  });

  describe("FIND ALL", () => {
    beforeEach(async () => {
      // Создаем несколько складов
      await pool.query(
        `INSERT INTO warehouses (name, organization_id, latitude, longitude)
         VALUES 
           ('Warehouse 1', $1, 55.7558, 37.6176),
           ('Warehouse 2', $1, 59.9343, 30.3351),
           ('Warehouse 3', $2, 40.7128, -74.006)`,
        [testOrganization.id, secondOrganization.id],
      );
    });

    it("should return all warehouses", async () => {
      const req = {} as Request;

      let successResponse:
        | SuccessResponse<WarehouseWithMaterialsAndOrganization[]>
        | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation(
            (
              data: SuccessResponse<WarehouseWithMaterialsAndOrganization[]>,
            ) => {
              successResponse = data;
            },
          ),
      } as unknown as Response;

      await warehouseController.findAll(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(isSuccessResponse(successResponse)).toBe(true);
      if (isSuccessResponse(successResponse)) {
        expect(successResponse.data.length).toBe(3);
      }
    });

    it("should return empty array when no warehouses exist", async () => {
      await pool.query("DELETE FROM warehouses");

      const req = {} as Request;

      let successResponse:
        | SuccessResponse<WarehouseWithMaterialsAndOrganization[]>
        | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation(
            (
              data: SuccessResponse<WarehouseWithMaterialsAndOrganization[]>,
            ) => {
              successResponse = data;
            },
          ),
      } as unknown as Response;

      await warehouseController.findAll(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(isSuccessResponse(successResponse)).toBe(true);
      if (isSuccessResponse(successResponse)) {
        expect(successResponse.data.length).toBe(0);
      }
    });
  });

  describe("FIND BY ID", () => {
    beforeEach(async () => {
      const result = await pool.query<Warehouse>(
        `INSERT INTO warehouses (name, organization_id, latitude, longitude)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        ["Test Warehouse", testOrganization.id, 55.7558, 37.6176],
      );
      testWarehouse = result.rows[0];
    });

    it("should find warehouse by id", async () => {
      const req = {
        params: { id: String(testWarehouse.id) },
      } as Request<{ id: string }>;

      let successResponse:
        | SuccessResponse<WarehouseWithMaterialsAndOrganization>
        | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation(
            (data: SuccessResponse<WarehouseWithMaterialsAndOrganization>) => {
              successResponse = data;
            },
          ),
      } as unknown as Response;

      await warehouseController.findById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(isSuccessResponse(successResponse)).toBe(true);
      if (isSuccessResponse(successResponse)) {
        expect(successResponse.data.id).toBe(testWarehouse.id);
        expect(successResponse.data.name).toBe("Test Warehouse");
      }
    });

    it("should return 404 for non-existent id", async () => {
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

      await warehouseController.findById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(isErrorResponse(errorResponse)).toBe(true);
    });

    it("should return 400 for invalid id format", async () => {
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

      await warehouseController.findById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
    });
  });

  describe("UPDATE", () => {
    beforeEach(async () => {
      const result = await pool.query<Warehouse>(
        `INSERT INTO warehouses (name, organization_id, manager_id, latitude, longitude)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [
          "Original Name",
          testOrganization.id,
          testManager.id,
          55.7558,
          37.6176,
        ],
      );
      testWarehouse = result.rows[0];
    });

    it("should update warehouse name", async () => {
      const req = {
        params: { id: String(testWarehouse.id) },
        body: { name: "Updated Name" },
      } as Request<{ id: string }, {}, any>;

      let successResponse: SuccessResponse<Warehouse> | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation((data: SuccessResponse<Warehouse>) => {
            successResponse = data;
          }),
      } as unknown as Response;

      await warehouseController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(isSuccessResponse(successResponse)).toBe(true);
      if (isSuccessResponse(successResponse)) {
        expect(successResponse.data.name).toBe("Updated Name");
      }
    });

    it("should update warehouse manager", async () => {
      const req = {
        params: { id: String(testWarehouse.id) },
        body: { manager_id: null },
      } as Request<{ id: string }, {}, any>;

      let successResponse: SuccessResponse<Warehouse> | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation((data: SuccessResponse<Warehouse>) => {
            successResponse = data;
          }),
      } as unknown as Response;

      await warehouseController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(isSuccessResponse(successResponse)).toBe(true);
      if (isSuccessResponse(successResponse)) {
        expect(successResponse.data.manager_id).toBeNull();
      }
    });

    it("should update warehouse coordinates", async () => {
      const req = {
        params: { id: String(testWarehouse.id) },
        body: { latitude: 40.7128, longitude: -74.006 },
      } as Request<{ id: string }, {}, any>;

      let successResponse: SuccessResponse<Warehouse> | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation((data: SuccessResponse<Warehouse>) => {
            successResponse = data;
          }),
      } as unknown as Response;

      await warehouseController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(isSuccessResponse(successResponse)).toBe(true);
      if (isSuccessResponse(successResponse)) {
        expect(successResponse.data.latitude).toBe(40.7128);
        expect(successResponse.data.longitude).toBe(-74.006);
      }
    });

    it("should reject update with empty name", async () => {
      const req = {
        params: { id: String(testWarehouse.id) },
        body: { name: "" },
      } as Request<{ id: string }, {}, any>;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await warehouseController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
    });
  });

  describe("DELETE", () => {
    beforeEach(async () => {
      const result = await pool.query<Warehouse>(
        `INSERT INTO warehouses (name, organization_id, latitude, longitude)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        ["To Be Deleted", testOrganization.id, 55.7558, 37.6176],
      );
      testWarehouse = result.rows[0];
    });

    it("should delete warehouse", async () => {
      const req = {
        params: { id: String(testWarehouse.id) },
      } as Request<{ id: string }>;

      let successResponse: SuccessResponse<Warehouse> | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation((data: SuccessResponse<Warehouse>) => {
            successResponse = data;
          }),
      } as unknown as Response;

      await warehouseController.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(isSuccessResponse(successResponse)).toBe(true);

      // Проверяем, что склад действительно удален
      const checkResult = await pool.query(
        "SELECT * FROM warehouses WHERE id = $1",
        [testWarehouse.id],
      );
      expect(checkResult.rows.length).toBe(0);
    });

    it("should return 404 for non-existent warehouse", async () => {
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

      await warehouseController.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(isErrorResponse(errorResponse)).toBe(true);
    });
  });

  describe("SEARCH", () => {
    beforeEach(async () => {
      const warehouses = [
        ["Main Warehouse"],
        ["Secondary Storage"],
        ["Warehouse Alpha"],
        ["Beta Facility"],
        ["Gamma Depot"],
      ];

      for (const [name] of warehouses) {
        await pool.query(
          `INSERT INTO warehouses (name, organization_id, latitude, longitude)
           VALUES ($1, $2, $3, $4)`,
          [name, testOrganization.id, 55.7558, 37.6176],
        );
      }
    });

    it("should search warehouses by name", async () => {
      const req = {
        query: { q: "Warehouse" },
      } as unknown as Request;

      let successResponse:
        | SuccessResponse<WarehouseWithMaterialsAndOrganization[]>
        | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation(
            (
              data: SuccessResponse<WarehouseWithMaterialsAndOrganization[]>,
            ) => {
              successResponse = data;
            },
          ),
      } as unknown as Response;

      await warehouseController.search(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(isSuccessResponse(successResponse)).toBe(true);
      if (isSuccessResponse(successResponse)) {
        expect(successResponse.data.length).toBeGreaterThan(0);
        successResponse.data.forEach((item) => {
          expect(item.name.toLowerCase()).toContain("warehouse");
        });
      }
    });

    it("should return empty array for non-matching search", async () => {
      const req = {
        query: { q: "Nonexistent" },
      } as unknown as Request;

      let successResponse:
        | SuccessResponse<WarehouseWithMaterialsAndOrganization[]>
        | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation(
            (
              data: SuccessResponse<WarehouseWithMaterialsAndOrganization[]>,
            ) => {
              successResponse = data;
            },
          ),
      } as unknown as Response;

      await warehouseController.search(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(isSuccessResponse(successResponse)).toBe(true);
      if (isSuccessResponse(successResponse)) {
        expect(successResponse.data.length).toBe(0);
      }
    });

    it("should return 400 for empty search query", async () => {
      const req = {
        query: { q: "" },
      } as unknown as Request;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await warehouseController.search(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
    });
  });

  describe("WAREHOUSE MATERIALS", () => {
    beforeEach(async () => {
      // Создаем склад
      const warehouseResult = await pool.query<Warehouse>(
        `INSERT INTO warehouses (name, organization_id, latitude, longitude)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        ["Material Warehouse", testOrganization.id, 55.7558, 37.6176],
      );
      testWarehouse = warehouseResult.rows[0];
    });

    describe("ADD MATERIAL", () => {
      it("should add material to warehouse", async () => {
        const req = {
          params: { id: String(testWarehouse.id) },
          body: { materialId: testMaterial.id, amount: 100 },
        } as Request<
          { id: string },
          {},
          { materialId: number; amount: number }
        >;

        let successResponse: SuccessResponse<WarehouseMaterial> | undefined;
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockImplementation((data: SuccessResponse<any>) => {
            successResponse = data;
          }),
        } as unknown as Response;

        await warehouseController.addMaterial(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(isSuccessResponse(successResponse)).toBe(true);
        if (isSuccessResponse(successResponse)) {
          expect(successResponse.data.warehouse_id).toBe(testWarehouse.id);
          expect(successResponse.data.material_id).toBe(testMaterial.id);
          expect(successResponse.data.amount).toBe(100);
        }
      });

      it("should increase amount when adding existing material", async () => {
        // Сначала добавляем материал
        await pool.query(
          `INSERT INTO warehouse_material (warehouse_id, material_id, amount)
           VALUES ($1, $2, $3)`,
          [testWarehouse.id, testMaterial.id, 100],
        );

        // Добавляем тот же материал снова
        const req = {
          params: { id: String(testWarehouse.id) },
          body: { materialId: testMaterial.id, amount: 50 },
        } as Request<
          { id: string },
          {},
          { materialId: number; amount: number }
        >;

        let successResponse: SuccessResponse<WarehouseMaterial> | undefined;
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockImplementation((data: SuccessResponse<any>) => {
            successResponse = data;
          }),
        } as unknown as Response;

        await warehouseController.addMaterial(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(isSuccessResponse(successResponse)).toBe(true);
        if (isSuccessResponse(successResponse)) {
          expect(successResponse.data.amount).toBe(150);
        }
      });

      it("should reject adding material with negative amount", async () => {
        const req = {
          params: { id: String(testWarehouse.id) },
          body: { materialId: testMaterial.id, amount: -50 },
        } as Request<
          { id: string },
          {},
          { materialId: number; amount: number }
        >;

        let errorResponse: ErrorResponse | undefined;
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockImplementation((data: ErrorResponse) => {
            errorResponse = data;
          }),
        } as unknown as Response;

        await warehouseController.addMaterial(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(isErrorResponse(errorResponse)).toBe(true);
      });

      it("should reject adding non-existent material", async () => {
        const req = {
          params: { id: String(testWarehouse.id) },
          body: { materialId: 999999, amount: 100 },
        } as Request<
          { id: string },
          {},
          { materialId: number; amount: number }
        >;

        let errorResponse: ErrorResponse | undefined;
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockImplementation((data: ErrorResponse) => {
            errorResponse = data;
          }),
        } as unknown as Response;

        await warehouseController.addMaterial(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(isErrorResponse(errorResponse)).toBe(true);
      });
    });

    describe("UPDATE MATERIAL AMOUNT", () => {
      beforeEach(async () => {
        await pool.query(
          `INSERT INTO warehouse_material (warehouse_id, material_id, amount)
           VALUES ($1, $2, $3)`,
          [testWarehouse.id, testMaterial.id, 100],
        );
      });

      it("should update material amount", async () => {
        const req = {
          params: {
            id: String(testWarehouse.id),
            materialId: String(testMaterial.id),
          },
          body: { amount: 250 },
        } as Request<
          { id: string; materialId: string },
          {},
          { amount: number }
        >;

        let successResponse: SuccessResponse<WarehouseMaterial> | undefined;
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockImplementation((data: SuccessResponse<any>) => {
            successResponse = data;
          }),
        } as unknown as Response;

        await warehouseController.updateMaterialAmount(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(isSuccessResponse(successResponse)).toBe(true);
        if (isSuccessResponse(successResponse)) {
          expect(successResponse.data.amount).toBe(250);
        }
      });

      it("should allow setting amount to zero", async () => {
        const req = {
          params: {
            id: String(testWarehouse.id),
            materialId: String(testMaterial.id),
          },
          body: { amount: 0 },
        } as Request<
          { id: string; materialId: string },
          {},
          { amount: number }
        >;

        let successResponse: SuccessResponse<WarehouseMaterial> | undefined;
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockImplementation((data: SuccessResponse<any>) => {
            successResponse = data;
          }),
        } as unknown as Response;

        await warehouseController.updateMaterialAmount(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(isSuccessResponse(successResponse)).toBe(true);
        if (isSuccessResponse(successResponse)) {
          expect(successResponse.data.amount).toBe(0);
        }
      });

      it("should reject negative amount", async () => {
        const req = {
          params: {
            id: String(testWarehouse.id),
            materialId: String(testMaterial.id),
          },
          body: { amount: -50 },
        } as Request<
          { id: string; materialId: string },
          {},
          { amount: number }
        >;

        let errorResponse: ErrorResponse | undefined;
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockImplementation((data: ErrorResponse) => {
            errorResponse = data;
          }),
        } as unknown as Response;

        await warehouseController.updateMaterialAmount(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(isErrorResponse(errorResponse)).toBe(true);
      });
    });

    describe("REMOVE MATERIAL", () => {
      beforeEach(async () => {
        await pool.query(
          `INSERT INTO warehouse_material (warehouse_id, material_id, amount)
           VALUES ($1, $2, $3)`,
          [testWarehouse.id, testMaterial.id, 100],
        );
      });

      it("should remove material from warehouse", async () => {
        const req = {
          params: {
            id: String(testWarehouse.id),
            materialId: String(testMaterial.id),
          },
        } as Request<{ id: string; materialId: string }>;

        let successResponse: SuccessResponse<any> | undefined;
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockImplementation((data: SuccessResponse<any>) => {
            successResponse = data;
          }),
        } as unknown as Response;

        await warehouseController.removeMaterial(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(isSuccessResponse(successResponse)).toBe(true);

        // Проверяем, что запись удалена
        const checkResult = await pool.query(
          "SELECT * FROM warehouse_material WHERE warehouse_id = $1 AND material_id = $2",
          [testWarehouse.id, testMaterial.id],
        );
        expect(checkResult.rows.length).toBe(0);
      });

      it("should return 404 when removing non-existent material", async () => {
        const req = {
          params: {
            id: String(testWarehouse.id),
            materialId: String(secondMaterial.id),
          },
        } as Request<{ id: string; materialId: string }>;

        let errorResponse: ErrorResponse | undefined;
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockImplementation((data: ErrorResponse) => {
            errorResponse = data;
          }),
        } as unknown as Response;

        await warehouseController.removeMaterial(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(isErrorResponse(errorResponse)).toBe(true);
      });
    });

    describe("GET MATERIALS", () => {
      beforeEach(async () => {
        // Добавляем несколько материалов на склад
        await pool.query(
          `INSERT INTO warehouse_material (warehouse_id, material_id, amount)
           VALUES 
             ($1, $2, 100),
             ($1, $3, 200)`,
          [testWarehouse.id, testMaterial.id, secondMaterial.id],
        );
      });

      it("should get all materials from warehouse", async () => {
        const req = {
          params: { id: String(testWarehouse.id) },
        } as Request<{ id: string }>;

        const mockStatus = jest.fn().mockReturnThis();
        const mockJson = jest.fn();

        const res = {
          status: mockStatus,
          json: mockJson,
        } as unknown as Response;

        await warehouseController.getMaterials(req, res);

        // Логируем все вызовы
        console.log("Status calls:", mockStatus.mock.calls);
        console.log(
          "JSON calls:",
          mockJson.mock.calls.map((call) => call[0]),
        );

        expect(mockStatus).toHaveBeenCalledWith(200);
      });

      it("should return empty array for warehouse with no materials", async () => {
        // Создаем новый склад без материалов
        const emptyWarehouseResult = await pool.query<Warehouse>(
          `INSERT INTO warehouses (name, organization_id, latitude, longitude)
           VALUES ($1, $2, $3, $4) RETURNING *`,
          ["Empty Warehouse", testOrganization.id, 55.7558, 37.6176],
        );
        const emptyWarehouse = emptyWarehouseResult.rows[0];

        const req = {
          params: { id: String(emptyWarehouse.id) },
        } as Request<{ id: string }>;

        let successResponse: SuccessResponse<any[]> | undefined;
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockImplementation((data: SuccessResponse<any[]>) => {
            successResponse = data;
          }),
        } as unknown as Response;

        await warehouseController.getMaterials(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(isSuccessResponse(successResponse)).toBe(true);
        if (isSuccessResponse(successResponse)) {
          expect(successResponse.data.length).toBe(0);
        }
      });
    });
  });
});
