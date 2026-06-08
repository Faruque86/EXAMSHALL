import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

interface LeaderboardEntry {
  username: string;
  email: string;
  totalAttempts: number;
  averageScorePercentage: number;
  totalCorrect: number;
  points: number;
}

// Define port & file storage
const DB_FILE = path.join(process.cwd(), "db.json");

// System-wide special Admin Permit Code
const ADMIN_REGISTRATION_CODE = "devpermit123";

// Ensure database file on disk with default preseeded content
const defaultQuizzes = [
  {
    id: "quiz-photosynthesis",
    titleEn: "Cell Structure and Photosynthesis Evaluation",
    titleBn: "কোষের গঠন ও সালোকসংশ্লেষণ মূল্যায়ন",
    classId: "class-9",
    subjectId: "science",
    durationMinutes: 5,
    isPublished: true,
    createdBy: "admin-system",
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: "q-photo-1",
        textEn: "Which organelle is primarily responsible for holding chlorophyll and conducting photosynthesis?",
        textBn: "কোন কোষীয় অঙ্গাণু সাধারণত ক্লোরোফিল ধারণ করতে এবং সালোকসংশ্লেষণ করে?",
        optionsEn: ["Mitochondria", "Chloroplast", "Golgi Apparatus", "Ribosome"],
        optionsBn: ["মাইটোকন্ড্রিয়া", "ক্লোরোপ্লাস্ট", "গলগি বডি", "রাইবোসোম"],
        correctOption: "B",
        explanationEn: "Chloroplasts contain chlorophyll pigments that absorb light energy to produce glucose during photosynthesis.",
        explanationBn: "ক্লোরোপ্লাস্টে ক্লোরোফিল রঞ্জক থাকে যা সালোকসংশ্লেষণ করে।"
      },
      {
        id: "q-photo-2",
        textEn: "What are the primary raw materials required by plants for conducting photosynthesis?",
        textBn: "সালোকসংশ্লেষণের জন্য উদ্ভিদের প্রাথমিক কাঁচামাল কী?",
        optionsEn: ["Oxygen and glucose", "Carbon dioxide and water", "Nitrogen and soil minerals", "Carbon dioxide and oxygen"],
        optionsBn: ["অক্সিজেন এবং গ্লুকোজ", "কার্বন ডাই অক্সাইড এবং পানি", "নাইট্রোজেন এবং খনিজ লবণ", "কার্বন ডাই অক্সাইড এবং অক্সিজেন"],
        correctOption: "B",
        explanationEn: "Plants combine carbon dioxide and water under sunlight to prepare glucose, releasing oxygen as a byproduct.",
        explanationBn: "উদ্ভিদ সূর্যালোকের উপস্থিতিতে কার্বন ডাই অক্সাইড এবং পানি মিশিয়ে গ্লুকোজ তৈরি করে।"
      }
    ]
  }
];

const defaultUsers = [
  {
    id: "user-admin",
    email: "admin@quiz.com",
    name: "Professor Russell",
    password: "admin123",
    role: "admin",
    isGuest: false
  },
  {
    id: "user-student",
    email: "student@quiz.com",
    name: "Mushfiqur Rahman",
    password: "student123",
    role: "student",
    isGuest: false
  }
];

// Load or seed db
let db: {
  users: typeof defaultUsers;
  quizzes: typeof defaultQuizzes;
  attempts: any[];
  retakeRequests: any[];
} = {
  users: [...defaultUsers],
  quizzes: [...defaultQuizzes],
  attempts: [],
  retakeRequests: []
};

function readDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      db = JSON.parse(content);
    } else {
      writeDb();
    }
  } catch (err) {
    console.error("Database reading failed, reverting to default parameters", err);
  }
}

function writeDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Database saving failed", err);
  }
}

readDb();

const app = express();
app.use(express.json({ limit: "50mb" }));

