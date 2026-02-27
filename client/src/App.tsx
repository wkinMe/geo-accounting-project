import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import './App.css';
import { userService } from './services';
import { useState } from 'react';

function App() {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');

	const queryClient = useQueryClient();

	const { data: profile } = useQuery({
		queryKey: ['profile'],
		queryFn: () => userService.getProfile(),
	});

	console.log(profile);

	const { mutate } = useMutation({
		mutationFn: () => userService.login({ name: username, password }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['profile'] });
		},
	});

	const { data: allUsers } = useQuery({
		queryKey: ['profile'],
		queryFn: () => userService.findAll(),
	});

	return (
		<div className="flex justify-center items-center bg-blue-200">
			<div className="w-3xl h-3xl ">
				<input value={username} onChange={(e) => setUsername(e.currentTarget.value)} />
				<input
					value={password}
					className="mt-2"
					onChange={(e) => setPassword(e.currentTarget.value)}
				/>
				<button onClick={() => mutate()}>Login</button>

				{allUsers && allUsers.data[0].name}
				<h1>{profile && profile.data && profile.data.name}</h1>
			</div>
		</div>
	);
}

export default App;
