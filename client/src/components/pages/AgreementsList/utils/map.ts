import type { AgreementWithDetails } from '@shared/models';
import { getStatusColor, getStatusText } from './status';

export const mapAgreementToTableItem = (agreement: AgreementWithDetails) => ({
	id: agreement.id,
	supplier: agreement.supplier?.name || '—',
	supplier_id: agreement.supplier_id,
	supplier_organization: agreement.supplier?.organization?.name || '—',
	supplier_organization_id: agreement.supplier?.organization_id || 0,
	customer: agreement.customer?.name || '—',
	customer_id: agreement.customer_id,
	customer_organization: agreement.customer?.organization?.name || '—',
	customer_organization_id: agreement.customer?.organization_id || 0,
	status: agreement.status || '-',
	status_display: getStatusText(agreement.status),
	status_color: getStatusColor(agreement.status),
	created_at: new Date(agreement.created_at).toLocaleDateString('ru-RU'),
	updated_at: new Date(agreement.updated_at).toLocaleDateString('ru-RU'),
});