// Initialize Google Gen AI
const aiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (aiKey && aiKey !== "MY_GEMINI_API_KEY") {
  aiClient = new GoogleGenAI({
    apiKey: aiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// Helper to check lockout (12 hours)
function getLockoutDurationSeconds(userId: string, quizId: string): number {
  const attempts = db.attempts.filter(
    (a) => a.userId === userId && a.quizId === quizId
  );
  if (attempts.length === 0) return 0;

  const latestAttempt = attempts.reduce((latest, current) => {
    return new Date(current.completedAt) > new Date(latest.completedAt) ? current : latest;
  }, attempts[0]);

  const lastTime = new Date(latestAttempt.completedAt).getTime();
  const now = new Date().getTime();
  const elapsedMs = now - lastTime;
  const lockPeriodMs = 12 * 60 * 60 * 1000;

  const approvals = db.retakeRequests.filter(
    (r) => r.userId === userId && r.quizId === quizId && r.status === "approved"
  );
  const latestApproval = approvals.reduce((latest, current) => {
    if (!latest) return current;
    return new Date(current.requestedAt) > new Date(latest.requestedAt) ? current : latest;
  }, null as any);

  if (latestApproval) {
    const approvalTime = new Date(latestApproval.requestedAt).getTime();
    if (approvalTime > lastTime) {
      return 0;
    }
  }

  const remainingMs = lockPeriodMs - elapsedMs;
  return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
}

// Authentication Endpoints
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const user = db.users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );

  if (!user) {
    return res.status(401).json({ errorEn: "Invalid academic credentials.", errorBn: "ভুল আইডি বা পাসওয়ার্ড।" });
  }

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isGuest: user.isGuest || false
  });
});

app.post("/api/auth/register", (req, res) => {
  const { email, password, name, role, permitCode } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ errorEn: "Incomplete details.", errorBn: "অসম্পূর্ণ বিবরণ।" });
  }

  const exists = db.users.some((u) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(400).json({ errorEn: "Email already registered.", errorBn: "ইমেইল ইতিমধ্যে নিবন্ধিত।" });
  }

  if (role === "admin" && permitCode !== ADMIN_REGISTRATION_CODE) {
    return res.status(400).json({
      errorEn: "Invalid permit code.",
      errorBn: "ভুল পারমিট কোড।"
    });
  }

  const newUser = {
    id: "user-" + Math.random().toString(36).substr(2, 9),
    email,
    name,
    password,
    role: role || "student",
    isGuest: false
  };

  db.users.push(newUser);
  writeDb();

  res.json({
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    role: newUser.role,
    isGuest: false
  });
});

app.post("/api/auth/guest", (req, res) => {
  const { name } = req.body;
  if (!name || name.trim() === "") {
    return res.status(400).json({ errorEn: "Guest name required.", errorBn: "অতিথির নাম প্রয়োজন।" });
  }

  const guestId = "guest-" + Math.random().toString(36).substr(2, 9);
  const guestUser = {
    id: guestId,
    email: `guest-${guestId}@examshall.internal`,
    name: name.trim(),
    password: "",
    role: "student" as const,
    isGuest: true
  };

  db.users.push(guestUser);
  writeDb();

  res.json({
    id: guestUser.id,
    email: guestUser.email,
    name: guestUser.name,
    role: guestUser.role,
    isGuest: true
  });
});

// Quiz Catalog
app.get("/api/quizzes", (req, res) => {
  res.json(db.quizzes);
});

app.post("/api/quizzes", (req, res) => {
  const { titleEn, titleBn, classId, subjectId, durationMinutes, questions, isPublished, createdBy } = req.body;

  if (!titleEn || !titleBn || !classId || !subjectId || !questions || questions.length === 0) {
    return res.status(400).json({ errorEn: "Missing required fields.", errorBn: "প্রয়োজনীয় ক্ষেত্র অনুপস্থিত।" });
  }

  const newQuiz = {
    id: "quiz-" + Math.random().toString(36).substr(2, 9),
    titleEn,
    titleBn,
    classId,
    subjectId,
    durationMinutes: Number(durationMinutes) || 10,
    isPublished: isPublished !== undefined ? isPublished : true,
    questions: questions.map((q: any, idx: number) => ({
      id: q.id || `q-${idx}-${Date.now()}`,
      textEn: q.textEn || q.question || "",
      textBn: q.textBn || q.question || "",
      optionsEn: q.optionsEn || [],
      optionsBn: q.optionsBn || [],
      correctOption: q.correctOption || "A",
      explanationEn: q.explanationEn || q.explanation || "",
      explanationBn: q.explanationBn || q.explanation || ""
    })),
    createdBy: createdBy || "admin",
    createdAt: new Date().toISOString()
  };

  db.quizzes.push(newQuiz);
  writeDb();

  res.json(newQuiz);
});

