
export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  question: string;
  options: QuizOption[];
  explanation: string;
}

export interface ContentBlock {
  type: 'theory' | 'example' | 'activity' | 'quiz' | 'image';
  title: string;
  content: string | QuizQuestion[] | string[];
  icon?: string;
}

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  isCompleted: boolean;
  isLocked: boolean;
  blocks: ContentBlock[];
}

export interface Unit {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

export interface Course {
  title: string;
  description: string;
  level: string;
  tags: string[];
  units: Unit[];
  sources?: { title: string; url: string }[];
  imagePrompt?: string; // New field for visual generation
}

export interface CourseRequest {
  topic: string;
  level: string;
  profile: string;
  goal: string;
  time: string;
  format: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isApproved?: boolean; // New Security Field
}
