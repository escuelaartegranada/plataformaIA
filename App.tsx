import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Rocket, ExternalLink, Award, Download, AlertTriangle, User as UserIcon } from 'lucide-react';
import { Course, CourseRequest, User } from './types';
import { generateCourse } from './services/geminiService';
import { authService } from './services/authService';
import CourseForm from './components/CourseForm';
import Sidebar from './components/Sidebar';
import LessonContent from './components/LessonContent';
import SkeletonLoader from './components/SkeletonLoader';
import AiTutor from './components/AiTutor';
import AuthScreen from './components/AuthScreen';

function App() {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  
  // App View State
  const [view, setView] = useState<'home' | 'player'>('home');
  const [isLoading, setIsLoading] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  
  // Player State
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false); 

  // --- INITIALIZATION & PERSISTENCE ---
  useEffect(() => {
    // Check Auth
    const savedUser = localStorage.getItem('reduia_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    // Check Course State
    const savedData = localStorage.getItem('reduia_state');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.course) {
          setCourse(parsed.course);
          setCompletedLessons(parsed.completedLessons || []);
          setCurrentLessonId(parsed.currentLessonId || parsed.course.units[0].lessons[0].id);
          setView('player');
        }
      } catch (e) {
        console.error("Error loading saved state", e);
        localStorage.removeItem('reduia_state');
      }
    }
  }, []);

  useEffect(() => {
    if (course) {
      localStorage.setItem('reduia_state', JSON.stringify({
        course,
        completedLessons,
        currentLessonId
      }));
    }
  }, [course, completedLessons, currentLessonId]);

  // --- ACTIONS ---

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    // Eliminamos el confirm() nativo que puede bloquear el flujo.
    try {
        // 1. Limpieza Local INMEDIATA (Prioridad UX)
        localStorage.removeItem('reduia_user');
        localStorage.removeItem('reduia_state');
        sessionStorage.clear();
        
        setUser(null);
        setCourse(null);
        setView('home');

        // 2. Intento de desconexión de Firebase (Async)
        await authService.logout();
        
    } catch (error) {
        console.error("Error en logout (no crítico):", error);
    } finally {
        // 3. Recarga forzada para limpiar memoria y caches
        window.location.href = window.location.origin;
    }
  };

  const handleResetRequest = () => {
    setShowExitModal(true);
  };

  const confirmExitToHome = () => {
    localStorage.removeItem('reduia_state');
    setCourse(null);
    setCompletedLessons([]);
    setCurrentLessonId(null);
    setView('home');
    setShowCertificate(false);
    setShowExitModal(false);
    setSidebarOpen(false);
  };

  const handleGenerate = async (request: CourseRequest) => {
    setIsLoading(true);
    try {
      const newCourse = await generateCourse(request);
      
      const cleanTopic = request.topic.replace(/[^\w\s]/gi, '').slice(0, 50);
      const encodedTopic = encodeURIComponent(cleanTopic);
      newCourse.imagePrompt = `https://image.pollinations.ai/prompt/${encodedTopic}%20futuristic%20educational%20wallpaper%204k%20cinematic?width=1920&height=600&model=flux&nologo=true`;

      setCourse(newCourse);
      
      if (newCourse.units.length > 0 && newCourse.units[0].lessons.length > 0) {
        setCurrentLessonId(newCourse.units[0].lessons[0].id);
      }
      setCompletedLessons([]);
      setView('player');
    } catch (e) {
      console.error("Generation failed", e);
      alert("Hubo un error generando el curso. Por favor intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteLesson = () => {
    if (currentLessonId && !completedLessons.includes(currentLessonId)) {
      const newCompleted = [...completedLessons, currentLessonId];
      setCompletedLessons(newCompleted);
      
      const totalLessons = course?.units.reduce((acc, u) => acc + u.lessons.length, 0) || 0;
      if (newCompleted.length === totalLessons) {
        setShowCertificate(true);
      } else {
        const allLessons = course?.units.flatMap(u => u.lessons) || [];
        const currentIndex = allLessons.findIndex(l => l.id === currentLessonId);
        if (currentIndex >= 0 && currentIndex < allLessons.length - 1) {
          setTimeout(() => {
            setCurrentLessonId(allLessons[currentIndex + 1].id);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }, 1000); 
        }
      }
    }
  };

  const currentLesson = course?.units
    .flatMap(u => u.lessons)
    .find(l => l.id === currentLessonId);

  // --- RENDER ---

  // 1. Auth Screen
  if (!user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100 selection:bg-violet-500/30 font-sans">
      
      <AnimatePresence mode="wait">
        
        {/* VIEW 1: HOME & LOADING */}
        {view === 'home' && (
          isLoading ? (
            <motion.div
               key="skeleton"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-50 bg-slate-950"
            >
               <SkeletonLoader />
            </motion.div>
          ) : (
            <motion.div 
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="relative min-h-screen flex flex-col items-center justify-center p-6"
            >
               {/* User Header */}
               <div className="absolute top-6 right-6 flex items-center gap-3 z-20">
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-bold text-white">{user.name}</p>
                    <button onClick={handleLogout} className="text-xs text-violet-400 hover:text-violet-300 transition-colors">Cerrar Sesión</button>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-violet-600 p-0.5 border-2 border-slate-800 shadow-xl overflow-hidden">
                     <img src={user.avatar} alt="User" className="w-full h-full bg-slate-900" />
                  </div>
               </div>

               <div className="absolute inset-0 overflow-hidden pointer-events-none">
                 <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[100px]" />
                 <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px]" />
               </div>

               <div className="relative z-10 w-full max-w-4xl flex flex-col items-center gap-10">
                  <div className="text-center space-y-6">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-4"
                    >
                      <Rocket className="w-4 h-4 text-violet-400" />
                      <span className="text-xs font-medium tracking-wide text-slate-300 uppercase">ReduIA v1.0</span>
                    </motion.div>
                    
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
                      Hola, <span className="text-violet-500">{user.name}</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                      ¿Qué te gustaría dominar hoy con ReduIA?
                    </p>
                  </div>

                  <CourseForm onSubmit={handleGenerate} isLoading={isLoading} />
               </div>
            </motion.div>
          )
        )}

        {/* VIEW 2: PLAYER */}
        {view === 'player' && course && (
          <motion.div 
            key="player"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex h-[100dvh] overflow-hidden relative"
          >
            {/* Mobile Header */}
            <div className="md:hidden absolute top-0 left-0 right-0 h-16 bg-slate-950/80 backdrop-blur-md z-50 flex items-center px-4 border-b border-white/5 justify-between">
               <div className="flex items-center gap-2" onClick={handleResetRequest}>
                  <Rocket className="w-5 h-5 text-violet-500" />
                  <span className="font-bold">ReduIA</span>
               </div>
               <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-slate-300">
                 {sidebarOpen ? <X /> : <Menu />}
               </button>
            </div>

            {/* Sidebar */}
            <div className={`
              fixed inset-0 z-40 transform transition-transform duration-300 md:relative md:translate-x-0 md:w-80
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
              <div className="absolute inset-0 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
              <div className="relative h-full w-80 shadow-2xl md:shadow-none bg-slate-950 md:bg-transparent">
                 <Sidebar 
                   title={course.title}
                   units={course.units}
                   currentLessonId={currentLessonId}
                   completedLessons={completedLessons}
                   onSelectLesson={(id) => {
                     setCurrentLessonId(id);
                     setSidebarOpen(false);
                   }}
                   onReset={confirmExitToHome}
                   onLogout={handleLogout}
                 />
              </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-slate-900 relative scroll-smooth">
               
               {/* GRAPHIC HEADER (HERO) */}
               <div className="relative h-48 md:h-64 w-full overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent z-10" />
                  <img 
                    src={course.imagePrompt || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop"} 
                    alt="Course Cover" 
                    className="w-full h-full object-cover opacity-60"
                    onError={(e) => {
                        e.currentTarget.onerror = null; 
                        e.currentTarget.src = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop";
                    }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 z-20 p-6 md:p-8 max-w-4xl mx-auto">
                     <span className="inline-block px-3 py-1 rounded-full bg-violet-600/80 text-white text-xs font-bold mb-2 backdrop-blur-sm border border-white/10 shadow-lg">
                        {course.level}
                     </span>
                     <h1 className="text-2xl md:text-4xl font-bold text-white shadow-black drop-shadow-md">
                        {course.title}
                     </h1>
                  </div>
               </div>

               <div className="max-w-4xl mx-auto px-6 py-8 md:py-12">
                 {currentLesson ? (
                   <motion.div
                     key={currentLessonId}
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     transition={{ duration: 0.3 }}
                   >
                     {/* Lesson Metadata */}
                     <header className="mb-8 border-b border-white/5 pb-6">
                       <div className="flex items-center gap-2 text-indigo-400 mb-2">
                          <span className="text-xs font-mono tracking-wider uppercase">Lección Actual</span>
                          <div className="h-px bg-indigo-500/30 flex-1"></div>
                       </div>
                       <h2 className="text-3xl font-bold text-white mb-2 leading-tight">
                         {currentLesson.title}
                       </h2>
                       <div className="flex items-center gap-2 text-slate-400 text-sm">
                         <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                         {currentLesson.duration} de lectura estimada
                       </div>
                     </header>

                     {/* Content Blocks */}
                     <LessonContent 
                       blocks={currentLesson.blocks}
                       isCompleted={completedLessons.includes(currentLesson.id)}
                       onComplete={handleCompleteLesson}
                     />

                     {/* Sources Footer */}
                     {course.sources && course.sources.length > 0 && (
                        <div className="mt-16 pt-8 border-t border-white/5">
                            <h4 className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wider">Bibliografía y Enlaces</h4>
                            <div className="flex flex-wrap gap-3">
                                {course.sources.map((source, i) => (
                                    <a 
                                        key={i} 
                                        href={source.url} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        title={source.title}
                                        className="text-xs flex items-center gap-1 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-indigo-400 transition-colors border border-white/5"
                                    >
                                        <ExternalLink className="w-3 h-3" />
                                        <span className="truncate max-w-[200px]">{source.title}</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                     )}

                   </motion.div>
                 ) : (
                   <div className="flex items-center justify-center h-40 text-slate-500">
                     Selecciona una lección para comenzar
                   </div>
                 )}
               </div>
            </main>

            {/* AI TUTOR AGENT */}
            {currentLesson && <AiTutor currentLesson={currentLesson} />}

            {/* EXIT CONFIRMATION MODAL */}
            <AnimatePresence>
              {showExitModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    onClick={() => setShowExitModal(false)}
                  />
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="relative bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4 text-red-500">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">¿Terminar Curso?</h3>
                      <p className="text-slate-400 text-sm mb-6">
                        Si sales ahora, se perderá tu progreso del curso actual.
                      </p>
                      <div className="flex gap-3 w-full">
                        <button 
                          onClick={() => setShowExitModal(false)}
                          className="flex-1 py-2.5 rounded-lg border border-white/10 hover:bg-white/5 text-slate-300 transition-colors text-sm font-medium"
                        >
                          Cancelar
                        </button>
                        <button 
                          onClick={confirmExitToHome}
                          className="flex-1 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors text-sm font-medium"
                        >
                          Salir
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* COMPLETION CERTIFICATE MODAL */}
            <AnimatePresence>
              {showCertificate && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                   <motion.div 
                     initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                     className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                     onClick={() => setShowCertificate(false)}
                   />
                   <motion.div 
                     initial={{ scale: 0.8, opacity: 0, y: 20 }}
                     animate={{ scale: 1, opacity: 1, y: 0 }}
                     exit={{ scale: 0.8, opacity: 0, y: 20 }}
                     className="relative bg-slate-900 border border-violet-500/50 rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl shadow-violet-500/20 overflow-hidden"
                   >
                      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500" />
                      <div className="absolute -top-10 -right-10 w-32 h-32 bg-violet-500/30 rounded-full blur-3xl" />
                      
                      <div className="mx-auto w-20 h-20 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-violet-500/40">
                         <Award className="w-10 h-10 text-white" />
                      </div>
                      
                      <h2 className="text-3xl font-bold text-white mb-2">¡Enhorabuena, {user.name}!</h2>
                      <p className="text-slate-400 mb-8">
                        Has completado con éxito el curso <br/>
                        <span className="text-violet-400 font-semibold">{course.title}</span>
                      </p>
                      
                      <div className="bg-slate-800/50 rounded-xl p-6 border border-white/5 mb-8 text-left">
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Estudiante</p>
                            <p className="font-mono text-lg text-white">{user.name}</p>
                          </div>
                          <div className="text-right">
                             <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Fecha</p>
                             <p className="font-mono text-sm text-slate-300">{new Date().toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <button 
                          onClick={() => setShowCertificate(false)}
                          className="flex-1 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors text-slate-300 font-medium"
                        >
                          Cerrar
                        </button>
                        <button className="flex-1 py-3 rounded-xl bg-white text-slate-900 font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
                           <Download className="w-4 h-4" />
                           Descargar
                        </button>
                      </div>
                      
                      <div className="mt-6 text-center">
                        <button onClick={confirmExitToHome} className="text-xs text-slate-500 hover:text-slate-300 underline">
                            Volver al inicio
                        </button>
                      </div>
                   </motion.div>
                </div>
              )}
            </AnimatePresence>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;