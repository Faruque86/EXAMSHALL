/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
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
const PORT = 3000;
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
        textBn: "কোন কোষীয় অঙ্গাণু সাধারণত ক্লোরোফিল ধারণ করতে এবং সালোকসংশ্লেষণ প্রক্রিয়ার জন্য দায়ী?",
        optionsEn: [
          "Mitochondria",
          "Chloroplast",
          "Golgi Apparatus",
          "Ribosome"
        ],
        optionsBn: [
          "মাইটোকন্ড্রিয়া",
          "ক্লোরোপ্লাস্ট",
          "গলগি বডি",
          "রাইবোসোম"
        ],
        correctOption: "B",
        explanationEn: "Chloroplasts contain chlorophyll pigments that absorb light energy to produce glucose during photosynthesis.",
        explanationBn: "ক্লোরোপ্লাস্টে ক্লোরোফিল রঞ্জক থাকে যা সালোকসংশ্লেষণ প্রক্রিয়ায় গ্লুকোজ তৈরির জন্য আলোক শক্তি শোষণ করে।"
      },
      {
        id: "q-photo-2",
        textEn: "What are the primary raw materials required by plants for conducting photosynthesis?",
        textBn: "সালোকসংশ্লেষণ প্রক্রিয়া পরিচালনার জন্য উদ্ভিদের প্রাথমিক কাঁচামাল কোনটি?",
        optionsEn: [
          "Oxygen and glucose",
          "Carbon dioxide and water",
          "Nitrogen and soil minerals",
          "Carbon dioxide and oxygen"
        ],
        optionsBn: [
          "অক্সিজেন এবং গ্লুকোজ",
          "কার্বন ডাই অক্সাইড এবং পানি",
          "নাইট্রোজেন এবং খনিজ লবণ",
          "কার্বন ডাই অক্সাইড এবং অক্সিজেন"
        ],
        correctOption: "B",
        explanationEn: "Plants combine carbon dioxide and water under sunlight to prepare glucose, releasing oxygen as a byproduct.",
        explanationBn: "উদ্ভিদ সূর্যালোকের উপস্থিতিতে কার্বন ডাই অক্সাইড এবং পানি মিশ্রিত করে গ্লুকোজ তৈরি করে এবং উপজাত হিসেবে অক্সিজেন নির্গত করে।"
      },
      {
        id: "q-photo-3",
        textEn: "In which light wavelength does the rate of photosynthesis reach its maximum peak?",
        textBn: "কোন রঙের আলোর তরঙ্গদৈর্ঘ্যে সালোকসংশ্লেষণের হার সর্বোচ্চ পর্যায়ে পৌঁছায়?",
        optionsEn: [
          "Green and yellow light",
          "Blue and red light",
          "Indigo and yellow light",
          "Infrared light"
        ],
        optionsBn: [
          "সবুজ এবং হলুদ আলো",
          "নীল এবং লাল আলো",
          "নীল এবং হলুদ আলো",
          "অবলোহিত আলো"
        ],
        correctOption: "B",
        explanationEn: "Photosynthesis is most efficient in the red and blue regions of the light spectrum because chlorophyll absorbs these wavelengths the most.",
        explanationBn: "বর্ণালীর লাল এবং নীল অঞ্চলে সালোকসংশ্লেষণ সবচেয়ে দক্ষ হয় কারণ ক্লোরোফিল এই তরঙ্গদৈর্ঘ্যের আলো সবচেয়ে বেশি শোষণ করে।"
      }
    ]
  },
  {
    id: "quiz-trig",
    titleEn: "Algebraic Trigonometry Practice Quiz",
    titleBn: "বীজগণিতীয় ত্রিকোণমিতি অনুশীলন কুইজ",
    classId: "class-10",
    subjectId: "math",
    durationMinutes: 10,
    isPublished: true,
    createdBy: "admin-system",
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: "q-trig-1",
        textEn: "If sin(θ) = 3/5 in a right-angled triangle, what is the value of cos(θ)?",
        textBn: "একটি সমকোণী ত্রিভুজে sin(θ) = ৩/৫ হলে, cos(θ)-এর মান কত?",
        optionsEn: ["4/5", "3/4", "5/3", "1/2"],
        optionsBn: ["৪/৫", "৩/৪", "৫/৩", "১/২"],
        correctOption: "A",
        explanationEn: "Using the Pythagorean identity sin²(θ) + cos²(θ) = 1, we get cos²(θ) = 1 - 9/25 = 16/25, hence cos(θ) = 4/5.",
        explanationBn: "পিথাগোরাসের সূত্র sin²(θ) + cos²(θ) = ১ ব্যবহার করে আমরা পাই cos²(θ) = ১ - ৯/২৫ = ১৬/২৫, অতএব cos(θ) = ৪/৫।"
      },
      {
        id: "q-trig-2",
        textEn: "What is the equivalent simplified value of cot²(θ) - cosec²(θ)?",
        textBn: "cot²(θ) - cosec²(θ) এর সমতুল্য সরলীকৃত মান কত?",
        optionsEn: ["1", "-1", "0", "tan²(θ)"],
        optionsBn: ["১", "-১", "০", "tan²(θ)"],
        correctOption: "B",
        explanationEn: "Since cosec²(θ) - cot²(θ) = 1, exchanging the terms cot²(θ) - cosec²(θ) yields -1.",
        explanationBn: "যেহেতু cosec²(θ) - cot²(θ) = ১, তাই পদ পরিবর্তনের মাধ্যমে cot²(θ) - cosec²(θ) = -১ পাওয়া যায়।"
      }
    ]
  },
  {
    id: "quiz-net-basics",
    titleEn: "Computer Networking Basics and Internet Protocol",
    titleBn: "কম্পিউটার নেটওয়ার্কিং বেসিক এবং ইন্টারনেট প্রোটোকল",
    classId: "class-8",
    subjectId: "ict",
    durationMinutes: 7,
    isPublished: true,
    createdBy: "admin-system",
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: "q-ict-1",
        textEn: "Which layout topology connects all computers to a single central hub or switch?",
        textBn: "কোন নেটওয়ার্ক টপোলজি সমস্ত কম্পিউটারকে একটি কেন্দ্রীয় হাব বা সুইচের সাথে সংযুক্ত করে?",
        optionsEn: ["Ring Topology", "Bus Topology", "Star Topology", "Mesh Topology"],
        optionsBn: ["রিং টপোলজি", "বাস টপোলজি", "স্টার টপোলজি", "মেশ টপোলজি"],
        correctOption: "C",
        explanationEn: "Star topology channels all communications through a central node, acting as a gateway or switch.",
        explanationBn: "স্টার টপোলজিতে সকল তথ্য আদান-প্রদান কেন্দ্রের একটি হাব বা সুইচের মাধ্যমে পরিবাহিত হয়।"
      },
      {
        id: "q-ict-2",
        textEn: "What does the abbreviation IP stand for in web network communications?",
        textBn: "ওয়েব নেটওয়ার্কের ক্ষেত্রে 'IP'-এর পূর্ণরূপ কী?",
        optionsEn: ["Intranet Process", "Information Pathway", "Internet Protocol", "Instant Portal"],
        optionsBn: ["ইনট্রানেট প্রসেস", "ইনফরমেশন পাথওয়ে", "ইন্টারনেট প্রোটোকল", "ইনস্ট্যান্ট পোর্টাল"],
        correctOption: "C",
        explanationEn: "IP stands for Internet Protocol, which routes packet deliveries across logical networking interfaces.",
        explanationBn: "IP এর পূর্ণরূপ হলো ইন্টারনেট প্রোটোকল, যা বিভিন্ন নেটওয়ার্কের মধ্যে তথ্যের প্যাকেট রাউটিং করতে ব্যবহৃত হয়।"
      }
    ]
  }
];

