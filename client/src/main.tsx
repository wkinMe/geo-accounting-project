// client/src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router';
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import { RoleRoute } from './components/shared/RoleRoute';
import { Auth } from './components/pages/Auth';
import { WarehousesList } from './components/pages/WarehousesList';
import { UsersList } from './components/pages/UsersList';
import { OrganizationsList } from './components/pages/OrganizationsList';
import { ReportsList } from './components/pages/ReportsList';
import { Report } from './components/pages/Report';
import { Warehouse } from './components/pages/Warehouse';
import { USER_ROLES } from './constants';
import { AgreementsList } from './components/pages/AgreementsList';
import { AgreementForm } from './components/pages/Agreement/components';
import { MaterialsList } from './components/pages/MaterialsList';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
	<BrowserRouter>
		<QueryClientProvider client={queryClient}>
			<StrictMode>
				<Routes>
					<Route path="login" element={<Auth />} />

					<Route
						path="/"
						element={
							<ProtectedRoute>
								<App />
							</ProtectedRoute>
						}
					>
						<Route index element={<div>Главная страница</div>} />

						{/* Склады - доступны всем авторизованным */}
						<Route path="warehouses">
							<Route index element={<WarehousesList />} />
							<Route path=":id" element={<Warehouse />} />
						</Route>

						{/* Организации - просмотр всем, управление только super_admin */}
						<Route
							path="organizations"
							element={
								<RoleRoute fallbackPath="/warehouses">
									<OrganizationsList />
								</RoleRoute>
							}
						>
							<Route index element={<OrganizationsList />} />
						</Route>

						{/* Материалы - просмотр всем, управление только super_admin */}
						<Route
							path="materials"
							element={
								<RoleRoute fallbackPath="/warehouses">
									<MaterialsList />
								</RoleRoute>
							}
						>
							<Route index element={<OrganizationsList />} />
						</Route>

						{/* Пользователи - только для admin и super_admin */}
						<Route
							path="users"
							element={
								<RoleRoute
									allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]}
									fallbackPath="/warehouses"
								>
									<UsersList />
								</RoleRoute>
							}
						>
							<Route index element={<UsersList />} />
						</Route>

						{/* Отчёты - доступны всем авторизованным */}
						<Route
							path="reports"
							element={
								<RoleRoute fallbackPath="/warehouses" deniedRoles={[USER_ROLES.USER]}>
									<ReportsList />
								</RoleRoute>
							}
						>
							<Route index element={<ReportsList />} />
							<Route path=":id" element={<Report />} />
						</Route>

						{/* Договоры */}
						<Route path="agreements">
							<Route index element={<AgreementsList />} />
							<Route path="new" element={<AgreementForm />} />
							<Route path=":id" element={<div>Просмотр договора (заглушка)</div>} />
							<Route path=":id/edit" element={<AgreementForm />} />
						</Route>
					</Route>
				</Routes>
			</StrictMode>
		</QueryClientProvider>
	</BrowserRouter>
);
