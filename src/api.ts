/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Quiz, QuizAttempt, RetakeRequest, LeaderboardEntry, SystemStats } from "./types";

// Generic request call with unified error handling
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {})
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorObj = new Error(
      errorData.errorEn || errorData.message || "Network request failed"
    ) as any;
    errorObj.errorBn = errorData.errorBn;
    errorObj.errorEn = errorData.errorEn || errorData.message;
    throw errorObj;
  }

  return response.json();
}

export const api = {
  // Credentials Routing
  async login(emailString: string, passwordString: string): Promise<User> {
    return request<User>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: emailString, password: passwordString })
    });
  },

  async register(
    emailString: string,
    passwordString: string,
    nameString: string,
    roleString: 'student' | 'admin',
    permitCodeString?: string
  ): Promise<User> {
    return request<User>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: emailString,
        password: passwordString,
        name: nameString,
        role: roleString,
        permitCode: permitCodeString
      })
    });
  },

  async guestLogin(fullName: string): Promise<User> {
    return request<User>("/api/auth/guest", {
      method: "POST",
      body: JSON.stringify({ name: fullName })
    });
  },

  // User Management
  async fetchUsers(): Promise<any[]> {
    return request<any[]>("/api/users");
  },

  async updateUserRole(uId: string, roleString: 'student' | 'admin'): Promise<any> {
    return request<any>(`/api/users/${uId}/role`, {
      method: "POST",
      body: JSON.stringify({ role: roleString })
    });
  },

  // Quiz Catalog Admin CRUD
  async fetchQuizzes(): Promise<Quiz[]> {
    return request<Quiz[]>("/api/quizzes");
  },

  async createQuiz(payload: Partial<Quiz>): Promise<Quiz> {
    return request<Quiz>("/api/quizzes", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  async updateQuiz(qId: string, payload: Partial<Quiz>): Promise<Quiz> {
    return request<Quiz>(`/api/quizzes/${qId}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
  },

  async deleteQuiz(qId: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/quizzes/${qId}`, {
      method: "DELETE"
    });
  },

  // Locked assessment & Hand in scripting
  async checkLockStatus(uId: string, qId: string): Promise<{ locked: boolean; remainingSeconds: number; hasRequested: boolean }> {
    return request<{ locked: boolean; remainingSeconds: number; hasRequested: boolean }>(
      `/api/attempts/lock/${uId}/${qId}`
    );
  },

  async submitAttempt(
    uId: string,
    uName: string,
    uEmail: string,
    qId: string,
    answersMap: { [questionIndex: number]: string },
    timeSpent: number
  ): Promise<QuizAttempt> {
    return request<QuizAttempt>("/api/attempts", {
      method: "POST",
      body: JSON.stringify({
        userId: uId,
        username: uName,
        email: uEmail,
        quizId: qId,
        answers: answersMap,
        timeSpentSeconds: timeSpent
      })
    });
  },

  async fetchUserAttempts(uId: string): Promise<QuizAttempt[]> {
    return request<QuizAttempt[]>(`/api/attempts/user/${uId}`);
  },

  // Clearance locks requesting
  async requestRetake(uId: string, uName: string, uEmail: string, qId: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>("/api/retakes/request", {
      method: "POST",
      body: JSON.stringify({ userId: uId, username: uName, email: uEmail, quizId: qId })
    });
  },

  async fetchPendingRetakes(): Promise<RetakeRequest[]> {
    return request<RetakeRequest[]>("/api/retakes/pending");
  },

  async approveRetake(reqId: string, statusText: "approved" | "rejected"): Promise<{ success: boolean }> {
    return request<{ success: boolean }>("/api/retakes/approve", {
      method: "POST",
      body: JSON.stringify({ requestId: reqId, status: statusText })
    });
  },

  // Leaderboards and dashboards pulse analytics
  async fetchLeaderboard(classId?: string, subjectId?: string): Promise<LeaderboardEntry[]> {
    let url = "/api/leaderboard";
    const params = new URLSearchParams();
    if (classId) params.append("classId", classId);
    if (subjectId) params.append("subjectId", subjectId);
    const query = params.toString();
    if (query) url += `?${query}`;
    return request<LeaderboardEntry[]>(url);
  },

  async fetchQuizAttempts(quizId: string): Promise<QuizAttempt[]> {
    return request<QuizAttempt[]>(`/api/attempts/quiz/${quizId}`);
  },

  async fetchStats(): Promise<SystemStats> {
    return request<SystemStats>("/api/stats");
  },

  async sendScorecardEmail(attemptId: string, emailAddress: string): Promise<{ success: boolean; messageEn: string; messageBn: string }> {
    return request<{ success: boolean; messageEn: string; messageBn: string }>(`/api/attempts/${attemptId}/email`, {
      method: "POST",
      body: JSON.stringify({ email: emailAddress })
    });
  },

  // Gemini Synthesis Automation Engine
  async aiGenerateQuiz(
    promptText: string,
    classVal: string,
    subjectVal: string,
    imageBase64?: string,
    imageMime?: string,
    imagesList?: { base64: string; mime: string }[],
    appLang?: "en" | "bn",
    count?: number
  ): Promise<Partial<Quiz>> {
    return request<Partial<Quiz>>("/api/quizzes/ai-generate", {
      method: "POST",
      body: JSON.stringify({
        prompt: promptText,
        classId: classVal,
        subjectId: subjectVal,
        imageBase64,
        imageMime,
        images: imagesList,
        lang: appLang,
        count
      })
    });
  }
};
