// client/src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
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
import { Register } from './components/pages/Register';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
	<BrowserRouter>
		<QueryClientProvider client={queryClient}>
			<StrictMode>
				<Routes>
					<Route path="login" element={<Auth />} />
					<Route path="register" element={<Register />} />

					<Route
						path="/"
						element={
							<ProtectedRoute>
								<App />
							</ProtectedRoute>
						}
					>
						<Route index element={<Navigate to="/warehouses" replace />} />
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
							<Route index element={<MaterialsList />} />
						</Route>

						{/* Договоры - доступны менеджерам, админам и суперадминам */}
						<Route path="agreements">
							<Route
								index
								element={
									<RoleRoute
										allowedRoles={[USER_ROLES.MANAGER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]}
										fallbackPath="/warehouses"
									>
										<AgreementsList />
									</RoleRoute>
								}
							/>
							<Route
								path="new"
								element={
									<RoleRoute
										allowedRoles={[USER_ROLES.MANAGER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]}
										fallbackPath="/warehouses"
									>
										<AgreementForm />
									</RoleRoute>
								}
							/>
							<Route
								path=":id/edit"
								element={
									<RoleRoute
										allowedRoles={[USER_ROLES.MANAGER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]}
										fallbackPath="/warehouses"
									>
										<AgreementForm />
									</RoleRoute>
								}
							/>
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

						{/* Отчёты - доступны всем, кроме обычных пользователей */}
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
					</Route>
				</Routes>
			</StrictMode>
		</QueryClientProvider>
	</BrowserRouter>
);