const defaultUsers = [
  {
    id: "user-admin",
    email: "admin@quiz.com",
    name: "Professor Russell (প্রফেসর রাসেল)",
    password: "admin123",
    role: "admin",
    isGuest: false
  },
  {
    id: "user-student",
    email: "student@quiz.com",
    name: "Mushfiqur Rahman (মুশফিকুর রহমান)",
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

  // Find the latest attempt
  const latestAttempt = attempts.reduce((latest, current) => {
    return new Date(current.completedAt) > new Date(latest.completedAt) ? current : latest;
  }, attempts[0]);

  const lastTime = new Date(latestAttempt.completedAt).getTime();
  const now = new Date().getTime();
  const elapsedMs = now - lastTime;
  const lockPeriodMs = 12 * 60 * 60 * 1000; // 12 hours

  // Check if a retake has been approved since the latest attempt completion
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
      // Retake got approved *after* the latest attempt, bypass the lock!
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
    return res.status(401).json({ errorEn: "Invalid academic credentials.", errorBn: "ভুল আইডি বা পাসওয়ার্ড সরবরাহ করা হয়েছে।" });
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
    return res.status(400).json({ errorEn: "Incomplete details.", errorBn: "অসম্পূর্ণ বিবরণ প্রদান করা হয়েছে।" });
  }

  const exists = db.users.some((u) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(400).json({ errorEn: "Email record already registered.", errorBn: "এই ইমেইল দিয়ে ইতঃপূর্বে হিসাব খোলা রয়েছে।" });
  }

  // Admin permit validation
  if (role === "admin" && permitCode !== ADMIN_REGISTRATION_CODE) {
    return res.status(400).json({
      errorEn: "Invalid developer/administrative security permit code.",
      errorBn: "ভুল ডেভেলপার বা প্রধান প্রশাসক সিকিউরিটি পারমিট কোড।"
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
    return res.status(400).json({ errorEn: "Guest name is strictly required.", errorBn: "অতিথি শিক্ষার্থীর পুরো নাম আবশ্যক।" });
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

// Admin ONLY: get users
app.get("/api/users", (req, res) => {
  // Strip passwords for transmit
  const safeUsers = db.users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    isGuest: u.isGuest
  }));
  res.json(safeUsers);
});

// Admin ONLY: update user roles
app.post("/api/users/:id/role", (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (role !== "admin" && role !== "student") {
    return res.status(400).json({ errorEn: "Invalid role value.", errorBn: "ভুল অ্যাক্সেস রাইটস।" });
  }

  const user = db.users.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ errorEn: "User not found.", errorBn: "ব্যবহারকারী খুঁজে পাওয়া যায়নি।" });
  }

  user.role = role;
  writeDb();

  res.json({ success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});


