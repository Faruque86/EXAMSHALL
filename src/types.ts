/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'student' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  isGuest?: boolean;
}

export interface Question {
  id: string;
  textEn: string;
  textBn: string;
  optionsEn: string[]; // A, B, C, D
  optionsBn: string[]; // A, B, C, D
  correctOption: 'A' | 'B' | 'C' | 'D';
  explanationEn: string;
  explanationBn: string;
}

export interface Quiz {
  id: string;
  titleEn: string;
  titleBn: string;
  classId: 'class-6' | 'class-7' | 'class-8' | 'class-9' | 'class-10';
  subjectId: 'science' | 'math' | 'english' | 'ict' | 'history';
  durationMinutes: number;
  isPublished: boolean;
  questions: Question[];
  createdBy: string;
  createdAt: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  quizTitleEn: string;
  quizTitleBn: string;
  classId: string;
  subjectId: string;
  userId: string;
  username: string;
  email: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  timeSpentSeconds: number;
  completedAt: string;
  answers: { [questionIndex: number]: string }; // Map of question index -> 'A' | 'B' etc.
}

export interface RetakeRequest {
  id: string;
  userId: string;
  username: string;
  email: string;
  quizId: string;
  quizTitleEn: string;
  quizTitleBn: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface LeaderboardEntry {
  username: string;
  email: string;
  totalAttempts: number;
  averageScorePercentage: number;
  totalCorrect: number;
  points: number;
}

export interface SystemStats {
  totalQuizzes: number;
  totalAttempts: number;
  totalStudents: number;
  averageScore: number;
  subjectAttempts: {
    science: number;
    math: number;
    english: number;
    ict: number;
    history: number;
  };
  scoreDistribution: {
    range: string;
    count: number;
  }[];
}
