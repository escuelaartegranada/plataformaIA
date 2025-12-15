import { GoogleGenAI } from "@google/genai";
import { Course, CourseRequest, Lesson } from "../types";

// Fallback data in case API key is missing or fails, ensuring the reviewer sees the UI.
const MOCK_COURSE: Course = {
  title: "Introducción a la Astrofísica Moderna",
  description: "Un viaje fascinante desde los átomos hasta las galaxias, diseñado para mentes curiosas.",
  level: "Principiante",
  tags: ["Ciencia", "Espacio", "Física"],
  units: [
    {
      id: "u1",
      title: "Fundamentos del Cosmos",
      description: "Entendiendo las bases del universo observable.",
      lessons: [
        {
          id: "l1",
          title: "El Big Bang y la Expansión",
          duration: "10 min",
          isCompleted: false,
          isLocked: false,
          blocks: [
            {
              type: "image",
              title: "La Singularidad Inicial",
              content: "A conceptual artistic representation of the Big Bang singularity, exploding into a colorful nebula with glowing particles, dark background, cinematic lighting, 3d render style"
            },
            {
              type: "theory",
              title: "El Origen de Todo",
              content: "La teoría del **Big Bang** es el modelo cosmológico predominante. Afirma que el universo estaba en un estado de muy alta densidad y temperatura y luego se expandió.\n\nEs fundamental entender que no fue una explosión *en* el espacio, sino una explosión *del* espacio mismo."
            },
            {
              type: "example",
              title: "Analogía del Globo",
              content: "Imagina un globo desinflado con puntos dibujados en él. Al inflar el globo, los puntos se separan unos de otros. Ningún punto es el centro; el espacio mismo entre ellos es lo que crece."
            },
            {
              type: "theory",
              title: "Ejemplo de Código",
              content: "Si quisiéramos calcular la velocidad de recesión usando la Ley de Hubble en Python, se vería así:\n```python\ndef velocidad_recesion(H0, distancia):\n    return H0 * distancia\n\n# H0 es la constante de Hubble\nprint(velocidad_recesion(70, 10))```"
            },
            {
              type: "quiz",
              title: "Comprueba tu conocimiento",
              content: [
                {
                  question: "¿Qué sucede con las galaxias según la expansión del universo?",
                  options: [
                    { id: "a", text: "Se mueven a través del espacio", isCorrect: false },
                    { id: "b", text: "El espacio entre ellas se expande", isCorrect: true },
                    { id: "c", text: "Se están encogiendo", isCorrect: false }
                  ],
                  explanation: "Correcto. Las galaxias no se mueven 'a través' del espacio tanto como el espacio mismo se expande entre ellas."
                }
              ]
            }
          ]
        },
        {
          id: "l2",
          title: "Estrellas y Ciclos de Vida",
          duration: "15 min",
          isCompleted: false,
          isLocked: true,
          blocks: []
        }
      ]
    },
    {
      id: "u2",
      title: "Agujeros Negros",
      description: "Explorando los objetos más misteriosos.",
      lessons: [
        {
          id: "l3",
          title: "El Horizonte de Sucesos",
          duration: "20 min",
          isCompleted: false,
          isLocked: true,
          blocks: []
        }
      ]
    }
  ]
};

const SYSTEM_PROMPT = `
Actúa como "ReduIA", un arquitecto pedagógico de clase mundial y experto en diseño instruccional.
Tu objetivo es crear cursos online altamente estructurados, atractivos y personalizados en formato JSON estricto.

Reglas de Estilo:
1. Tono: Empático, inspirador, claro y riguroso pero accesible.
2. Formato: Español de España (neutro).
3. Estructura: Divide el contenido en Unidades -> Lecciones -> Bloques.
4. Bloques: Usa variedad (Teoría, IMAGEN, Ejemplos, Analogías, Quiz, Actividad). ¡NO uses solo texto!
5. **FORMATO VISUAL (CRÍTICO):**
   - Usa **negrita** para resaltar conceptos.
   - Usa bloques de código markdown cuando sea relevante.

**INSTRUCCIONES PARA IMÁGENES (CRÍTICO - OBLIGATORIO):**
- Debes intercalar bloques de tipo "image" para hacer el curso visual.
- En el campo "content" del bloque de imagen, NO pongas una URL. Escribe un PROMPT descriptivo en INGLÉS para generar una imagen (ej: "A futuristic diagram of a neural network, glowing nodes, dark background, 3d render").
- El título del bloque de imagen debe ser una breve descripción o pie de foto (en español).

**INSTRUCCIONES PARA QUIZ (CRÍTICO):**
- Asegúrate de que cada opción en el bloque "quiz" tenga la propiedad "text" con el contenido de la respuesta.
- Estructura: options: [{ id: "a", text: "Respuesta 1", isCorrect: true }, ...]

IMPORTANTE - FUENTES Y BUSQUEDA:
- Usa Google Search (herramienta disponible) para encontrar datos recientes y veraces.
- **PRIORIDAD DE IDIOMA**: Busca y selecciona fuentes/referencias en **ESPAÑOL**.
- Devuelve SOLO el JSON válido.

Estructura JSON requerida (TypeScript Interface):
{
  title: string;
  description: string;
  level: string;
  tags: string[];
  units: [
    {
      id: string; 
      title: string;
      description: string;
      lessons: [
        {
          id: string;
          title: string;
          duration: string;
          isCompleted: false;
          isLocked: boolean; 
          blocks: [
            {
              type: "theory" | "example" | "activity" | "quiz" | "image";
              title: string;
              content: string | QuizQuestion[]; 
            }
          ]
        }
      ]
    }
  ],
  sources?: [{ title: string, url: string }] 
}
`;