// Quiz Catalog Management CRUD
app.get("/api/quizzes", (req, res) => {
  res.json(db.quizzes);
});

app.post("/api/quizzes", (req, res) => {
  const { titleEn, titleBn, classId, subjectId, durationMinutes, questions, isPublished, createdBy } = req.body;

  if (!titleEn || !titleBn || !classId || !subjectId || !questions || questions.length === 0) {
    return res.status(400).json({ errorEn: "Missing required quiz components.", errorBn: "কুইজের প্রয়োজনীয় তথ্যাবলী অনুপস্থিত।" });
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
      optionsEn: q.optionsEn || [q.optionA, q.optionB, q.optionC, q.optionD].filter(Boolean),
      optionsBn: q.optionsBn || [q.optionA, q.optionB, q.optionC, q.optionD].filter(Boolean),
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

app.put("/api/quizzes/:id", (req, res) => {
  const { id } = req.params;
  const { titleEn, titleBn, classId, subjectId, durationMinutes, questions, isPublished } = req.body;

  const idx = db.quizzes.findIndex((q) => q.id === id);
  if (idx === -1) {
    return res.status(404).json({ errorEn: "Quiz path not discovered.", errorBn: "কুইজ ডিরেক্টরি পাওয়া যায়নি।" });
  }

  db.quizzes[idx] = {
    ...db.quizzes[idx],
    titleEn: titleEn || db.quizzes[idx].titleEn,
    titleBn: titleBn || db.quizzes[idx].titleBn,
    classId: classId || db.quizzes[idx].classId,
    subjectId: subjectId || db.quizzes[idx].subjectId,
    durationMinutes: durationMinutes !== undefined ? Number(durationMinutes) : db.quizzes[idx].durationMinutes,
    isPublished: isPublished !== undefined ? isPublished : db.quizzes[idx].isPublished,
    questions: questions ? questions.map((q: any, qIdx: number) => ({
      id: q.id || `q-${qIdx}-${Date.now()}`,
      textEn: q.textEn,
      textBn: q.textBn,
      optionsEn: q.optionsEn,
      optionsBn: q.optionsBn,
      correctOption: q.correctOption,
      explanationEn: q.explanationEn,
      explanationBn: q.explanationBn
    })) : db.quizzes[idx].questions
  };

  writeDb();
  res.json(db.quizzes[idx]);
});

app.delete("/api/quizzes/:id", (req, res) => {
  const { id } = req.params;
  const initialLen = db.quizzes.length;
  db.quizzes = db.quizzes.filter((q) => q.id !== id);

  if (db.quizzes.length === initialLen) {
    return res.status(404).json({ errorEn: "Quiz has already been deleted or is not found.", errorBn: "কুইজটি পাওয়া যায়নি বা ইতিপূর্বে মুছে ফেলা হয়েছে।" });
  }

  writeDb();
  res.json({ success: true, message: "Quiz permanently removed from directories." });
});


// Locked / Active retake checks
app.get("/api/attempts/lock/:userId/:quizId", (req, res) => {
  const { userId, quizId } = req.params;
  const lockSeconds = getLockoutDurationSeconds(userId, quizId);

  // Check pending request status
  const pendingRequests = db.retakeRequests.filter(
    (r) => r.userId === userId && r.quizId === quizId && r.status === "pending"
  );

  res.json({
    locked: lockSeconds > 0,
    remainingSeconds: lockSeconds,
    hasRequested: pendingRequests.length > 0
  });
});

// Attempt Submissions
app.post("/api/attempts", (req, res) => {
  const { userId, username, email, quizId, answers, timeSpentSeconds } = req.body;

  if (!userId || !quizId || !answers) {
    return res.status(400).json({ errorEn: "Incomplete evaluation sheet.", errorBn: "পরীক্ষার শীট ও উত্তরপত্র অসম্পূর্ণ।" });
  }

  // 12 hours lockout check
  const lockSeconds = getLockoutDurationSeconds(userId, quizId);
  if (lockSeconds > 0) {
    return res.status(403).json({
      errorEn: "Unlock lockout violation. Active Anti-cheat block is active.",
      errorBn: "১২-ঘণ্টার ব্লকআউটের কারণে পরীক্ষাটি পুনরায় লক হয়ে রয়েছে।"
    });
  }

  const quiz = db.quizzes.find((q) => q.id === quizId);
  if (!quiz) {
    return res.status(404).json({ errorEn: "Quiz directory not found.", errorBn: "কুইজ ডিরেক্টরি পাওয়া যায়নি।" });
  }

  // Grade script
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

// User profiling history dashboard
app.get("/api/attempts/user/:userId", (req, res) => {
  const { userId } = req.params;
  const userAttempts = db.attempts.filter((a) => a.userId === userId);
  res.json(userAttempts);
});

// Retake request approval channels
app.post("/api/retakes/request", (req, res) => {
  const { userId, username, email, quizId } = req.body;

  if (!userId || !quizId) {
    return res.status(400).json({ errorEn: "Incomplete request details.", errorBn: "অনুরোধের বিবরণ অসম্পূর্ণ।" });
  }

  const quiz = db.quizzes.find((q) => q.id === quizId);
  if (!quiz) {
    return res.status(404).json({ errorEn: "Quiz not found.", errorBn: "কুইজ খুঁজে পাওয়া যায়নি।" });
  }

  // Already pending?
  const alreadyRequested = db.retakeRequests.some(
    (r) => r.userId === userId && r.quizId === quizId && r.status === "pending"
  );
  if (alreadyRequested) {
    return res.json({ success: true, message: "Request already pending." });
  }

  const request = {
    id: "req-" + Math.random().toString(36).substr(2, 9),
    userId,
    username,
    email: email || "anonymous@examshall.internal",
    quizId,
    quizTitleEn: quiz.titleEn,
    quizTitleBn: quiz.titleBn,
    requestedAt: new Date().toISOString(),
    status: "pending"
  };

  db.retakeRequests.push(request);
  writeDb();

  res.json({ success: true, request });
});

app.get("/api/retakes/pending", (req, res) => {
  const pending = db.retakeRequests.filter((r) => r.status === "pending");
  res.json(pending);
});

app.post("/api/retakes/approve", (req, res) => {
  const { requestId, status } = req.body; // status: 'approved' | 'rejected'

  if (!requestId || !status) {
    return res.status(400).json({ error: "Missing requestId or status." });
  }

  const request = db.retakeRequests.find((r) => r.id === requestId);
  if (!request) {
    return res.status(404).json({ error: "Request not discovered." });
  }

  request.status = status;
  writeDb();

  res.json({ success: true, request });
});


// Fetch attempts for a specific quiz (Result Sheet)
app.get("/api/attempts/quiz/:quizId", (req, res) => {
  const { quizId } = req.params;
  const attempts = db.attempts.filter((a) => a.quizId === quizId);
  // Sort by score (descending), then by timeSpentSeconds (ascending)
  const sorted = [...attempts].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.timeSpentSeconds - b.timeSpentSeconds;
  });
  res.json(sorted);
});

// Leaderboard computes points score based on average performance, with optional class and subject filtering
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
    // Accumulate percentage for computing final average
    entry.averageScorePercentage = (entry.averageScorePercentage * (entry.totalAttempts - 1) + a.percentage) / entry.totalAttempts;
  });

  const list = Object.values(scoresMap);
  // Calculate talent points: Correct answers * 20 + Average percentage * 5
  list.forEach((entry) => {
    entry.points = Math.round(entry.totalCorrect * 20 + entry.averageScorePercentage * 5);
    entry.averageScorePercentage = Math.round(entry.averageScorePercentage);
  });

  list.sort((a, b) => b.points - a.points);
  res.json(list);
});

