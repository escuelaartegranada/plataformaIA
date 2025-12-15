import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// --- CONFIGURACIÓN DE FIREBASE ---
// PARA ACTIVAR EL BACKEND REAL:
// 1. Ve a https://console.firebase.google.com/
// 2. Crea un nuevo proyecto.
// 3. Activa "Authentication" (Email/Password).
// 4. Activa "Firestore Database" (En modo prueba).
// 5. Ve a Configuración del Proyecto -> General -> Tus apps -> Web, copia el objeto 'firebaseConfig' y PEGALO ABAJO:

// Pega aquí tus credenciales reales copiadas de la consola de Firebase:
const firebaseConfig = {
  apiKey: "AIzaSyAKA5zUqusnpM-tZy0t0VyboxHcoedO7kQ",
  authDomain: "reduia-7999a.firebaseapp.com",
  projectId: "reduia-7999a",
  storageBucket: "reduia-7999a.firebasestorage.app",
  messagingSenderId: "222888556306",
  appId: "1:222888556306:web:55511f9401c919c3ffa5cb"
};

// Singleton pattern to ensure we only initialize once
let app;
let auth;
let db;

try {
  // Check if config is still the placeholder
  if (firebaseConfig.apiKey === "TU_API_KEY_AQUI" || firebaseConfig.apiKey === "PON_AQUI_TU_API_KEY_REAL") {
    console.warn("⚠️ ReduIA: Firebdase no está configurado. Usando modo simulación. Edita services/firebase.ts con tus claves.");
  } else {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    
    // --- CONFIGURACIÓN REGIONAL ---
    // Forzamos el idioma a Español para todos los correos (verificación, reset password)
    // y mensajes de error automáticos.
    auth.languageCode = 'es';
    
    console.log("✅ ReduIA: Conexión a Firebase establecida (Idioma: ES).");
  }
} catch (e) {
  console.error("Error inicializando Firebase:", e);
}

export { auth, db };