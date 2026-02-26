import { Request, Response } from "express";
import { WarehouseController } from "@src/controllers";
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
} from "@src/models";
import { isSuccessResponse, isErrorResponse } from "@t/guards";
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from "@src/constants/messages";
import { SuccessResponse, ErrorResponse } from "@t/api";

describe("Warehouse Controller Edge Cases", () => {
  let warehouseController: WarehouseController;
  let testOrganization: Organization;
  let testManager: User;
  let secondOrganization: Organization;
  const entityName = "warehouse";

  beforeAll(async () => {
    warehouseController = new WarehouseController(pool);
  });

  beforeEach(async () => {
    // Очищаем таблицы в правильном порядке (учитывая внешние ключи)
    await pool.query("DELETE FROM warehouse_material");
    await pool.query("DELETE FROM agreements");
    await pool.query("DELETE FROM warehouses");
    await pool.query("DELETE FROM app_users");
    await pool.query("DELETE FROM organizations");

    // Создаем тестовую организацию
    const organizationResult = await pool.query<Organization>(
      "INSERT INTO organizations (name, latitude, longitude) VALUES ($1, $2, $3) RETURNING *",
      ["Test Organization", 55.7558, 37.6176],
    );
    testOrganization = organizationResult.rows[0];

    // Создаем вторую организацию
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
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("CREATE edge cases", () => {
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
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toContain("Warehouse name is required");
      }
    });

    it("should reject creation with whitespace-only name", async () => {
      const req = {
        body: {
          name: "   ",
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
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toContain("Warehouse name is required");
      }
    });

    it("should reject creation with missing name", async () => {
      const req = {
        body: {
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
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toContain("Warehouse name is required");
      }
    });

    it("should reject creation with null name", async () => {
      const req = {
        body: {
          name: null,
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
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toContain("Warehouse name is required");
      }
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
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toContain("Organization ID is required");
      }
    });

    it("should reject creation with empty organization_id", async () => {
      const req = {
        body: {
          name: "Test Warehouse",
          organization_id: "",
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
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toContain("Organization ID is required");
      }
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
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toContain(
          "Organization with id 999999 not found",
        );
      }
    });

    describe("Coordinate validation", () => {
      it("should reject latitude below -90", async () => {
        const req = {
          body: {
            name: "Test Warehouse",
            organization_id: testOrganization.id,
            latitude: -91,
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
        if (isErrorResponse(errorResponse)) {
          expect(errorResponse.message).toContain(
            "Latitude must be between -90 and 90",
          );
        }
      });

      it("should reject latitude above 90", async () => {
        const req = {
          body: {
            name: "Test Warehouse",
            organization_id: testOrganization.id,
            latitude: 91,
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
        if (isErrorResponse(errorResponse)) {
          expect(errorResponse.message).toContain(
            "Latitude must be between -90 and 90",
          );
        }
      });

      it("should reject longitude below -180", async () => {
        const req = {
          body: {
            name: "Test Warehouse",
            organization_id: testOrganization.id,
            latitude: 55.7558,
            longitude: -181,
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
        if (isErrorResponse(errorResponse)) {
          expect(errorResponse.message).toContain(
            "Longitude must be between -180 and 180",
          );
        }
      });

      it("should reject longitude above 180", async () => {
        const req = {
          body: {
            name: "Test Warehouse",
            organization_id: testOrganization.id,
            latitude: 55.7558,
            longitude: 181,
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
        if (isErrorResponse(errorResponse)) {
          expect(errorResponse.message).toContain(
            "Longitude must be between -180 and 180",
          );
        }
      });

      it("should accept valid coordinates", async () => {
        const req = {
          body: {
            name: "Test Warehouse",
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
          expect(successResponse.data.name).toBe("Test Warehouse");
          expect(successResponse.data.latitude).toBe(55.7558);
          expect(successResponse.data.longitude).toBe(37.6176);
          expect(successResponse.data.organization_id).toBe(
            testOrganization.id,
          );
          expect(successResponse.message).toBe(
            SUCCESS_MESSAGES.CREATE(entityName),
          );
        }
      });
    });

    it("should create warehouse with manager assigned", async () => {
      const req = {
        body: {
          name: "Warehouse With Manager",
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
        expect(successResponse.data.name).toBe("Warehouse With Manager");
        expect(successResponse.data.manager_id).toBe(testManager.id);
        expect(successResponse.message).toBe(
          SUCCESS_MESSAGES.CREATE(entityName),
        );
      }
    });

    it("should reject creation with non-existent manager", async () => {
      const req = {
        body: {
          name: "Warehouse With Invalid Manager",
          organization_id: testOrganization.id,
          manager_id: 999999,
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
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toContain(
          "Manager with id 999999 not found",
        );
      }
    });

    it("should handle extremely long warehouse names", async () => {
      const longName = "a".repeat(1000);

      const req = {
        body: {
          name: longName,
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
        expect(successResponse.data.name).toBe(longName);
        expect(successResponse.message).toBe(
          SUCCESS_MESSAGES.CREATE(entityName),
        );
      }
    });

    it("should handle special characters in warehouse names", async () => {
      const specialNames = [
        "Warehouse!@#$%^&*()",
        "Склад на русском",
        "倉庫テスト",
        "Warehouse with emoji 🏭",
        "'; DROP TABLE warehouses; --",
        "<script>alert('xss')</script>",
        "name with\nnewline",
        "name\twith\ttabs",
      ];

      for (const specialName of specialNames) {
        const req = {
          body: {
            name: specialName,
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
          expect(successResponse.data.name).toBe(specialName);
          expect(successResponse.message).toBe(
            SUCCESS_MESSAGES.CREATE(entityName),
          );
        }
      }
    });
  });

  describe("FIND BY ID edge cases", () => {
    let createdWarehouse: Warehouse;

    beforeEach(async () => {
      const createReq = {
        body: {
          name: "Test Warehouse",
          organization_id: testOrganization.id,
          latitude: 55.7558,
          longitude: 37.6176,
        },
      } as Request;

      const createRes = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation((data: SuccessResponse<Warehouse>) => {
            if (isSuccessResponse<Warehouse>(data)) {
              createdWarehouse = data.data;
            }
          }),
      } as unknown as Response;

      await warehouseController.create(createReq, createRes);
    });

    it("should handle non-existent ID", async () => {
      const req = {
        params: { id: "999999" },
      } as Request<{ id: string }, {}, {}>;

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
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toContain("not found");
      }
    });

    it("should handle negative IDs", async () => {
      const req = {
        params: { id: "-5" },
      } as Request<{ id: string }, {}, {}>;

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
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toBe(
          ERROR_MESSAGES.INVALID_ID_FORMAT(entityName),
        );
      }
    });

    it("should handle zero ID", async () => {
      const req = {
        params: { id: "0" },
      } as Request<{ id: string }, {}, {}>;

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
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toBe(
          ERROR_MESSAGES.INVALID_ID_FORMAT(entityName),
        );
      }
    });

    it("should handle non-numeric ID", async () => {
      const req = {
        params: { id: "abc" },
      } as Request<{ id: string }, {}, {}>;

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
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toBe(
          ERROR_MESSAGES.INVALID_ID_FORMAT(entityName),
        );
      }
    });

    it("should handle extremely large but valid ID", async () => {
      const req = {
        params: { id: "2147483647" }, // MAX INT для PostgreSQL
      } as Request<{ id: string }, {}, {}>;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await warehouseController.findById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should return warehouse by ID", async () => {
      const req = {
        params: { id: String(createdWarehouse.id) },
      } as Request<{ id: string }, {}, {}>;

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
        expect(successResponse.data.id).toBe(createdWarehouse.id);
        expect(successResponse.data.name).toBe(createdWarehouse.name);
        expect(successResponse.message).toBe(
          SUCCESS_MESSAGES.FIND_BY_ID(entityName, createdWarehouse.id),
        );
      }
    });
  });

  describe("UPDATE edge cases", () => {
    let createdWarehouse: Warehouse;

    beforeEach(async () => {
      const createReq = {
        body: {
          name: "Original Warehouse",
          organization_id: testOrganization.id,
          latitude: 55.7558,
          longitude: 37.6176,
        },
      } as Request;

      const createRes = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation((data: SuccessResponse<Warehouse>) => {
            if (isSuccessResponse<Warehouse>(data)) {
              createdWarehouse = data.data;
            }
          }),
      } as unknown as Response;

      await warehouseController.create(createReq, createRes);
    });

    it("should reject update with empty name", async () => {
      const updateReq = {
        params: { id: String(createdWarehouse.id) },
        body: { name: "" },
      } as Request<{ id: string }, {}, any>;

      let errorResponse: ErrorResponse | undefined;
      const updateRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await warehouseController.update(updateReq, updateRes);

      expect(updateRes.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toContain("cannot be empty");
      }
    });

    it("should reject update with whitespace-only name", async () => {
      const updateReq = {
        params: { id: String(createdWarehouse.id) },
        body: { name: "   " },
      } as Request<{ id: string }, {}, any>;

      let errorResponse: ErrorResponse | undefined;
      const updateRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await warehouseController.update(updateReq, updateRes);

      expect(updateRes.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toContain("cannot be empty");
      }
    });

    it("should reject update with empty organization_id", async () => {
      const updateReq = {
        params: { id: String(createdWarehouse.id) },
        body: { organization_id: "" },
      } as Request<{ id: string }, {}, any>;

      let errorResponse: ErrorResponse | undefined;
      const updateRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await warehouseController.update(updateReq, updateRes);

      expect(updateRes.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toContain("Organization ID is required");
      }
    });

    it("should reject update with non-existent organization", async () => {
      const updateReq = {
        params: { id: String(createdWarehouse.id) },
        body: { organization_id: 999999 },
      } as Request<{ id: string }, {}, any>;

      let errorResponse: ErrorResponse | undefined;
      const updateRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await warehouseController.update(updateReq, updateRes);

      expect(updateRes.status).toHaveBeenCalledWith(404);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toContain(
          "Organization with id 999999 not found",
        );
      }
    });

    it("should reject update with non-existent manager", async () => {
      const updateReq = {
        params: { id: String(createdWarehouse.id) },
        body: { manager_id: 999999 },
      } as Request<{ id: string }, {}, any>;

      let errorResponse: ErrorResponse | undefined;
      const updateRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await warehouseController.update(updateReq, updateRes);

      expect(updateRes.status).toHaveBeenCalledWith(404);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toContain(
          "Manager with id 999999 not found",
        );
      }
    });

    it("should allow setting manager to null", async () => {
      // Сначала назначаем менеджера
      const assignReq = {
        params: { id: String(createdWarehouse.id) },
        body: { managerId: testManager.id },
      } as Request<{ id: string }, {}, { managerId: number }>;

      const assignRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await warehouseController.assignManager(assignReq, assignRes);

      // Затем удаляем менеджера
      const updateReq = {
        params: { id: String(createdWarehouse.id) },
        body: { manager_id: null },
      } as Request<{ id: string }, {}, any>;

      let successResponse: SuccessResponse<Warehouse> | undefined;
      const updateRes = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation((data: SuccessResponse<Warehouse>) => {
            successResponse = data;
          }),
      } as unknown as Response;

      await warehouseController.update(updateReq, updateRes);

      expect(updateRes.status).toHaveBeenCalledWith(200);
      expect(isSuccessResponse(successResponse)).toBe(true);
      if (isSuccessResponse(successResponse)) {
        expect(successResponse.data.manager_id).toBeNull();
        expect(successResponse.message).toBe(
          SUCCESS_MESSAGES.UPDATE(entityName),
        );
      }
    });

    it("should reject update with invalid latitude", async () => {
      const updateReq = {
        params: { id: String(createdWarehouse.id) },
        body: { latitude: -100 },
      } as Request<{ id: string }, {}, any>;

      let errorResponse: ErrorResponse | undefined;
      const updateRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await warehouseController.update(updateReq, updateRes);

      expect(updateRes.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toContain(
          "Latitude must be between -90 and 90",
        );
      }
    });

    it("should reject update with invalid longitude", async () => {
      const updateReq = {
        params: { id: String(createdWarehouse.id) },
        body: { longitude: 200 },
      } as Request<{ id: string }, {}, any>;

      let errorResponse: ErrorResponse | undefined;
      const updateRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await warehouseController.update(updateReq, updateRes);

      expect(updateRes.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toContain(
          "Longitude must be between -180 and 180",
        );
      }
    });

    it("should handle update of non-existent warehouse", async () => {
      const updateReq = {
        params: { id: "999999" },
        body: { name: "New Name" },
      } as Request<{ id: string }, {}, any>;

      let errorResponse: ErrorResponse | undefined;
      const updateRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await warehouseController.update(updateReq, updateRes);

      expect(updateRes.status).toHaveBeenCalledWith(404);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toContain("not found");
      }
    });

    it("should update warehouse name only", async () => {
      const newName = "Updated Warehouse Name";
      const updateReq = {
        params: { id: String(createdWarehouse.id) },
        body: { name: newName },
      } as Request<{ id: string }, {}, any>;

      let successResponse: SuccessResponse<Warehouse> | undefined;
      const updateRes = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation((data: SuccessResponse<Warehouse>) => {
            successResponse = data;
          }),
      } as unknown as Response;

      await warehouseController.update(updateReq, updateRes);

      expect(updateRes.status).toHaveBeenCalledWith(200);
      expect(isSuccessResponse(successResponse)).toBe(true);
      if (isSuccessResponse(successResponse)) {
        expect(successResponse.data.name).toBe(newName);
        expect(successResponse.data.latitude).toBe(createdWarehouse.latitude);
        expect(successResponse.data.organization_id).toBe(
          createdWarehouse.organization_id,
        );
        expect(successResponse.message).toBe(
          SUCCESS_MESSAGES.UPDATE(entityName),
        );
      }
    });

    it("should update warehouse coordinates only", async () => {
      const updateReq = {
        params: { id: String(createdWarehouse.id) },
        body: {
          latitude: 40.7128,
          longitude: -74.006,
        },
      } as Request<{ id: string }, {}, any>;

      let successResponse: SuccessResponse<Warehouse> | undefined;
      const updateRes = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation((data: SuccessResponse<Warehouse>) => {
            successResponse = data;
          }),
      } as unknown as Response;

      await warehouseController.update(updateReq, updateRes);

      expect(updateRes.status).toHaveBeenCalledWith(200);
      expect(isSuccessResponse(successResponse)).toBe(true);
      if (isSuccessResponse(successResponse)) {
        expect(successResponse.data.latitude).toBe(40.7128);
        expect(successResponse.data.longitude).toBe(-74.006);
        expect(successResponse.data.name).toBe(createdWarehouse.name);
        expect(successResponse.message).toBe(
          SUCCESS_MESSAGES.UPDATE(entityName),
        );
      }
    });

    it("should update multiple fields at once", async () => {
      const updateReq = {
        params: { id: String(createdWarehouse.id) },
        body: {
          name: "New Name",
          latitude: 40.7128,
          longitude: -74.006,
        },
      } as Request<{ id: string }, {}, any>;

      let successResponse: SuccessResponse<Warehouse> | undefined;
      const updateRes = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation((data: SuccessResponse<Warehouse>) => {
            successResponse = data;
          }),
      } as unknown as Response;

      await warehouseController.update(updateReq, updateRes);

      expect(updateRes.status).toHaveBeenCalledWith(200);
      expect(isSuccessResponse(successResponse)).toBe(true);
      if (isSuccessResponse(successResponse)) {
        expect(successResponse.data.name).toBe("New Name");
        expect(successResponse.data.latitude).toBe(40.7128);
        expect(successResponse.data.longitude).toBe(-74.006);
        expect(successResponse.message).toBe(
          SUCCESS_MESSAGES.UPDATE(entityName),
        );
      }
    });
  });

  describe("DELETE edge cases", () => {
    let createdWarehouse: Warehouse;

    beforeEach(async () => {
      const createReq = {
        body: {
          name: "To Be Deleted",
          organization_id: testOrganization.id,
          latitude: 55.7558,
          longitude: 37.6176,
        },
      } as Request;

      const createRes = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation((data: SuccessResponse<Warehouse>) => {
            if (isSuccessResponse<Warehouse>(data)) {
              createdWarehouse = data.data;
            }
          }),
      } as unknown as Response;

      await warehouseController.create(createReq, createRes);
    });

    it("should handle deletion of non-existent warehouse", async () => {
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

      await warehouseController.delete(deleteReq, deleteRes);

      expect(deleteRes.status).toHaveBeenCalledWith(404);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toContain("not found");
      }
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

      await warehouseController.delete(deleteReq, deleteRes);

      expect(deleteRes.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toBe(
          ERROR_MESSAGES.INVALID_ID_FORMAT(entityName),
        );
      }
    });

    it("should handle zero ID in delete", async () => {
      const deleteReq = {
        params: { id: "0" },
      } as Request<{ id: string }, {}, {}>;

      let errorResponse: ErrorResponse | undefined;
      const deleteRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await warehouseController.delete(deleteReq, deleteRes);

      expect(deleteRes.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toBe(
          ERROR_MESSAGES.INVALID_ID_FORMAT(entityName),
        );
      }
    });

    it("should handle non-numeric ID in delete", async () => {
      const deleteReq = {
        params: { id: "abc" },
      } as Request<{ id: string }, {}, {}>;

      let errorResponse: ErrorResponse | undefined;
      const deleteRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await warehouseController.delete(deleteReq, deleteRes);

      expect(deleteRes.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toBe(
          ERROR_MESSAGES.INVALID_ID_FORMAT(entityName),
        );
      }
    });

    it("should allow double deletion (second should fail)", async () => {
      // Первое удаление
      const deleteReq1 = {
        params: { id: String(createdWarehouse.id) },
      } as Request<{ id: string }, {}, {}>;

      let successResponse: SuccessResponse<Warehouse> | undefined;
      const deleteRes1 = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation((data: SuccessResponse<Warehouse>) => {
            successResponse = data;
          }),
      } as unknown as Response;

      await warehouseController.delete(deleteReq1, deleteRes1);
      expect(deleteRes1.status).toHaveBeenCalledWith(200);
      expect(isSuccessResponse(successResponse)).toBe(true);
      if (isSuccessResponse(successResponse)) {
        expect(successResponse.message).toBe(
          SUCCESS_MESSAGES.DELETE(entityName),
        );
      }

      // Второе удаление того же ID
      const deleteReq2 = {
        params: { id: String(createdWarehouse.id) },
      } as Request<{ id: string }, {}, {}>;

      let errorResponse: ErrorResponse | undefined;
      const deleteRes2 = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await warehouseController.delete(deleteReq2, deleteRes2);

      expect(deleteRes2.status).toHaveBeenCalledWith(404);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toContain("not found");
      }
    });
  });

  describe("SEARCH edge cases", () => {
    beforeEach(async () => {
      // Создаем тестовые данные
      const warehouses = [
        {
          name: "Main Warehouse Moscow",
          organization_id: testOrganization.id,
          latitude: 55.7558,
          longitude: 37.6176,
        },
        {
          name: "Secondary Warehouse SPB",
          organization_id: testOrganization.id,
          latitude: 59.9343,
          longitude: 30.3351,
        },
        {
          name: "Storage Facility",
          organization_id: testOrganization.id,
          latitude: 55.7558,
          longitude: 37.6176,
        },
        {
          name: "Склад на русском",
          organization_id: testOrganization.id,
          latitude: 55.7558,
          longitude: 37.6176,
        },
        {
          name: "Warehouse with emoji 🏭",
          organization_id: testOrganization.id,
          latitude: 55.7558,
          longitude: 37.6176,
        },
      ];

      for (const wh of warehouses) {
        const req = { body: wh } as Request;
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        } as unknown as Response;
        await warehouseController.create(req, res);
      }
    });

    it("should handle empty search string", async () => {
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
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toBe(
          ERROR_MESSAGES.SEARCH_QUERY_REQUIRED,
        );
      }
    });

    it("should handle whitespace-only search", async () => {
      const req = {
        query: { q: "   " },
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
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toBe(
          ERROR_MESSAGES.SEARCH_QUERY_REQUIRED,
        );
      }
    });

    it("should handle missing query parameter", async () => {
      const req = {
        query: {},
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
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toBe(
          ERROR_MESSAGES.SEARCH_QUERY_REQUIRED,
        );
      }
    });

    it("should return empty array for non-matching search", async () => {
      const req = {
        query: { q: "NonexistentWarehouse123!@#" },
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
        expect(successResponse.message).toBe(
          SUCCESS_MESSAGES.SEARCH(entityName, 0),
        );
      }
    });

    it("should handle very long search string", async () => {
      const longSearch = "a".repeat(1000);

      const req = {
        query: { q: longSearch },
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
          query: { q: search },
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
      }
    });

    it("should search by partial names", async () => {
      const req = {
        query: { q: "Main" },
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
        expect(successResponse.data.length).toBe(1);
        expect(successResponse.data[0].name).toContain("Main");
        expect(successResponse.message).toBe(
          SUCCESS_MESSAGES.SEARCH(entityName, 1),
        );
      }
    });

    it("should search with cyrillic characters", async () => {
      const req = {
        query: { q: "Склад" },
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
        expect(successResponse.data.length).toBe(1);
        expect(successResponse.data[0].name).toBe("Склад на русском");
        expect(successResponse.message).toBe(
          SUCCESS_MESSAGES.SEARCH(entityName, 1),
        );
      }
    });

    it("should search with emoji", async () => {
      const req = {
        query: { q: "🏭" },
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
        expect(successResponse.data.length).toBe(1);
        expect(successResponse.data[0].name).toContain("🏭");
        expect(successResponse.message).toBe(
          SUCCESS_MESSAGES.SEARCH(entityName, 1),
        );
      }
    });

    it("should search case-insensitively", async () => {
      const req = {
        query: { q: "storage facility" },
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
        expect(successResponse.data.length).toBe(1);
        expect(successResponse.data[0].name).toBe("Storage Facility");
        expect(successResponse.message).toBe(
          SUCCESS_MESSAGES.SEARCH(entityName, 1),
        );
      }
    });
  });

  describe("FIND BY MANAGER ID edge cases", () => {
    let managerWarehouse: Warehouse;
    let otherWarehouse: Warehouse;

    beforeEach(async () => {
      // Создаем склад с менеджером
      const createManagerReq = {
        body: {
          name: "Manager Warehouse",
          organization_id: testOrganization.id,
          manager_id: testManager.id,
          latitude: 55.7558,
          longitude: 37.6176,
        },
      } as Request;

      const createManagerRes = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation((data: SuccessResponse<Warehouse>) => {
            if (isSuccessResponse<Warehouse>(data)) {
              managerWarehouse = data.data;
            }
          }),
      } as unknown as Response;

      await warehouseController.create(createManagerReq, createManagerRes);

      // Создаем склад без менеджера
      const createOtherReq = {
        body: {
          name: "Other Warehouse",
          organization_id: testOrganization.id,
          latitude: 55.7558,
          longitude: 37.6176,
        },
      } as Request;

      const createOtherRes = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation((data: SuccessResponse<Warehouse>) => {
            if (isSuccessResponse<Warehouse>(data)) {
              otherWarehouse = data.data;
            }
          }),
      } as unknown as Response;

      await warehouseController.create(createOtherReq, createOtherRes);
    });

    it("should return warehouses for valid manager ID", async () => {
      const req = {
        params: { managerId: String(testManager.id) },
      } as Request<{ managerId: string }>;

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

      await warehouseController.findByManagerId(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(isSuccessResponse(successResponse)).toBe(true);
      if (isSuccessResponse(successResponse)) {
        expect(successResponse.data.length).toBe(1);
        expect(successResponse.data[0].id).toBe(managerWarehouse.id);
        expect(successResponse.data[0].manager?.id).toBe(testManager.id);
        expect(successResponse.message).toBe(
          SUCCESS_MESSAGES.FIND_BY_MANAGER_ID(entityName, 1, testManager.name),
        );
      }
    });

    it("should return empty array for manager with no warehouses", async () => {
      // Создаем нового менеджера без складов
      const newManagerResult = await pool.query<User>(
        `INSERT INTO app_users (name, organization_id, password, is_admin)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        ["Empty Manager", testOrganization.id, "hashedpassword123", false],
      );
      const emptyManager = newManagerResult.rows[0];

      const req = {
        params: { managerId: String(emptyManager.id) },
      } as Request<{ managerId: string }>;

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

      await warehouseController.findByManagerId(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(isSuccessResponse(successResponse)).toBe(true);
      if (isSuccessResponse(successResponse)) {
        expect(successResponse.data.length).toBe(0);
        expect(successResponse.message).toBe(
          SUCCESS_MESSAGES.FIND_BY_MANAGER_ID(entityName, 0, "Unknown"),
        );
      }
    });

    it("should handle non-existent manager ID", async () => {
      const req = {
        params: { managerId: "999999" },
      } as Request<{ managerId: string }>;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await warehouseController.findByManagerId(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toContain("not found");
      }
    });

    it("should handle negative manager ID", async () => {
      const req = {
        params: { managerId: "-5" },
      } as Request<{ managerId: string }>;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await warehouseController.findByManagerId(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toBe(
          ERROR_MESSAGES.INVALID_ID_FORMAT("manager"),
        );
      }
    });

    it("should handle zero manager ID", async () => {
      const req = {
        params: { managerId: "0" },
      } as Request<{ managerId: string }>;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await warehouseController.findByManagerId(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toBe(
          ERROR_MESSAGES.INVALID_ID_FORMAT("manager"),
        );
      }
    });

    it("should handle non-numeric manager ID", async () => {
      const req = {
        params: { managerId: "abc" },
      } as Request<{ managerId: string }>;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await warehouseController.findByManagerId(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toBe(
          ERROR_MESSAGES.INVALID_ID_FORMAT("manager"),
        );
      }
    });
  });

  describe("ASSIGN MANAGER edge cases", () => {
    let createdWarehouse: Warehouse;

    beforeEach(async () => {
      const createReq = {
        body: {
          name: "Test Warehouse",
          organization_id: testOrganization.id,
          latitude: 55.7558,
          longitude: 37.6176,
        },
      } as Request;

      const createRes = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation((data: SuccessResponse<Warehouse>) => {
            if (isSuccessResponse<Warehouse>(data)) {
              createdWarehouse = data.data;
            }
          }),
      } as unknown as Response;

      await warehouseController.create(createReq, createRes);
    });

    it("should assign manager to warehouse", async () => {
      const req = {
        params: { id: String(createdWarehouse.id) },
        body: { managerId: testManager.id },
      } as Request<{ id: string }, {}, { managerId: number }>;

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

      await warehouseController.assignManager(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(isSuccessResponse(successResponse)).toBe(true);
      if (isSuccessResponse(successResponse)) {
        expect(successResponse.data.manager_id).toBe(testManager.id);
        expect(successResponse.data.manager?.id).toBe(testManager.id);
        expect(successResponse.message).toBe(
          SUCCESS_MESSAGES.ASSIGN_MANAGER(testManager.name, true),
        );
      }
    });

    it("should unassign manager from warehouse", async () => {
      // Сначала назначаем менеджера
      const assignReq = {
        params: { id: String(createdWarehouse.id) },
        body: { managerId: testManager.id },
      } as Request<{ id: string }, {}, { managerId: number }>;

      const assignRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await warehouseController.assignManager(assignReq, assignRes);

      // Затем убираем менеджера
      const unassignReq = {
        params: { id: String(createdWarehouse.id) },
        body: { managerId: null },
      } as Request<{ id: string }, {}, { managerId: null }>;

      let successResponse:
        | SuccessResponse<WarehouseWithMaterialsAndOrganization>
        | undefined;
      const unassignRes = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation(
            (data: SuccessResponse<WarehouseWithMaterialsAndOrganization>) => {
              successResponse = data;
            },
          ),
      } as unknown as Response;

      await warehouseController.assignManager(unassignReq, unassignRes);

      expect(unassignRes.status).toHaveBeenCalledWith(200);
      expect(isSuccessResponse(successResponse)).toBe(true);
      if (isSuccessResponse(successResponse)) {
        expect(successResponse.data.manager_id).toBeNull();
        expect(successResponse.data.manager).toBeNull();
        expect(successResponse.message).toBe(
          SUCCESS_MESSAGES.ASSIGN_MANAGER("Unknown", false),
        );
      }
    });

    it("should handle assigning to non-existent warehouse", async () => {
      const req = {
        params: { id: "999999" },
        body: { managerId: testManager.id },
      } as Request<{ id: string }, {}, { managerId: number }>;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await warehouseController.assignManager(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toContain("not found");
      }
    });

    it("should handle assigning non-existent manager", async () => {
      const req = {
        params: { id: String(createdWarehouse.id) },
        body: { managerId: 999999 },
      } as Request<{ id: string }, {}, { managerId: number }>;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await warehouseController.assignManager(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toContain("not found");
      }
    });

    it("should handle negative warehouse ID", async () => {
      const req = {
        params: { id: "-5" },
        body: { managerId: testManager.id },
      } as Request<{ id: string }, {}, { managerId: number }>;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await warehouseController.assignManager(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toBe(
          ERROR_MESSAGES.INVALID_ID_FORMAT(entityName),
        );
      }
    });

    it("should handle non-numeric warehouse ID", async () => {
      const req = {
        params: { id: "abc" },
        body: { managerId: testManager.id },
      } as Request<{ id: string }, {}, { managerId: number }>;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await warehouseController.assignManager(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toBe(
          ERROR_MESSAGES.INVALID_ID_FORMAT(entityName),
        );
      }
    });

    it("should handle negative manager ID", async () => {
      const req = {
        params: { id: String(createdWarehouse.id) },
        body: { managerId: -5 },
      } as Request<{ id: string }, {}, { managerId: number }>;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await warehouseController.assignManager(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toBe(
          ERROR_MESSAGES.INVALID_ID_FORMAT("manager"),
        );
      }
    });

    it("should handle non-numeric manager ID as string", async () => {
      const req = {
        params: { id: String(createdWarehouse.id) },
        body: { managerId: "abc" },
      } as Request<{ id: string }, {}, any>;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await warehouseController.assignManager(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toBe(
          ERROR_MESSAGES.INVALID_ID_FORMAT("manager"),
        );
      }
    });
  });

  describe("FIND ALL edge cases", () => {
    it("should return empty array when no warehouses exist", async () => {
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
        expect(successResponse.message).toBe(
          SUCCESS_MESSAGES.FIND_ALL(entityName),
        );
      }
    });

    it("should return all created warehouses", async () => {
      // Создаем несколько складов
      const warehouses = [
        {
          name: "Warehouse 1",
          organization_id: testOrganization.id,
          latitude: 55.7558,
          longitude: 37.6176,
        },
        {
          name: "Warehouse 2",
          organization_id: testOrganization.id,
          latitude: 59.9343,
          longitude: 30.3351,
        },
        {
          name: "Warehouse 3",
          organization_id: secondOrganization.id,
          latitude: 40.7128,
          longitude: -74.006,
        },
      ];

      for (const wh of warehouses) {
        const req = { body: wh } as Request;
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        } as unknown as Response;
        await warehouseController.create(req, res);
      }

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
        expect(successResponse.data.map((w) => w.name)).toEqual(
          expect.arrayContaining(warehouses.map((w) => w.name)),
        );
        expect(successResponse.message).toBe(
          SUCCESS_MESSAGES.FIND_ALL(entityName),
        );
      }
    });
  });

  describe("CONCURRENCY edge cases", () => {
    it("should handle multiple simultaneous creations", async () => {
      const createPromises = [];
      const names = [];

      for (let i = 0; i < 10; i++) {
        const name = `Concurrent Warehouse ${i}`;
        names.push(name);

        const req = {
          body: {
            name,
            organization_id: testOrganization.id,
            latitude: 55.7558,
            longitude: 37.6176,
          },
        } as Request;

        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        } as unknown as Response;

        createPromises.push(warehouseController.create(req, res));
      }

      await Promise.all(createPromises);

      const findAllReq = {} as Request;
      let allWarehouses: WarehouseWithMaterialsAndOrganization[] = [];
      const findAllRes = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation(
            (
              data: SuccessResponse<WarehouseWithMaterialsAndOrganization[]>,
            ) => {
              if (isSuccessResponse(data)) {
                allWarehouses = data.data;
              }
            },
          ),
      } as unknown as Response;

      await warehouseController.findAll(findAllReq, findAllRes);

      expect(allWarehouses.length).toBe(10);
      names.forEach((name) => {
        expect(allWarehouses.some((w) => w.name === name)).toBeTruthy();
      });
    });

    it("should handle concurrent updates to same warehouse", async () => {
      // Создаем склад
      const createReq = {
        body: {
          name: "Concurrent Update Test",
          organization_id: testOrganization.id,
          latitude: 55.7558,
          longitude: 37.6176,
        },
      } as Request;

      let createdWarehouse: Warehouse;
      const createRes = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation((data: SuccessResponse<Warehouse>) => {
            if (isSuccessResponse(data)) {
              createdWarehouse = data.data;
            }
          }),
      } as unknown as Response;

      await warehouseController.create(createReq, createRes);

      // Пытаемся обновить его одновременно 5 раз
      const updatePromises = [];
      for (let i = 0; i < 5; i++) {
        const updateReq = {
          params: { id: String(createdWarehouse!.id) },
          body: { name: `Updated Name ${i}` },
        } as Request<{ id: string }, {}, any>;

        const updateRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        } as unknown as Response;

        updatePromises.push(warehouseController.update(updateReq, updateRes));
      }

      // Все запросы должны выполниться без ошибок (последний победит)
      await expect(Promise.all(updatePromises)).resolves.not.toThrow();
    });

    it("should handle concurrent assign manager operations", async () => {
      // Создаем склад
      const createReq = {
        body: {
          name: "Concurrent Assign Test",
          organization_id: testOrganization.id,
          latitude: 55.7558,
          longitude: 37.6176,
        },
      } as Request;

      let createdWarehouse: Warehouse;
      const createRes = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation((data: SuccessResponse<Warehouse>) => {
            if (isSuccessResponse(data)) {
              createdWarehouse = data.data;
            }
          }),
      } as unknown as Response;

      await warehouseController.create(createReq, createRes);

      // Пытаемся назначать/убирать менеджера одновременно
      const assignPromises = [];
      for (let i = 0; i < 5; i++) {
        const managerId = i % 2 === 0 ? testManager.id : null;
        const assignReq = {
          params: { id: String(createdWarehouse!.id) },
          body: { managerId },
        } as Request<{ id: string }, {}, { managerId: number | null }>;

        const assignRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        } as unknown as Response;

        assignPromises.push(
          warehouseController.assignManager(assignReq, assignRes),
        );
      }

      await expect(Promise.all(assignPromises)).resolves.not.toThrow();
    });
  });
});