// Platform Statistics overview counts
app.get("/api/stats", (req, res) => {
  const totalQuizzes = db.quizzes.length;
  const totalAttempts = db.attempts.length;

  // Unique student IDs or email
  const uniqueStudents = new Set(db.attempts.map((a) => a.email.toLowerCase()));
  const totalStudents = uniqueStudents.size || db.users.filter((u) => u.role === "student").length || 1;

  const totalPerc = db.attempts.reduce((sum, a) => sum + a.percentage, 0);
  const averageScore = totalAttempts > 0 ? Math.round(totalPerc / totalAttempts) : 0;

  const subjectAttempts = {
    science: 0,
    math: 0,
    english: 0,
    ict: 0,
    history: 0
  };

  db.attempts.forEach((a) => {
    const sId = (a.subjectId || "").toLowerCase();
    if (sId === "science") subjectAttempts.science++;
    else if (sId === "math") subjectAttempts.math++;
    else if (sId === "english") subjectAttempts.english++;
    else if (sId === "ict") subjectAttempts.ict++;
    else if (sId === "history") subjectAttempts.history++;
  });

  const ranges = {
    "90-100": 0,
    "70-89": 0,
    "50-69": 0,
    "Under 50": 0
  };

  db.attempts.forEach((a) => {
    const p = a.percentage;
    if (p >= 90) ranges["90-100"]++;
    else if (p >= 70) ranges["70-89"]++;
    else if (p >= 50) ranges["50-69"]++;
    else ranges["Under 50"]++;
  });

  const scoreDistribution = [
    { range: "90-100%", count: ranges["90-100"] },
    { range: "70-89%", count: ranges["70-89"] },
    { range: "50-69%", count: ranges["50-69"] },
    { range: "Below 50%", count: ranges["Under 50"] }
  ];

  res.json({
    totalQuizzes,
    totalAttempts,
    totalStudents,
    averageScore,
    subjectAttempts,
    scoreDistribution
  });
});