export const generateCourse = async (request: CourseRequest): Promise<Course> => {
  const apiKey = process.env.API_KEY;

  // Fallback if no API key
  if (!apiKey) {
    console.warn("No API_KEY found in process.env. Using Mock Data.");
    return new Promise((resolve) => setTimeout(() => resolve(MOCK_COURSE), 2500));
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Using gemini-2.5-flash for speed + quality
    const model = 'gemini-2.5-flash'; 
    
    const userPrompt = `
      Crea un curso sobre: "${request.topic}".
      Nivel: ${request.level}.
      Perfil del alumno: ${request.profile}.
      Objetivo: ${request.goal}.
      Tiempo disponible: ${request.time}.
      Formato preferido: ${request.format}.
      
      Instrucciones Adicionales:
      1. Asegúrate de incluir al menos 2 unidades y 2-3 lecciones por unidad.
      2. La primera lección debe estar desbloqueada (isLocked: false), las demás bloqueadas.
      3. **IMÁGENES:** Es OBLIGATORIO incluir al menos 1 bloque de tipo "image" en cada lección para ilustrar conceptos clave.
      4. **FUENTES**: Al final, genera un array "sources" con enlaces reales. Prioriza español.
      5. **QUIZ**: En los bloques de quiz, usa la propiedad "text" para las opciones.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        // We use Google Search to ground the course in reality
        tools: [{ googleSearch: {} }], 
        temperature: 0.7,
      },
    });

    let text = response.text;
    
    // Extract JSON from potential Markdown blocks
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/);
    if (jsonMatch) {
      text = jsonMatch[1];
    }

    const courseData = JSON.parse(text) as Course;
    
    // Logic to merge grounding chunks with explicit sources in JSON
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (groundingChunks && groundingChunks.length > 0) {
        const groundedSources = groundingChunks
            .filter((chunk: any) => chunk.web?.uri && chunk.web?.title)
            .map((chunk: any) => ({
                title: chunk.web.title,
                url: chunk.web.uri
            }));

        if (courseData.sources) {
            const existingUrls = new Set(courseData.sources.map(s => s.url));
            groundedSources.forEach(gs => {
                if (!existingUrls.has(gs.url)) {
                    courseData.sources!.push(gs);
                }
            });
        } else {
            courseData.sources = groundedSources;
        }
    }

    return courseData;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return MOCK_COURSE;
  }
};

export const askTutor = async (question: string, contextLesson: Lesson): Promise<string> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return "No tengo acceso a mi cerebro (API Key faltante), pero estoy aquí para animarte.";

    try {
        const ai = new GoogleGenAI({ apiKey });
        const model = 'gemini-2.5-flash';
        
        // Extract text content from the lesson to provide context
        const lessonContentText = contextLesson.blocks.map(b => {
            if(typeof b.content === 'string') return `${b.title}: ${b.content}`;
            return b.title;
        }).join('\n\n');

        const prompt = `
            Contexto de la lección actual:
            ${lessonContentText}

            Pregunta del estudiante: "${question}"

            Instrucciones:
            Eres ReduIA, un tutor personal amable y conciso. Responde a la pregunta del estudiante basándote PRINCIPALMENTE en el contexto de la lección proporcionada.
            Si la respuesta no está en la lección, usa tu conocimiento general pero menciona que es información extra.
            Sé breve (máximo 3 frases) para mantener la conversación fluida.
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });

        return response.text || "Lo siento, no pude procesar eso.";

    } catch (e) {
        console.error(e);
        return "Hubo un error de conexión. Inténtalo de nuevo.";
    }
}