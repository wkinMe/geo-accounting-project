import { Request, Response } from "express";
import { MaterialController } from "../../src/controllers/MaterialController";
import { pool } from "../../src/db";
import {
  jest,
  expect,
  describe,
  it,
  beforeAll,
  beforeEach,
  afterAll,
} from "@jest/globals";
import { Material } from "../../src/models";
import { isSuccessResponse } from "../../types";

describe("Material controller test", () => {
  let materialController: MaterialController;

  beforeAll(() => {
    materialController = new MaterialController(pool);
  });

  beforeEach(async () => {
    await pool.query("DELETE FROM materials");
  });

  afterAll(async () => {
    await pool.end();
  });

  it("CRUD material check", async () => {
    // CREATE
    const createReq = {
      body: { name: "Test material" },
    } as Request;

    let createData = {} as Material;

    const createRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation((data) => {
        if (isSuccessResponse(data)) {
          createData = data.data;
        }
      }),
    } as unknown as Response;

    await materialController.create(createReq, createRes);

    expect(createRes.status).toHaveBeenCalledWith(201);
    expect(createData.name).toEqual("Test material");

    let updateData = {} as Material;
    // UPDATE
    const updateReq = {
      params: { id: String(createData.id) },
      body: { name: "Update name" },
    } as unknown as Request<{ id: string }, {}, { name: string }>;

    const updateRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation((data) => {
        if (isSuccessResponse(data)) {
          updateData = data.data;
        }
      }), // 👇 ЯВНЫЙ ТИП
    } as unknown as Response;

    await materialController.update(updateReq, updateRes);

    expect(updateRes.status).toHaveBeenCalledWith(200);
    expect(updateData.name).toBe("Update name");
    expect(updateData.updated_at).not.toEqual(createData.updated_at);
    expect(updateData.created_at).toEqual(createData.created_at);
    expect(updateData.id).toBe(createData.id);
  });
});
