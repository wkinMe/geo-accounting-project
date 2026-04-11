import { useParams } from 'react-router';

export function Material() {
	const params = useParams();

	console.log('RENDERED');

	const id = Number(params?.id);

	return <h1>You are on {id} material page</h1>;
}
