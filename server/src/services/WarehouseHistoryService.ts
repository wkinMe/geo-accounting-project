// server/src/services/WarehouseHistoryService.ts
import { Pool } from "pg";
import { executeQuery } from "@src/utils";
import { type WarehouseHistoryType } from "@shared/constants/warehouseHistoryTypes";
import {
  Material,
  Warehouse,
  User,
  AgreementWithDetails,
  Organization,
  WarehouseHistoryWithDetails,
} from "@shared/models";

interface CreateHistoryEntryParams {
  warehouseId: number;
  materialId: number;
  operationType: WarehouseHistoryType;
  oldAmount: number;
  newAmount: number;
  delta: number;
  userId?: number;
  agreementId?: number;
  description?: string;
}

export class WarehouseHistoryService {
  private _db: Pool;

  constructor(dbConnection: Pool) {
    this._db = dbConnection;
  }

  async createEntry(params: CreateHistoryEntryParams): Promise<void> {
    const {
      warehouseId,
      materialId,
      operationType,
      oldAmount,
      newAmount,
      delta,
      userId,
      agreementId,
      description,
    } = params;

    await executeQuery(
      this._db,
      "createWarehouseHistoryEntry",
      `
        INSERT INTO warehouse_material_history (
          warehouse_id, material_id, operation_type,
          old_amount, new_amount, delta,
          user_id, agreement_id, description
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
      [
        warehouseId,
        materialId,
        operationType,
        oldAmount,
        newAmount,
        delta,
        userId || null,
        agreementId || null,
        description || null,
      ],
    );
  }

  async getHistoryByWarehouse(
    warehouseId: number,
    limit: number = 100,
    offset: number = 0,
  ): Promise<WarehouseHistoryWithDetails[]> {
    const query = `
      SELECT 
        row_to_json(h.*) as history,
        row_to_json(m.*) as material,
        row_to_json(u.*) as user,
        row_to_json(w.*) as warehouse,
        row_to_json(a.*) as agreement,
        row_to_json(s.*) as supplier,
        row_to_json(os.*) as supplier_organization,
        row_to_json(c.*) as customer,
        row_to_json(oc.*) as customer_organization,
        row_to_json(sw.*) as supplier_warehouse,
        row_to_json(cw.*) as customer_warehouse,
        COALESCE(
          json_agg(
            CASE WHEN am.material_id IS NOT NULL THEN
              json_build_object(
                'material', m_ag.*,
                'amount', am.amount
              )
            ELSE NULL END
          ) FILTER (WHERE am.material_id IS NOT NULL),
          '[]'::json
        ) as materials
      FROM warehouse_material_history h
      LEFT JOIN materials m ON h.material_id = m.id
      LEFT JOIN app_users u ON h.user_id = u.id
      LEFT JOIN warehouses w ON h.warehouse_id = w.id
      LEFT JOIN agreements a ON h.agreement_id = a.id
      LEFT JOIN app_users s ON a.supplier_id = s.id
      LEFT JOIN organizations os ON s.organization_id = os.id
      LEFT JOIN app_users c ON a.customer_id = c.id
      LEFT JOIN organizations oc ON c.organization_id = oc.id
      LEFT JOIN warehouses sw ON a.supplier_warehouse_id = sw.id
      LEFT JOIN warehouses cw ON a.customer_warehouse_id = cw.id
      LEFT JOIN agreement_material am ON a.id = am.agreement_id
      LEFT JOIN materials m_ag ON am.material_id = m_ag.id
      WHERE h.warehouse_id = $1
      GROUP BY 
        h.id, m.id, u.id, w.id,
        a.id, s.id, os.id, c.id, oc.id, sw.id, cw.id
      ORDER BY h.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const rows = await executeQuery<{
      history: any;
      material: Material | null;
      user: User | null;
      warehouse: Warehouse | null;
      agreement: any;
      supplier: User;
      supplier_organization: Organization;
      customer: User;
      customer_organization: Organization;
      supplier_warehouse: Warehouse;
      customer_warehouse: Warehouse;
      materials: Array<{
        material: Material;
        amount: number;
      }>;
    }>(this._db, "getHistoryByWarehouse", query, [warehouseId, limit, offset]);

    return rows.map((row): WarehouseHistoryWithDetails => {
      let agreementWithDetails: AgreementWithDetails | undefined;

      if (row.agreement) {
        agreementWithDetails = {
          ...row.agreement,
          supplier: {
            ...row.supplier,
            organization: row.supplier_organization,
          },
          customer: {
            ...row.customer,
            organization: row.customer_organization,
          },
          supplier_warehouse: row.supplier_warehouse,
          customer_warehouse: row.customer_warehouse,
          materials: row.materials || [],
        };
      }

      return {
        ...row.history,
        material: row.material || undefined,
        user: row.user || undefined,
        warehouse: row.warehouse || undefined,
        agreement: agreementWithDetails,
      };
    });
  }

  async getHistoryByAgreement(
    agreementId: number,
    limit: number = 100,
    offset: number = 0,
  ): Promise<WarehouseHistoryWithDetails[]> {
    const query = `
      SELECT 
        row_to_json(h.*) as history,
        row_to_json(m.*) as material,
        row_to_json(u.*) as user,
        row_to_json(w.*) as warehouse,
        row_to_json(a.*) as agreement,
        row_to_json(s.*) as supplier,
        row_to_json(os.*) as supplier_organization,
        row_to_json(c.*) as customer,
        row_to_json(oc.*) as customer_organization,
        row_to_json(sw.*) as supplier_warehouse,
        row_to_json(cw.*) as customer_warehouse,
        COALESCE(
          json_agg(
            CASE WHEN am.material_id IS NOT NULL THEN
              json_build_object(
                'material', m_ag.*,
                'amount', am.amount
              )
            ELSE NULL END
          ) FILTER (WHERE am.material_id IS NOT NULL),
          '[]'::json
        ) as materials
      FROM warehouse_material_history h
      LEFT JOIN materials m ON h.material_id = m.id
      LEFT JOIN app_users u ON h.user_id = u.id
      LEFT JOIN warehouses w ON h.warehouse_id = w.id
      LEFT JOIN agreements a ON h.agreement_id = a.id
      LEFT JOIN app_users s ON a.supplier_id = s.id
      LEFT JOIN organizations os ON s.organization_id = os.id
      LEFT JOIN app_users c ON a.customer_id = c.id
      LEFT JOIN organizations oc ON c.organization_id = oc.id
      LEFT JOIN warehouses sw ON a.supplier_warehouse_id = sw.id
      LEFT JOIN warehouses cw ON a.customer_warehouse_id = cw.id
      LEFT JOIN agreement_material am ON a.id = am.agreement_id
      LEFT JOIN materials m_ag ON am.material_id = m_ag.id
      WHERE h.agreement_id = $1
      GROUP BY 
        h.id, m.id, u.id, w.id,
        a.id, s.id, os.id, c.id, oc.id, sw.id, cw.id
      ORDER BY h.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const rows = await executeQuery<{
      history: any;
      material: Material | null;
      user: User | null;
      warehouse: Warehouse | null;
      agreement: any;
      supplier: User;
      supplier_organization: Organization;
      customer: User;
      customer_organization: Organization;
      supplier_warehouse: Warehouse;
      customer_warehouse: Warehouse;
      materials: Array<{
        material: Material;
        amount: number;
      }>;
    }>(this._db, "getHistoryByAgreement", query, [agreementId, limit, offset]);

    return rows.map((row): WarehouseHistoryWithDetails => {
      let agreementWithDetails: AgreementWithDetails | undefined;

      if (row.agreement) {
        agreementWithDetails = {
          ...row.agreement,
          supplier: {
            ...row.supplier,
            organization: row.supplier_organization,
          },
          customer: {
            ...row.customer,
            organization: row.customer_organization,
          },
          supplier_warehouse: row.supplier_warehouse,
          customer_warehouse: row.customer_warehouse,
          materials: row.materials || [],
        };
      }

      return {
        ...row.history,
        material: row.material || undefined,
        user: row.user || undefined,
        warehouse: row.warehouse || undefined,
        agreement: agreementWithDetails,
      };
    });
  }
}
