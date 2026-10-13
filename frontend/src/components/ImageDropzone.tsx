import React, { useState, useRef } from 'react';
import UploadCloud from './Elements/UploadCloud';
import Close from './Elements/Close';
import AlertCircle from './Elements/AlertCircle';
// 1. Definición del contrato / tipos
interface ImageDropzoneProps {
  currentImageUrl?: string; // <-- Mucho mejor y genérico
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
  uploadProgress?: number;
  variant?: 'avatar' | 'post'; // Opcional: para cambiar el diseño visual (redondo o rectangular)
}

export const ImageDropzone: React.FC<ImageDropzoneProps> = ({
  currentImageUrl,
  onFileSelect,
  isUploading = false,
  uploadProgress = 0,
  variant = 'post',
}) => {
  // 1. Estado para detectar si el usuario está arrastrando un archivo sobre el área (para cambiar el borde/color)
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // 2. Estado para la URL de la vista previa (empieza con la foto actual si existe)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // 3. Estado para guardar el mensaje de error visual si la validación falla
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 4. Referencia para conectar el clic de la zona con el <input type="file" hidden />[cite: 1]
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ... (Siguiente paso)
  // 2. Procesar y Validar Archivo
  const processAndValidateFile = (file: File) => {
    setErrorMessage(null);

    // Validar tipo MIME (Solo imágenes válidas)
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('Formato no válido. Solo se permiten imágenes (JPG, PNG).');
      return;
    }

    // Validar Tamaño (Máximo 2 MB)
    const maxSizeBytes = 2 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setErrorMessage('La imagen supera el peso máximo permitido (2 MB).');
      return;
    }

    // Guardar archivo y crear Preview local
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Enviar archivo al componente padre
    onFileSelect(file);
  };
  // 3. Manejadores de Drag & Drop Nativos
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processAndValidateFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processAndValidateFile(e.target.files[0]);
    }
  };

  // 4. Limpiar Selección Actual
  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(currentImageUrl || null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    };    
    return (
        <div className="w-full max-w-md mx-auto space-y-4">
          {/* Input nativo oculto */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleInputChange}
            accept="image/jpeg,image/png"
            className="hidden"
          />
    
          {/* Zona Interactiva Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 ${
              isDragging
                ? 'border-primary bg-secondary-50/50 dark:bg-secondary/10 scale-[1.01]'
                : 'border-border dark:border-border hover:border-secondary bg-white dark:bg-surface'
            }`}
          >
            {previewUrl ? (
              /* Muestra Vista Previa */
              <div className="relative group">
                <img
                  src={previewUrl}
                  alt="Vista previa"
                  className={
                    variant === 'avatar'
                      ? 'w-28 h-28 rounded-full object-cover shadow-md border-2 border-secondary mx-auto'
                      : 'w-full h-48 rounded-lg object-cover shadow-md border-2 border-secondary mx-auto'
                  }
                />
                {selectedFile && !isUploading && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation(); // Evita reabrir el selector de archivos
                      handleClear();
                    }}
                    className="absolute -top-2 -right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition shadow"
                    title="Remove image"
                  >
                    <Close />
                  </button>
                )}
              </div>
            ) : (
              /* Muestra Placeholder inicial */
              <div
                className={`rounded-full p-4 text-secondary transition-colors duration-200 ${
                  isDragging ? 'bg-primary/40' : 'bg-primary/10'
                }`}
              >
                <UploadCloud className="w-8 h-8" />
              </div>
            )}
    
            <div className="space-y-1">
              <p className="text-sm font-medium text-text dark:text-text-soft">
                {selectedFile
                  ? selectedFile.name
                  : `Drag and drop your ${variant === 'avatar' ? 'avatar' : 'imagen'} here, or click to explore`}
              </p>
              <p className="text-xs text-text dark:text-text-soft">
                PNG o JPG (máx. 2MB)
              </p>
            </div>
          </div>
    
          {/* Indicador / Barra de Progreso */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-text dark:text-text-soft">
                <span>Subiendo archivo...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-150 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
    
          {/* Feedback de Error Visual */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 text-xs text-red-600 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      );
};


