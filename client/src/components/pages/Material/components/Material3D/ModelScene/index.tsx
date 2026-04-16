import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { ModelViewer } from '../ModelViewer';

interface ModelSceneProps {
	modelData: any;
	format: string | null;
	className?: string;
}

export function ModelScene({ modelData, format, className = '' }: ModelSceneProps) {
	const hasData = !!modelData && !!format;

	return (
		<Canvas
			camera={{ fov: 45, position: [5, 5, 5], near: 0.1, far: 1000 }}
			className={`cursor-grab bg-white ${className}`}
		>
			<PerspectiveCamera makeDefault position={[5, 5, 5]} fov={45} />

			<ambientLight intensity={0.6} />
			<directionalLight position={[5, 5, 5]} intensity={1} />
			<directionalLight position={[-5, 5, 0]} intensity={0.5} />
			<directionalLight position={[0, -5, 0]} intensity={0.3} />

			<OrbitControls
				makeDefault
				enableZoom
				enablePan
				enableRotate
				zoomSpeed={1.2}
				panSpeed={0.8}
				rotateSpeed={1.0}
				target={[0, 0, 0]}
			/>

			<Suspense fallback={null}>
				{hasData && <ModelViewer modelData={modelData} format={format} />}
			</Suspense>
		</Canvas>
	);
}
