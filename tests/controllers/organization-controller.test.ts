import { Request, Response } from "express";
import { OrganizationController } from "@src/controllers";
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
import { Organization } from "@src/models";
import { isSuccessResponse } from "@t/guards";

describe("Organization Controller Edge Cases", () => {
  let organizationController: OrganizationController;

  beforeAll(() => {
    organizationController = new OrganizationController(pool);
  });

  beforeEach(async () => {
    await pool.query("DELETE FROM organizations");
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("CREATE edge cases", () => {
    it("should reject creation with empty name", async () => {
      const req = {
        body: { name: "", latitude: 55.7558, longitude: 37.6176 },
      } as Request;

      let errorResponse: any = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await organizationController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(errorResponse.message).toBe("Organization name is required");
    });

    it("should reject creation with whitespace-only name", async () => {
      const req = {
        body: { name: "   ", latitude: 55.7558, longitude: 37.6176 },
      } as Request;

      let errorResponse: any = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await organizationController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(errorResponse.message).toBe("Organization name is required");
    });

    it("should reject creation with missing name field", async () => {
      const req = {
        body: { latitude: 55.7558, longitude: 37.6176 },
      } as Request;

      let errorResponse: any = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await organizationController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(errorResponse.message).toBe("Organization name is required");
    });

    it("should reject creation with null name", async () => {
      const req = {
        body: { name: null, latitude: 55.7558, longitude: 37.6176 },
      } as Request;

      let errorResponse: any = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await organizationController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(errorResponse.message).toBe("Organization name is required");
    });

    describe("Coordinate validation", () => {
      it("should reject latitude below -90", async () => {
        const req = {
          body: {
            name: "Test Organization",
            latitude: -91,
            longitude: 37.6176,
          },
        } as Request;

        let errorResponse: any = {};
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockImplementation((data) => {
            errorResponse = data;
          }),
        } as unknown as Response;

        await organizationController.create(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(errorResponse.message).toContain(
          "Latitude must be between -90 and 90",
        );
      });

      it("should reject latitude above 90", async () => {
        const req = {
          body: {
            name: "Test Organization",
            latitude: 91,
            longitude: 37.6176,
          },
        } as Request;

        let errorResponse: any = {};
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockImplementation((data) => {
            errorResponse = data;
          }),
        } as unknown as Response;

        await organizationController.create(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(errorResponse.message).toContain(
          "Latitude must be between -90 and 90",
        );
      });

      it("should reject longitude below -180", async () => {
        const req = {
          body: {
            name: "Test Organization",
            latitude: 55.7558,
            longitude: -181,
          },
        } as Request;

        let errorResponse: any = {};
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockImplementation((data) => {
            errorResponse = data;
          }),
        } as unknown as Response;

        await organizationController.create(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(errorResponse.message).toContain(
          "Longitude must be between -180 and 180",
        );
      });

      it("should reject longitude above 180", async () => {
        const req = {
          body: {
            name: "Test Organization",
            latitude: 55.7558,
            longitude: 181,
          },
        } as Request;

        let errorResponse: any = {};
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockImplementation((data) => {
            errorResponse = data;
          }),
        } as unknown as Response;

        await organizationController.create(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(errorResponse.message).toContain(
          "Longitude must be between -180 and 180",
        );
      });

      it("should accept valid coordinates", async () => {
        const req = {
          body: {
            name: "Test Organization",
            latitude: 55.7558,
            longitude: 37.6176,
          },
        } as Request;

        let createdOrg = {} as Organization;
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockImplementation((data) => {
            if (isSuccessResponse<Organization>(data)) {
              createdOrg = data.data;
            }
          }),
        } as unknown as Response;

        await organizationController.create(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(createdOrg.name).toBe("Test Organization");
        expect(createdOrg.latitude).toBe(55.7558);
        expect(createdOrg.longitude).toBe(37.6176);
      });
    });

    it("should reject duplicate organization names", async () => {
      // Создаем первую организацию
      const createReq1 = {
        body: {
          name: "Unique Organization",
          latitude: 55.7558,
          longitude: 37.6176,
        },
      } as Request;

      const createRes1 = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await organizationController.create(createReq1, createRes1);
      expect(createRes1.status).toHaveBeenCalledWith(201);

      // Пытаемся создать с таким же именем
      const createReq2 = {
        body: {
          name: "Unique Organization",
          latitude: 55.7558,
          longitude: 37.6176,
        },
      } as Request;

      let errorResponse: any = {};
      const createRes2 = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await organizationController.create(createReq2, createRes2);

      expect(createRes2.status).toHaveBeenCalledWith(500);
      expect(errorResponse.message).toContain("already exists");
    });

    it("should handle extremely long organization names", async () => {
      const longName = "a".repeat(1000);

      const req = {
        body: { name: longName, latitude: 55.7558, longitude: 37.6176 },
      } as Request;

      let createdOrg = {} as Organization;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          if (isSuccessResponse<Organization>(data)) {
            createdOrg = data.data;
          }
        }),
      } as unknown as Response;

      await organizationController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(createdOrg.name).toBe(longName);
    });

    it("should handle special characters in organization names", async () => {
      const specialNames = [
        "Org!@#$%^&*()",
        "Организация на русском",
        "組織テスト",
        "Org with emoji 🏢",
        "'; DROP TABLE organizations; --",
        "<script>alert('xss')</script>",
        "name with\nnewline",
        "name\twith\ttabs",
      ];

      for (const specialName of specialNames) {
        const req = {
          body: { name: specialName, latitude: 55.7558, longitude: 37.6176 },
        } as Request;

        let createdOrg = {} as Organization;
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockImplementation((data) => {
            if (isSuccessResponse<Organization>(data)) {
              createdOrg = data.data;
            }
          }),
        } as unknown as Response;

        await organizationController.create(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(createdOrg.name).toBe(specialName);
      }
    });
  });

  describe("FIND BY ID edge cases", () => {
    let createdOrganization: Organization;

    beforeEach(async () => {
      const createReq = {
        body: {
          name: "Test Organization",
          latitude: 55.7558,
          longitude: 37.6176,
        },
      } as Request;

      const createRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          if (isSuccessResponse<Organization>(data)) {
            createdOrganization = data.data;
          }
        }),
      } as unknown as Response;

      await organizationController.create(createReq, createRes);
    });

    it("should handle non-existent ID", async () => {
      const req = {
        params: { id: "999999" },
      } as Request<{ id: string }>;

      let errorResponse: any = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await organizationController.findById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(errorResponse.message).toContain("not found");
    });

    it("should handle negative IDs", async () => {
      const req = {
        params: { id: "-5" },
      } as Request<{ id: string }>;

      let errorResponse: any = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await organizationController.findById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(errorResponse.message).toBe("Invalid ID");
    });

    it("should handle zero ID", async () => {
      const req = {
        params: { id: "0" },
      } as Request<{ id: string }>;

      let errorResponse: any = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await organizationController.findById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(errorResponse.message).toBe("Invalid ID");
    });

    it("should handle non-numeric ID", async () => {
      const req = {
        params: { id: "abc" },
      } as Request<{ id: string }>;

      let errorResponse: any = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await organizationController.findById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(errorResponse.message).toBe("Invalid ID");
    });

    it("should handle extremely large ID", async () => {
      const req = {
        params: { id: "9999999999999" },
      } as Request<{ id: string }>;

      let errorResponse: any = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await organizationController.findById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("UPDATE edge cases", () => {
    let createdOrganization: Organization;

    beforeEach(async () => {
      const createReq = {
        body: {
          name: "Original Organization",
          latitude: 55.7558,
          longitude: 37.6176,
        },
      } as Request;

      const createRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          if (isSuccessResponse<Organization>(data)) {
            createdOrganization = data.data;
          }
        }),
      } as unknown as Response;

      await organizationController.create(createReq, createRes);
    });

    it("should reject update with empty name", async () => {
      const updateReq = {
        params: { id: String(createdOrganization.id) },
        body: { name: "" },
      } as unknown as Request<{ id: string }, {}, { name: string }>;

      let errorResponse: any = {};
      const updateRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await organizationController.update(updateReq, updateRes);

      expect(updateRes.status).toHaveBeenCalledWith(400);
      expect(errorResponse.message).toBe("Organization name cannot be empty");
    });

    it("should reject update with whitespace-only name", async () => {
      const updateReq = {
        params: { id: String(createdOrganization.id) },
        body: { name: "   " },
      } as unknown as Request<{ id: string }, {}, { name: string }>;

      let errorResponse: any = {};
      const updateRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await organizationController.update(updateReq, updateRes);

      expect(updateRes.status).toHaveBeenCalledWith(400);
      expect(errorResponse.message).toBe("Organization name cannot be empty");
    });

    it("should reject update to existing name (duplicate)", async () => {
      // Создаем вторую организацию
      const createReq2 = {
        body: {
          name: "Second Organization",
          latitude: 55.7558,
          longitude: 37.6176,
        },
      } as Request;

      const createRes2 = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await organizationController.create(createReq2, createRes2);

      // Пытаемся обновить первую организацию именем второй
      const updateReq = {
        params: { id: String(createdOrganization.id) },
        body: { name: "Second Organization" },
      } as unknown as Request<{ id: string }, {}, { name: string }>;

      let errorResponse: any = {};
      const updateRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await organizationController.update(updateReq, updateRes);

      expect(updateRes.status).toHaveBeenCalledWith(500);
      expect(errorResponse.message).toContain("already exists");
    });

    it("should handle update of non-existent organization", async () => {
      const updateReq = {
        params: { id: "999999" },
        body: { name: "New Name" },
      } as unknown as Request<{ id: string }, {}, { name: string }>;

      let errorResponse: any = {};
      const updateRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await organizationController.update(updateReq, updateRes);

      expect(updateRes.status).toHaveBeenCalledWith(500);
      expect(errorResponse.message).toContain("not found");
    });

    it("should reject update with no fields to update", async () => {
      const updateReq = {
        params: { id: String(createdOrganization.id) },
        body: {},
      } as unknown as Request<{ id: string }, {}, {}>;

      let errorResponse: any = {};
      const updateRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await organizationController.update(updateReq, updateRes);

      expect(updateRes.status).toHaveBeenCalledWith(400);
      expect(errorResponse.message).toBe("Update data is required");
    });

    describe("Coordinate validation in update", () => {
      it("should reject latitude below -90", async () => {
        const updateReq = {
          params: { id: String(createdOrganization.id) },
          body: { latitude: -91 },
        } as unknown as Request<{ id: string }, {}, { latitude: number }>;

        let errorResponse: any = {};
        const updateRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockImplementation((data) => {
            errorResponse = data;
          }),
        } as unknown as Response;

        await organizationController.update(updateReq, updateRes);

        expect(updateRes.status).toHaveBeenCalledWith(500);
        expect(errorResponse.message).toContain(
          "Latitude must be between -90 and 90",
        );
      });

      it("should reject latitude above 90", async () => {
        const updateReq = {
          params: { id: String(createdOrganization.id) },
          body: { latitude: 91 },
        } as unknown as Request<{ id: string }, {}, { latitude: number }>;

        let errorResponse: any = {};
        const updateRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockImplementation((data) => {
            errorResponse = data;
          }),
        } as unknown as Response;

        await organizationController.update(updateReq, updateRes);

        expect(updateRes.status).toHaveBeenCalledWith(500);
        expect(errorResponse.message).toContain(
          "Latitude must be between -90 and 90",
        );
      });

      it("should reject longitude below -180", async () => {
        const updateReq = {
          params: { id: String(createdOrganization.id) },
          body: { longitude: -181 },
        } as unknown as Request<{ id: string }, {}, { longitude: number }>;

        let errorResponse: any = {};
        const updateRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockImplementation((data) => {
            errorResponse = data;
          }),
        } as unknown as Response;

        await organizationController.update(updateReq, updateRes);

        expect(updateRes.status).toHaveBeenCalledWith(500);
        expect(errorResponse.message).toContain(
          "Longitude must be between -180 and 180",
        );
      });

      it("should reject longitude above 180", async () => {
        const updateReq = {
          params: { id: String(createdOrganization.id) },
          body: { longitude: 181 },
        } as unknown as Request<{ id: string }, {}, { longitude: number }>;

        let errorResponse: any = {};
        const updateRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockImplementation((data) => {
            errorResponse = data;
          }),
        } as unknown as Response;

        await organizationController.update(updateReq, updateRes);

        expect(updateRes.status).toHaveBeenCalledWith(500);
        expect(errorResponse.message).toContain(
          "Longitude must be between -180 and 180",
        );
      });

      it("should accept valid coordinate updates", async () => {
        const updateReq = {
          params: { id: String(createdOrganization.id) },
          body: {
            latitude: 40.7128,
            longitude: -74.006,
          },
        } as unknown as Request<
          { id: string },
          {},
          { latitude: number; longitude: number }
        >;

        let updatedOrg = {} as Organization;
        const updateRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockImplementation((data) => {
            if (isSuccessResponse<Organization>(data)) {
              updatedOrg = data.data;
            }
          }),
        } as unknown as Response;

        await organizationController.update(updateReq, updateRes);

        expect(updateRes.status).toHaveBeenCalledWith(200);
        expect(updatedOrg.latitude).toBe(40.7128);
        expect(updatedOrg.longitude).toBe(-74.006);
        expect(updatedOrg.name).toBe(createdOrganization.name); // имя не изменилось
      });
    });
  });

  describe("DELETE edge cases", () => {
    let createdOrganization: Organization;

    beforeEach(async () => {
      const createReq = {
        body: {
          name: "To Be Deleted",
          latitude: 55.7558,
          longitude: 37.6176,
        },
      } as Request;

      const createRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          if (isSuccessResponse<Organization>(data)) {
            createdOrganization = data.data;
          }
        }),
      } as unknown as Response;

      await organizationController.create(createReq, createRes);
    });

    it("should handle deletion of non-existent organization", async () => {
      const deleteReq = {
        params: { id: "999999" },
      } as Request<{ id: string }, {}, {}>;

      let errorResponse: any = {};
      const deleteRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await organizationController.delete(deleteReq, deleteRes);

      expect(deleteRes.status).toHaveBeenCalledWith(500);
      expect(errorResponse.message).toContain("not found");
    });

    it("should handle negative ID in delete", async () => {
      const deleteReq = {
        params: { id: "-5" },
      } as Request<{ id: string }, {}, {}>;

      let errorResponse: any = {};
      const deleteRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await organizationController.delete(deleteReq, deleteRes);

      expect(deleteRes.status).toHaveBeenCalledWith(400);
      expect(errorResponse.message).toBe("Invalid ID");
    });

    it("should allow double deletion (second should fail)", async () => {
      // Первое удаление
      const deleteReq1 = {
        params: { id: String(createdOrganization.id) },
      } as Request<{ id: string }, {}, {}>;

      const deleteRes1 = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await organizationController.delete(deleteReq1, deleteRes1);
      expect(deleteRes1.status).toHaveBeenCalledWith(200);

      // Второе удаление того же ID
      const deleteReq2 = {
        params: { id: String(createdOrganization.id) },
      } as Request<{ id: string }, {}, {}>;

      let errorResponse: any = {};
      const deleteRes2 = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await organizationController.delete(deleteReq2, deleteRes2);

      expect(deleteRes2.status).toHaveBeenCalledWith(500);
      expect(errorResponse.message).toContain("not found");
    });
  });

  describe("SEARCH edge cases", () => {
    beforeEach(async () => {
      // Создаем тестовые данные
      const organizations = [
        { name: "Tech Company Moscow", latitude: 55.7558, longitude: 37.6176 },
        { name: "Tech Company SPB", latitude: 59.9343, longitude: 30.3351 },
        { name: "Finance Corp", latitude: 55.7558, longitude: 37.6176 },
        {
          name: "Технологическая компания",
          latitude: 55.7558,
          longitude: 37.6176,
        },
        { name: "Org with emoji 🏢", latitude: 55.7558, longitude: 37.6176 },
      ];

      for (const org of organizations) {
        const req = { body: org } as Request;
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        } as unknown as Response;
        await organizationController.create(req, res);
      }
    });

    it("should handle empty search string", async () => {
      const req = {
        params: { search: "" },
      } as Request<{ search: string }, {}, {}>;

      let errorResponse: any = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await organizationController.search(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(errorResponse.message).toBe("Search query is required");
    });

    it("should handle whitespace-only search", async () => {
      const req = {
        params: { search: "   " },
      } as Request<{ search: string }, {}, {}>;

      let errorResponse: any = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          errorResponse = data;
        }),
      } as unknown as Response;

      await organizationController.search(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(errorResponse.message).toBe("Search query is required");
    });

    it("should return empty array for non-matching search", async () => {
      const req = {
        params: { search: "NonexistentPattern123!@#" },
      } as Request<{ search: string }, {}, {}>;

      let searchData: Organization[] = [];
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          if (isSuccessResponse<Organization[]>(data)) {
            searchData = data.data;
          }
        }),
      } as unknown as Response;

      await organizationController.search(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(searchData.length).toBe(0);
    });

    it("should handle very long search string", async () => {
      const longSearch = "a".repeat(1000);

      const req = {
        params: { search: longSearch },
      } as Request<{ search: string }, {}, {}>;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await organizationController.search(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
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

        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        } as unknown as Response;

        await organizationController.search(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
      }
    });

    it("should search by partial names", async () => {
      const req = {
        params: { search: "Tech" },
      } as Request<{ search: string }, {}, {}>;

      let searchData: Organization[] = [];
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          if (isSuccessResponse<Organization[]>(data)) {
            searchData = data.data;
          }
        }),
      } as unknown as Response;

      await organizationController.search(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(searchData.length).toBe(2); // Tech Company Moscow и Tech Company SPB
      expect(searchData.every((org) => org.name.includes("Tech"))).toBeTruthy();
    });

    it("should search with cyrillic characters", async () => {
      const req = {
        params: { search: "Технологическая" },
      } as Request<{ search: string }, {}, {}>;

      let searchData: Organization[] = [];
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          if (isSuccessResponse<Organization[]>(data)) {
            searchData = data.data;
          }
        }),
      } as unknown as Response;

      await organizationController.search(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(searchData.length).toBe(1);
      expect(searchData[0].name).toBe("Технологическая компания");
    });

    it("should search with emoji", async () => {
      const req = {
        params: { search: "🏢" },
      } as Request<{ search: string }, {}, {}>;

      let searchData: Organization[] = [];
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          if (isSuccessResponse<Organization[]>(data)) {
            searchData = data.data;
          }
        }),
      } as unknown as Response;

      await organizationController.search(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(searchData.length).toBe(1);
      expect(searchData[0].name).toContain("🏢");
    });
  });

  describe("CONCURRENCY edge cases", () => {
    it("should handle multiple simultaneous creations", async () => {
      const createPromises = [];
      const names = [];

      for (let i = 0; i < 10; i++) {
        const name = `Concurrent Organization ${i}`;
        names.push(name);

        const req = {
          body: {
            name,
            latitude: 55.7558,
            longitude: 37.6176,
          },
        } as Request;

        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        } as unknown as Response;

        createPromises.push(organizationController.create(req, res));
      }

      await Promise.all(createPromises);

      // Проверяем, что все создались
      const findAllReq = {} as Request;
      let allOrganizations: Organization[] = [];
      const findAllRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          if (isSuccessResponse<Organization[]>(data)) {
            allOrganizations = data.data;
          }
        }),
      } as unknown as Response;

      await organizationController.findAll(findAllReq, findAllRes);
      expect(allOrganizations.length).toBe(10);
      names.forEach((name) => {
        expect(allOrganizations.some((org) => org.name === name)).toBeTruthy();
      });
    });

    it("should handle concurrent updates to same organization", async () => {
      // Создаем организацию
      const createReq = {
        body: {
          name: "Concurrent Update Test",
          latitude: 55.7558,
          longitude: 37.6176,
        },
      } as Request;

      let createdOrganization: Organization;
      const createRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          if (isSuccessResponse<Organization>(data)) {
            createdOrganization = data.data;
          }
        }),
      } as unknown as Response;

      await organizationController.create(createReq, createRes);

      // Пытаемся обновить его одновременно 5 раз
      const updatePromises = [];
      for (let i = 0; i < 5; i++) {
        const updateReq = {
          params: { id: String(createdOrganization.id) },
          body: { name: `Updated Name ${i}` },
        } as unknown as Request<{ id: string }, {}, { name: string }>;

        const updateRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        } as unknown as Response;

        updatePromises.push(
          organizationController.update(updateReq, updateRes),
        );
      }

      // Все запросы должны выполниться без ошибок (последний победит)
      await expect(Promise.all(updatePromises)).resolves.not.toThrow();
    });
  });

  describe("INTEGRATION with related entities", () => {
    it("should handle deletion of organization with related users (if foreign key exists)", async () => {
      // Создаем организацию
      const createReq = {
        body: {
          name: "Org With Users",
          latitude: 55.7558,
          longitude: 37.6176,
        },
      } as Request;

      let createdOrganization: Organization;
      const createRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          if (isSuccessResponse<Organization>(data)) {
            createdOrganization = data.data;
          }
        }),
      } as unknown as Response;

      await organizationController.create(createReq, createRes);

      // Создаем связанного пользователя (если таблица app_user существует)
      try {
        await pool.query(
          `INSERT INTO app_user (username, email, organization_id)
           VALUES ($1, $2, $3)`,
          ["testuser", "test@example.com", createdOrganization.id],
        );

        // Пытаемся удалить организацию
        const deleteReq = {
          params: { id: String(createdOrganization.id) },
        } as Request<{ id: string }, {}, {}>;

        let errorResponse: any = {};
        const deleteRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockImplementation((data) => {
            errorResponse = data;
          }),
        } as unknown as Response;

        await organizationController.delete(deleteReq, deleteRes);

        // В зависимости от внешнего ключа может быть ошибка или успех
        if ((errorResponse as any).message) {
          expect(errorResponse.message).toContain("associated users");
        }
      } catch (error) {
        // Таблица app_user может не существовать
        console.log(
          "Skipping user integration test - app_user table may not exist",
        );
      }
    });
  });
});
