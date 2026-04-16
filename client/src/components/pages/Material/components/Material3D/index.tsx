import { useEffect, useState, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Bounds, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import * as THREE from 'three';
import { FaUpload, FaSave, FaSpinner, FaEdit } from 'react-icons/fa';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Material3D } from '@shared/models';
import { material3dService } from '@/services/material3DService';
import { useRole } from '@/hooks/useRole'; // импортируйте ваш хук
import { atLeastManager } from '@/utils';

interface Material3DComponentProps {
	materialId: number;
}

// Допустимые форматы 3D файлов
const ALLOWED_3D_EXTENSIONS = ['.gltf', '.glb', '.fbx', '.obj', '.stl', '.ply', '.3mf'];

// Компонент для отображения 3D модели из Buffer данных
function ModelViewer({ modelData, format }: { modelData: any; format: string | null }) {
	const [model, setModel] = useState<THREE.Object3D | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const blobUrlRef = useRef<string | null>(null);

	useEffect(() => {
		if (!modelData || !format) {
			setModel(null);
			return;
		}

		console.log('[ModelViewer] Начинаем загрузку модели из Buffer, формат:', format);
		setLoading(true);
		setError(null);

		const loadModel = async () => {
			let blobUrl: string | null = null;

			try {
				// Извлекаем массив байтов из modelData (это уже model_data.data)
				let bytes: Uint8Array;

				if (Array.isArray(modelData)) {
					// Данные приходят как массив чисел [75, 97, 121, ...]
					bytes = new Uint8Array(modelData as number[]);
					console.log('[ModelViewer] Получен массив байтов, размер:', bytes.length);
				} else if (modelData instanceof ArrayBuffer) {
					bytes = new Uint8Array(modelData);
				} else if (modelData instanceof Uint8Array) {
					bytes = modelData;
				} else if (modelData instanceof Blob) {
					const arrayBuffer = await modelData.arrayBuffer();
					bytes = new Uint8Array(arrayBuffer);
				} else {
					throw new Error('Неизвестный формат данных');
				}

				// Создаём Blob и URL для лоадера
				const blob = new Blob([bytes.buffer as ArrayBuffer]);
				blobUrl = URL.createObjectURL(blob);
				blobUrlRef.current = blobUrl;

				console.log('[ModelViewer] Blob URL создан, размер Blob:', blob.size);

				let loadedModel: THREE.Object3D;

				switch (format.toLowerCase()) {
					case 'gltf':
					case 'glb': {
						console.log('[ModelViewer] Загрузка GLTF/GLB...');
						const loader = new GLTFLoader();
						const gltf = await loader.loadAsync(blobUrl);
						loadedModel = gltf.scene;
						break;
					}
					case 'fbx': {
						console.log('[ModelViewer] Загрузка FBX...');
						const loader = new FBXLoader();
						loadedModel = await loader.loadAsync(blobUrl);
						break;
					}
					case 'obj': {
						console.log('[ModelViewer] Загрузка OBJ...');
						const loader = new OBJLoader();
						loadedModel = await loader.loadAsync(blobUrl);
						break;
					}
					default:
						console.warn('[ModelViewer] Неподдерживаемый формат:', format);
						setError(`Неподдерживаемый формат: ${format}`);
						setLoading(false);
						return;
				}

				console.log('[ModelViewer] Модель успешно загружена');
				setModel(loadedModel);
			} catch (err: any) {
				console.error('[ModelViewer] Ошибка загрузки модели:', err);
				setError(`Ошибка загрузки: ${err?.message || 'Неизвестная ошибка'}`);
			} finally {
				setLoading(false);
			}
		};

		loadModel();

		// Очистка Blob URL при размонтировании
		return () => {
			if (blobUrlRef.current && blobUrlRef.current.startsWith('blob:')) {
				console.log('[ModelViewer] Очистка Blob URL:', blobUrlRef.current);
				URL.revokeObjectURL(blobUrlRef.current);
				blobUrlRef.current = null;
			}
		};
	}, [modelData, format]);

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

	// Оборачиваем модель в Bounds для автоматического центрирования
	return (
		<Bounds fit clip observe margin={1.5}>
			<primitive object={model} />
		</Bounds>
	);
}

