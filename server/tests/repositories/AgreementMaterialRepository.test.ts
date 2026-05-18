// tests/repositories/AgreementMaterialRepository.test.ts
import { AgreementMaterialRepository } from '../../src/repositories/AgreementMaterialRepository';
import { AgreementMaterial } from '../../src/domain/entities/AgreementMaterial';
import { Pool } from 'pg';

// Создаем полный мок Pool с корректной типизацией
const mockQuery = jest.fn();
const mockConnect = jest.fn();
const mockRelease = jest.fn();
const mockClientQuery = jest.fn();

const mockClient = {
  query: mockClientQuery,
  release: mockRelease,
};

const mockPool = {
  query: mockQuery,
  connect: mockConnect,
} as unknown as jest.Mocked<Pool>;

jest.mock('pg', () => {
  return {
    Pool: jest.fn(() => mockPool),
  };
});

describe('AgreementMaterialRepository', () => {
  let repository: AgreementMaterialRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConnect.mockResolvedValue(mockClient);
    repository = new AgreementMaterialRepository(mockPool);
  });

  describe('findByAgreement', () => {
    test('должен вернуть пустой массив, если договор не имеет материалов', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await repository.findByAgreement(999);

      expect(result).toEqual([]);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [999]
      );
    });

    test('должен корректно обработать материалы с нулевой ценой', async () => {
      const mockRows = [
        { agreement_id: 1, material_id: 1, amount: 10, item_price: 0 },
        { agreement_id: 1, material_id: 2, amount: 5, item_price: 0 },
      ];
      mockQuery.mockResolvedValueOnce({ rows: mockRows });

      const result = await repository.findByAgreement(1);

      expect(result).toHaveLength(2);
      expect(result[0].item_price).toBe(0);
      expect(result[1].item_price).toBe(0);
    });

    test('должен корректно обработать материалы с null ценой', async () => {
      const mockRows = [
        { agreement_id: 1, material_id: 1, amount: 10, item_price: null },
      ];
      mockQuery.mockResolvedValueOnce({ rows: mockRows });

      const result = await repository.findByAgreement(1);

      expect(result[0].item_price).toBeNull();
    });
  });

  describe('save', () => {
    test('должен выполнить upsert при конфликте', async () => {
      const material = new AgreementMaterial(1, 1, 10, 100);
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await repository.save(material);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('ON CONFLICT'),
        [1, 1, 10, 100]
      );
    });

    test('должен пробросить ошибку при ошибке выполнения запроса', async () => {
      const material = new AgreementMaterial(1, 1, 10, 100);
      const dbError = new Error('Connection failed');
      mockQuery.mockRejectedValueOnce(dbError);

      await expect(repository.save(material)).rejects.toThrow('Connection failed');
    });

    test('должен корректно сохранить материал с отрицательной ценой', async () => {
      const material = new AgreementMaterial(1, 1, 10, -50);
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await repository.save(material);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT'),
        [1, 1, 10, -50]
      );
    });
  });

  describe('saveMany', () => {
    test('должен ничего не делать при пустом массиве материалов', async () => {
      await repository.saveMany([]);

      expect(mockConnect).not.toHaveBeenCalled();
      expect(mockClientQuery).not.toHaveBeenCalled();
    });

    test('должен выполнить транзакцию для нескольких материалов', async () => {
      const materials = [
        new AgreementMaterial(1, 1, 10, 100),
        new AgreementMaterial(1, 2, 5, 200),
      ];

      mockClientQuery.mockResolvedValue({});

      await repository.saveMany(materials);

      expect(mockConnect).toHaveBeenCalled();
      expect(mockClientQuery).toHaveBeenCalledWith('BEGIN');
      expect(mockClientQuery).toHaveBeenCalledWith('COMMIT');
      expect(mockRelease).toHaveBeenCalled();
    });

    test('должен выполнить rollback при ошибке в середине транзакции', async () => {
      const materials = [
        new AgreementMaterial(1, 1, 10, 100),
        new AgreementMaterial(1, 2, 5, 200),
      ];
      
      mockClientQuery.mockImplementation((query: string) => {
        if (query.includes('INSERT') && query.includes('2')) {
          return Promise.reject(new Error('Duplicate key'));
        }
        return Promise.resolve();
      });

      await expect(repository.saveMany(materials)).rejects.toThrow('Duplicate key');
      expect(mockClientQuery).toHaveBeenCalledWith('ROLLBACK');
      expect(mockRelease).toHaveBeenCalled();
    });

    test('должен корректно обработать транзакцию с одним материалом', async () => {
      const materials = [new AgreementMaterial(1, 1, 10, 100)];
      mockClientQuery.mockResolvedValue({});

      await repository.saveMany(materials);

      expect(mockClientQuery).toHaveBeenCalledWith('BEGIN');
      expect(mockClientQuery).toHaveBeenCalledWith(
        'DELETE FROM agreement_material WHERE agreement_id = $1 AND material_id = $2',
        [1, 1]
      );
      expect(mockClientQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT'),
        [1, 1, 10, 100]
      );
      expect(mockClientQuery).toHaveBeenCalledWith('COMMIT');
    });

    test('должен корректно обработать материалы с одинаковым agreement_id', async () => {
      const materials = [
        new AgreementMaterial(1, 1, 10, 100),
        new AgreementMaterial(1, 2, 5, 200),
        new AgreementMaterial(1, 3, 7, 150),
      ];
      mockClientQuery.mockResolvedValue({});

      await repository.saveMany(materials);

      // 1 BEGIN + 3 DELETE + 3 INSERT + 1 COMMIT = 8
      expect(mockClientQuery).toHaveBeenCalledTimes(8);
    });
  });

  describe('deleteByAgreement', () => {
    test('должен выполнить удаление даже если у договора нет материалов', async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 0 });

      await repository.deleteByAgreement(999);

      expect(mockQuery).toHaveBeenCalledWith(
        'DELETE FROM agreement_material WHERE agreement_id = $1',
        [999]
      );
    });

    test('должен пробросить ошибку при проблеме с подключением к БД', async () => {
      const dbError = new Error('Database connection lost');
      mockQuery.mockRejectedValueOnce(dbError);

      await expect(repository.deleteByAgreement(1)).rejects.toThrow('Database connection lost');
    });
  });

  describe('delete', () => {
    test('должен удалить конкретную пару договор-материал', async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 1 });

      await repository.delete(1, 1);

      expect(mockQuery).toHaveBeenCalledWith(
        'DELETE FROM agreement_material WHERE agreement_id = $1 AND material_id = $2',
        [1, 1]
      );
    });

    test('должен выполнить удаление даже если запись не существовала', async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 0 });

      await repository.delete(999, 999);

      expect(mockQuery).toHaveBeenCalled();
    });
  });

  describe('краевые случаи с транзакциями', () => {
    test('должен корректно освободить клиента даже при ошибке', async () => {
      const materials = [new AgreementMaterial(1, 1, 10, 100)];
      mockClientQuery.mockRejectedValueOnce(new Error('Some error'));

      await expect(repository.saveMany(materials)).rejects.toThrow();
      expect(mockRelease).toHaveBeenCalled();
    });

    test('должен корректно обработать очень большое количество материалов', async () => {
      const materials = Array.from({ length: 100 }, (_, i) => 
        new AgreementMaterial(1, i + 1, 10, 100)
      );
      mockClientQuery.mockResolvedValue({});

      await repository.saveMany(materials);

      // BEGIN + 100 DELETE + 100 INSERT + COMMIT = 202
      expect(mockClientQuery).toHaveBeenCalledTimes(202);
      expect(mockClientQuery).toHaveBeenCalledWith('BEGIN');
      expect(mockClientQuery).toHaveBeenCalledWith('COMMIT');
    });
  });
});