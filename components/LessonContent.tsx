import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, FlaskConical, PenTool, CheckCircle, XCircle, ArrowRight, Terminal, Info, Volume2, Square, Play, Image as ImageIcon, Maximize2, AlertCircle } from 'lucide-react';
import { ContentBlock, QuizQuestion } from '../types';

interface LessonContentProps {
  blocks: ContentBlock[];
  onComplete: () => void;
  isCompleted: boolean;
}

const LessonContent: React.FC<LessonContentProps> = ({ blocks, onComplete, isCompleted }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechUtterance, setSpeechUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  // Stop audio if component unmounts or blocks change
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, [blocks]);

  const toggleSpeech = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      const textToRead = blocks.map(b => {
        if (b.type === 'image') return '';
        if (typeof b.content === 'string') {
          return `${b.title}. ${b.content.replace(/[\*`#]/g, '')}`;
        }
        return b.title; 
      }).join('. ');

      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = 'es-ES';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);

      setSpeechUtterance(utterance);
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-12 pb-20 relative">
      <div className="flex justify-end mb-4">
        <button
          onClick={toggleSpeech}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-sm font-medium
            ${isPlaying 
              ? 'bg-violet-500 text-white border-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.5)] animate-pulse' 
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }
          `}
        >
          {isPlaying ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          {isPlaying ? 'Detener Lectura' : 'Escuchar Lección'}
        </button>
      </div>

      {blocks.map((block, index) => (
        <BlockRenderer key={index} block={block} index={index} />
      ))}
      
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="pt-8 flex justify-center border-t border-white/5"
      >
        <button
          onClick={onComplete}
          className={`
            px-8 py-4 rounded-full font-bold text-lg flex items-center gap-2 shadow-xl transition-all
            ${isCompleted 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 cursor-default' 
              : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:scale-105 hover:shadow-violet-500/25'}
          `}
        >
          {isCompleted ? (
            <>
              <CheckCircle className="w-5 h-5" />
              Lección Completada
            </>
          ) : (
            <>
              Continuar a la siguiente
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
};

// --- Helper Components for Rich Text ---
const RichTextRenderer: React.FC<{ text: string }> = ({ text }) => {
  const parts = text.split(/```([\s\S]*?)\n```/) || text.split(/```([\s\S]*?)```/);
  const safeParts = parts.length > 1 ? parts : text.split(/```([\s\S]*?)```/g);

  return (
    <div className="space-y-4">
      {safeParts.map((part, index) => {
        if (index % 2 === 1) {
          const firstLineBreak = part.indexOf('\n');
          let language = "Code";
          let codeContent = part;
          if (firstLineBreak > -1 && firstLineBreak < 20) {
             const potentialLang = part.substring(0, firstLineBreak).trim();
             if (!potentialLang.includes(' ') && potentialLang.length > 0) {
                language = potentialLang || "Code";
                codeContent = part.substring(firstLineBreak + 1);
             }
          }
          return <CodeBlock key={index} language={language} code={codeContent} />;
        }
        if (!part.trim()) return null;
        return part.split('\n').map((paragraph, pIdx) => {
           if (!paragraph.trim()) return null;
           return (
             <p key={`${index}-${pIdx}`} className="text-slate-300 leading-relaxed">
               <InlineTextParser text={paragraph} />
             </p>
           );
        });
      })}
    </div>
  );
};

const InlineTextParser: React.FC<{ text: string }> = ({ text }) => {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 1) {
          return (
            <span key={i} className="font-bold text-violet-400 bg-violet-500/10 px-1 rounded-sm">
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
};

const CodeBlock: React.FC<{ code: string, language: string }> = ({ code, language }) => {
  return (
    <div className="my-6 rounded-lg overflow-hidden border border-slate-700/50 bg-[#0d1117] shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <Terminal className="w-3 h-3 text-slate-500" />
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">{language}</span>
        </div>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-600/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-slate-600/50" />
        </div>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="font-mono text-sm text-slate-200 leading-relaxed">
          <code>{code.trim()}</code>
        </pre>
      </div>
    </div>
  );
};

// --- Image Block Renderer (UPDATED FOR HD QUALITY) ---

const ImageBlock: React.FC<{ prompt: string; title: string }> = ({ prompt, title }) => {
  const [imgError, setImgError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Enhanced Prompt Engineering
  const enhancedPrompt = React.useMemo(() => {
    const raw = prompt || title || "educational concept";
    const clean = raw.replace(/[^\w\s,]/gi, '').slice(0, 150);
    // Add visual quality keywords
    return `${clean}, 4k resolution, cinematic lighting, photorealistic, highly detailed, unreal engine 5 render`;
  }, [prompt, title]);

  const seed = React.useMemo(() => Math.floor(Math.random() * 100000), []);
  const encodedPrompt = encodeURIComponent(enhancedPrompt);
  
  // Use 'flux' model for high quality. Added explicit dimensions 1280x720 (HD).
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&model=flux&nologo=true&seed=${seed}`;

  // Increased timeout for Flux model (it's slower but better)
  useEffect(() => {
    if (!isLoaded && !imgError) {
      const timer = setTimeout(() => {
        setImgError(true);
      }, 15000); // 15s timeout for high quality generation
      return () => clearTimeout(timer);
    }
  }, [isLoaded, imgError]);

  if (imgError) {
      return (
        <div className="my-8 rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-lg">
            <div className="aspect-video bg-slate-800/50 flex flex-col items-center justify-center p-8 text-center">
                <div className="p-4 bg-slate-800 rounded-full mb-3">
                   <ImageIcon className="w-8 h-8 text-slate-600" />
                </div>
                <p className="text-slate-400 text-sm font-medium">Imagen no disponible</p>
                <p className="text-slate-600 text-xs mt-1 max-w-md italic">El servidor de imágenes está ocupado.</p>
            </div>
        </div>
      );
  }
  
  return (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="my-10 relative group"
    >
        <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
        <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-700 shadow-2xl">
            <div className="relative aspect-video bg-slate-900 overflow-hidden flex items-center justify-center">
                {!isLoaded && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-0">
                         {/* Loading skeleton shimmer */}
                         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                         
                        <div className="relative flex flex-col items-center gap-4">
                            <div className="relative w-12 h-12">
                                <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                            <span className="text-xs text-violet-300/70 font-mono tracking-widest animate-pulse">RENDERIZANDO HD...</span>
                        </div>
                    </div>
                )}
                <img 
                    src={imageUrl} 
                    alt={title}
                    loading="lazy"
                    onLoad={() => setIsLoaded(true)}
                    onError={() => setImgError(true)}
                    className={`w-full h-full object-cover transition-all duration-1000 z-10 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 pointer-events-none" />
                
                <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 z-30">
                     <div className="flex items-center gap-2 text-white text-xs uppercase tracking-wider font-bold mb-1">
                        <ImageIcon className="w-3 h-3" />
                        Generado con Flux AI
                     </div>
                </div>
            </div>
            <div className="p-4 bg-slate-900 border-t border-slate-800 relative z-30">
                <p className="text-sm font-medium text-slate-300 text-center italic">
                    "{title}"
                </p>
            </div>
        </div>
    </motion.div>
  );
};


// --- Main Block Renderer ---

const BlockRenderer: React.FC<{ block: ContentBlock; index: number }> = ({ block, index }) => {
  const delay = index * 0.1;

  switch (block.type) {
    case 'image':
        return (
            <div className="relative w-full">
                 <ImageBlock prompt={block.content as string} title={block.title} />
            </div>
        );

    case 'theory':
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay, duration: 0.5 }}
          viewport={{ once: true }}
          className="relative pl-6 md:pl-0"
        >
           <div className="hidden md:block absolute left-[-29px] top-0 bottom-0 w-[2px] bg-slate-800">
             <div className="absolute top-0 left-[-5px] w-3 h-3 rounded-full bg-violet-500 border-2 border-slate-900 box-content shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
           </div>

           <div className="glass-panel p-8 rounded-2xl border-t border-white/10 shadow-xl relative overflow-hidden group hover:border-violet-500/30 transition-colors duration-500">
              <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
              
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="p-2.5 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl shadow-lg text-white">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <h3 className="text-2xl font-bold text-white tracking-tight">{block.title}</h3>
              </div>
              
              <div className="relative z-10 text-lg">
                <RichTextRenderer text={block.content as string} />
              </div>
           </div>
        </motion.div>
      );

    case 'example':
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay, duration: 0.5 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-indigo-950/40 to-slate-900/40 p-1 rounded-2xl my-8"
        >
          <div className="bg-slate-950/80 backdrop-blur-sm p-6 md:p-8 rounded-2xl h-full relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                 <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded">Ejemplo Práctico</span>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-4">{block.title}</h3>
              
              <div className="bg-black/20 p-6 rounded-xl border border-indigo-500/20 italic text-slate-300">
                <RichTextRenderer text={block.content as string} />
              </div>
            </div>
          </div>
        </motion.div>
      );

    case 'activity':
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay, duration: 0.5 }}
          viewport={{ once: true }}
          className="border border-slate-700 border-dashed rounded-3xl p-8 bg-slate-900/30 my-8"
        >
          <div className="flex flex-col md:flex-row items-start gap-6">
             <div className="p-4 bg-slate-800 rounded-2xl text-slate-300 shadow-inner shrink-0">
              <PenTool className="w-6 h-6" />
            </div>
            <div className="w-full">
              <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-3">
                {block.title}
                <span className="text-xs font-normal bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">Actividad</span>
              </h3>
              <div className="text-slate-400 leading-relaxed">
                 <RichTextRenderer text={block.content as string} />
              </div>
            </div>
          </div>
        </motion.div>
      );

    case 'quiz':
      return <QuizBlock questions={block.content as QuizQuestion[]} title={block.title} />;

    default:
      return null;
  }
};

const QuizBlock: React.FC<{ questions: QuizQuestion[]; title: string }> = ({ questions, title }) => {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);

  const question = questions[currentQuestionIdx];

  const handleOptionClick = (optionId: string) => {
    if (isAnswered) return;
    setSelectedOptionId(optionId);
    setIsAnswered(true);
    
    const option = question.options.find(o => o.id === optionId);
    if (option?.isCorrect) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(p => p + 1);
      setSelectedOptionId(null);
      setIsAnswered(false);
    }
  };

  const isLast = currentQuestionIdx === questions.length - 1;

  if (!question) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      className="glass-panel p-1 rounded-2xl shadow-2xl shadow-violet-900/10 my-8"
    >
      <div className="bg-slate-900/80 p-6 md:p-8 rounded-xl backdrop-blur-xl">
        <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-violet-500/20 rounded-lg">
               <FlaskConical className="w-5 h-5 text-violet-400" />
            </div>
            {title}
          </h3>
          <span className="text-xs font-mono font-bold text-slate-400 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
            {currentQuestionIdx + 1} / {questions.length}
          </span>
        </div>

        <div className="mb-8">
          <p className="text-xl text-slate-100 font-semibold mb-6 leading-snug">{question.question}</p>
          
          <div className="space-y-3">
            {question.options.map((option) => {
              const text = option.text || (option as any).label || (option as any).content || "Opción";
              
              let className = "w-full p-4 rounded-xl border text-left transition-all relative overflow-hidden group ";
              
              if (isAnswered) {
                if (option.isCorrect) className += "bg-emerald-500/10 border-emerald-500/50 text-emerald-100";
                else if (option.id === selectedOptionId) className += "bg-red-500/10 border-red-500/50 text-red-100";
                else className += "bg-slate-800/20 border-slate-800 text-slate-500 opacity-50 grayscale";
              } else {
                className += "bg-slate-800/40 border-slate-700 hover:bg-slate-700/80 text-slate-200 hover:text-white hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/5";
              }

              return (
                <button
                  key={option.id}
                  onClick={() => handleOptionClick(option.id)}
                  disabled={isAnswered}
                  className={className}
                >
                  <div className="flex items-center justify-between relative z-10">
                    <span className="font-medium text-base">{text}</span>
                    {isAnswered && option.isCorrect && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 ml-2" />}
                    {isAnswered && !option.isCorrect && option.id === selectedOptionId && <XCircle className="w-5 h-5 text-red-400 shrink-0 ml-2" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {isAnswered && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-indigo-900/20 rounded-xl p-5 mb-6 border border-indigo-500/30 flex gap-4 items-start"
          >
            <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-sm text-indigo-200/80 leading-relaxed">
              <span className="font-bold text-indigo-300 block mb-1">Explicación:</span>
              {question.explanation}
            </p>
          </motion.div>
        )}

        {isAnswered && !isLast && (
          <button
            onClick={nextQuestion}
            className="w-full py-4 rounded-xl bg-slate-100 hover:bg-white text-slate-900 font-bold transition-all transform hover:scale-[1.01] shadow-lg"
          >
            Siguiente Pregunta
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default LessonContent;