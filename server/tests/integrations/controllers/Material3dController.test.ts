// tests/integrations/controllers/Material3DController.test.ts
import { Material3DController } from '../../../src/controllers/Material3DController';
import { Request, Response } from 'express';
import { NotFoundError } from '@shared/service';

jest.mock('../../../src/services/Material3DService');
jest.mock('../../../src/repositories/Material3DRepository');
jest.mock('../../../src/repositories/MaterialRepository');
jest.mock('../../../src/db', () => ({ pool: {} }));

import { Material3DService } from '../../../src/services/Material3DService';

describe('Material3DController Integration Tests', () => {
  let controller: Material3DController;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockMaterial3DService: jest.Mocked<Material3DService>;

  beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
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
      file: undefined,
    };

    mockMaterial3DService = {
      findByMaterialId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getModelData: jest.fn(),
    } as any;

    controller = new Material3DController(mockMaterial3DService);
  });

  describe('getByMaterialId', () => {
    test('должен вернуть 3D модель по ID материала', async () => {
      const mockModel = { id: 1, materialId: 1, format: 'gltf', toJSON: () => ({ id: 1, format: 'gltf' }) };
      mockReq.params = { materialId: '1' };
      mockMaterial3DService.findByMaterialId.mockResolvedValue(mockModel as any);

      await controller.getByMaterialId(mockReq as Request, mockRes as Response);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: { id: 1, format: 'gltf' },
      });
    });

    test('должен вернуть 404 если модель не найдена', async () => {
      mockReq.params = { materialId: '999' };
      mockMaterial3DService.findByMaterialId.mockResolvedValue(null);

      await controller.getByMaterialId(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: '3D object for material 999 not found',
      });
    });
  });

  describe('create', () => {
    test('должен создать 3D модель', async () => {
      const mockModel = { id: 1, materialId: 1, format: 'gltf', toJSON: () => ({ id: 1, format: 'gltf' }) };
      mockReq.body = { materialId: '1', format: 'gltf' };
      mockReq.file = { buffer: Buffer.from('test') } as any;
      mockMaterial3DService.create.mockResolvedValue(mockModel as any);

      await controller.create(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(201);
    });
  });

  describe('update', () => {
    test('должен обновить 3D модель', async () => {
      const mockModel = { id: 1, materialId: 1, format: 'obj', toJSON: () => ({ id: 1, format: 'obj' }) };
      mockReq.params = { materialId: '1' };
      mockReq.body = { format: 'obj' };
      mockMaterial3DService.update.mockResolvedValue(mockModel as any);

      await controller.update(mockReq as Request, mockRes as Response);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: { id: 1, format: 'obj' },
      });
    });
  });

  describe('delete', () => {
    test('должен удалить 3D модель', async () => {
      mockReq.params = { materialId: '1' };
      mockMaterial3DService.delete.mockResolvedValue(undefined);

      await controller.delete(mockReq as Request, mockRes as Response);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: '3D object deleted successfully',
      });
    });
  });

  describe('downloadModel', () => {
    test('должен скачать 3D модель', async () => {
      const mockModelData = Buffer.from('test model data');
      const mockModel = { format: 'gltf' };
      mockReq.params = { materialId: '1' };
      mockMaterial3DService.getModelData.mockResolvedValue(mockModelData);
      mockMaterial3DService.findByMaterialId.mockResolvedValue(mockModel as any);

      const mockSend = jest.fn();
      const mockSetHeader = jest.fn();
      mockRes.send = mockSend;
      mockRes.setHeader = mockSetHeader;

      await controller.downloadModel(mockReq as Request, mockRes as Response);

      expect(mockSetHeader).toHaveBeenCalled();
      expect(mockSend).toHaveBeenCalledWith(mockModelData);
    });

    test('должен вернуть 404 если модель не найдена', async () => {
      mockReq.params = { materialId: '999' };
      mockMaterial3DService.getModelData.mockResolvedValue(null);

      await controller.downloadModel(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
    });
  });
});