export function Material3D({ materialId }: Material3DComponentProps) {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [isEditMode, setIsEditMode] = useState(false);
	const [modelDataForView, setModelDataForView] = useState<any>(null);
	const [modelFormat, setModelFormat] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const queryClient = useQueryClient();
	const role = useRole(); 
	const canEdit = atLeastManager(role); // могут редактировать только Manager и выше

	console.log(
		'[Material3D] Компонент рендерится, materialId:',
		materialId,
		'role:',
		role,
		'canEdit:',
		canEdit
	);

	// TanStack Query для получения 3D объекта
	const { data: response, isLoading } = useQuery({
		queryKey: ['material3d', materialId],
		queryFn: async () => {
			try {
				const result = await material3dService.findByMaterialId(materialId);
				console.log('[Material3D] API ответ:', result);
				return result;
			} catch (err) {
				console.error('[Material3D] Ошибка API:', err);
				throw err;
			}
		},
		retry: (failureCount, error: any) => {
			if (error?.response?.status === 404) {
				console.log('[Material3D] 404 Not Found — 3D объекта нет в БД');
				return false;
			}
			console.log(`[Material3D] Ретрай ${failureCount} из 3`);
			return failureCount < 3;
		},
	});

	// Извлекаем данные из ответа { data, message }
	const material3D = response?.data;

	// Mutation для создания 3D объекта
	const createMutation = useMutation({
		mutationFn: async (formData: FormData) => {
			console.log('[Material3D] Отправка FormData на сервер');
			for (const pair of formData.entries()) {
				console.log(
					'[Material3D] FormData entry:',
					pair[0],
					pair[1] instanceof File ? `File: ${pair[1].name}, size: ${pair[1].size}` : pair[1]
				);
			}
			return material3dService.create(formData);
		},
		onSuccess: () => {
			console.log('[Material3D] 3D объект успешно сохранён на сервере');
			setSuccessMessage('3D объект успешно сохранён');
			setSelectedFile(null);
			setModelDataForView(null);
			setIsEditMode(false);
			setErrorMessage(null);
			setTimeout(() => setSuccessMessage(null), 3000);
			queryClient.invalidateQueries({ queryKey: ['material3d', materialId] });
		},
		onError: (err: any) => {
			console.error('[Material3D] Ошибка при сохранении:', err);
			setErrorMessage(
				`Ошибка при сохранении: ${err?.response?.data?.error || err?.message || 'Неизвестная ошибка'}`
			);
			setTimeout(() => setErrorMessage(null), 3000);
		},
		retry: false,
	});

	// Mutation для обновления 3D объекта
	const updateMutation = useMutation({
		mutationFn: async (formData: FormData) => {
			console.log('[Material3D] Отправка FormData на сервер для обновления');
			for (const pair of formData.entries()) {
				console.log(
					'[Material3D] FormData entry:',
					pair[0],
					pair[1] instanceof File ? `File: ${pair[1].name}, size: ${pair[1].size}` : pair[1]
				);
			}
			return material3dService.update(formData);
		},
		onSuccess: () => {
			console.log('[Material3D] 3D объект успешно обновлён на сервере');
			setSuccessMessage('3D объект успешно обновлён');
			setSelectedFile(null);
			setModelDataForView(null);
			setIsEditMode(false);
			setErrorMessage(null);
			setTimeout(() => setSuccessMessage(null), 3000);
			queryClient.invalidateQueries({ queryKey: ['material3d', materialId] });
		},
		onError: (err: any) => {
			console.error('[Material3D] Ошибка при обновлении:', err);
			setErrorMessage(
				`Ошибка при обновлении: ${err?.response?.data?.error || err?.message || 'Неизвестная ошибка'}`
			);
			setTimeout(() => setErrorMessage(null), 3000);
		},
		retry: false,
	});

	// При получении данных с сервера, подготавливаем их для просмотра
	useEffect(() => {
		if (material3D?.model_data) {
			console.log('[Material3D] Получены данные с сервера, формат:', material3D.format);
			// Извлекаем массив байтов из model_data.data
			if (material3D.model_data.data && Array.isArray(material3D.model_data.data)) {
				setModelDataForView(material3D.model_data.data);
				setModelFormat(material3D.format);
			} else {
				console.log('[Material3D] model_data.data не является массивом');
				setModelDataForView(null);
			}
		} else {
			console.log('[Material3D] Нет данных model_data в ответе API');
			setModelDataForView(null);
		}
	}, [material3D]);

	// Проверка, является ли файл 3D объектом
	const isValid3DFile = (file: File): boolean => {
		const extension = '.' + file.name.split('.').pop()?.toLowerCase();
		const isValid = ALLOWED_3D_EXTENSIONS.includes(extension);

		console.log(
			'[Material3D] Проверка файла:',
			file.name,
			'расширение:',
			extension,
			'валиден:',
			isValid
		);

		if (!isValid) {
			const msg = `Файл "${file.name}" не является 3D объектом. Поддерживаемые форматы: ${ALLOWED_3D_EXTENSIONS.join(', ')}`;
			setErrorMessage(msg);
			setTimeout(() => setErrorMessage(null), 3000);
			return false;
		}
		return true;
	};

	// Обработка выбранного файла
	const handleFileSelect = (file: File) => {
		console.log('[Material3D] Выбран файл:', { name: file.name, size: file.size, type: file.type });

		if (!isValid3DFile(file)) {
			return;
		}

		const extension = file.name.split('.').pop()?.toLowerCase() || '';
		const format = extension === 'gltf' || extension === 'glb' ? 'gltf' : extension;

		console.log('[Material3D] Формат файла:', format);

		// Для предпросмотра нового файла передаём сам File объект (он будет обработан как Blob)
		setSelectedFile(file);
		setModelDataForView(file);
		setModelFormat(format);
		setErrorMessage(null);
		setSuccessMessage(`Файл "${file.name}" загружен для предпросмотра`);
		setTimeout(() => setSuccessMessage(null), 3000);
	};

	const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			handleFileSelect(file);
		}
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		const file = e.dataTransfer.files?.[0];
		console.log('[Material3D] Drop файла:', file?.name);
		if (file) {
			handleFileSelect(file);
		}
	};

	const handleSave = () => {
		console.log('[Material3D] Нажата кнопка Сохранить');

		if (!selectedFile) {
			console.warn('[Material3D] Нет выбранного файла для сохранения');
			setErrorMessage('Выберите 3D объект для сохранения');
			setTimeout(() => setErrorMessage(null), 3000);
			return;
		}

		const formData = new FormData();
		formData.append('material_id', String(materialId));
		formData.append('format', modelFormat || 'unknown');
		formData.append('model_data', selectedFile);

		console.log('[Material3D] Подготовлен FormData:', {
			material_id: materialId,
			format: modelFormat,
			file_name: selectedFile.name,
			file_size: selectedFile.size,
		});

		createMutation.mutate(formData);
	};

	const handleUpdate = () => {
		console.log('[Material3D] Нажата кнопка Обновить');

		if (!selectedFile) {
			console.warn('[Material3D] Нет выбранного файла для обновления');
			setErrorMessage('Выберите 3D объект для обновления');
			setTimeout(() => setErrorMessage(null), 3000);
			return;
		}

		const formData = new FormData();
		formData.append('material_id', String(materialId));
		formData.append('format', modelFormat || 'unknown');
		formData.append('model_data', selectedFile);

		console.log('[Material3D] Подготовлен FormData для обновления:', {
			material_id: materialId,
			format: modelFormat,
			file_name: selectedFile.name,
			file_size: selectedFile.size,
		});

		updateMutation.mutate(formData);
	};

	const handleEditClick = () => {
		console.log('[Material3D] Вход в режим редактирования');
		setIsEditMode(true);
		setSelectedFile(null);
		setModelDataForView(null);
		setModelFormat(null);
	};

	const handleCancelEdit = () => {
		console.log('[Material3D] Выход из режима редактирования');
		setIsEditMode(false);
		setSelectedFile(null);
		// Восстанавливаем исходные данные для просмотра
		if (material3D?.model_data?.data) {
			setModelDataForView(material3D.model_data.data);
			setModelFormat(material3D.format);
		}
	};

	const handleUploadClick = () => {
		console.log('[Material3D] Клик по области загрузки');
		fileInputRef.current?.click();
	};

	if (isLoading) {
		console.log('[Material3D] Состояние: загрузка данных с сервера');
		return (
			<div className="shadow-md flex-1 bg-white rounded-2xl py-4 px-8 flex items-center justify-center">
				<FaSpinner className="animate-spin text-gray-400 text-2xl" />
			</div>
		);
	}

	const hasExistingModel = !!material3D?.model_data?.data;
	const hasNewFile = !!selectedFile;
	const showUploadButton = !hasExistingModel && !hasNewFile && !isEditMode;
	const showSaveButton = hasNewFile && !hasExistingModel;
	const showUpdateButton = hasNewFile && hasExistingModel && isEditMode;
	const showEditButton = hasExistingModel && !isEditMode && canEdit;
	const hasDataToView = !!modelDataForView;

	console.log('[Material3D] Состояние UI:', {
		hasExistingModel,
		hasNewFile,
		showUploadButton,
		showSaveButton,
		showUpdateButton,
		showEditButton,
		isEditMode,
		modelFormat,
		hasDataToView,
		canEdit,
	});

	return (
		<div className="shadow-md flex-1 bg-white rounded-2xl py-4 px-8 flex flex-col">
			{/* Сообщения об ошибках и успехе */}
			{errorMessage && (
				<div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
					❌ {errorMessage}
				</div>
			)}
			{successMessage && (
				<div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
					✅ {successMessage}
				</div>
			)}

			<div className="flex justify-end gap-2 mb-4">
				{showSaveButton && (
					<button
						onClick={handleSave}
						disabled={createMutation.isPending}
						className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{createMutation.isPending ? <FaSpinner className="animate-spin" /> : <FaSave />}
						Сохранить 3D объект
					</button>
				)}

				{showUpdateButton && (
					<button
						onClick={handleUpdate}
						disabled={updateMutation.isPending}
						className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{updateMutation.isPending ? <FaSpinner className="animate-spin" /> : <FaSave />}
						Обновить 3D объект
					</button>
				)}

				{showEditButton && (
					<button
						onClick={handleEditClick}
						className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
					>
						<FaEdit />
						Заменить модель
					</button>
				)}

				{isEditMode && hasExistingModel && (
					<button
						onClick={handleCancelEdit}
						className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
					>
						Отмена
					</button>
				)}
			</div>

			<div
				className="flex-1 min-h-[400px] relative bg-white rounded-lg overflow-hidden"
				onDragOver={handleDragOver}
				onDrop={handleDrop}
			>
				<Canvas
					camera={{
						fov: 45,
						position: [5, 5, 5],
						near: 0.1,
						far: 1000,
					}}
					className="cursor-grab bg-white"
				>
					<PerspectiveCamera makeDefault position={[5, 5, 5]} fov={45} />

					<ambientLight intensity={0.6} />
					<directionalLight position={[5, 5, 5]} intensity={1} />
					<directionalLight position={[-5, 5, 0]} intensity={0.5} />
					<directionalLight position={[0, -5, 0]} intensity={0.3} />

					<OrbitControls
						makeDefault
						enableZoom={true}
						enablePan={true}
						enableRotate={true}
						zoomSpeed={1.2}
						panSpeed={0.8}
						rotateSpeed={1.0}
						target={[0, 0, 0]}
					/>

					<gridHelper args={[20, 20, '#cccccc', '#e0e0e0']} position={[0, -1, 0]} />

					<Suspense fallback={null}>
						{hasDataToView && <ModelViewer modelData={modelDataForView} format={modelFormat} />}
					</Suspense>
				</Canvas>

				{showUploadButton && (
					<div
						className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm cursor-pointer hover:bg-gray-50 transition-colors rounded-lg"
						onClick={handleUploadClick}
					>
						<FaUpload className="text-gray-400 text-5xl mb-4" />
						<p className="text-gray-500 text-lg">Загрузить 3D объект</p>
						<p className="text-gray-400 text-sm mt-2">
							Поддерживаемые форматы: {ALLOWED_3D_EXTENSIONS.join(', ')}
						</p>
						<p className="text-gray-400 text-xs mt-1">Перетащите файл или кликните для выбора</p>
					</div>
				)}

				{isEditMode && !hasNewFile && hasExistingModel && (
					<div
						className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm cursor-pointer hover:bg-gray-50 transition-colors rounded-lg"
						onClick={handleUploadClick}
					>
						<FaUpload className="text-gray-400 text-5xl mb-4" />
						<p className="text-gray-500 text-lg">Выберите новую модель для замены</p>
						<p className="text-gray-400 text-sm mt-2">
							Поддерживаемые форматы: {ALLOWED_3D_EXTENSIONS.join(', ')}
						</p>
						<p className="text-gray-400 text-xs mt-1">Перетащите файл или кликните для выбора</p>
					</div>
				)}

				{!showUploadButton && !hasDataToView && !isEditMode && (
					<div className="absolute inset-0 flex items-center justify-center">
						<p className="text-gray-400">Нет данных для отображения</p>
					</div>
				)}
			</div>

			<input
				ref={fileInputRef}
				type="file"
				accept={ALLOWED_3D_EXTENSIONS.join(',')}
				onChange={handleFileInputChange}
				className="hidden"
			/>
		</div>
	);
}
