import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Clock, Target, User, BookOpen, Layers } from 'lucide-react';
import { CourseRequest } from '../types';

interface CourseFormProps {
  onSubmit: (data: CourseRequest) => void;
  isLoading: boolean;
}

const CourseForm: React.FC<CourseFormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<CourseRequest>({
    topic: '',
    level: 'Principiante',
    profile: '',
    goal: '',
    time: '',
    format: 'Mixto',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-2xl mx-auto"
    >
      <form onSubmit={handleSubmit} className="glass-panel p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              ¿Qué quieres aprender hoy?
            </label>
            <input
              type="text"
              name="topic"
              required
              placeholder="Ej. Astrofísica, Programación en Python, Historia de Roma..."
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-4 text-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
              value={formData.topic}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                Nivel actual
              </label>
              <select
                name="level"
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                value={formData.level}
                onChange={handleChange}
              >
                <option value="Principiante">Principiante</option>
                <option value="Intermedio">Intermedio</option>
                <option value="Avanzado">Avanzado</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                Formato preferido
              </label>
              <select
                name="format"
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                value={formData.format}
                onChange={handleChange}
              >
                <option value="Lectura">Teórico / Lectura</option>
                <option value="Práctico">100% Práctico</option>
                <option value="Mixto">Equilibrado</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 flex items-center gap-2">
                <User className="w-3 h-3" />
                Tu perfil
              </label>
              <input
                type="text"
                name="profile"
                placeholder="Ej. Diseñador"
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                value={formData.profile}
                onChange={handleChange}
              />
            </div>
             <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 flex items-center gap-2">
                <Target className="w-3 h-3" />
                Objetivo
              </label>
              <input
                type="text"
                name="goal"
                placeholder="Ej. Aprobar examen"
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                value={formData.goal}
                onChange={handleChange}
              />
            </div>
             <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 flex items-center gap-2">
                <Clock className="w-3 h-3" />
                Tiempo disponible
              </label>
              <input
                type="text"
                name="time"
                placeholder="Ej. 2 semanas"
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                value={formData.time}
                onChange={handleChange}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`
              w-full mt-6 py-4 rounded-xl font-bold text-lg text-white shadow-lg
              bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500
              transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
              flex items-center justify-center gap-3
              ${isLoading ? 'opacity-80 cursor-wait' : ''}
            `}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Diseñando tu curso con IA...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Generar Aula Virtual</span>
              </>
            )}
          </button>

        </div>
      </form>
    </motion.div>
  );
};

export default CourseForm;