app.get("/api/attempts/lock/:userId/:quizId", (req, res) => {
  const { userId, quizId } = req.params;
  const lockSeconds = getLockoutDurationSeconds(userId, quizId);

  const pendingRequests = db.retakeRequests.filter(
    (r) => r.userId === userId && r.quizId === quizId && r.status === "pending"
  );

  res.json({
    locked: lockSeconds > 0,
    remainingSeconds: lockSeconds,
    hasRequested: pendingRequests.length > 0
  });
});

app.post("/api/attempts", (req, res) => {
  const { userId, username, email, quizId, answers, timeSpentSeconds } = req.body;

  if (!userId || !quizId || !answers) {
    return res.status(400).json({ errorEn: "Incomplete data.", errorBn: "অসম্পূর্ণ তথ্য।" });
  }

  const lockSeconds = getLockoutDurationSeconds(userId, quizId);
  if (lockSeconds > 0) {
    return res.status(403).json({
      errorEn: "Quiz locked for 12 hours.",
      errorBn: "কুইজ ১২ ঘণ্টা লক থাকবে।"
    });
  }

  const quiz = db.quizzes.find((q) => q.id === quizId);
  if (!quiz) {
    return res.status(404).json({ errorEn: "Quiz not found.", errorBn: "কুইজ পাওয়া যায়নি।" });
  }

  let correctCount = 0;
  quiz.questions.forEach((q, idx) => {
    const studentAnswer = answers[idx];
    if (studentAnswer === q.correctOption) {
      correctCount++;
    }
  });

  const totalQuestions = quiz.questions.length;
  const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  const newAttempt = {
    id: "attempt-" + Math.random().toString(36).substr(2, 9),
    quizId,
    quizTitleEn: quiz.titleEn,
    quizTitleBn: quiz.titleBn,
    classId: quiz.classId,
    subjectId: quiz.subjectId,
    userId,
    username,
    email: email || "anonymous@examshall.internal",
    score: correctCount,
    totalQuestions,
    percentage,
    timeSpentSeconds: Number(timeSpentSeconds) || 0,
    completedAt: new Date().toISOString(),
    answers
  };

  db.attempts.push(newAttempt);
  writeDb();

  res.json(newAttempt);
});

app.get("/api/attempts/user/:userId", (req, res) => {
  const { userId } = req.params;
  const userAttempts = db.attempts.filter((a) => a.userId === userId);
  res.json(userAttempts);
});

app.get("/api/attempts/quiz/:quizId", (req, res) => {
  const { quizId } = req.params;
  const attempts = db.attempts.filter((a) => a.quizId === quizId);
  const sorted = [...attempts].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.timeSpentSeconds - b.timeSpentSeconds;
  });
  res.json(sorted);
});

app.get("/api/leaderboard", (req, res) => {
  const { classId, subjectId } = req.query;
  const scoresMap: { [email: string]: LeaderboardEntry } = {};

  const filteredAttempts = db.attempts.filter((a) => {
    if (classId && a.classId !== classId) return false;
    if (subjectId && a.subjectId !== subjectId) return false;
    return true;
  });

  filteredAttempts.forEach((a) => {
    const key = a.email.toLowerCase();
    if (!scoresMap[key]) {
      scoresMap[key] = {
        username: a.username,
        email: key,
        totalAttempts: 0,
        averageScorePercentage: 0,
        totalCorrect: 0,
        points: 0
      };
    }
    const entry = scoresMap[key];
    entry.totalAttempts += 1;
    entry.totalCorrect += a.score;
    entry.averageScorePercentage = (entry.averageScorePercentage * (entry.totalAttempts - 1) + a.percentage) / entry.totalAttempts;
  });

  const list = Object.values(scoresMap);
  list.forEach((entry) => {
    entry.points = Math.round(entry.totalCorrect * 20 + entry.averageScorePercentage * 5);
    entry.averageScorePercentage = Math.round(entry.averageScorePercentage);
  });

  list.sort((a, b) => b.points - a.points);
  res.json(list);
});

app.get("/api/stats", (req, res) => {
  const totalQuizzes = db.quizzes.length;
  const totalAttempts = db.attempts.length;

  const uniqueStudents = new Set(db.attempts.map((a) => a.email.toLowerCase()));
  const totalStudents = uniqueStudents.size || db.users.filter((u) => u.role === "student").length || 1;

  const totalPerc = db.attempts.reduce((sum, a) => sum + a.percentage, 0);
  const averageScore = totalAttempts > 0 ? Math.round(totalPerc / totalAttempts) : 0;

  res.json({
    totalQuizzes,
    totalAttempts,
    totalStudents,
    averageScore
  });
});

export default app;
