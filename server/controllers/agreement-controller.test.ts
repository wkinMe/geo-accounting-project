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

describe("Agreement Controller Edge Cases", () => {
  let agreementController: AgreementController;
  let testOrganization: Organization;
  let secondOrganization: Organization;
  let testSupplier: User;
  let testCustomer: User;
  let supplierWarehouse: Warehouse;
  let customerWarehouse: Warehouse;
  let testMaterial: Material;
  const entityName = "agreement";

  beforeAll(async () => {
    agreementController = new AgreementController(pool);
  });

  beforeEach(async () => {
    // Очищаем таблицы в правильном порядке (учитывая внешние ключи)
    await pool.query("DELETE FROM agreement_material");
    await pool.query("DELETE FROM agreements");
    await pool.query("DELETE FROM materials");
    await pool.query("DELETE FROM warehouses");
    await pool.query("DELETE FROM app_users");
    await pool.query("DELETE FROM organizations");

    const organizationController = new OrganizationController(pool);
    const userController = new UserController(pool);
    const warehouseController = new WarehouseController(pool);
    const materialController = new MaterialController(pool);

    // Создаем тестовые организации через контроллер
    const orgReq = {
      body: {
        name: "Test Organization",
        latitude: 55.7558,
        longitude: 37.6176,
      },
    } as Request;

    const orgRes = {
      status: jest.fn().mockReturnThis(),
      json: jest
        .fn()
        .mockImplementation((data: SuccessResponse<Organization>) => {
          if (isSuccessResponse(data)) {
            testOrganization = data.data;
          }
        }),
    } as unknown as Response;

    await organizationController.create(orgReq, orgRes);

    // Создаем вторую организацию
    const secondOrgReq = {
      body: {
        name: "Second Organization",
        latitude: 40.7128,
        longitude: -74.006,
      },
    } as Request;

    const secondOrgRes = {
      status: jest.fn().mockReturnThis(),
      json: jest
        .fn()
        .mockImplementation((data: SuccessResponse<Organization>) => {
          if (isSuccessResponse(data)) {
            secondOrganization = data.data;
          }
        }),
    } as unknown as Response;

    await organizationController.create(secondOrgReq, secondOrgRes);

    // Создаем поставщика
    const supplierReq = {
      body: {
        name: "Test Supplier",
        organization_id: testOrganization.id,
        password: "hashedpassword123",
        is_admin: false,
      },
    } as Request;

    const supplierRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation((data: SuccessResponse<User>) => {
        if (isSuccessResponse(data)) {
          testSupplier = data.data;
        }
      }),
    } as unknown as Response;

    await userController.create(supplierReq, supplierRes);

    // Создаем заказчика
    const customerReq = {
      body: {
        name: "Test Customer",
        organization_id: secondOrganization.id,
        password: "hashedpassword123",
        is_admin: false,
      },
    } as Request;

    const customerRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation((data: SuccessResponse<User>) => {
        if (isSuccessResponse(data)) {
          testCustomer = data.data;
        }
      }),
    } as unknown as Response;

    await userController.create(customerReq, customerRes);

    // Создаем склад поставщика
    const supplierWarehouseReq = {
      body: {
        name: "Supplier Warehouse",
        organization_id: testOrganization.id,
        latitude: 55.7558,
        longitude: 37.6176,
      },
    } as Request;

    const supplierWarehouseRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation((data: SuccessResponse<Warehouse>) => {
        if (isSuccessResponse(data)) {
          supplierWarehouse = data.data;
        }
      }),
    } as unknown as Response;

    await warehouseController.create(
      supplierWarehouseReq,
      supplierWarehouseRes,
    );

    // Создаем склад заказчика
    const customerWarehouseReq = {
      body: {
        name: "Customer Warehouse",
        organization_id: secondOrganization.id,
        latitude: 40.7128,
        longitude: -74.006,
      },
    } as Request;

    const customerWarehouseRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation((data: SuccessResponse<Warehouse>) => {
        if (isSuccessResponse(data)) {
          customerWarehouse = data.data;
        }
      }),
    } as unknown as Response;

    await warehouseController.create(
      customerWarehouseReq,
      customerWarehouseRes,
    );

    // Создаем тестовый материал
    const materialReq = {
      body: {
        name: "Test Material",
      },
    } as Request;

    const materialRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation((data: SuccessResponse<Material>) => {
        if (isSuccessResponse(data)) {
          testMaterial = data.data;
        }
      }),
    } as unknown as Response;

    await materialController.create(materialReq, materialRes);
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("CREATE edge cases", () => {
    it("should reject creation with missing request body", async () => {
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

      await agreementController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toBe(
          ERROR_MESSAGES.REQUEST_BODY_REQUIRED,
        );
      }
    });

    it("should reject creation with missing createData", async () => {
      const req = {
        body: {
          materials: [],
        },
      } as Request;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await agreementController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toBe(
          ERROR_MESSAGES.REQUEST_BODY_REQUIRED,
        );
      }
    });

    it("should reject creation with missing supplier_id", async () => {
      const req = {
        body: {
          createData: {
            customer_id: testCustomer.id,
            supplier_warehouse_id: supplierWarehouse.id,
            customer_warehouse_id: customerWarehouse.id,
          },
        },
      } as Request;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await agreementController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toBe(
          ERROR_MESSAGES.REQUIRED_FIELD("Supplier ID"),
        );
      }
    });

    it("should reject creation with invalid supplier_id format", async () => {
      const req = {
        body: {
          createData: {
            supplier_id: "abc",
            customer_id: testCustomer.id,
            supplier_warehouse_id: supplierWarehouse.id,
            customer_warehouse_id: customerWarehouse.id,
          },
        },
      } as Request;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await agreementController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toBe(
          ERROR_MESSAGES.INVALID_ID_FORMAT("Supplier"),
        );
      }
    });

    it("should reject creation with negative supplier_id", async () => {
      const req = {
        body: {
          createData: {
            supplier_id: -5,
            customer_id: testCustomer.id,
            supplier_warehouse_id: supplierWarehouse.id,
            customer_warehouse_id: customerWarehouse.id,
          },
        },
      } as Request;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await agreementController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toBe(
          ERROR_MESSAGES.INVALID_ID_FORMAT("Supplier"),
        );
      }
    });

    it("should reject creation with zero supplier_id", async () => {
      const req = {
        body: {
          createData: {
            supplier_id: 0,
            customer_id: testCustomer.id,
            supplier_warehouse_id: supplierWarehouse.id,
            customer_warehouse_id: customerWarehouse.id,
          },
        },
      } as Request;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await agreementController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toBe(
          ERROR_MESSAGES.INVALID_ID_FORMAT("Supplier"),
        );
      }
    });

    it("should reject creation with missing customer_id", async () => {
      const req = {
        body: {
          createData: {
            supplier_id: testSupplier.id,
            supplier_warehouse_id: supplierWarehouse.id,
            customer_warehouse_id: customerWarehouse.id,
          },
        },
      } as Request;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await agreementController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toBe(
          ERROR_MESSAGES.REQUIRED_FIELD("Customer ID"),
        );
      }
    });

    it("should reject creation with invalid customer_id", async () => {
      const req = {
        body: {
          createData: {
            supplier_id: testSupplier.id,
            customer_id: -1,
            supplier_warehouse_id: supplierWarehouse.id,
            customer_warehouse_id: customerWarehouse.id,
          },
        },
      } as Request;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await agreementController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toBe(
          ERROR_MESSAGES.INVALID_ID_FORMAT("Customer"),
        );
      }
    });

    it("should reject creation with missing supplier_warehouse_id", async () => {
      const req = {
        body: {
          createData: {
            supplier_id: testSupplier.id,
            customer_id: testCustomer.id,
            customer_warehouse_id: customerWarehouse.id,
          },
        },
      } as Request;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await agreementController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toBe(
          ERROR_MESSAGES.REQUIRED_FIELD("Supplier warehouse ID"),
        );
      }
    });

    it("should reject creation with invalid supplier_warehouse_id", async () => {
      const req = {
        body: {
          createData: {
            supplier_id: testSupplier.id,
            customer_id: testCustomer.id,
            supplier_warehouse_id: -5,
            customer_warehouse_id: customerWarehouse.id,
          },
        },
      } as Request;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await agreementController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toBe(
          ERROR_MESSAGES.INVALID_ID_FORMAT("Supplier warehouse"),
        );
      }
    });

    it("should reject creation with missing customer_warehouse_id", async () => {
      const req = {
        body: {
          createData: {
            supplier_id: testSupplier.id,
            customer_id: testCustomer.id,
            supplier_warehouse_id: supplierWarehouse.id,
          },
        },
      } as Request;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await agreementController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toBe(
          ERROR_MESSAGES.REQUIRED_FIELD("Customer warehouse ID"),
        );
      }
    });

    it("should reject creation with invalid customer_warehouse_id", async () => {
      const req = {
        body: {
          createData: {
            supplier_id: testSupplier.id,
            customer_id: testCustomer.id,
            supplier_warehouse_id: supplierWarehouse.id,
            customer_warehouse_id: -10,
          },
        },
      } as Request;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await agreementController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toBe(
          ERROR_MESSAGES.INVALID_ID_FORMAT("Customer warehouse"),
        );
      }
    });

    it("should reject creation with empty status string", async () => {
      const req = {
        body: {
          createData: {
            supplier_id: testSupplier.id,
            customer_id: testCustomer.id,
            supplier_warehouse_id: supplierWarehouse.id,
            customer_warehouse_id: customerWarehouse.id,
            status: "",
          },
        },
      } as Request;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await agreementController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toBe(
          ERROR_MESSAGES.EMPTY_FIELD("Status"),
        );
      }
    });

    it("should reject creation with whitespace-only status", async () => {
      const req = {
        body: {
          createData: {
            supplier_id: testSupplier.id,
            customer_id: testCustomer.id,
            supplier_warehouse_id: supplierWarehouse.id,
            customer_warehouse_id: customerWarehouse.id,
            status: "   ",
          },
        },
      } as Request;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await agreementController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toBe(
          ERROR_MESSAGES.EMPTY_FIELD("Status"),
        );
      }
    });

    it("should reject creation with materials not as array", async () => {
      const req = {
        body: {
          createData: {
            supplier_id: testSupplier.id,
            customer_id: testCustomer.id,
            supplier_warehouse_id: supplierWarehouse.id,
            customer_warehouse_id: customerWarehouse.id,
          },
          materials: "not an array",
        },
      } as Request;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await agreementController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toBe("Materials must be an array");
      }
    });

    it("should reject creation with material missing material_id", async () => {
      const req = {
        body: {
          createData: {
            supplier_id: testSupplier.id,
            customer_id: testCustomer.id,
            supplier_warehouse_id: supplierWarehouse.id,
            customer_warehouse_id: customerWarehouse.id,
          },
          materials: [
            {
              amount: 100,
            },
          ],
        },
      } as Request;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await agreementController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toBe(
          ERROR_MESSAGES.INVALID_ID_FORMAT("Material"),
        );
      }
    });

    it("should reject creation with material invalid material_id", async () => {
      const req = {
        body: {
          createData: {
            supplier_id: testSupplier.id,
            customer_id: testCustomer.id,
            supplier_warehouse_id: supplierWarehouse.id,
            customer_warehouse_id: customerWarehouse.id,
          },
          materials: [
            {
              material_id: -5,
              amount: 100,
            },
          ],
        },
      } as Request;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await agreementController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toBe(
          ERROR_MESSAGES.INVALID_ID_FORMAT("Material"),
        );
      }
    });

    it("should reject creation with material missing amount", async () => {
      const req = {
        body: {
          createData: {
            supplier_id: testSupplier.id,
            customer_id: testCustomer.id,
            supplier_warehouse_id: supplierWarehouse.id,
            customer_warehouse_id: customerWarehouse.id,
          },
          materials: [
            {
              material_id: testMaterial.id,
            },
          ],
        },
      } as Request;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await agreementController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toBe("Amount must be positive");
      }
    });

    it("should reject creation with zero amount", async () => {
      const req = {
        body: {
          createData: {
            supplier_id: testSupplier.id,
            customer_id: testCustomer.id,
            supplier_warehouse_id: supplierWarehouse.id,
            customer_warehouse_id: customerWarehouse.id,
          },
          materials: [
            {
              material_id: testMaterial.id,
              amount: 0,
            },
          ],
        },
      } as Request;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await agreementController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toBe("Amount must be positive");
      }
    });

    it("should reject creation with negative amount", async () => {
      const req = {
        body: {
          createData: {
            supplier_id: testSupplier.id,
            customer_id: testCustomer.id,
            supplier_warehouse_id: supplierWarehouse.id,
            customer_warehouse_id: customerWarehouse.id,
          },
          materials: [
            {
              material_id: testMaterial.id,
              amount: -50,
            },
          ],
        },
      } as Request;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await agreementController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toBe("Amount must be positive");
      }
    });

    it("should successfully create agreement without materials", async () => {
      const req = {
        body: {
          createData: {
            supplier_id: testSupplier.id,
            customer_id: testCustomer.id,
            supplier_warehouse_id: supplierWarehouse.id,
            customer_warehouse_id: customerWarehouse.id,
            status: "active",
          },
        },
      } as Request;

      let successResponse: SuccessResponse<AgreementWithDetails> | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation((data: SuccessResponse<AgreementWithDetails>) => {
            successResponse = data;
          }),
      } as unknown as Response;

      await agreementController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(isSuccessResponse(successResponse)).toBe(true);
      if (isSuccessResponse(successResponse)) {
        expect(successResponse.data.supplier_id).toBe(testSupplier.id);
        expect(successResponse.data.customer_id).toBe(testCustomer.id);
        expect(successResponse.data.status).toBe("active");
        expect(successResponse.message).toBe(
          SUCCESS_MESSAGES.CREATE(entityName),
        );
      }
    });

    it("should successfully create agreement with materials", async () => {
      const req = {
        body: {
          createData: {
            supplier_id: testSupplier.id,
            customer_id: testCustomer.id,
            supplier_warehouse_id: supplierWarehouse.id,
            customer_warehouse_id: customerWarehouse.id,
          },
          materials: [
            {
              material_id: testMaterial.id,
              amount: 100,
            },
          ],
        },
      } as Request;

      let successResponse: SuccessResponse<AgreementWithDetails> | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation((data: SuccessResponse<AgreementWithDetails>) => {
            successResponse = data;
          }),
      } as unknown as Response;

      await agreementController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(isSuccessResponse(successResponse)).toBe(true);
      if (isSuccessResponse(successResponse)) {
        expect(successResponse.data.materials.length).toBe(1);
        expect(successResponse.data.materials[0].material.id).toBe(
          testMaterial.id,
        );
        expect(successResponse.data.materials[0].amount).toBe(100);
        expect(successResponse.message).toBe(
          SUCCESS_MESSAGES.CREATE(entityName),
        );
      }
    });
  });

  describe("FIND BY ID edge cases", () => {
    let createdAgreementId: number;

    beforeEach(async () => {
      // Создаем тестовое соглашение
      const createReq = {
        body: {
          createData: {
            supplier_id: testSupplier.id,
            customer_id: testCustomer.id,
            supplier_warehouse_id: supplierWarehouse.id,
            customer_warehouse_id: customerWarehouse.id,
          },
          materials: [
            {
              material_id: testMaterial.id,
              amount: 100,
            },
          ],
        },
      } as Request;

      const createRes = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation((data: SuccessResponse<AgreementWithDetails>) => {
            if (isSuccessResponse(data)) {
              createdAgreementId = data.data.id;
            }
          }),
      } as unknown as Response;

      await agreementController.create(createReq, createRes);
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

      await agreementController.findById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toContain("not found");
      }
    });

    it("should handle negative ID", async () => {
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

      await agreementController.findById(req, res);

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
      } as Request<{ id: string }>;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await agreementController.findById(req, res);

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
      } as Request<{ id: string }>;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await agreementController.findById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toBe(
          ERROR_MESSAGES.INVALID_ID_FORMAT(entityName),
        );
      }
    });

    it("should return agreement by ID", async () => {
      const req = {
        params: { id: String(createdAgreementId) },
      } as Request<{ id: string }>;

      let successResponse: SuccessResponse<AgreementWithDetails> | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation((data: SuccessResponse<AgreementWithDetails>) => {
            successResponse = data;
          }),
      } as unknown as Response;

      await agreementController.findById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(isSuccessResponse(successResponse)).toBe(true);
      if (isSuccessResponse(successResponse)) {
        expect(successResponse.data.id).toBe(createdAgreementId);
        expect(successResponse.message).toBe(
          SUCCESS_MESSAGES.FIND_BY_ID(entityName, createdAgreementId),
        );
      }
    });
  });

  describe("UPDATE edge cases", () => {
    let createdAgreementId: number;

    beforeEach(async () => {
      // Создаем тестовое соглашение
      const createReq = {
        body: {
          createData: {
            supplier_id: testSupplier.id,
            customer_id: testCustomer.id,
            supplier_warehouse_id: supplierWarehouse.id,
            customer_warehouse_id: customerWarehouse.id,
            status: "draft",
          },
          materials: [
            {
              material_id: testMaterial.id,
              amount: 100,
            },
          ],
        },
      } as Request;

      const createRes = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation((data: SuccessResponse<AgreementWithDetails>) => {
            if (isSuccessResponse(data)) {
              createdAgreementId = data.data.id;
            }
          }),
      } as unknown as Response;

      await agreementController.create(createReq, createRes);
    });

    it("should reject update with invalid ID format", async () => {
      const req = {
        params: { id: "abc" },
        body: {
          updateData: {
            status: "active",
          },
        },
      } as Request<{ id: string }, {}, any>;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await agreementController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toBe(
          ERROR_MESSAGES.INVALID_ID_FORMAT(entityName),
        );
      }
    });

    it("should reject update with missing updateData", async () => {
      const req = {
        params: { id: String(createdAgreementId) },
        body: {},
      } as Request<{ id: string }, {}, any>;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await agreementController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toBe(ERROR_MESSAGES.UPDATE_DATA_REQUIRED);
      }
    });

    it("should reject update with empty updateData", async () => {
      const req = {
        params: { id: String(createdAgreementId) },
        body: {
          updateData: {},
        },
      } as Request<{ id: string }, {}, any>;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await agreementController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toBe(ERROR_MESSAGES.UPDATE_DATA_REQUIRED);
      }
    });

    it("should reject update with invalid supplier_id", async () => {
      const req = {
        params: { id: String(createdAgreementId) },
        body: {
          updateData: {
            supplier_id: -5,
          },
        },
      } as Request<{ id: string }, {}, any>;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await agreementController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toBe(
          ERROR_MESSAGES.INVALID_ID_FORMAT("Supplier"),
        );
      }
    });

    it("should reject update with invalid customer_id", async () => {
      const req = {
        params: { id: String(createdAgreementId) },
        body: {
          updateData: {
            customer_id: -10,
          },
        },
      } as Request<{ id: string }, {}, any>;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await agreementController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toBe(
          ERROR_MESSAGES.INVALID_ID_FORMAT("Customer"),
        );
      }
    });

    it("should reject update with invalid supplier_warehouse_id", async () => {
      const req = {
        params: { id: String(createdAgreementId) },
        body: {
          updateData: {
            supplier_warehouse_id: -1,
          },
        },
      } as Request<{ id: string }, {}, any>;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await agreementController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toBe(
          ERROR_MESSAGES.INVALID_ID_FORMAT("Supplier warehouse"),
        );
      }
    });

    it("should reject update with invalid customer_warehouse_id", async () => {
      const req = {
        params: { id: String(createdAgreementId) },
        body: {
          updateData: {
            customer_warehouse_id: -20,
          },
        },
      } as Request<{ id: string }, {}, any>;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await agreementController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toBe(
          ERROR_MESSAGES.INVALID_ID_FORMAT("Customer warehouse"),
        );
      }
    });

    it("should reject update with empty status", async () => {
      const req = {
        params: { id: String(createdAgreementId) },
        body: {
          updateData: {
            status: "",
          },
        },
      } as Request<{ id: string }, {}, any>;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await agreementController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toBe(
          ERROR_MESSAGES.EMPTY_FIELD("Status"),
        );
      }
    });

    it("should reject update with whitespace-only status", async () => {
      const req = {
        params: { id: String(createdAgreementId) },
        body: {
          updateData: {
            status: "   ",
          },
        },
      } as Request<{ id: string }, {}, any>;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await agreementController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toBe(
          ERROR_MESSAGES.EMPTY_FIELD("Status"),
        );
      }
    });

    it("should reject update with materials not as array", async () => {
      const req = {
        params: { id: String(createdAgreementId) },
        body: {
          updateData: {
            status: "active",
          },
          materials: "not an array",
        },
      } as Request<{ id: string }, {}, any>;

      let errorResponse: ErrorResponse | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await agreementController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toBe("Materials must be an array");
      }
    });

    it("should successfully update only status", async () => {
      const req = {
        params: { id: String(createdAgreementId) },
        body: {
          updateData: {
            status: "active",
          },
        },
      } as Request<{ id: string }, {}, any>;

      let successResponse: SuccessResponse<AgreementWithDetails> | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation((data: SuccessResponse<AgreementWithDetails>) => {
            successResponse = data;
          }),
      } as unknown as Response;

      await agreementController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(isSuccessResponse(successResponse)).toBe(true);
      if (isSuccessResponse(successResponse)) {
        expect(successResponse.data.status).toBe("active");
        expect(successResponse.message).toBe(
          SUCCESS_MESSAGES.UPDATE(entityName),
        );
      }
    });

    it("should successfully update with new materials", async () => {
      // Создаем дополнительный материал
      const secondMaterialResult = await pool.query<Material>(
        `INSERT INTO materials (name) VALUES ($1) RETURNING *`,
        ["Second Material"],
      );
      const secondMaterial = secondMaterialResult.rows[0];

      const req = {
        params: { id: String(createdAgreementId) },
        body: {
          updateData: {
            status: "active",
          },
          materials: [
            {
              material_id: testMaterial.id,
              amount: 200,
            },
            {
              material_id: secondMaterial.id,
              amount: 50,
            },
          ],
        },
      } as Request<{ id: string }, {}, any>;

      let successResponse: SuccessResponse<AgreementWithDetails> | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation((data: SuccessResponse<AgreementWithDetails>) => {
            successResponse = data;
          }),
      } as unknown as Response;

      await agreementController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(isSuccessResponse(successResponse)).toBe(true);
      if (isSuccessResponse(successResponse)) {
        expect(successResponse.data.status).toBe("active");
        expect(successResponse.data.materials.length).toBe(2);
        expect(
          successResponse.data.materials.find(
            (m) => m.material.id === testMaterial.id,
          )?.amount,
        ).toBe(200);
        expect(
          successResponse.data.materials.find(
            (m) => m.material.id === secondMaterial.id,
          )?.amount,
        ).toBe(50);
        expect(successResponse.message).toBe(
          SUCCESS_MESSAGES.UPDATE(entityName),
        );
      }
    });
  });

  describe("DELETE edge cases", () => {
    let createdAgreementId: number;

    beforeEach(async () => {
      // Создаем тестовое соглашение
      const createReq = {
        body: {
          createData: {
            supplier_id: testSupplier.id,
            customer_id: testCustomer.id,
            supplier_warehouse_id: supplierWarehouse.id,
            customer_warehouse_id: customerWarehouse.id,
          },
          materials: [
            {
              material_id: testMaterial.id,
              amount: 100,
            },
          ],
        },
      } as Request;

      const createRes = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation((data: SuccessResponse<AgreementWithDetails>) => {
            if (isSuccessResponse(data)) {
              createdAgreementId = data.data.id;
            }
          }),
      } as unknown as Response;

      await agreementController.create(createReq, createRes);
    });

    it("should handle deletion of non-existent agreement", async () => {
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

      await agreementController.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toContain("not found");
      }
    });

    it("should handle negative ID in delete", async () => {
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

      await agreementController.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toBe(
          ERROR_MESSAGES.INVALID_ID_FORMAT(entityName),
        );
      }
    });

    it("should handle zero ID in delete", async () => {
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

      await agreementController.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toBe(
          ERROR_MESSAGES.INVALID_ID_FORMAT(entityName),
        );
      }
    });

    it("should handle non-numeric ID in delete", async () => {
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

      await agreementController.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toBe(
          ERROR_MESSAGES.INVALID_ID_FORMAT(entityName),
        );
      }
    });

    it("should successfully delete agreement", async () => {
      const req = {
        params: { id: String(createdAgreementId) },
      } as Request<{ id: string }>;

      let successResponse: SuccessResponse<Agreement> | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation((data: SuccessResponse<Agreement>) => {
            successResponse = data;
          }),
      } as unknown as Response;

      await agreementController.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(isSuccessResponse(successResponse)).toBe(true);
      if (isSuccessResponse(successResponse)) {
        expect(successResponse.data.id).toBe(createdAgreementId);
        expect(successResponse.message).toBe(
          SUCCESS_MESSAGES.DELETE(entityName),
        );
      }
    });

    it("should allow double deletion (second should fail)", async () => {
      // Первое удаление
      const deleteReq1 = {
        params: { id: String(createdAgreementId) },
      } as Request<{ id: string }>;

      const deleteRes1 = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await agreementController.delete(deleteReq1, deleteRes1);
      expect(deleteRes1.status).toHaveBeenCalledWith(200);

      // Второе удаление того же ID
      const deleteReq2 = {
        params: { id: String(createdAgreementId) },
      } as Request<{ id: string }>;

      let errorResponse: ErrorResponse | undefined;
      const deleteRes2 = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data: ErrorResponse) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await agreementController.delete(deleteReq2, deleteRes2);

      expect(deleteRes2.status).toHaveBeenCalledWith(404);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toContain("not found");
      }
    });
  });

  describe("SEARCH edge cases", () => {
    beforeEach(async () => {
      // Создаем тестовые соглашения
      const agreements = [
        {
          supplier_name: "Alpha Corp",
          customer_name: "Beta Ltd",
          status: "active",
        },
        {
          supplier_name: "Gamma Inc",
          customer_name: "Delta LLC",
          status: "draft",
        },
        {
          supplier_name: "Epsilon GmbH",
          customer_name: "Zeta SA",
          status: "completed",
        },
      ];

      for (const agreement of agreements) {
        // Создаем поставщиков
        const supplierResult = await pool.query<User>(
          `INSERT INTO app_users (name, organization_id, password, is_admin)
           VALUES ($1, $2, $3, $4) RETURNING *`,
          [
            agreement.supplier_name,
            testOrganization.id,
            "hashedpassword123",
            false,
          ],
        );
        const supplier = supplierResult.rows[0];

        // Создаем заказчиков
        const customerResult = await pool.query<User>(
          `INSERT INTO app_users (name, organization_id, password, is_admin)
           VALUES ($1, $2, $3, $4) RETURNING *`,
          [
            agreement.customer_name,
            secondOrganization.id,
            "hashedpassword123",
            false,
          ],
        );
        const customer = customerResult.rows[0];

        // Создаем соглашение
        const createReq = {
          body: {
            createData: {
              supplier_id: supplier.id,
              customer_id: customer.id,
              supplier_warehouse_id: supplierWarehouse.id,
              customer_warehouse_id: customerWarehouse.id,
              status: agreement.status,
            },
            materials: [
              {
                material_id: testMaterial.id,
                amount: 100,
              },
            ],
          },
        } as Request;

        const createRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        } as unknown as Response;

        await agreementController.create(createReq, createRes);
      }
    });

    it("should handle missing search query", async () => {
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

      await agreementController.search(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(errorResponse)).toBe(true);
      if (isErrorResponse(errorResponse)) {
        expect(errorResponse.message).toBe(
          ERROR_MESSAGES.SEARCH_QUERY_REQUIRED,
        );
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

      await agreementController.search(req, res);

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

      await agreementController.search(req, res);

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
        query: { q: "NonexistentAgreement123!@#" },
      } as unknown as Request;

      let successResponse: SuccessResponse<AgreementWithDetails[]> | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation(
            (data: SuccessResponse<AgreementWithDetails[]>) => {
              successResponse = data;
            },
          ),
      } as unknown as Response;

      await agreementController.search(req, res);

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

      let successResponse: SuccessResponse<AgreementWithDetails[]> | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation(
            (data: SuccessResponse<AgreementWithDetails[]>) => {
              successResponse = data;
            },
          ),
      } as unknown as Response;

      await agreementController.search(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(isSuccessResponse(successResponse)).toBe(true);
      expect(successResponse?.message).toBe(
        SUCCESS_MESSAGES.SEARCH(entityName, 0),
      );
    });

    it("should search by supplier name", async () => {
      const req = {
        query: { q: "Alpha" },
      } as unknown as Request;

      let successResponse: SuccessResponse<AgreementWithDetails[]> | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation(
            (data: SuccessResponse<AgreementWithDetails[]>) => {
              successResponse = data;
            },
          ),
      } as unknown as Response;

      await agreementController.search(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(isSuccessResponse(successResponse)).toBe(true);
      if (isSuccessResponse(successResponse)) {
        expect(successResponse.data.length).toBe(1);
        expect(successResponse.data[0].supplier?.name).toContain("Alpha");
        expect(successResponse.message).toBe(
          SUCCESS_MESSAGES.SEARCH(entityName, 1),
        );
      }
    });

    it("should search by customer name", async () => {
      const req = {
        query: { q: "Beta" },
      } as unknown as Request;

      let successResponse: SuccessResponse<AgreementWithDetails[]> | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation(
            (data: SuccessResponse<AgreementWithDetails[]>) => {
              successResponse = data;
            },
          ),
      } as unknown as Response;

      await agreementController.search(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(isSuccessResponse(successResponse)).toBe(true);
      if (isSuccessResponse(successResponse)) {
        expect(successResponse.data.length).toBe(1);
        expect(successResponse.data[0].customer?.name).toContain("Beta");
        expect(successResponse.message).toBe(
          SUCCESS_MESSAGES.SEARCH(entityName, 1),
        );
      }
    });

    it("should search by status", async () => {
      const req = {
        query: { q: "active" },
      } as unknown as Request;

      let successResponse: SuccessResponse<AgreementWithDetails[]> | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation(
            (data: SuccessResponse<AgreementWithDetails[]>) => {
              successResponse = data;
            },
          ),
      } as unknown as Response;

      await agreementController.search(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(isSuccessResponse(successResponse)).toBe(true);
      if (isSuccessResponse(successResponse)) {
        expect(successResponse.data.length).toBe(1);
        expect(successResponse.data[0].status).toBe("active");
        expect(successResponse.message).toBe(
          SUCCESS_MESSAGES.SEARCH(entityName, 1),
        );
      }
    });

    it("should search case-insensitively", async () => {
      const req = {
        query: { q: "ALPHA" },
      } as unknown as Request;

      let successResponse: SuccessResponse<AgreementWithDetails[]> | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation(
            (data: SuccessResponse<AgreementWithDetails[]>) => {
              successResponse = data;
            },
          ),
      } as unknown as Response;

      await agreementController.search(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(isSuccessResponse(successResponse)).toBe(true);
      if (isSuccessResponse(successResponse)) {
        expect(successResponse.data.length).toBe(1);
        expect(successResponse.message).toBe(
          SUCCESS_MESSAGES.SEARCH(entityName, 1),
        );
      }
    });
  });

  describe("FIND ALL edge cases", () => {
    it("should return empty array when no agreements exist", async () => {
      const req = {} as Request;

      let successResponse: SuccessResponse<AgreementWithDetails[]> | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation(
            (data: SuccessResponse<AgreementWithDetails[]>) => {
              successResponse = data;
            },
          ),
      } as unknown as Response;

      await agreementController.findAll(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(isSuccessResponse(successResponse)).toBe(true);
      if (isSuccessResponse(successResponse)) {
        expect(successResponse.data.length).toBe(0);
        expect(successResponse.message).toBe(
          SUCCESS_MESSAGES.FIND_ALL(entityName),
        );
      }
    });

    it("should return all created agreements", async () => {
      // Создаем несколько соглашений
      const agreements = [
        {
          supplier_id: testSupplier.id,
          customer_id: testCustomer.id,
          supplier_warehouse_id: supplierWarehouse.id,
          customer_warehouse_id: customerWarehouse.id,
        },
        {
          supplier_id: testSupplier.id,
          customer_id: testCustomer.id,
          supplier_warehouse_id: supplierWarehouse.id,
          customer_warehouse_id: customerWarehouse.id,
        },
      ];

      for (const agreement of agreements) {
        const createReq = {
          body: {
            createData: agreement,
            materials: [
              {
                material_id: testMaterial.id,
                amount: 100,
              },
            ],
          },
        } as Request;

        const createRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        } as unknown as Response;

        await agreementController.create(createReq, createRes);
      }

      const req = {} as Request;
      let successResponse: SuccessResponse<AgreementWithDetails[]> | undefined;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation(
            (data: SuccessResponse<AgreementWithDetails[]>) => {
              successResponse = data;
            },
          ),
      } as unknown as Response;

      await agreementController.findAll(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(isSuccessResponse(successResponse)).toBe(true);
      if (isSuccessResponse(successResponse)) {
        expect(successResponse.data.length).toBe(2);
        expect(successResponse.message).toBe(
          SUCCESS_MESSAGES.FIND_ALL(entityName),
        );
      }
    });
  });

  describe("CONCURRENCY edge cases", () => {
    it("should handle multiple simultaneous creations", async () => {
      const createPromises = [];

      for (let i = 0; i < 5; i++) {
        const req = {
          body: {
            createData: {
              supplier_id: testSupplier.id,
              customer_id: testCustomer.id,
              supplier_warehouse_id: supplierWarehouse.id,
              customer_warehouse_id: customerWarehouse.id,
              status: `status-${i}`,
            },
            materials: [
              {
                material_id: testMaterial.id,
                amount: 100 + i,
              },
            ],
          },
        } as Request;

        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        } as unknown as Response;

        createPromises.push(agreementController.create(req, res));
      }

      await expect(Promise.all(createPromises)).resolves.not.toThrow();

      const findAllReq = {} as Request;
      let allAgreements: AgreementWithDetails[] = [];
      const findAllRes = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation(
            (data: SuccessResponse<AgreementWithDetails[]>) => {
              if (isSuccessResponse(data)) {
                allAgreements = data.data;
              }
            },
          ),
      } as unknown as Response;

      await agreementController.findAll(findAllReq, findAllRes);

      expect(allAgreements.length).toBe(5);
    });

    it("should handle concurrent updates to same agreement", async () => {
      // Создаем соглашение
      const createReq = {
        body: {
          createData: {
            supplier_id: testSupplier.id,
            customer_id: testCustomer.id,
            supplier_warehouse_id: supplierWarehouse.id,
            customer_warehouse_id: customerWarehouse.id,
            status: "initial",
          },
          materials: [
            {
              material_id: testMaterial.id,
              amount: 100,
            },
          ],
        },
      } as Request;

      let createdAgreementId: number;
      const createRes = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation((data: SuccessResponse<AgreementWithDetails>) => {
            if (isSuccessResponse(data)) {
              createdAgreementId = data.data.id;
            }
          }),
      } as unknown as Response;

      await agreementController.create(createReq, createRes);

      // Пытаемся обновить его одновременно 5 раз
      const updatePromises = [];
      for (let i = 0; i < 5; i++) {
        const updateReq = {
          params: { id: String(createdAgreementId!) },
          body: {
            updateData: {
              status: `updated-${i}`,
            },
          },
        } as Request<{ id: string }, {}, any>;

        const updateRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        } as unknown as Response;

        updatePromises.push(agreementController.update(updateReq, updateRes));
      }

      // Все запросы должны выполниться без ошибок (последний победит)
      await expect(Promise.all(updatePromises)).resolves.not.toThrow();
    });

    it("should handle concurrent delete operations", async () => {
      // Создаем несколько соглашений
      const agreementIds: number[] = [];

      for (let i = 0; i < 3; i++) {
        const createReq = {
          body: {
            createData: {
              supplier_id: testSupplier.id,
              customer_id: testCustomer.id,
              supplier_warehouse_id: supplierWarehouse.id,
              customer_warehouse_id: customerWarehouse.id,
            },
            materials: [
              {
                material_id: testMaterial.id,
                amount: 100,
              },
            ],
          },
        } as Request;

        const createRes = {
          status: jest.fn().mockReturnThis(),
          json: jest
            .fn()
            .mockImplementation(
              (data: SuccessResponse<AgreementWithDetails>) => {
                if (isSuccessResponse(data)) {
                  agreementIds.push(data.data.id);
                }
              },
            ),
        } as unknown as Response;

        await agreementController.create(createReq, createRes);
      }

      // Удаляем их одновременно
      const deletePromises = agreementIds.map((id) => {
        const deleteReq = {
          params: { id: String(id) },
        } as Request<{ id: string }>;

        const deleteRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        } as unknown as Response;

        return agreementController.delete(deleteReq, deleteRes);
      });

      await expect(Promise.all(deletePromises)).resolves.not.toThrow();

      // Проверяем, что все удалены
      const findAllReq = {} as Request;
      let allAgreements: AgreementWithDetails[] = [];
      const findAllRes = {
        status: jest.fn().mockReturnThis(),
        json: jest
          .fn()
          .mockImplementation(
            (data: SuccessResponse<AgreementWithDetails[]>) => {
              if (isSuccessResponse(data)) {
                allAgreements = data.data;
              }
            },
          ),
      } as unknown as Response;

      await agreementController.findAll(findAllReq, findAllRes);
      expect(allAgreements.length).toBe(0);
    });
  });
});
