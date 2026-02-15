import { Request, Response } from "express";
import { UserController } from "@src/controllers";
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
import { User, Organization, UserWithOrganization } from "@src/models";
import { isSuccessResponse, isErrorResponse } from "@t/guards";
import bcrypt from "bcrypt";

describe("User Controller Edge Cases", () => {
  let userController: UserController;
  let testOrganization: Organization;

  beforeAll(async () => {
    userController = new UserController(pool);
  });

  beforeEach(async () => {
    await pool.query("DELETE FROM app_users");
    await pool.query("DELETE FROM organizations");

    const organizationResult = await pool.query<Organization>(
      "INSERT INTO organizations (name, latitude, longitude) VALUES ($1, $2, $3) RETURNING *",
      ["Test Organization", 55.7558, 37.6176],
    );
    testOrganization = organizationResult.rows[0];
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
          password: "password123",
        },
      } as Request;

      let responseData: unknown;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          responseData = data;
        }),
      } as unknown as Response;

      await userController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      console.log(responseData);
      expect(isErrorResponse(responseData)).toBe(true);
      if (isErrorResponse(responseData)) {
        expect(responseData.message).toBe("User name is required");
      }
    });

    it("should reject creation with whitespace-only name", async () => {
      const req = {
        body: {
          name: "   ",
          organization_id: testOrganization.id,
          password: "password123",
        },
      } as Request;

      let responseData: unknown;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          responseData = data;
        }),
      } as unknown as Response;

      await userController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(responseData)).toBe(true);
      if (isErrorResponse(responseData)) {
        expect(responseData.message).toBe("User name is required");
      }
    });

    it("should reject creation with missing name", async () => {
      const req = {
        body: {
          organization_id: testOrganization.id,
          password: "password123",
        },
      } as Request;

      let responseData: unknown;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          responseData = data;
        }),
      } as unknown as Response;

      await userController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(responseData)).toBe(true);
      if (isErrorResponse(responseData)) {
        expect(responseData.message).toBe("User name is required");
      }
    });

    it("should reject creation with empty organization_id", async () => {
      const req = {
        body: {
          name: "Test User",
          organization_id: "",
          password: "password123",
        },
      } as Request;

      let responseData: unknown;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          responseData = data;
        }),
      } as unknown as Response;

      await userController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(responseData)).toBe(true);
      if (isErrorResponse(responseData)) {
        expect(responseData.message).toBe("Organization ID is required");
      }
    });

    it("should reject creation with missing organization_id", async () => {
      const req = {
        body: {
          name: "Test User",
          password: "password123",
        },
      } as Request;

      let responseData: unknown;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          responseData = data;
        }),
      } as unknown as Response;

      await userController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(responseData)).toBe(true);
      if (isErrorResponse(responseData)) {
        expect(responseData.message).toBe("Organization ID is required");
      }
    });

    it("should reject creation with empty password", async () => {
      const req = {
        body: {
          name: "Test User",
          organization_id: testOrganization.id,
          password: "",
        },
      } as Request;

      let responseData: unknown;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          responseData = data;
        }),
      } as unknown as Response;

      await userController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(responseData)).toBe(true);
      if (isErrorResponse(responseData)) {
        expect(responseData.message).toBe("Password is required");
      }
    });

    it("should reject creation with missing password", async () => {
      const req = {
        body: {
          name: "Test User",
          organization_id: testOrganization.id,
        },
      } as Request;

      let responseData: unknown;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          responseData = data;
        }),
      } as unknown as Response;

      await userController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(responseData)).toBe(true);
      if (isErrorResponse(responseData)) {
        expect(responseData.message).toBe("Password is required");
      }
    });

    it("should handle extremely long name", async () => {
      const longName = "a".repeat(500);

      const req = {
        body: {
          name: longName,
          organization_id: testOrganization.id,
          password: "password123",
        },
      } as Request;

      let responseData: unknown;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          responseData = data;
        }),
      } as unknown as Response;

      await userController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(isSuccessResponse<User>(responseData)).toBe(true);
      if (isSuccessResponse<User>(responseData)) {
        expect(responseData.data.name).toBe(longName);
        expect(responseData.message).toBe("User created successfully");
      }
    });

    it("should handle extremely long password", async () => {
      const longPassword = "a".repeat(200);

      const req = {
        body: {
          name: "Test User",
          organization_id: testOrganization.id,
          password: longPassword,
        },
      } as Request;

      let responseData: unknown;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          responseData = data;
        }),
      } as unknown as Response;

      await userController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(isSuccessResponse<User>(responseData)).toBe(true);
      if (isSuccessResponse<User>(responseData)) {
        const isMatch = await bcrypt.compare(
          longPassword,
          responseData.data.password,
        );
        expect(isMatch).toBe(true);
      }
    });

    it("should handle special characters in name", async () => {
      const specialNames = [
        "User!@#$%^&*()",
        "Пользователь на русском",
        "ユーザー",
        "User with emoji 👤",
        "'; DROP TABLE users; --",
        "<script>alert('xss')</script>",
        "name with\nnewline",
        "name\twith\ttabs",
      ];

      for (const specialName of specialNames) {
        const req = {
          body: {
            name: specialName,
            organization_id: testOrganization.id,
            password: "password123",
          },
        } as Request;

        let responseData: unknown;
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockImplementation((data) => {
            responseData = data;
          }),
        } as unknown as Response;

        await userController.create(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(isSuccessResponse<User>(responseData)).toBe(true);
        if (isSuccessResponse<User>(responseData)) {
          expect(responseData.data.name).toBe(specialName);
        }
      }
    });

    it("should handle special characters in password", async () => {
      const specialPasswords = [
        "!@#$%^&*()",
        "пароль123",
        "😊🎉🚀",
        "'; DROP TABLE users; --",
        "password with\nnewline",
        "password\twith\ttabs",
      ];

      for (const specialPassword of specialPasswords) {
        const req = {
          body: {
            name: "Test User",
            organization_id: testOrganization.id,
            password: specialPassword,
          },
        } as Request;

        let responseData: unknown;
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockImplementation((data) => {
            responseData = data;
          }),
        } as unknown as Response;

        await userController.create(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(isSuccessResponse<User>(responseData)).toBe(true);
        if (isSuccessResponse<User>(responseData)) {
          const isMatch = await bcrypt.compare(
            specialPassword,
            responseData.data.password,
          );
          expect(isMatch).toBe(true);
        }
      }
    });

    it("should reject creation with non-existent organization", async () => {
      const req = {
        body: {
          name: "Test User",
          organization_id: 999999,
          password: "password123",
        },
      } as Request;

      let responseData: unknown;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          responseData = data;
        }),
      } as unknown as Response;

      await userController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(isErrorResponse(responseData)).toBe(true);
      if (isErrorResponse(responseData)) {
        expect(responseData.message).toBeDefined();
      }
    });

    it("should create user with is_admin false by default", async () => {
      const req = {
        body: {
          name: "Regular User",
          organization_id: testOrganization.id,
          password: "password123",
        },
      } as Request;

      let responseData: unknown;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          responseData = data;
        }),
      } as unknown as Response;

      await userController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(isSuccessResponse<User>(responseData)).toBe(true);
      if (isSuccessResponse<User>(responseData)) {
        expect(responseData.data.is_admin).toBe(false);
      }
    });

    it("should create user with is_admin true when specified", async () => {
      const req = {
        body: {
          name: "Admin User",
          organization_id: testOrganization.id,
          password: "password123",
          is_admin: true,
        },
      } as Request;

      let responseData: unknown;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          responseData = data;
        }),
      } as unknown as Response;

      await userController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(isSuccessResponse<User>(responseData)).toBe(true);
      if (isSuccessResponse<User>(responseData)) {
        expect(responseData.data.is_admin).toBe(true);
      }
    });
  });

  describe("FIND BY ID edge cases", () => {
    let createdUser: User;

    beforeEach(async () => {
      const createReq = {
        body: {
          name: "Test User",
          organization_id: testOrganization.id,
          password: "password123",
        },
      } as Request;

      const createRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          if (isSuccessResponse<User>(data)) {
            createdUser = data.data;
          }
        }),
      } as unknown as Response;

      await userController.create(createReq, createRes);
    });

    it("should handle non-existent ID", async () => {
      const req = {
        params: { id: "999999" },
      } as Request<{ id: string }>;

      let responseData: unknown;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          responseData = data;
        }),
      } as unknown as Response;

      await userController.findById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(isErrorResponse(responseData)).toBe(true);
      if (isErrorResponse(responseData)) {
        expect(responseData.message).toContain("not found");
      }
    });

    it("should handle negative IDs", async () => {
      const req = {
        params: { id: "-5" },
      } as Request<{ id: string }>;

      let responseData: unknown;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          responseData = data;
        }),
      } as unknown as Response;

      await userController.findById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(responseData)).toBe(true);
      if (isErrorResponse(responseData)) {
        expect(responseData.message).toBe("Invalid user ID");
      }
    });

    it("should handle zero ID", async () => {
      const req = {
        params: { id: "0" },
      } as Request<{ id: string }>;

      let responseData: unknown;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          responseData = data;
        }),
      } as unknown as Response;

      await userController.findById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(responseData)).toBe(true);
      if (isErrorResponse(responseData)) {
        expect(responseData.message).toBe("Invalid user ID");
      }
    });

    it("should handle non-numeric ID", async () => {
      const req = {
        params: { id: "abc" },
      } as Request<{ id: string }>;

      let responseData: unknown;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          responseData = data;
        }),
      } as unknown as Response;

      await userController.findById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(responseData)).toBe(true);
      if (isErrorResponse(responseData)) {
        expect(responseData.message).toBe("Invalid user ID");
      }
    });

    it("should return user with organization data", async () => {
      const req = {
        params: { id: String(createdUser.id) },
      } as Request<{ id: string }>;

      let responseData: unknown;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          responseData = data;
        }),
      } as unknown as Response;

      await userController.findById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(isSuccessResponse<UserWithOrganization>(responseData)).toBe(true);
      if (isSuccessResponse<UserWithOrganization>(responseData)) {
        expect(responseData.data.name).toBe("Test User");
        expect(responseData.data.organization).toBeDefined();
        expect(responseData.data.organization?.name).toBe("Test Organization");
        expect(responseData.message).toBe(
          `User with id=${createdUser.id} has been got successfully`,
        );
      }
    });
  });

  describe("UPDATE edge cases", () => {
    let createdUser: User;

    beforeEach(async () => {
      const createReq = {
        body: {
          name: "Original User",
          organization_id: testOrganization.id,
          password: "original123",
        },
      } as Request;

      const createRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          if (isSuccessResponse<User>(data)) {
            createdUser = data.data;
          }
        }),
      } as unknown as Response;

      await userController.create(createReq, createRes);
    });

    it("should reject update with empty name", async () => {
      const updateReq = {
        params: { id: String(createdUser.id) },
        body: { name: "" },
      } as unknown as Request<{ id: string }, {}, { name: string }>;

      let responseData: unknown;
      const updateRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          responseData = data;
        }),
      } as unknown as Response;

      await userController.update(updateReq, updateRes);

      expect(updateRes.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(responseData)).toBe(true);
      if (isErrorResponse(responseData)) {
        expect(responseData.message).toBe("User name cannot be empty");
      }
    });

    it("should reject update with whitespace-only name", async () => {
      const updateReq = {
        params: { id: String(createdUser.id) },
        body: { name: "   " },
      } as unknown as Request<{ id: string }, {}, { name: string }>;

      let responseData: unknown;
      const updateRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          responseData = data;
        }),
      } as unknown as Response;

      await userController.update(updateReq, updateRes);

      expect(updateRes.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(responseData)).toBe(true);
      if (isErrorResponse(responseData)) {
        expect(responseData.message).toBe("User name cannot be empty");
      }
    });

    it("should reject update with empty organization_id", async () => {
      const updateReq = {
        params: { id: String(createdUser.id) },
        body: { organization_id: "" },
      } as unknown as Request<{ id: string }, {}, { organization_id: string }>;

      let responseData: unknown;
      const updateRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          responseData = data;
        }),
      } as unknown as Response;

      await userController.update(updateReq, updateRes);

      expect(updateRes.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(responseData)).toBe(true);
      if (isErrorResponse(responseData)) {
        expect(responseData.message).toBe("Organization ID cannot be empty");
      }
    });

    it("should reject update with empty password", async () => {
      const updateReq = {
        params: { id: String(createdUser.id) },
        body: { password: "" },
      } as unknown as Request<{ id: string }, {}, { password: string }>;

      let responseData: unknown;
      const updateRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          responseData = data;
        }),
      } as unknown as Response;

      await userController.update(updateReq, updateRes);

      expect(updateRes.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(responseData)).toBe(true);
      if (isErrorResponse(responseData)) {
        expect(responseData.message).toBe(
          "Password cannot be empty if provided",
        );
      }
    });

    it("should handle update of non-existent user", async () => {
      const updateReq = {
        params: { id: "999999" },
        body: { name: "New Name" },
      } as unknown as Request<{ id: string }, {}, { name: string }>;

      let responseData: unknown;
      const updateRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          responseData = data;
        }),
      } as unknown as Response;

      await userController.update(updateReq, updateRes);

      expect(updateRes.status).toHaveBeenCalledWith(500);
      expect(isErrorResponse(responseData)).toBe(true);
      if (isErrorResponse(responseData)) {
        expect(responseData.message).toContain("not found");
      }
    });

    it("should reject update with no fields to update", async () => {
      const updateReq = {
        params: { id: String(createdUser.id) },
        body: {},
      } as unknown as Request<{ id: string }, {}, {}>;

      let responseData: unknown;
      const updateRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          responseData = data;
        }),
      } as unknown as Response;

      await userController.update(updateReq, updateRes);

      expect(updateRes.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(responseData)).toBe(true);
      if (isErrorResponse(responseData)) {
        expect(responseData.message).toBe("Update data is required");
      }
    });

    it("should update name only", async () => {
      const updateReq = {
        params: { id: String(createdUser.id) },
        body: { name: "Updated Name" },
      } as unknown as Request<{ id: string }, {}, { name: string }>;

      let responseData: unknown;
      const updateRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          responseData = data;
        }),
      } as unknown as Response;

      await userController.update(updateReq, updateRes);

      expect(updateRes.status).toHaveBeenCalledWith(200);
      expect(isSuccessResponse<User>(responseData)).toBe(true);
      if (isSuccessResponse<User>(responseData)) {
        expect(responseData.data.name).toBe("Updated Name");
        expect(responseData.message).toBe("User updated successfully");

        const isMatch = await bcrypt.compare(
          "original123",
          responseData.data.password,
        );
        expect(isMatch).toBe(true);
      }
    });

    it("should update password only", async () => {
      const updateReq = {
        params: { id: String(createdUser.id) },
        body: { password: "newpassword456" },
      } as unknown as Request<{ id: string }, {}, { password: string }>;

      let responseData: unknown;
      const updateRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          responseData = data;
        }),
      } as unknown as Response;

      await userController.update(updateReq, updateRes);

      expect(updateRes.status).toHaveBeenCalledWith(200);
      expect(isSuccessResponse<User>(responseData)).toBe(true);
      if (isSuccessResponse<User>(responseData)) {
        const isMatch = await bcrypt.compare(
          "newpassword456",
          responseData.data.password,
        );
        expect(isMatch).toBe(true);
        expect(responseData.data.name).toBe("Original User");
      }
    });

    it("should update is_admin flag", async () => {
      expect(createdUser.is_admin).toBe(false);

      const updateReq = {
        params: { id: String(createdUser.id) },
        body: { is_admin: true },
      } as unknown as Request<{ id: string }, {}, { is_admin: boolean }>;

      let responseData: unknown;
      const updateRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          responseData = data;
        }),
      } as unknown as Response;

      await userController.update(updateReq, updateRes);

      expect(updateRes.status).toHaveBeenCalledWith(200);
      expect(isSuccessResponse<User>(responseData)).toBe(true);
      if (isSuccessResponse<User>(responseData)) {
        expect(responseData.data.is_admin).toBe(true);
      }
    });

    it("should update multiple fields at once", async () => {
      const updateReq = {
        params: { id: String(createdUser.id) },
        body: {
          name: "New Name",
          password: "newpass123",
          is_admin: true,
        },
      } as unknown as Request<
        { id: string },
        {},
        { name: string; password: string; is_admin: boolean }
      >;

      let responseData: unknown;
      const updateRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          responseData = data;
        }),
      } as unknown as Response;

      await userController.update(updateReq, updateRes);

      expect(updateRes.status).toHaveBeenCalledWith(200);
      expect(isSuccessResponse<User>(responseData)).toBe(true);
      if (isSuccessResponse<User>(responseData)) {
        expect(responseData.data.name).toBe("New Name");
        expect(responseData.data.is_admin).toBe(true);

        const isMatch = await bcrypt.compare(
          "newpass123",
          responseData.data.password,
        );
        expect(isMatch).toBe(true);
      }
    });
  });

  describe("DELETE edge cases", () => {
    let createdUser: User;

    beforeEach(async () => {
      const createReq = {
        body: {
          name: "To Be Deleted",
          organization_id: testOrganization.id,
          password: "password123",
        },
      } as Request;

      const createRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          if (isSuccessResponse<User>(data)) {
            createdUser = data.data;
          }
        }),
      } as unknown as Response;

      await userController.create(createReq, createRes);
    });

    it("should handle deletion of non-existent user", async () => {
      const deleteReq = {
        params: { id: "999999" },
      } as Request<{ id: string }, {}, {}>;

      let responseData: unknown;
      const deleteRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          responseData = data;
        }),
      } as unknown as Response;

      await userController.delete(deleteReq, deleteRes);

      expect(deleteRes.status).toHaveBeenCalledWith(500);
      expect(isErrorResponse(responseData)).toBe(true);
      if (isErrorResponse(responseData)) {
        expect(responseData.message).toContain("not found");
      }
    });

    it("should handle negative ID in delete", async () => {
      const deleteReq = {
        params: { id: "-5" },
      } as Request<{ id: string }, {}, {}>;

      let responseData: unknown;
      const deleteRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          responseData = data;
        }),
      } as unknown as Response;

      await userController.delete(deleteReq, deleteRes);

      expect(deleteRes.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(responseData)).toBe(true);
      if (isErrorResponse(responseData)) {
        expect(responseData.message).toBe("Invalid user ID");
      }
    });

    it("should handle zero ID in delete", async () => {
      const deleteReq = {
        params: { id: "0" },
      } as Request<{ id: string }, {}, {}>;

      let responseData: unknown;
      const deleteRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          responseData = data;
        }),
      } as unknown as Response;

      await userController.delete(deleteReq, deleteRes);

      expect(deleteRes.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(responseData)).toBe(true);
      if (isErrorResponse(responseData)) {
        expect(responseData.message).toBe("Invalid user ID");
      }
    });

    it("should handle non-numeric ID in delete", async () => {
      const deleteReq = {
        params: { id: "abc" },
      } as Request<{ id: string }, {}, {}>;

      let responseData: unknown;
      const deleteRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          responseData = data;
        }),
      } as unknown as Response;

      await userController.delete(deleteReq, deleteRes);

      expect(deleteRes.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(responseData)).toBe(true);
      if (isErrorResponse(responseData)) {
        expect(responseData.message).toBe("Invalid user ID");
      }
    });

    it("should allow double deletion (second should fail)", async () => {
      // Первое удаление
      const deleteReq1 = {
        params: { id: String(createdUser.id) },
      } as Request<{ id: string }, {}, {}>;

      let responseData1: unknown;
      const deleteRes1 = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          responseData1 = data;
        }),
      } as unknown as Response;

      await userController.delete(deleteReq1, deleteRes1);
      expect(deleteRes1.status).toHaveBeenCalledWith(200);
      expect(isSuccessResponse<User>(responseData1)).toBe(true);

      // Второе удаление того же ID
      const deleteReq2 = {
        params: { id: String(createdUser.id) },
      } as Request<{ id: string }, {}, {}>;

      let responseData2: unknown;
      const deleteRes2 = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          responseData2 = data;
        }),
      } as unknown as Response;

      await userController.delete(deleteReq2, deleteRes2);

      expect(deleteRes2.status).toHaveBeenCalledWith(500);
      expect(isErrorResponse(responseData2)).toBe(true);
      if (isErrorResponse(responseData2)) {
        expect(responseData2.message).toContain("not found");
      }
    });
  });

  describe("SEARCH edge cases", () => {
    beforeEach(async () => {
      const users = [
        {
          name: "John Doe",
          organization_id: testOrganization.id,
          password: "pass1",
        },
        {
          name: "Jane Smith",
          organization_id: testOrganization.id,
          password: "pass2",
        },
        {
          name: "Bob Johnson",
          organization_id: testOrganization.id,
          password: "pass3",
        },
        {
          name: "Алексей Петров",
          organization_id: testOrganization.id,
          password: "pass4",
        },
        {
          name: "田中太郎",
          organization_id: testOrganization.id,
          password: "pass5",
        },
        {
          name: "User with emoji 👤",
          organization_id: testOrganization.id,
          password: "pass6",
        },
      ];

      for (const user of users) {
        const req = { body: user } as Request;
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        } as unknown as Response;
        await userController.create(req, res);
      }
    });

    it("should handle empty search string", async () => {
      const req = {
        params: { search: "" },
      } as Request<{ search: string }, {}, {}>;

      let responseData: unknown;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          responseData = data;
        }),
      } as unknown as Response;

      await userController.search(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(responseData)).toBe(true);
      if (isErrorResponse(responseData)) {
        expect(responseData.message).toBe("Search query is required");
      }
    });

    it("should handle whitespace-only search", async () => {
      const req = {
        params: { search: "   " },
      } as Request<{ search: string }, {}, {}>;

      let responseData: unknown;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          responseData = data;
        }),
      } as unknown as Response;

      await userController.search(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(isErrorResponse(responseData)).toBe(true);
      if (isErrorResponse(responseData)) {
        expect(responseData.message).toBe("Search query is required");
      }
    });

    it("should return empty array for non-matching search", async () => {
      const req = {
        params: { search: "NonexistentUser123!@#" },
      } as Request<{ search: string }, {}, {}>;

      let responseData: unknown;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          responseData = data;
        }),
      } as unknown as Response;

      await userController.search(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(isSuccessResponse<User[]>(responseData)).toBe(true);
      if (isSuccessResponse<User[]>(responseData)) {
        expect(responseData.data.length).toBe(0);
        expect(responseData.message).toBe("Found 0 user(s)");
      }
    });

    it("should handle very long search string", async () => {
      const longSearch = "a".repeat(1000);

      const req = {
        params: { search: longSearch },
      } as Request<{ search: string }, {}, {}>;

      let responseData: unknown;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          responseData = data;
        }),
      } as unknown as Response;

      await userController.search(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(isSuccessResponse<User[]>(responseData)).toBe(true);
    });

    it("should search by partial names", async () => {
      const req = {
        params: { search: "Joh" },
      } as Request<{ search: string }, {}, {}>;

      let responseData: unknown;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          responseData = data;
        }),
      } as unknown as Response;

      await userController.search(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(isSuccessResponse<User[]>(responseData)).toBe(true);
      if (isSuccessResponse<User[]>(responseData)) {
        expect(responseData.data.length).toBe(1);
        expect(responseData.data[0].name).toContain("John");
      }
    });

    it("should search with cyrillic characters", async () => {
      const req = {
        params: { search: "Алексей" },
      } as Request<{ search: string }, {}, {}>;

      let responseData: unknown;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          responseData = data;
        }),
      } as unknown as Response;

      await userController.search(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(isSuccessResponse<User[]>(responseData)).toBe(true);
      if (isSuccessResponse<User[]>(responseData)) {
        expect(responseData.data.length).toBe(1);
        expect(responseData.data[0].name).toBe("Алексей Петров");
      }
    });

    it("should search with japanese characters", async () => {
      const req = {
        params: { search: "田中" },
      } as Request<{ search: string }, {}, {}>;

      let responseData: unknown;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          responseData = data;
        }),
      } as unknown as Response;

      await userController.search(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(isSuccessResponse<User[]>(responseData)).toBe(true);
      if (isSuccessResponse<User[]>(responseData)) {
        expect(responseData.data.length).toBe(1);
        expect(responseData.data[0].name).toBe("田中太郎");
      }
    });

    it("should search with emoji", async () => {
      const req = {
        params: { search: "👤" },
      } as Request<{ search: string }, {}, {}>;

      let responseData: unknown;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          responseData = data;
        }),
      } as unknown as Response;

      await userController.search(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(isSuccessResponse<User[]>(responseData)).toBe(true);
      if (isSuccessResponse<User[]>(responseData)) {
        expect(responseData.data.length).toBe(1);
        expect(responseData.data[0].name).toContain("👤");
      }
    });

    it("should search case-insensitively", async () => {
      const req = {
        params: { search: "jOhN dOe" },
      } as Request<{ search: string }, {}, {}>;

      let responseData: unknown;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          responseData = data;
        }),
      } as unknown as Response;

      await userController.search(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(isSuccessResponse<User[]>(responseData)).toBe(true);
      if (isSuccessResponse<User[]>(responseData)) {
        expect(responseData.data.length).toBe(1);
        expect(responseData.data[0].name).toBe("John Doe");
      }
    });
  });

  describe("SPECIFIC METHODS edge cases", () => {
    beforeEach(async () => {
      const users = [
        {
          name: "Admin 1",
          organization_id: testOrganization.id,
          password: "pass1",
          is_admin: true,
        },
        {
          name: "Admin 2",
          organization_id: testOrganization.id,
          password: "pass2",
          is_admin: true,
        },
        {
          name: "Regular 1",
          organization_id: testOrganization.id,
          password: "pass3",
          is_admin: false,
        },
        {
          name: "Regular 2",
          organization_id: testOrganization.id,
          password: "pass4",
          is_admin: false,
        },
      ];

      for (const user of users) {
        const req = { body: user } as Request;
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        } as unknown as Response;
        await userController.create(req, res);
      }
    });

    describe("getAdmins", () => {
      it("should return only admin users", async () => {
        const req = {} as Request;
        let responseData: unknown;
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockImplementation((data) => {
            responseData = data;
          }),
        } as unknown as Response;

        await userController.getAdmins(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(isSuccessResponse<UserWithOrganization[]>(responseData)).toBe(
          true,
        );
        if (isSuccessResponse<UserWithOrganization[]>(responseData)) {
          expect(responseData.data.length).toBe(2);
          expect(responseData.data.every((user) => user.is_admin)).toBe(true);
          expect(responseData.message).toContain(
            "Found 2 admin(s) successfully",
          );
        }
      });

      it("should return empty array if no admins exist", async () => {
        await pool.query("DELETE FROM app_users");

        const users = [
          {
            name: "Regular 1",
            organization_id: testOrganization.id,
            password: "pass1",
            is_admin: false,
          },
          {
            name: "Regular 2",
            organization_id: testOrganization.id,
            password: "pass2",
            is_admin: false,
          },
        ];

        for (const user of users) {
          const req = { body: user } as Request;
          const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
          } as unknown as Response;
          await userController.create(req, res);
        }

        const req = {} as Request;
        let responseData: unknown;
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockImplementation((data) => {
            responseData = data;
          }),
        } as unknown as Response;

        await userController.getAdmins(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(isSuccessResponse<UserWithOrganization[]>(responseData)).toBe(
          true,
        );
        if (isSuccessResponse<UserWithOrganization[]>(responseData)) {
          expect(responseData.data.length).toBe(0);
          expect(responseData.message).toContain(
            "Found 0 admin(s) successfully",
          );
        }
      });
    });

    describe("findByOrganizationId", () => {
      let secondOrganization: Organization;

      beforeEach(async () => {
        const organizationResult = await pool.query<Organization>(
          "INSERT INTO organizations (name, latitude, longitude) VALUES ($1, $2, $3) RETURNING *",
          ["Second Organization", 40.7128, -74.006],
        );
        secondOrganization = organizationResult.rows[0];

        const users = [
          {
            name: "Organization2 User 1",
            organization_id: secondOrganization.id,
            password: "pass1",
          },
          {
            name: "Organization2 User 2",
            organization_id: secondOrganization.id,
            password: "pass2",
          },
        ];

        for (const user of users) {
          const req = { body: user } as Request;
          const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
          } as unknown as Response;
          await userController.create(req, res);
        }
      });

      it("should return users for valid organization ID", async () => {
        const req = {
          params: { id: String(testOrganization.id) },
        } as Request<{ id: string }, {}, {}>;

        let responseData: unknown;
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockImplementation((data) => {
            responseData = data;
          }),
        } as unknown as Response;

        await userController.findByOrganizationId(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(isSuccessResponse<UserWithOrganization[]>(responseData)).toBe(
          true,
        );
        if (isSuccessResponse<UserWithOrganization[]>(responseData)) {
          expect(responseData.data.length).toBe(4);
          expect(
            responseData.data.every(
              (user) => user.organization_id === testOrganization.id,
            ),
          ).toBe(true);
          expect(responseData.message).toBe(
            `Found 4 user(s) for organization ${testOrganization.id}`,
          );
        }
      });

      it("should return empty array for organization with no users", async () => {
        const req = {
          params: { id: "999999" },
        } as Request<{ id: string }, {}, {}>;

        let responseData: unknown;
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockImplementation((data) => {
            responseData = data;
          }),
        } as unknown as Response;

        await userController.findByOrganizationId(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(isSuccessResponse<UserWithOrganization[]>(responseData)).toBe(
          true,
        );
        if (isSuccessResponse<UserWithOrganization[]>(responseData)) {
          expect(responseData.data.length).toBe(0);
          expect(responseData.message).toBe(
            "Found 0 user(s) for organization 999999",
          );
        }
      });

      it("should handle invalid organization ID (negative)", async () => {
        const req = {
          params: { id: "-5" },
        } as Request<{ id: string }, {}, {}>;

        let responseData: unknown;
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockImplementation((data) => {
            responseData = data;
          }),
        } as unknown as Response;

        await userController.findByOrganizationId(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(isErrorResponse(responseData)).toBe(true);
        if (isErrorResponse(responseData)) {
          expect(responseData.message).toBe("Invalid organization ID");
        }
      });

      it("should handle invalid organization ID (non-numeric)", async () => {
        const req = {
          params: { id: "abc" },
        } as Request<{ id: string }, {}, {}>;

        let responseData: unknown;
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockImplementation((data) => {
            responseData = data;
          }),
        } as unknown as Response;

        await userController.findByOrganizationId(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(isErrorResponse(responseData)).toBe(true);
        if (isErrorResponse(responseData)) {
          expect(responseData.message).toBe("Invalid organization ID");
        }
      });
    });

    describe("getAvailableManagers", () => {
      it("should return all non-admin users as available managers", async () => {
        const req = {} as Request;
        let responseData: unknown;
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockImplementation((data) => {
            responseData = data;
          }),
        } as unknown as Response;

        await userController.getAvailableManagers(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(isSuccessResponse<User[]>(responseData)).toBe(true);
        if (isSuccessResponse<User[]>(responseData)) {
          expect(responseData.data.length).toBe(2);
          expect(responseData.data.every((user) => !user.is_admin)).toBe(true);
          expect(responseData.message).toBe("Found 2 available manager(s)");
        }
      });

      it("should return empty array if no non-admin users exist", async () => {
        await pool.query("DELETE FROM app_users");

        const users = [
          {
            name: "Admin 1",
            organization_id: testOrganization.id,
            password: "pass1",
            is_admin: true,
          },
          {
            name: "Admin 2",
            organization_id: testOrganization.id,
            password: "pass2",
            is_admin: true,
          },
        ];

        for (const user of users) {
          const req = { body: user } as Request;
          const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
          } as unknown as Response;
          await userController.create(req, res);
        }

        const req = {} as Request;
        let responseData: unknown;
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockImplementation((data) => {
            responseData = data;
          }),
        } as unknown as Response;

        await userController.getAvailableManagers(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(isSuccessResponse<User[]>(responseData)).toBe(true);
        if (isSuccessResponse<User[]>(responseData)) {
          expect(responseData.data.length).toBe(0);
          expect(responseData.message).toBe("Found 0 available manager(s)");
        }
      });
    });
  });

  describe("CONCURRENCY edge cases", () => {
    it("should handle multiple simultaneous creations", async () => {
      const createPromises: Promise<Response<any, Record<string, any>>>[] = [];
      const names: string[] = [];

      for (let i = 0; i < 10; i++) {
        const name = `Concurrent User ${i}`;
        names.push(name);

        const req = {
          body: {
            name,
            organization_id: testOrganization.id,
            password: `password${i}`,
          },
        } as Request;

        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        } as unknown as Response;

        createPromises.push(userController.create(req, res));
      }

      await Promise.all(createPromises);

      const findAllReq = {} as Request;
      let responseData: unknown;
      const findAllRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          responseData = data;
        }),
      } as unknown as Response;

      await userController.findAll(findAllReq, findAllRes);
      expect(isSuccessResponse<UserWithOrganization[]>(responseData)).toBe(
        true,
      );
      if (isSuccessResponse<UserWithOrganization[]>(responseData)) {
        const { data } = responseData; // Переменная чтобы ts не ругался на тип в names.forEach, а то замыкание как-то криво для ts там работает
        expect(data.length).toBe(10);
        names.forEach((name) => {
          expect(data.some((user) => user.name === name)).toBeTruthy();
        });
      }
    });

    it("should handle concurrent updates to same user", async () => {
      const createReq = {
        body: {
          name: "Concurrent Update Test",
          organization_id: testOrganization.id,
          password: "password123",
        },
      } as Request;

      let createdUser: User | undefined;
      const createRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          if (isSuccessResponse<User>(data)) {
            createdUser = data.data;
          }
        }),
      } as unknown as Response;

      await userController.create(createReq, createRes);

      const updatePromises: Promise<Response<any, Record<string, any>>>[] = [];
      for (let i = 0; i < 5; i++) {
        const updateReq = {
          params: { id: String(createdUser!.id) },
          body: { name: `Updated Name ${i}` },
        } as unknown as Request<{ id: string }, {}, { name: string }>;

        const updateRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        } as unknown as Response;

        updatePromises.push(userController.update(updateReq, updateRes));
      }

      await expect(Promise.all(updatePromises)).resolves.not.toThrow();
    });
  });
});
