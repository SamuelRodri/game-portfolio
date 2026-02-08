# 🔥 Integración Firebase Firestore - Guía de Configuración

## Paso 1: Obtener Credenciales de Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Crea un nuevo proyecto o selecciona uno existente
3. En la sección **Configuración del proyecto** (esquina inferior izquierda), ve a **Configuración general**
4. Desplázate hasta **Tus aplicaciones** y haz clic en **Web (< >)**
5. Copia el objeto de configuración que se muestra

## Paso 2: Actualizar Credenciales 

Edita el archivo `src/app/core/config/firebase.config.ts` y reemplaza:

```typescript
const firebaseConfig = {
  apiKey: 'tu_api_key_aqui',
  authDomain: 'tu_auth_domain_aqui',
  projectId: 'tu_project_id_aqui',
  storageBucket: 'tu_storage_bucket_aqui',
  messagingSenderId: 'tu_messaging_sender_id_aqui',
  appId: 'tu_app_id_aqui'
};
```

Con los valores reales de tu proyecto Firebase.

## Paso 3: Habilitar Firestore

1. En Firebase Console, ve a **Firestore Database**
2. Haz clic en **Crear base de datos**
3. Elige **modo de prueba** (para desarrollo) o **modo seguro** (para producción)
4. Selecciona la ubicación más cercana a ti
5. Haz clic en **Crear**

## Paso 4: Habilitar Storage

1. En Firebase Console, ve a **Storage**
2. Haz clic en **Comenzar**
3. Acepta las reglas de seguridad por defecto
4. Selecciona la ubicación
5. Haz clic en **Listo**

## Paso 5: Configurar Reglas de Seguridad (Producción)

### Firestore Rules

Ve a **Firestore Database > Reglas** y establece:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /projects/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### Storage Rules

Ve a **Storage > Reglas** y establece:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /projects/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Paso 6: Usar los Servicios en tu Aplicación

### En tus componentes:

```typescript
import { FirestoreProjectsService } from './core/services/firestore-projects.service';
import { FirebaseStorageService } from './core/services/firebase-storage.service';

export class MiComponente {
  constructor(
    private projectsService: FirestoreProjectsService,
    private storageService: FirebaseStorageService
  ) {}

  ngOnInit() {
    // Obtener todos los proyectos
    this.projectsService.getAll().subscribe(projects => {
      console.log('Proyectos:', projects);
    });
  }

  cargarImagen(projectId: string, archivo: File) {
    this.storageService.uploadAndGetURL(projectId, archivo, 'images')
      .subscribe(url => {
        console.log('URL de la imagen:', url);
      });
  }
}
```

## Migrando desde JSON local

Si actualmente usas el archivo `projects.json`:

1. Puedes importar los datos manualmente desde Firebase Console
2. O utilizar el siguiente código para cargar los datos desde JSON a Firestore:

```typescript
import { HttpClient } from '@angular/common/http';
import { addDoc, collection } from 'firebase/firestore';
import { db } from './core/config/firebase.config';

// En un componente o servicio temporal
constructor(private http: HttpClient) {}

migrarDatos() {
  this.http.get('./assets/data/projects.json').subscribe(async (projects: any[]) => {
    for (const project of projects) {
      await addDoc(collection(db, 'projects'), project);
    }
    console.log('Datos migrados exitosamente');
  });
}
```

## Estructura de la Colección Firestore

```
projects/
  ├── vandamme
  │   ├── id: "vandamme"
  │   ├── title: "Proyecto Van Damme"
  │   ├── engine: "Unity"
  │   ├── language: "C#"
  │   ├── year: 2024
  │   ├── category: ["proyecto"]
  │   ├── status: "terminado"
  │   ├── shortDescription: "..."
  │   ├── longDescription: "..."
  │   ├── tags: ["Unity", "C#", "2D", "Estrategia"]
  │   ├── images: ["url1", "url2", ...] // URLs de Firebase Storage
  │   └── links: { github: "...", itch: "..." }
  │
  └── puzzle-game
      ├── id: "puzzle-game"
      └── ...
```

## Estructura de Storage

```
gs://tu-bucket/
└── projects/
    ├── vandamme/
    │   ├── images/
    │   │   ├── timestamp_imagen1.png
    │   │   └── timestamp_imagen2.png
    │   └── videos/
    │       └── timestamp_video1.mp4
    │
    └── puzzle-game/
        ├── images/
        └── videos/
```

## Verificar que todo funciona

1. Ejecuta tu aplicación: `npm start`
2. Abre la consola del navegador (F12)
3. Deberías ver los proyectos cargándose desde Firestore
4. En Firebase Console, ve a **Firestore Database** y verifica que se están leyendo los documentos

## Solución de Problemas

| Problema | Solución |
|----------|----------|
| Error "Missing or insufficient permissions" | Actualiza las Firestore Rules (ver Paso 5) |
| No se cargan los datos | Verifica que Firestore Database esté habilitado |
| Error al subir archivos | Verifica que Storage esté habilitado y las reglas son correctas |
| CORS errors | Asegúrate de que firebase.config.ts está correctamente importado |

