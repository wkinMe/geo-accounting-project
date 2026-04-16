import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { bufferToUint8Array, createBlobUrl, loadModel } from '../utils/modelUtils';

interface UseModelViewerProps {
	modelData: any;
	format: string | null;
}

export function useModelViewer({ modelData, format }: UseModelViewerProps) {
	const [model, setModel] = useState<THREE.Object3D | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const blobUrlRef = useRef<string | null>(null);

	useEffect(() => {
		if (!modelData || !format) {
			setModel(null);
			return;
		}

		setLoading(true);
		setError(null);

		const load = async () => {
			let blobUrl: string | null = null;

			try {
				let bytes = bufferToUint8Array(modelData);

				if (!bytes && modelData instanceof Blob) {
					const arrayBuffer = await modelData.arrayBuffer();
					bytes = new Uint8Array(arrayBuffer);
				}

				if (!bytes) {
					throw new Error('Failed to convert data');
				}

				blobUrl = createBlobUrl(bytes);
				blobUrlRef.current = blobUrl;

				const loadedModel = await loadModel(blobUrl, format);
				setModel(loadedModel);
			} catch (err: any) {
				console.error('[useModelViewer] Error:', err);
				setError(err?.message || 'Unknown error');
			} finally {
				setLoading(false);
			}
		};

		load();

		return () => {
			if (blobUrlRef.current) {
				URL.revokeObjectURL(blobUrlRef.current);
				blobUrlRef.current = null;
			}
		};
	}, [modelData, format]);

	return { model, loading, error };
}
