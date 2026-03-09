import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router';
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import { Auth } from './components/pages/Auth';
import { WarehousesList } from './components/pages/WarehousesList';
import { ManagersList } from './components/pages/ManagersList';
import { Manager } from './components/pages/Manager';
import { ReportsList } from './components/pages/ReportsList';
import { Report } from './components/pages/Report';
import { Warehouse } from './components/pages/Warehouse';

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
						<Route path="warehouses">
							<Route index element={<WarehousesList />} />
							<Route path=":id" element={<Warehouse />} />
						</Route>
						<Route path="managers">
							<Route index element={<ManagersList />} />
							<Route path=":id" element={<Manager />} />
						</Route>
						<Route path="reports">
							<Route index element={<ReportsList />} />
							<Route path=":id" element={<Report />} />
						</Route>
					</Route>
				</Routes>
			</StrictMode>
		</QueryClientProvider>
	</BrowserRouter>
);
