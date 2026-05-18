// tests/repositories/WarehouseRepository.test.ts
import { WarehouseRepository } from '../../src/repositories/WarehouseRepository';
import { Warehouse } from '../../src/domain/entities/Warehouse';
import { Pool } from 'pg';
import { DatabaseError, NotFoundError } from '@shared/service';

const mockQuery = jest.fn();
const mockPool = { query: mockQuery } as unknown as jest.Mocked<Pool>;

describe('WarehouseRepository', () => {
  let repository: WarehouseRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new WarehouseRepository(mockPool);
  });

  describe('findAll', () => {
    test('должен вернуть пустой массив если складов нет', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockQuery.mockResolvedValueOnce({ rows: [{ total: 0 }] });
      const result = await repository.findAll();
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('findById', () => {
    test('должен вернуть null при несуществующем ID', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await repository.findById(999);
      expect(result).toBeNull();
    });
  });

  describe('findByIdWithDetails', () => {
    test('должен вернуть null при несуществующем ID', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await repository.findByIdWithDetails(999);
      expect(result).toBeNull();
    });
  });

  describe('findByName', () => {
    test('должен вернуть null при несуществующем имени', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await repository.findByName('nonexistent', 1);
      expect(result).toBeNull();
    });
  });

  describe('findByManagerId', () => {
    test('должен вернуть пустой массив если у менеджера нет складов', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await repository.findByManagerId(999);
      expect(result).toEqual([]);
    });
  });

  describe('save', () => {
    test('должен выбросить DatabaseError при неудачном сохранении', async () => {
      const warehouse = Warehouse.create('Тест', 1, 52.0, 31.0);
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(repository.save(warehouse)).rejects.toThrow(DatabaseError);
    });
  });

  describe('update', () => {
    test('должен выбросить NotFoundError при обновлении несуществующего склада', async () => {
      const warehouse = Warehouse.create('Тест', 1, 52.0, 31.0);
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(repository.update(999, warehouse)).rejects.toThrow(NotFoundError);
    });
  });

  describe('delete', () => {
    test('должен выбросить NotFoundError при удалении несуществующего склада', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(repository.delete(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('checkUsageInAgreements', () => {
    test('должен вернуть нулевые значения если склад не используется в договорах', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: 0 }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ count: 0 }] });
      const result = await repository.checkUsageInAgreements(1);
      expect(result.as_supplier).toBe(0);
      expect(result.as_customer).toBe(0);
    });
  });

  describe('checkHasMaterials', () => {
    test('должен вернуть false если на складе нет материалов', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: 0 }] });
      const result = await repository.checkHasMaterials(1);
      expect(result).toBe(false);
    });
  });
});