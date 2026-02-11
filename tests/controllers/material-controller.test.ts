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

// 👇 ЯВНЫЙ ИНТЕРФЕЙС
interface MaterialResponse {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

// 👇 ТИП ДЛЯ JSON МОКА
type JsonMock = jest.Mock & {
  mock: {
    calls: Array<[MaterialResponse & { message?: string }]>;
  };
};

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

    const createRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn() as JsonMock, // 👇 ЯВНЫЙ ТИП
    } as unknown as Response;

    await materialController.create(createReq, createRes);

    expect(createRes.status).toHaveBeenCalledWith(201);

    const createJsonMock = createRes.json as JsonMock;
    const createResponseData = createJsonMock.mock.calls[0][0].data;

    expect(createResponseData).toEqual({
      id: expect.any(Number),
      name: "Test material",
      created_at: expect.any(String),
      updated_at: expect.any(String),
    });

    const createdUpdatedAt = createResponseData.updated_at;

    // UPDATE
    const updateReq = {
      params: { id: String(createResponseData.id) },
      body: { name: "Update name" },
    } as unknown as Request<{ id: string }, {}, { name: string }>;

    const updateRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn() as JsonMock, // 👇 ЯВНЫЙ ТИП
    } as unknown as Response;

    await materialController.update(updateReq, updateRes);

    expect(updateRes.status).toHaveBeenCalledWith(200);

    const updateJsonMock = updateRes.json as JsonMock;
    const updateResponseData = updateJsonMock.mock.calls[0][0].data;

    expect(updateResponseData).toEqual({
      id: createResponseData.id,
      name: "Update name",
      created_at: createResponseData.created_at,
      updated_at: expect.any(String),
    });

    // 👇 СРАВНЕНИЕ ДАТ
    expect(new Date(updateResponseData.updated_at).getTime()).toBeGreaterThan(
      new Date(createdUpdatedAt).getTime(),
    );
  });
});
