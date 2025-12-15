import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, Mail, Lock, User as UserIcon, ArrowRight, AlertCircle, Loader2, BrainCircuit, CheckCircle, HelpCircle, ChevronLeft, RefreshCcw } from 'lucide-react';
import { User } from '../types';
import { authService } from '../services/authService';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(false); // New state for showing resend button
  
  const [isVerifying, setIsVerifying] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const oobCode = params.get('oobCode');

    if (mode === 'verifyEmail' && oobCode) {
        handleEmailVerification(oobCode);
    }
  }, []);

  const handleEmailVerification = async (code: string) => {
      setIsVerifying(true);
      const result = await authService.verifyEmailCode(code);
      setIsVerifying(false);
      
      window.history.replaceState({}, document.title, window.location.pathname);

      if (result.success) {
          setSuccessMsg("¡Correo verificado correctamente! Ahora espera a que un administrador active tu cuenta.");
          setIsLogin(true);
      } else {
          setError(result.message);
      }
  };

  const handleResendVerification = async () => {
      if (!formData.email || !formData.password) {
          setError("Ingresa tu email y contraseña para reenviar la verificación.");
          return;
      }
      setIsLoading(true);
      setError(null);
      setSuccessMsg(null);

      const res = await authService.resendVerification(formData.email, formData.password);
      setIsLoading(false);

      if (res.success) {
          setSuccessMsg(res.message);
          setShowResend(false);
      } else {
          setError(res.message);
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);
    setShowResend(false);

    try {
      if (isResetting) {
          const response = await authService.resetPassword(formData.email);
          if (response.success) {
              setSuccessMsg(response.message || "Correo enviado.");
              setTimeout(() => {
                  setIsResetting(false);
                  setError(null);
                  setSuccessMsg("Revisa tu correo y sigue las instrucciones para crear una nueva contraseña.");
              }, 3000);
          } else {
              setError(response.error || "Error al enviar correo.");
          }

      } else if (isLogin) {
        const response = await authService.login(formData.email, formData.password);
        
        if (response.success && response.user) {
          localStorage.setItem('reduia_user', JSON.stringify(response.user));
          onLogin(response.user);
        } else {
          setError(response.error || "Error de acceso.");
          // Si el servicio dice que requiere acción (email no verificado), mostramos el botón
          if (response.requiresAction) {
              setShowResend(true);
          }
        }

      } else {
        const response = await authService.register(formData.name, formData.email, formData.password);

        if (response.success) {
            setSuccessMsg(`¡Registro recibido! Hemos enviado un enlace de confirmación a ${formData.email}. Haz clic en él para verificar.`);
            setIsLogin(true); 
            // Mantener datos para posible reenvío o login
        } else {
            setError(response.error || "Error al registrarse.");
        }
      }
    } catch (err) {
      setError("Error de conexión con el servicio.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    if (isResetting) {
        setIsResetting(false);
        setIsLogin(true);
    } else {
        setIsLogin(!isLogin);
    }
    setError(null);
    setSuccessMsg(null);
    setShowResend(false);
    setFormData(prev => ({ ...prev, name: '' })); // No limpiar email/pass para UX
  };

  if (isVerifying) {
     return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <div className="bg-slate-900 p-8 rounded-2xl border border-white/10 flex flex-col items-center text-center max-w-sm">
                <Loader2 className="w-10 h-10 text-violet-500 animate-spin mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Verificando tu correo...</h2>
                <p className="text-slate-400">Por favor espera un momento, estamos validando tu enlace de seguridad.</p>
            </div>
        </div>
     );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-950 font-sans">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[120px]" />
         <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px]" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-12 z-10 p-4">
        
        <div className="hidden md:flex flex-col justify-center p-8 space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6">
              <BrainCircuit className="w-4 h-4 text-violet-400" />
              <span className="text-xs font-medium text-slate-300">Inteligencia Artificial Educativa</span>
            </div>
            <h1 className="text-6xl font-bold text-white mb-6 leading-tight tracking-tight">
              Aprende <br/>
              lo que sea con <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
                ReduIA.
              </span>
            </h1>
            <p className="text-xl text-slate-400 max-w-md leading-relaxed">
              Plataforma exclusiva de formación con IA. Acceso restringido a usuarios verificados.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900/40 border border-white/5 backdrop-blur-md transition-transform hover:scale-105 duration-300">
                 <h4 className="font-bold text-white text-2xl mb-1">Segura</h4>
                 <p className="text-sm text-slate-400">Verificación 2FA</p>
              </div>
              <div className="p-5 rounded-2xl bg-slate-900/40 border border-white/5 backdrop-blur-md transition-transform hover:scale-105 duration-300">
                 <h4 className="font-bold text-white text-2xl mb-1">Gemini</h4>
                 <p className="text-sm text-slate-400">Motor Inteligente</p>
              </div>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-slate-900/60 border border-white/10 backdrop-blur-xl p-8 md:p-12 rounded-[2rem] shadow-2xl relative overflow-hidden flex flex-col justify-center"
        >
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet-500/20 rounded-full blur-3xl" />

          <div className="mb-8 text-center md:text-left relative z-10">
            {isResetting && (
                <button 
                  onClick={() => { setIsResetting(false); setError(null); setShowResend(false); }}
                  className="mb-4 text-slate-400 hover:text-white flex items-center gap-1 text-sm transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" /> Volver
                </button>
            )}
            
            <div className="inline-flex items-center gap-2 mb-4 md:hidden">
                <Rocket className="w-6 h-6 text-violet-500" />
                <span className="font-bold text-xl text-white">ReduIA</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {isResetting ? 'Recuperar Cuenta' : isLogin ? 'Acceso Privado' : 'Solicitar Acceso'}
            </h2>
            <p className="text-slate-400 text-sm">
              {isResetting 
                ? 'Introduce tu email para recibir un enlace de recuperación.'
                : isLogin 
                    ? 'Ingresa tus credenciales verificadas.' 
                    : 'Registro sujeto a aprobación.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            <AnimatePresence>
              {successMsg && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3 text-emerald-200 text-sm mb-4"
                >
                  <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </motion.div>
              )}
            
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex flex-col gap-2 text-red-200 text-sm"
                >
                  <div className="flex items-start gap-3">
                     <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                     <span>{error}</span>
                  </div>
                  {showResend && !isLoading && (
                      <button 
                        type="button" 
                        onClick={handleResendVerification}
                        className="ml-8 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-100 py-1.5 px-3 rounded-lg w-fit flex items-center gap-2 transition-colors"
                      >
                         <RefreshCcw className="w-3 h-3" />
                         Reenviar correo de verificación
                      </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {!isLogin && !isResetting && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 ml-1 uppercase tracking-wider">Nombre</label>
                <div className="relative group">
                  <UserIcon className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
                  <input 
                    type="text" 
                    required 
                    className="w-full bg-slate-950/50 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all"
                    placeholder="Tu nombre completo"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 ml-1 uppercase tracking-wider">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
                <input 
                  type="email" 
                  required 
                  className="w-full bg-slate-950/50 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all"
                  placeholder="estudiante@ejemplo.com"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            {!isResetting && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-400 ml-1 uppercase tracking-wider">Contraseña</label>
                    {isLogin && (
                        <button 
                            type="button"
                            onClick={() => { setIsResetting(true); setError(null); setSuccessMsg(null); setShowResend(false); }}
                            className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                        >
                            ¿Olvidaste tu contraseña?
                        </button>
                    )}
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
                    <input 
                      type="password" 
                      required 
                      className="w-full bg-slate-950/50 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                    />
                  </div>
                </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full mt-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isResetting ? 'Enviar Enlace' : isLogin ? 'Iniciar Sesión' : 'Registrarse'}
                  {!isResetting && <ArrowRight className="w-5 h-5" />}
                  {isResetting && <Mail className="w-5 h-5" />}
                </>
              )}
            </button>
          </form>

          {!isResetting && (
              <div className="mt-8 text-center relative z-10">
                <p className="text-slate-400 text-sm">
                  {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
                  <button 
                    onClick={toggleMode}
                    className="ml-2 text-violet-400 font-bold hover:text-violet-300 transition-colors underline decoration-transparent hover:decoration-violet-300 underline-offset-4"
                  >
                    {isLogin ? 'Solicitar Acceso' : 'Volver a Login'}
                  </button>
                </p>
              </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AuthScreen;