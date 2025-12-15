import React from 'react';
import { motion } from 'framer-motion';

const SkeletonLoader: React.FC = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-900 w-full">
      {/* Sidebar Skeleton */}
      <div className="hidden md:flex w-80 flex-col bg-slate-950 border-r border-white/5 p-6 space-y-8">
         <div className="h-8 w-3/4 bg-slate-800 rounded animate-pulse" />
         <div className="space-y-4">
             {[1, 2, 3].map(i => (
                 <div key={i} className="space-y-2">
                     <div className="h-4 w-1/2 bg-slate-800 rounded animate-pulse" />
                     <div className="h-10 w-full bg-slate-800/50 rounded animate-pulse" />
                     <div className="h-10 w-full bg-slate-800/50 rounded animate-pulse" />
                 </div>
             ))}
         </div>
         <div className="mt-auto h-12 w-full bg-slate-800 rounded animate-pulse" />
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 p-8 md:p-16 flex flex-col max-w-4xl mx-auto w-full">
         {/* Header */}
         <div className="space-y-4 mb-12">
             <div className="h-4 w-32 bg-slate-800 rounded animate-pulse" />
             <div className="h-12 w-3/4 bg-slate-800 rounded animate-pulse" />
             <div className="flex gap-4">
                 <div className="h-6 w-24 bg-slate-800 rounded animate-pulse" />
                 <div className="h-6 w-24 bg-slate-800 rounded animate-pulse" />
             </div>
         </div>

         {/* Blocks */}
         <div className="space-y-8">
             <div className="h-48 w-full bg-slate-800/30 rounded-2xl animate-pulse border border-white/5" />
             <div className="h-32 w-full bg-slate-800/30 rounded-2xl animate-pulse border border-white/5" />
             <div className="h-64 w-full bg-slate-800/30 rounded-2xl animate-pulse border border-white/5" />
         </div>
         
         <div className="mt-12 mx-auto h-14 w-64 bg-slate-800 rounded-full animate-pulse" />
      </div>
      
      {/* Loading Overlay Text */}
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/20 backdrop-blur-[2px]">
          <div className="bg-slate-950/80 backdrop-blur-xl p-8 rounded-3xl border border-white/10 flex flex-col items-center shadow-2xl">
              <div className="relative w-16 h-16 mb-4">
                  <div className="absolute inset-0 border-4 border-violet-500/30 rounded-full" />
                  <div className="absolute inset-0 border-4 border-t-violet-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Diseñando tu Curso</h3>
              <p className="text-slate-400 text-sm animate-pulse">Estructurando lecciones...</p>
          </div>
      </div>
    </div>
  );
};

export default SkeletonLoader;