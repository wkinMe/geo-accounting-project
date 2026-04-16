import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

export type LoaderType = 'gltf' | 'glb' | 'fbx' | 'obj';

export function getLoader(format: string) {
  switch (format.toLowerCase()) {
    case 'gltf':
    case 'glb':
      return new GLTFLoader();
    case 'fbx':
      return new FBXLoader();
    case 'obj':
      return new OBJLoader();
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

export async function loadModel(
  url: string,
  format: string
): Promise<THREE.Object3D> {
  const loader = getLoader(format);
  
  switch (format.toLowerCase()) {
    case 'gltf':
    case 'glb': {
      const gltf = await (loader as GLTFLoader).loadAsync(url);
      return gltf.scene;
    }
    case 'fbx':
    case 'obj': {
      return await (loader as FBXLoader | OBJLoader).loadAsync(url);
    }
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

export function bufferToUint8Array(modelData: any): Uint8Array | null {
  if (!modelData) return null;

  if (Array.isArray(modelData)) {
    return new Uint8Array(modelData);
  }

  if (modelData instanceof ArrayBuffer) {
    return new Uint8Array(modelData);
  }

  if (modelData instanceof Uint8Array) {
    return modelData;
  }

  return null;
}

export function createBlobUrl(bytes: Uint8Array): string {
  const blob = new Blob([bytes.buffer as ArrayBuffer]);
  return URL.createObjectURL(blob);
}