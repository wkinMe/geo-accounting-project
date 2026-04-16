import { Bounds } from '@react-three/drei';
import { useModelViewer } from './hooks';

interface ModelViewerProps {
	modelData: any;
	format: string | null;
}

export function ModelViewer({ modelData, format }: ModelViewerProps) {
	const { model, loading, error } = useModelViewer({ modelData, format });

	if (error) {
		return (
			<mesh>
				<boxGeometry args={[1, 1, 1]} />
				<meshStandardMaterial color="#ffcccc" wireframe />
			</mesh>
		);
	}

	if (loading || !model) {
		return (
			<mesh>
				<boxGeometry args={[1, 1, 1]} />
				<meshStandardMaterial color="#e0e0e0" wireframe />
			</mesh>
		);
	}

	return (
		<Bounds fit clip observe margin={1.5}>
			<primitive object={model} />
		</Bounds>
	);
}