// Live mock dispatched email endpoint
app.post("/api/attempts/:id/email", (req, res) => {
  const { id } = req.params;
  const { email } = req.body;

  const attempt = db.attempts.find((a) => a.id === id);
  if (!attempt) {
    return res.status(404).json({ error: "Exam evaluation record not found." });
  }

  // Simulate transactional email dispatch log
  console.log(`[SMTP SIMULATOR] Dispatching official score evaluation for attempt: ${id} to address ${email}`);

  res.json({
    success: true,
    messageEn: `Bilingual scorecard synthesized and successfully dispatched to ${email}.`,
    messageBn: `দ্বিভাষিক স্কোরকার্ড তৈরি করা হয়েছে এবং ${email} এ সফলভাবে প্রেরণ করা হয়েছে।`
  });
});

// Gemini AI Quiz Generator endpoint using the rigid response schema guidelines
app.post("/api/quizzes/ai-generate", async (req, res) => {
  if (!aiClient) {
    return res.status(503).json({
      errorEn: "Gemini server-side AI integration token key is missing or unset. Please configure GEMINI_API_KEY in server secrets.",
      errorBn: "জেমিনি এআই এপিআই কি সেটিংসে যুক্ত করা হয়নি। অনুগ্রহ করে সেটিংসে 'GEMINI_API_KEY' যুক্ত করুন।"
    });
  }

  const { titleEn, titleBn, prompt, classId, subjectId, imageBase64, imageMime, images, lang, count } = req.body;

  try {
    const parts: any[] = [];
    const targetCount = count && !isNaN(Number(count)) ? Math.min(Math.max(Number(count), 1), 50) : 5;

    // Support multiple uploaded images up to 8
    if (images && Array.isArray(images)) {
      images.forEach((img: any) => {
        if (img.base64) {
          parts.push({
            inlineData: {
              mimeType: img.mime || "image/jpeg",
              data: img.base64
            }
          });
        }
      });
    } else if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: imageMime || "image/jpeg",
          data: imageBase64
        }
      });
    }

    const generationInstruction = `
You are an expert curriculum writer and assessment specialist for Grade Class Level 6 to 10 in Bangladesh.
Your task is to analyze the provided prompt, textbooks content description, or image worksheets, and synthesize highly qualitative Multiple-Choice Questions (MCQs).

Generate a list of premium MCQ questions.
VERY IMPORTANT LANGUAGE INSTRUCTION:
- The user has requested the output to be strictly in ONLY ONE language based on the current language selection: \${lang === 'bn' ? 'BANGLA (বাংলা)' : 'ENGLISH'}.
- Since the database and form schemas require both "En" and "Bn" fields (e.g., textEn and textBn, optionsEn and optionsBn, explanationEn and explanationBn, titleEn and titleBn), you MUST write the EXACT identical \${lang === 'bn' ? 'Bangla' : 'English'} content in both the English ("En") and Bangla ("Bn") versions of these fields!
  - If generating in Bangla (lang === 'bn'): both 'titleEn' and 'titleBn' must contain the SAME Bangla title; both 'textEn' and 'textBn' must contain the SAME Bangla question; 'optionsEn' and 'optionsBn' must contain the SAME Bangla options list; and 'explanationEn' and 'explanationBn' must contain the SAME Bangla explanation text.
  - If generating in English (lang === 'en'): both 'titleEn' and 'titleBn' must contain the SAME English title; both 'textEn' and 'textBn' must contain the SAME English question; 'optionsEn' and 'optionsBn' must contain the SAME English options list; and 'explanationEn' and 'explanationBn' must contain the SAME English explanation text.
- Do NOT output both English and Bangla. Keep the language strictly consistent as requested.

VERY IMPORTANT SPECIAL INSTRUCTIONS FOR COPYING & EXTRACTION:
- The user has uploaded image worksheets containing multiple-choice questions (MCQs) and has provided a prompt asking to copy/extract some specific question numbers (for example: "Copy questions 8, 9, 20" or "Extract questions 1, 2, 3").
- If the user's prompt specifies certain question numbers to copy (either in English digits like "8, 9" or Bangla digits like "৮, ৯"):
  1. You MUST find and extract ONLY those specified questions from the uploaded images. Do NOT generate or include any other questions.
  2. You MUST copy/transcribe the question text and the 4 options exactly as they are written in the sheet, but translated/written strictly in \${lang === 'bn' ? 'Bangla' : 'English'}.
  3. CRITICAL: From the extracted question text, you MUST COMPLETELY STRIP/REMOVE any leading question numbers, periods, punctuation, or spaces (such as "৮.", "8.", "৯.", "9.", "২০.", "20।", "১১।", "11.").
     Examples:
     - If the text in the image is "৮. সমবাহু ত্রিভুজের বহিঃস্থ কোণের মান কত?", you MUST extract/translate it to "\${lang === 'bn' ? 'সমবাহু ত্রিভুজের বহিঃস্থ কোণের মান কত?' : 'What is the value of an exterior angle of an equilateral triangle?'}"
     - If the text in the image is "৯. ত্রিভুজের অন্তস্থ কোণ কয়টি?", you MUST extract/translate it to "\${lang === 'bn' ? 'ত্রিভুজের অন্তস্থ কোণ কয়টি?' : 'How many interior angles does a triangle have?'}"
  4. Write the exact transcribing in the chosen language (\${lang === 'bn' ? 'Bangla' : 'English'}) into BOTH the En and Bn fields.
  5. Calculate the correct answer based on math/science principles, and set "correctOption" to exactly 'A' (if (ক)), 'B' (if (খ)), 'C' (if (গ)), or 'D' (if (ঘ)).
  6. Generate detailed explanations in the chosen language (\${lang === 'bn' ? 'Bangla' : 'English'}) and write the SAME text in BOTH "explanationEn" and "explanationBn".

- If the user prompt does NOT specify any particular question numbers to extract:
  1. Generate exactly \${targetCount} high-quality, premier MCQ questions based on the prompt instructions and the image contexts.
  2. Write all values (title, text, options, explanation) strictly in \${lang === 'bn' ? 'Bangla' : 'English'} and duplicate them into both En and Bn key fields.
  3. Provide correctOption ('A', 'B', 'C', or 'D') and comprehensive explanations.

Generate the response in strict accordance with the requested JSON schema.
The user requested subject context: ClassId=\${classId || 'class-9'}, SubjectId=\${subjectId || 'science'}.
Detailed Prompt/User instruction: \${prompt || 'Create ' + targetCount + ' random questions.'}
`;

    parts.push({ text: generationInstruction });

    let response;
    let fallbackSuccess = false;
    let lastError: any = null;
    const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];

    // Small helper for delay
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    for (const modelName of modelsToTry) {
      if (fallbackSuccess) break;
      
      const maxAttempts = 3;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          console.log(`[AI Quiz Generation] Attempt ${attempt}/${maxAttempts} with model: ${modelName}`);
          response = await aiClient.models.generateContent({
            model: modelName,
            contents: { parts },
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  titleEn: { type: Type.STRING, description: "Bilingual engaging quiz title in English" },
                  titleBn: { type: Type.STRING, description: "Bilingual engaging quiz title in Bangla" },
                  questions: {
                    type: Type.ARRAY,
                    description: "Array of multiple choice questions extracted or generated based on the user request and instructions",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        textEn: { type: Type.STRING, description: "Question text in English" },
                        textBn: { type: Type.STRING, description: "Equivalent translated question text in Bangla" },
                        optionsEn: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                          description: "Exactly 4 options in English (representing A, B, C, D)"
                        },
                        optionsBn: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                          description: "Exactly 4 equivalent options in Bangla (representing A, B, C, D)"
                        },
                        correctOption: {
                          type: Type.STRING,
                          description: "The capital letter of the correct answer. Must be exactly 'A', 'B', 'C', or 'D'"
                        },
                        explanationEn: { type: Type.STRING, description: "A detailed description in English explaining why the chosen option is correct" },
                        explanationBn: { type: Type.STRING, description: "A detailed text description in Bangla explaining why the chosen option is correct" }
                      },
                      required: ["textEn", "textBn", "optionsEn", "optionsBn", "correctOption", "explanationEn", "explanationBn"]
                    }
                  }
                },
                required: ["titleEn", "titleBn", "questions"]
              }
            }
          });
          fallbackSuccess = true;
          console.log(`[AI Quiz Generation] Successfully generated content using model: ${modelName}`);
          break; // break out of attempt loop
        } catch (err: any) {
          const errMsg = err.message || "";
          const errStatus = err.status || "";
          const errCode = err.code || 0;
          console.warn(`[AI Quiz Generation] Error in Attempt ${attempt} for model ${modelName}:`, errMsg || err);
          lastError = err;
          
          if (attempt < maxAttempts) {
            const isTransient = errStatus === "UNAVAILABLE" || 
                              errCode === 503 || 
                              errCode === 429 ||
                              errMsg.includes("503") || 
                              errMsg.includes("high demand") || 
                              errMsg.includes("temporary") || 
                              errMsg.includes("UNAVAILABLE") || 
                              errMsg.includes("Limit") ||
                              errMsg.includes("ResourceExhausted");
            if (isTransient) {
              const backoffMs = attempt * 1500;
              console.log(`[AI Quiz Generation] Transient error detected. Retrying model ${modelName} after ${backoffMs}ms...`);
              await delay(backoffMs);
            } else {
              // Not a typical transient error, but do a quick recovery delay and retry
              await delay(500);
            }
          }
        }
      }
    }

    if (!fallbackSuccess || !response) {
      throw lastError || new Error("Failed to generate content using fallback models.");
    }

    const parsedData = JSON.parse(response.text.trim());
    res.json(parsedData);
  } catch (err: any) {
    console.error("Gemini Content Generation error:", err);
    res.status(500).json({
      errorEn: "Failed to generate AI quiz content. " + (err.message || ""),
      errorBn: "আই কুইজ তৈরি করতে ব্যর্থ হয়েছে। জেমিনি এপিআই রেসপন্স করতে পারেনি বা নেটওয়ার্ক সংযোগ বিচ্ছিন্ন।"
    });
  }
});


// Dev vs production Vite integration
async function bootServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`EXAMSHALL server booted on port ${PORT}`);
  });
}

bootServer();
