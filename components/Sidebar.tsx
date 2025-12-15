import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, PlayCircle, Lock, CheckCircle, Book, PlusCircle, LogOut } from 'lucide-react';
import { Unit, Lesson } from '../types';

interface SidebarProps {
  units: Unit[];
  currentLessonId: string | null;
  completedLessons: string[];
  onSelectLesson: (lessonId: string) => void;
  onReset: () => void;
  onLogout: () => void;
  title: string;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  units, 
  currentLessonId, 
  completedLessons, 
  onSelectLesson,
  onReset,
  onLogout,
  title
}) => {
  const [expandedUnits, setExpandedUnits] = React.useState<string[]>(units.map(u => u.id));

  const toggleUnit = (unitId: string) => {
    setExpandedUnits(prev => 
      prev.includes(unitId) ? prev.filter(id => id !== unitId) : [...prev, unitId]
    );
  };

  const calculateProgress = () => {
    const totalLessons = units.reduce((acc, unit) => acc + unit.lessons.length, 0);
    const completedCount = completedLessons.length;
    return totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100);
  };

  return (
    <div className="h-full flex flex-col bg-slate-950/90 backdrop-blur-xl border-r border-white/5 w-full md:w-80 shadow-2xl">
      
      {/* Header */}
      <div className="p-6 border-b border-white/5 bg-slate-900/50">
        <h2 className="text-lg font-bold text-white mb-2 leading-tight line-clamp-2">{title}</h2>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Progreso del Curso</span>
            <span>{calculateProgress()}%</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${calculateProgress()}%` }}
              className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]"
            />
          </div>
        </div>
      </div>

      {/* Units List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {units.map((unit) => (
          <div key={unit.id} className="rounded-xl overflow-hidden bg-white/5 border border-white/5 shadow-sm">
            <button 
              onClick={() => toggleUnit(unit.id)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                  <Book className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-200 line-clamp-1">{unit.title}</h3>
                  <p className="text-xs text-slate-500">{unit.lessons.length} lecciones</p>
                </div>
              </div>
              <ChevronDown 
                className={`w-4 h-4 text-slate-500 transition-transform ${expandedUnits.includes(unit.id) ? 'rotate-180' : ''}`} 
              />
            </button>

            <AnimatePresence>
              {expandedUnits.includes(unit.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-2 space-y-1 bg-black/20 border-t border-white/5">
                    {unit.lessons.map((lesson) => {
                      const isCompleted = completedLessons.includes(lesson.id);
                      const isLocked = lesson.isLocked && !isCompleted; 
                      const isActive = currentLessonId === lesson.id;

                      return (
                        <button
                          key={lesson.id}
                          disabled={isLocked && !isCompleted} 
                          onClick={() => onSelectLesson(lesson.id)}
                          className={`
                            w-full flex items-center justify-between p-3 rounded-lg text-sm transition-all
                            ${isActive ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30 shadow-inner' : 'text-slate-400 hover:bg-white/5'}
                            ${(isLocked && !isCompleted) ? 'opacity-50 cursor-not-allowed' : ''}
                          `}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            {isCompleted ? (
                              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : isLocked ? (
                              <Lock className="w-4 h-4 text-slate-600 shrink-0" />
                            ) : (
                              <PlayCircle className={`w-4 h-4 shrink-0 ${isActive ? 'text-violet-400' : 'text-slate-500'}`} />
                            )}
                            <span className="truncate">{lesson.title}</span>
                          </div>
                          <span className="text-[10px] bg-white/5 px-2 py-1 rounded text-slate-500 shrink-0 border border-white/5">
                            {lesson.duration}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Footer / Actions */}
      <div className="p-4 border-t border-white/5 bg-slate-900/50 space-y-2">
        <button 
          onClick={onReset}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-violet-600/10 hover:bg-violet-600/20 text-violet-300 border border-violet-500/20 transition-all text-sm font-medium"
        >
          <PlusCircle className="w-4 h-4" />
          Nuevo Curso
        </button>
        <button 
          type="button"
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl hover:bg-red-500/10 hover:text-red-400 text-slate-500 transition-all text-xs font-medium"
        >
          <LogOut className="w-3 h-3" />
          Cerrar Sesión
        </button>
      </div>

    </div>
  );
};

export default Sidebar;