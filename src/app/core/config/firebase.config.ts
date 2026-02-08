import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { environment } from '../../../environments/environment';

// 🔧 CONFIGURACIÓN DE FIREBASE
// Las credenciales se cargan desde variables de entorno (.env.local)
const firebaseConfig = environment.firebase;

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Obtener referencias a los servicios
export const db = getFirestore(app);
export const storage = getStorage(app);
