# 🚀 Integración Supabase Storage - Guía de Configuración

## Paso 1: Proyecto Supabase Creado ✅

Ya tienes configurado:
- **URL**: `https://bgqxmvxpxacitjckgqvn.supabase.co`
- **API Key**: Configurado en `src/app/core/config/supabase.config.ts`

## Paso 2: Crear Bucket para Archivos Multimedia

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. En el menú lateral, ve a **Storage**
3. Haz clic en **New bucket**
4. Nombre del bucket: **`project-media`** (debe ser exactamente así)
5. Marca **Public bucket** (para que las imágenes sean públicas)
6. Haz clic en **Create bucket**

## Paso 3: Configurar Políticas de Acceso

1. Haz clic en el bucket **project-media**
2. Ve a la pestaña **Policies**
3. En **Select a template**, elige **For public buckets** o crea a mano:

```sql
-- Permitir lectura pública
SELECT (auth.role() = 'authenticated' OR auth.role() = 'anon') as allowed;

-- Permitir escritura para usuarios autenticados (opcional)
INSERT (auth.role() = 'authenticated') as allowed;
```

**O más simple**: En modo público, cualquiera puede leer y escribir (está bien para portfolios).

## Paso 4: Estructura del Bucket

El storage se organizará así:

```
project-media/
├── vandamme/
│   ├── images/
│   │   ├── 1707271234_screenshot1.png
│   │   └── 1707271235_screenshot2.png
│   └── videos/
│       └── 1707271236_gameplay.mp4
│
├── puzzle-game/
│   ├── images/
│   └── videos/
│
└── ...otros proyectos...
```

## Paso 5: Usar en tu Aplicación

### Subir archivos:

```typescript
import { SupabaseStorageService } from './core/services/supabase-storage.service';

export class MyComponent {
  constructor(private storage: SupabaseStorageService) {}

  subirImagen(projectId: string, archivo: File) {
    this.storage.uploadAndGetURL(projectId, archivo, 'images')
      .subscribe(url => {
        console.log('URL pública:', url);
        // La URL es pública y se puede compartir • Guardar en la BD
      });
  }

  subirVideo(projectId: string, archivo: File) {
    this.storage.uploadAndGetURL(projectId, archivo, 'videos')
      .subscribe(url => {
        console.log('URL del video:', url);
      });
  }
}
```

### Obtener URL pública:

```typescript
const publicUrl = this.storage.getPublicURL('vandamme', 'mi_imagen.png', 'images');
```

### Eliminar un archivo:

```typescript
this.storage.deleteFile('vandamme', 'mi_imagen.png', 'images')
  .subscribe(() => {
    console.log('Archivo eliminado');
  });
```

### Listar archivos:

```typescript
this.storage.listProjectFiles('vandamme')
  .subscribe(files => {
    console.log('Archivos del proyecto:', files);
  });
```

## Paso 6: Actualizar Firestore

Cuando subes un archivo a Supabase, guarda la URL en Firestore:

```typescript
async crearProyecto(projectForm: any, archivos: File[]) {
  const imageUrls = [];
  
  // Subir cada imagen y recolectar URLs
  for (const file of archivos) {
    const url = await this.supabase.uploadAndGetURL('mi-proyecto', file, 'images').toPromise();
    imageUrls.push(url);
  }
  
  // Crear documento en Firestore con las URLs
  const proyecto = {
    title: projectForm.title,
    images: imageUrls,  // Guardar como strings (no objetos)
    // ... otros campos
  };
  
  await this.firestore.create(proyecto).toPromise();
}
```

## URLs Públicas

Todas las imágenes y videos en Supabase serán públicas y tendrán esta estructura:

```
https://bgqxmvxpxacitjckgqvn.supabase.co/storage/v1/object/public/project-media/PROJECT_ID/TYPE/FILENAME
```

Ejemplo:
```
https://bgqxmvxpxacitjckgqvn.supabase.co/storage/v1/object/public/project-media/vandamme/images/1707271234_screenshot.png
```

## Límites Gratuitos de Supabase

| Límite | Cantidad |
|--------|----------|
| Almacenamiento | 1 GB |
| Descarga de datos | 2 GB/mes |
| Solicitudes de API | 50,000/mes |

Para 5-10 proyectos con 5-10 imágenes cada uno, estarás bien dentro del límite gratis 👍

## Troubleshooting

| Problema | Solución |
|----------|----------|
| 404 en las URLs | Verifica que el bucket sea **public** |
| "Bucket does not exist" | Crea el bucket `project-media` |
| Error al subir archivos | Revisa que el bucket exista y sea público |
| Las imágenes no cargan | Copia la URL completa desde Supabase dashboard |

## Próximos Pasos Opcionales

1. **Autenticación**: Puedes proteger uploads requiriendo login
2. **Transformaciones**: Supabase puede redimensionar imágenes
3. **CDN**: Las URLs se cachean automáticamente en CDN global

¿Necesitas ayuda con algo más?
