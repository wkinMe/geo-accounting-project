export const ALLOWED_3D_EXTENSIONS = ['.gltf', '.glb', '.fbx', '.obj', '.stl', '.ply', '.3mf'];

export function isValid3DFile(file: File): boolean {
	const extension = '.' + file.name.split('.').pop()?.toLowerCase();
	return ALLOWED_3D_EXTENSIONS.includes(extension);
}

export function getFormatFromFileName(fileName: string): string {
	const extension = fileName.split('.').pop()?.toLowerCase() || '';
	return extension === 'gltf' || extension === 'glb' ? 'gltf' : extension;
}
