import { User } from "../types";
import { auth, db } from "./firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  signOut, 
  sendEmailVerification,
  applyActionCode,
  sendPasswordResetEmail
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
  requiresAction?: boolean;
}

const isValidEmail = (email: string) => {
  const strictRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return strictRegex.test(email);
};

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    if (auth && db) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        
        if (!firebaseUser.emailVerified) {
             await signOut(auth);
             return { 
                 success: false, 
                 error: "Acceso denegado: Email no verificado.",
                 requiresAction: true // Flag para mostrar botón de reenvío
             };
        }

        const docRef = doc(db, "users", firebaseUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
             await signOut(auth);
             return { success: false, error: "Usuario verificado pero sin datos de perfil (Error de Firestore)." };
        }

        const data = docSnap.data();

        if (data.isApproved !== true) {
            await signOut(auth);
            return { 
                success: false, 
                error: "Tu cuenta ha sido verificada correctamente, pero espera aprobación manual del administrador." 
            };
        }

        let userData: User = {
          id: firebaseUser.uid,
          name: data.name || firebaseUser.displayName || "Estudiante",
          email: firebaseUser.email || "",
          avatar: data.avatar || firebaseUser.photoURL,
          isApproved: data.isApproved
        };

        return { success: true, user: userData };

      } catch (error: any) {
        let msg = "Error al iniciar sesión: " + error.code;
        if (error.code === 'auth/invalid-credential') msg = "Email o contraseña incorrectos.";
        if (error.code === 'auth/user-not-found') msg = "Usuario no encontrado.";
        if (error.code === 'auth/wrong-password') msg = "Contraseña incorrecta.";
        if (error.code === 'auth/too-many-requests') msg = "Demasiados intentos fallidos. Intenta más tarde.";
        return { success: false, error: msg };
      }
    }

    return { success: false, error: "Firebase no está configurado." };
  },

  register: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    
    if (!isValidEmail(email)) return { success: false, error: "Email inválido. Usa un dominio real." };
    if (password.length < 6) return { success: false, error: "La contraseña es demasiado corta (min 6)." };

    if (auth && db) {
      try {
        auth.languageCode = 'es';

        // 1. Create User in Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        const avatarUrl = `https://api.dicebear.com/7.x/notionists/svg?seed=${email}&backgroundColor=b6e3f4`;

        // 2. Update Profile
        await updateProfile(firebaseUser, { displayName: name, photoURL: avatarUrl });

        // 3. Save to Firestore
        try {
            await setDoc(doc(db, "users", firebaseUser.uid), {
                uid: firebaseUser.uid,
                name: name,
                email: email,
                avatar: avatarUrl,
                role: 'student',
                createdAt: new Date().toISOString(),
                emailVerified: false, 
                isApproved: false,
                capturedFrom: 'ReduIA Web App'
            });
        } catch (dbError: any) {
            await firebaseUser.delete();
            throw new Error(`Error guardando datos en Firestore: ${dbError.message || dbError.code}. Verifica las Reglas de Seguridad.`);
        }

        // 4. Send Verification Email - SIMPLIFICADO para asegurar entrega
        // No usamos URL de redirección compleja para evitar 'unauthorized-continue-uri' en dominios no configurados.
        try {
            await sendEmailVerification(firebaseUser);
        } catch (emailError: any) {
             console.warn("Error enviando verificación inicial:", emailError);
             // No lanzamos error fatal, permitimos que el usuario intente reenviar desde login si falló.
        }

        // 5. Force Logout
        await signOut(auth);

        return { 
            success: true, 
            requiresAction: true, 
            user: { id: firebaseUser.uid, name, email } 
        };

      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            return { success: false, error: "Este correo electrónico ya está registrado. Por favor, inicia sesión." };
        }
        if (error.code === 'auth/weak-password') {
            return { success: false, error: "La contraseña es demasiado débil." };
        }
        if (error.code === 'auth/invalid-email') {
             return { success: false, error: "El correo electrónico no es válido." };
        }
        
        console.error("Registration Error:", error);
        return { success: false, error: `${error.message}` };
      }
    }

    return { success: false, error: "Error crítico: No hay conexión con Firebase." };
  },

  // Nueva función para reenviar verificación
  resendVerification: async (email: string, password: string): Promise<{success: boolean, message: string}> => {
      if (!auth) return { success: false, message: "Error de configuración" };
      try {
          // Necesitamos loguear para obtener el objeto usuario y enviar el correo
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
          
          if (user.emailVerified) {
              await signOut(auth);
              return { success: false, message: "Este correo ya está verificado. Puedes iniciar sesión." };
          }

          await sendEmailVerification(user);
          await signOut(auth);
          
          return { success: true, message: "Correo de verificación reenviado. Revisa tu bandeja de entrada." };
      } catch (error: any) {
          if (error.code === 'auth/too-many-requests') {
              return { success: false, message: "Demasiados intentos. Espera unos minutos antes de reenviar." };
          }
          if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
              return { success: false, message: "Contraseña incorrecta. No podemos verificar tu identidad." };
          }
          return { success: false, message: "Error al reenviar: " + error.message };
      }
  },

  verifyEmailCode: async (oobCode: string): Promise<{success: boolean, message: string}> => {
    if (!auth) return { success: false, message: "Error de configuración" };
    try {
        await applyActionCode(auth, oobCode);
        return { success: true, message: "Correo verificado exitosamente." };
    } catch (error: any) {
        return { success: false, message: "El enlace es inválido o ha expirado." };
    }
  },

  resetPassword: async (email: string): Promise<{success: boolean, message?: string, error?: string}> => {
      if (!auth) return { success: false, error: "Error de configuración" };
      if (!isValidEmail(email)) return { success: false, error: "Introduce un email válido." };
      
      try {
          // Intentamos sin settings complejos para evitar errores de dominio
          await sendPasswordResetEmail(auth, email);
          return { success: true, message: "Te hemos enviado un enlace de recuperación. Revisa tu correo." };
      } catch (error: any) {
          if (error.code === 'auth/user-not-found') {
              return { success: false, error: "No encontramos una cuenta con este correo." };
          }
          console.error("Reset Password Error:", error);
          return { success: false, error: "Error al enviar el correo. Intenta más tarde." };
      }
  },

  logout: async () => {
    localStorage.clear();
    sessionStorage.clear();
    if (auth) await signOut(auth);
  }
};