// COMPONENTE ImageDropzone(props)
// │
// ├── 1. CONTRATO Y ENTRADAS (Props)
// │   ├── currentImageUrl  : Cadena opcional (URL de la imagen inicial)
// │   ├── onFileSelect     : Función callback para entregar el archivo al padre
// │   ├── isUploading      : Booleano (Indica si hay subida en curso)
// │   ├── uploadProgress   : Número de 0 a 100 (Porcentaje de subida)
// │   └── variant          : Enum ('avatar' | 'post') -> Define la forma visual
// │
// ├── 2. ESTADOS LOCALES Y REFERENCIAS (State & Refs)
// │   ├── isDragging       : Booleano = Falso
// │   ├── previewUrl       : Cadena = currentImageUrl O Nulo
// │   ├── selectedFile     : Archivo = Nulo
// │   ├── errorMessage     : Cadena = Nulo
// │   └── fileInputRef     : Referencia al <input type="file"> HTML oculto
// │
// ├── 3. ALGORITMOS / FUNCIONES INTERNAS
// │   │
// │   ├── FUNCION processAndValidateFile(archivo):
// │   │   ├── Limpiar errorMessage
// │   │   │
// │   │   ├── SI archivo.tipo NO ES ('image/jpeg' O 'image/png' O 'image/webp'):
// │   │   │   ├── Establecer errorMessage = "Formato no válido"
// │   │   │   └── RETORNAR
// │   │   │
// │   │   ├── SI archivo.tamaño > 2 MB (2 * 1024 * 1024 bytes):
// │   │   │   ├── Establecer errorMessage = "Excede el límite de 2MB"
// │   │   │   └── RETORNAR
// │   │   │
// │   │   ├── Guardar archivo en selectedFile
// │   │   ├── Generar URL temporal local en memoria (URL.createObjectURL(archivo))
// │   │   ├── Guardar la URL temporal en previewUrl
// │   │   └── EJECUTAR onFileSelect(archivo)  <-- Entrega el archivo al componente padre
// │   │
// │   ├── FUNCIONES DRAG & DROP (Nativas):
// │   │   ├── FUNCION handleDragOver(evento):
// │   │   │   ├── Cancelar comportamiento por defecto (e.preventDefault)
// │   │   │   └── Establecer isDragging = Verdadero
// │   │   │
// │   │   ├── FUNCION handleDragLeave(evento):
// │   │   │   ├── Cancelar comportamiento por defecto (e.preventDefault)
// │   │   │   └── Establecer isDragging = Falso
// │   │   │
// │   │   └── FUNCION handleDrop(evento):
// │   │       ├── Cancelar comportamiento por defecto (e.preventDefault)
// │   │       ├── Establecer isDragging = Falso
// │   │       └── SI existen archivos soltados (e.dataTransfer.files[0]):
// │   │           └── EJECUTAR processAndValidateFile(archivo)
// │   │
// │   ├── FUNCION handleInputChange(evento):
// │   │   └── SI se selecciona archivo desde el explorador del SO:
// │   │       └── EJECUTAR processAndValidateFile(archivo)
// │   │
// │   └── FUNCION handleClear():
// │       ├── Resetear selectedFile = Nulo
// │       ├── Restaurar previewUrl = currentImageUrl
// │       ├── Limpiar errorMessage
// │       └── Resetear el valor físico de fileInputRef
// │
// └── 4. ESTRUCTURA VISUAL Y RENDERIZADO (UI / JSX)
//     │
//     ├── CONTENEDOR OCULTO:
//     │   └── <input type="file" ref={fileInputRef} onChange={handleInputChange} style="hidden" />
//     │
//     ├── CONTENEDOR INTERACTIVO (Dropzone Main Area):
//     │   ├── Eventos vinculados: onDragOver, onDragLeave, onDrop, onClick=(disparar fileInputRef)
//     │   ├── Estilos dinámicos:
//     │   │   └── SI isDragging == Verdadero -> Borde iluminado + Fondo activo
//     │   │   └── SI isDragging == Falso     -> Borde punteado estándar
//     │   │
//     │   ├── SECCIÓN DE IMAGEN / PLACEHOLDER:
//     │   │   ├── SI previewUrl existe:
//     │   │   │   ├── Renderizar <img src={previewUrl} />
//     │   │   │   ├── Aplicar forma: SI variant == 'avatar' ? Círculo : Rectángulo
//     │   │   │   └── SI selectedFile existe Y NO isUploading:
//     │   │   │       └── Renderizar Botón (X) flotante -> Al hacer clic: EJECUTAR handleClear()
//     │   │   │
//     │   │   └── SI NO existe previewUrl:
//     │   │       └── Renderizar Icono de Nube + Texto ("Arrastra tu imagen aquí")
//     │   │
//     │   └── TEXTO DE INFORMACIÓN:
//     │       └── Muestra el nombre del archivo seleccionado O las extensiones permitidas
//     │
//     ├── INDICADOR DE PROGRESO:
//     │   └── SI isUploading == Verdadero:
//     │       ├── Muestra etiqueta de texto ("Subiendo... XX%")
//     │       └── Muestra Barra de Carga con ancho = uploadProgress%
//     │
//     └── NOTIFICACIÓN DE ERROR:
//         └── SI errorMessage NO es Nulo:
//             └── Renderizar Alerta Visual en rojo con errorMessage