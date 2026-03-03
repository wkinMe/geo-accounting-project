import { Outlet } from 'react-router';

function App() {
	return (
		<div className="min-h-screen bg-white dark:bg-black">
			
			{/* Основной контент */}
			<main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
				{/* Здесь будет отображаться содержимое дочерних маршрутов */}
				<Outlet />
			</main>
		</div>
	);
}

export default App;
