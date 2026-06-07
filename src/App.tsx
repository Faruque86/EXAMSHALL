/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { User, Quiz, QuizAttempt } from "./types";
import { api } from "./api";
import { localization } from "./localization";
import AuthScreen from "./components/AuthScreen";
import AdminPanel from "./components/AdminPanel";
import QuizInterface from "./components/QuizInterface";
import ResultsDisplay from "./components/ResultsDisplay";
import Leaderboard from "./components/Leaderboard";
import { 
  Compass, LogOut, Globe, User as UserIcon, ShieldAlert, BookOpen, 
  ChevronRight, Folder, FolderOpen, RefreshCw, Trophy, ClipboardList, HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type MainTab = "dashboard" | "leaderboard" | "profile" | "admin";

export default function App() {
  const [lang, setLang] = useState<"en" | "bn">("en");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<MainTab>("dashboard");

  // Catalog Hierarchy States
  const [activeClassId, setActiveClassId] = useState<Quiz["classId"] | null>(null);
  const [activeSubjectId, setActiveSubjectId] = useState<Quiz["subjectId"] | null>(null);
  
  // Quizzes and active flows
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [activeAttemptRef, setActiveAttemptRef] = useState<QuizAttempt | null>(null);
  const [reviewQuiz, setReviewQuiz] = useState<Quiz | null>(null);
  const [selectedLeaderboardQuizId, setSelectedLeaderboardQuizId] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [userAttempts, setUserAttempts] = useState<QuizAttempt[]>([]);

  const t = localization[lang];

  useEffect(() => {
    // Restore locale or user credentials session if already on client
    const savedLang = localStorage.getItem("examshall_locale");
    if (savedLang === "en" || savedLang === "bn") {
      setLang(savedLang);
    }

    const savedUser = localStorage.getItem("examshall_credentials");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
      } catch (err) {
        console.error(err);
      }
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchGlobalQuizzes();
      fetchProfileHistory();
    }
  }, [currentUser]);

  const fetchGlobalQuizzes = async () => {
    setLoading(true);
    try {
      const all = await api.fetchQuizzes();
      setQuizzes(all);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfileHistory = async () => {
    if (!currentUser) return;
    try {
      const history = await api.fetchUserAttempts(currentUser.id);
      setUserAttempts(history);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLanguageToggle = () => {
    const nextLang = lang === "en" ? "bn" : "en";
    setLang(nextLang);
    localStorage.setItem("examshall_locale", nextLang);
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem("examshall_credentials", JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("examshall_credentials");
    setActiveTab("dashboard");
    setActiveClassId(null);
    setActiveSubjectId(null);
    setActiveQuiz(null);
    setActiveAttemptRef(null);
    setReviewQuiz(null);
  };

  const startQuizSession = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setActiveAttemptRef(null);
    setReviewQuiz(null);
  };

  const handleQuizCompleted = async (attempt: QuizAttempt) => {
    setActiveAttemptRef(attempt);
    setActiveQuiz(null);
    setReviewQuiz(null);
    fetchProfileHistory();
  };

  const handleReviewAttempt = (attempt: QuizAttempt, quiz: Quiz) => {
    setActiveAttemptRef(attempt);
    setReviewQuiz(quiz);
    setActiveQuiz(null);
  };

  // Exit QuizTaking/Results Screen
  const handleExitToDashboard = () => {
    setActiveQuiz(null);
    setActiveAttemptRef(null);
    setReviewQuiz(null);
    fetchProfileHistory();
    fetchGlobalQuizzes();
    setActiveTab("dashboard");
  };

  // Directories and subject taxonomy maps
  const classesList: { id: Quiz["classId"]; labelEn: string; labelBn: string }[] = [
    { id: "class-6", labelEn: "Class 6", labelBn: t.class6 },
    { id: "class-7", labelEn: "Class 7", labelBn: t.class7 },
    { id: "class-8", labelEn: "Class 8", labelBn: t.class8 },
    { id: "class-9", labelEn: "Class 9", labelBn: t.class9 },
    { id: "class-10", labelEn: "Class 10", labelBn: t.class10 }
  ];

  const subjectsList: { id: Quiz["subjectId"]; labelEn: string; labelBn: string; color: string }[] = [
    { id: "science", labelEn: "General Science", labelBn: t.subjectScience, color: "from-emerald-500 to-teal-600" },
    { id: "math", labelEn: "Mathematics", labelBn: t.subjectMath, color: "from-blue-500 to-indigo-600" },
    { id: "english", labelEn: "English Language", labelBn: t.subjectEnglish, color: "from-purple-500 to-indigo-700" },
    { id: "ict", labelEn: "ICT & Digital Tech", labelBn: t.subjectIct, color: "from-amber-500 to-orange-600" },
    { id: "history", labelEn: "History & Culture", labelBn: t.subjectHistory, color: "from-rose-500 to-pink-600" }
  ];

  // Filter quizzes by active folder path
  const filteredQuizzes = quizzes.filter(
    (q) => q.isPublished && q.classId === activeClassId && q.subjectId === activeSubjectId
  );

  // Computed dashboard counts
  const totalSubmissions = userAttempts.length;
  const passedSubmissions = userAttempts.filter((a) => a.percentage >= 60).length;
  const avgAccuracy = totalSubmissions > 0 
    ? Math.round(userAttempts.reduce((sum, a) => sum + a.percentage, 0) / totalSubmissions) 
    : 0;

  // Unauthenticated routing
  if (!currentUser) {
    return <AuthScreen lang={lang} onAuthSuccess={handleAuthSuccess} onLanguageToggle={handleLanguageToggle} />;
  }

  // Multi screens overlays for Active taking or score reviewing
  if (activeQuiz) {
    return (
      <QuizInterface
        lang={lang}
        quiz={activeQuiz}
        currentUser={currentUser}
        onQuizCompleted={handleQuizCompleted}
        onExit={handleExitToDashboard}
      />
    );
  }

  if (activeAttemptRef) {
    const matchingQuiz = reviewQuiz || quizzes.find((q) => q.id === activeAttemptRef.quizId);
    if (matchingQuiz) {
      return (
        <ResultsDisplay
          lang={lang}
          attempt={activeAttemptRef}
          quiz={matchingQuiz}
          onExit={handleExitToDashboard}
          onViewResultSheet={() => {
            setSelectedLeaderboardQuizId(activeAttemptRef.quizId);
            setActiveQuiz(null);
            setActiveAttemptRef(null);
            setReviewQuiz(null);
            fetchProfileHistory();
            fetchGlobalQuizzes();
            setActiveTab("leaderboard");
          }}
        />
      );
    }
  }

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col justify-between" id="app-portal-wrapper">
      
      {/* GLOBAL NAVIGATION HEADER */}
      <header className="bg-white border-b border-slate-100 shadow-xs sticky top-0 z-30" id="main-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Left Brand Slogan Logo */}
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-md cursor-pointer flex items-center justify-center" onClick={() => setActiveTab("dashboard")}>
                <Compass className="w-5 h-5 animate-spin" style={{ animationDuration: "12s" }} />
              </div>
              <div>
                <h1 className="font-sans font-black tracking-tight text-xl text-slate-800 uppercase flex items-center gap-1">
                  EXAMSHALL
                </h1>
                <p className="text-[9px] text-slate-400 font-bold tracking-wider font-mono">
                  {lang === "en" ? "BILINGUAL STANDARD ASSESSMENT" : "দ্বিভাষিক জাতীয় পরীক্ষা সংকলন"}
                </p>
              </div>
            </div>

            {/* Middle Nav Switches */}
            <nav className="hidden md:flex gap-1" id="desktop-routing">
              {[
                { id: "dashboard", label: t.dashboard },
                { id: "leaderboard", label: t.leaderboard },
                { id: "profile", label: t.profile },
                ...(currentUser.role === "admin" ? [{ id: "admin", label: t.adminConsole }] : [])
              ].map((sw) => (
                <button
                  key={sw.id}
                  id={`main-nav-btn-${sw.id}`}
                  onClick={() => { setActiveTab(sw.id as any); setReviewQuiz(null); setActiveAttemptRef(null); }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
                    activeTab === sw.id 
                      ? "bg-slate-800 text-white shadow-sm" 
                      : "text-slate-600 hover:text-slate-800 hover:bg-slate-50/80"
                  }`}
                >
                  {sw.label}
                </button>
              ))}
            </nav>

            {/* Right details button toggles list */}
            <div className="flex items-center gap-3">
              
              {/* Bilingual locale switch */}
              <button
                onClick={handleLanguageToggle}
                id="header-lang-toggle"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-sans text-xs font-bold text-slate-700 cursor-pointer shadow-xs uppercase tracking-wide"
              >
                <Globe className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                {t.languageToggle}
              </button>

              <div className="h-8 w-[1px] bg-slate-200 hidden sm:block"></div>

              {/* Profile display badge */}
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                  <UserIcon className="w-4 h-4 text-slate-500" />
                </div>
                <div className="text-left text-xs font-semibold">
                  <p className="text-slate-800 max-w-[8rem] truncate">{currentUser.name}</p>
                  <span className="text-[9px] text-indigo-600 font-extrabold uppercase font-mono tracking-wider">
                    {currentUser.role === "admin" ? t.adminBadge : (currentUser.isGuest ? t.guestBadge : "STUDENT")}
                  </span>
                </div>
              </div>

              {/* Log out channel */}
              <button
                onClick={handleLogout}
                id="header-logout-btn"
                className="p-1.5 sm:p-2 bg-red-50 text-red-500 border border-red-100 rounded-xl hover:bg-red-100 cursor-pointer transition-all"
                title={t.logout}
              >
                <LogOut className="w-4 h-4" />
              </button>

            </div>
          </div>
        </div>

        {/* Mobile Submenu Navigation Switch */}
        <div className="md:hidden flex border-t border-slate-100 bg-slate-50 p-1 justify-around" id="mobile-routing">
          {[
            { id: "dashboard", label: t.dashboard },
            { id: "leaderboard", label: t.leaderboard },
            { id: "profile", label: t.profile },
            ...(currentUser.role === "admin" ? [{ id: "admin", label: t.adminConsole }] : [])
          ].map((sw) => (
            <button
              key={sw.id}
              onClick={() => { setActiveTab(sw.id as any); setReviewQuiz(null); setActiveAttemptRef(null); }}
              className={`flex-1 text-center py-2 text-[10px] uppercase font-extrabold tracking-wider ${
                activeTab === sw.id ? "text-indigo-600 font-black border-b-2 border-indigo-600" : "text-slate-500"
              }`}
            >
              {sw.label}
            </button>
          ))}
        </div>

      </header>


      {/* MAIN SCREEN DISPATCH PANEL */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          
          {/* 1. ACADEMIC CATALOG DIRECTORIES DASHBOARD */}
          {activeTab === "dashboard" && (
            <motion.div
              key="view-dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8"
              id="dashboard-root"
            >
              
              {/* Central banner welcome greeting */}
              <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 opacity-95"></div>
                
                <div className="relative z-10 flex items-center gap-3.5">
                  <div className="bg-indigo-500/10 border border-indigo-400/20 p-3 rounded-2xl shrink-0">
                    <BookOpen className="w-7 h-7 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black font-sans tracking-tight">
                      {t.welcomeBack}, {currentUser.name}!
                    </h2>
                    <p className="text-xs text-slate-300 mt-1 uppercase font-semibold font-mono tracking-wider">
                      {lang === "en" ? "Select your targeted academic directory class folder below to explore and complete multiple-choice quiz questions" : "কুইজে অংশ নিতে নিচে আপনার একাডেমিক ক্লাসের ফোল্ডার নির্বাচন করুন"}
                    </p>
                  </div>
                </div>

                <div className="relative z-10 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 py-1.5 px-3.5 rounded-xl font-sans text-xs font-extrabold uppercase font-mono tracking-wide">
                  Grade Catalog Map
                </div>
              </div>


              {/* organized Folder Taxonomy Classes Grid */}
              <div className="space-y-4">
                <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1.5 select-none font-mono">
                  <Folder className="w-4 h-4 text-slate-400 shrink-0" />
                  {t.allClasses}
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {classesList.map((cl) => {
                    const isSelected = activeClassId === cl.id;
                    return (
                      <button
                        key={cl.id}
                        id={`class-trigger-${cl.id}`}
                        onClick={() => {
                          setActiveClassId(isSelected ? null : cl.id);
                          setActiveSubjectId(null);
                        }}
                        className={`p-5 rounded-2xl text-left border-2 cursor-pointer transition-all flex flex-col justify-between h-32 select-none relative overflow-hidden group ${
                          isSelected 
                            ? "bg-indigo-600/50 border-indigo-600 shadow-md" 
                            : "bg-white hover:bg-slate-50 border-slate-100 hover:border-slate-200"
                        }`}
                      >
                        {/* Upper icon folder indicators */}
                        {isSelected ? (
                          <FolderOpen className="w-8 h-8 text-indigo-800 shrink-0" />
                        ) : (
                          <Folder className="w-8 h-8 text-indigo-500 group-hover:scale-105 transition-transform shrink-0" />
                        )}

                        <div className="mt-4">
                          <p className={`text-base font-extrabold tracking-tight leading-tight ${isSelected ? "text-slate-800" : "text-slate-700"}`}>
                            {cl.labelEn}
                          </p>
                          <p className={`text-[11px] font-bold ${isSelected ? "text-slate-700" : "text-slate-500"} line-clamp-1`}>
                            {cl.labelBn}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>


              {/* Organized Subject taxonomy directories */}
              {activeClassId && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 pt-2"
                  id="dashboard-subjects-pane"
                >
                  <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1.5 select-none font-mono">
                    <FolderOpen className="w-4 h-4 text-slate-400 shrink-0" />
                    {t.chooseSubject} :: {(activeClassId || "").toUpperCase().replace("-", " ")}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {subjectsList.map((sub) => {
                      const isSelected = activeSubjectId === sub.id;
                      return (
                        <button
                          key={sub.id}
                          id={`subj-trigger-${sub.id}`}
                          onClick={() => setActiveSubjectId(isSelected ? null : sub.id)}
                          className={`p-4 rounded-xl text-left border-2 cursor-pointer transition-all relative overflow-hidden ${
                            isSelected
                              ? "bg-slate-800 text-white border-slate-800 shadow-lg"
                              : "bg-white hover:bg-slate-50 border-slate-100 hover:border-slate-250 text-slate-700"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm font-bold tracking-tight">{sub.labelEn}</p>
                              <p className="text-[10px] font-semibold text-slate-500 italic leading-snug line-clamp-1 mt-0.5">{sub.labelBn}</p>
                            </div>
                            <ChevronRight className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isSelected ? "rotate-90 text-white" : ""}`} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}


              {/* Quizzes matching taxonomies filter list */}
              {activeClassId && activeSubjectId && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4 pt-4"
                  id="dashboard-quizzes-pane"
                >
                  <div className="flex border-b border-slate-150 pb-2 justify-between items-center">
                    <h3 className="text-xs font-extrabold uppercase text-slate-500 tracking-wide font-mono">
                      Published Exam Lists
                    </h3>
                    <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-mono font-bold">
                      {filteredQuizzes.length} AVAILABLE
                    </span>
                  </div>

                  {filteredQuizzes.length === 0 ? (
                    <div className="p-12 text-center text-xs text-slate-400 bg-white border border-slate-100 rounded-3xl font-semibold">
                      {t.noQuizzesAvailable}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredQuizzes.map((quiz) => (
                        <div
                          key={quiz.id}
                          className="bg-white p-6 rounded-2xl border border-slate-250/50 hover:border-indigo-600 transition-all flex flex-col justify-between gap-5 relative group"
                          id={`card-quiz-${quiz.id}`}
                        >
                          <div className="space-y-2">
                            <span className="inline-block px-2.5 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold uppercase rounded-md font-mono">
                              {quiz.questions?.length || 0} Questions
                            </span>
                            <h4 className="text-base font-extrabold text-slate-800 tracking-tight group-hover:text-indigo-600 leading-tight">
                              {lang === "en" ? quiz.titleEn : quiz.titleBn}
                            </h4>
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                            <span className="text-xs font-bold text-slate-500 font-mono">
                              Duration: {quiz.durationMinutes} mins
                            </span>
                            <button
                              onClick={() => startQuizSession(quiz)}
                              id={`quiz-lobby-trigger-${quiz.id}`}
                              className="py-1.5 px-4 bg-indigo-600 hover:bg-slate-800 text-white text-xs font-bold uppercase rounded-lg cursor-pointer transition-all shadow-xs"
                            >
                              Explore Quiz
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

            </motion.div>
          )}

          {/* 2. STATS LEADERBOARD */}
          {activeTab === "leaderboard" && (
            <motion.div
              key="view-leaderboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Leaderboard 
                lang={lang} 
                userId={currentUser.id} 
                quizzes={quizzes} 
                onReviewAttempt={handleReviewAttempt} 
                initialSelectedQuizId={selectedLeaderboardQuizId}
                onSelectQuizId={setSelectedLeaderboardQuizId}
              />
            </motion.div>
          )}

          {/* 3. PROFILE DASHBOARD STATE */}
          {activeTab === "profile" && (
            <motion.div
              key="view-profile"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6"
              id="profile-root"
            >
              {/* Profile welcome container details */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-lg flex flex-col sm:flex-row items-center gap-6">
                <div className="w-20 h-20 bg-indigo-50 border-4 border-indigo-100 rounded-full flex items-center justify-center shrink-0">
                  <UserIcon className="w-10 h-10 text-indigo-600" />
                </div>
                <div className="space-y-1.5 text-center sm:text-left">
                  <h3 className="text-xl font-extrabold text-slate-800 tracking-tight font-sans">
                    {currentUser.name}
                  </h3>
                  <p className="text-xs font-mono text-slate-400">{currentUser.email}</p>
                  <div className="flex gap-2 justify-center sm:justify-start">
                    <span className="py-0.5 px-2 bg-indigo-50 text-indigo-700 text-[9px] font-extrabold tracking-wider uppercase rounded">
                      Role Level: {currentUser.role}
                    </span>
                    {currentUser.isGuest && (
                      <span className="py-0.5 px-2 bg-amber-50 text-amber-700 text-[9px] font-extrabold tracking-wider uppercase rounded">
                        GUEST MODULE
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats overview matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-6 bg-indigo-50/50 border border-indigo-100/30 rounded-2xl text-center">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Total Attempted</p>
                  <p className="text-3xl font-extrabold text-slate-800 font-sans mt-2">{totalSubmissions}</p>
                </div>
                <div className="p-6 bg-emerald-50/50 border border-emerald-100/30 rounded-2xl text-center">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Passed Evaluations</p>
                  <p className="text-3xl font-extrabold text-emerald-800 font-sans mt-2">{passedSubmissions}</p>
                </div>
                <div className="p-6 bg-slate-50 border border-slate-200/50 rounded-2xl text-center">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Average Accuracy</p>
                  <p className="text-3xl font-extrabold text-slate-800 font-sans mt-2">{avgAccuracy}%</p>
                </div>
              </div>

              {/* History checklist ledger */}
              <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-xs">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-4 font-mono select-none">
                  Individual Assessment Records
                </h4>

                <div className="space-y-3">
                  {userAttempts.map((att) => {
                    const matchedQuiz = quizzes.find((q) => q.id === att.quizId);
                    return (
                      <div key={att.id} className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-slate-800">{lang === "en" ? att.quizTitleEn : att.quizTitleBn}</p>
                          <span className="text-[9px] text-slate-400 font-mono italic">Handed in: {new Date(att.completedAt).toLocaleString()}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`py-0.5 px-2 font-mono font-bold text-[10px] rounded-md ${
                            att.percentage >= 60 ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
                          }`}>
                            {att.score} / {att.totalQuestions} ({att.percentage}%)
                          </span>

                          {matchedQuiz && (
                            <button
                              onClick={() => handleReviewAttempt(att, matchedQuiz)}
                              id={`profile-review-btn-${att.id}`}
                              className="py-1 px-2.5 border border-slate-200 hover:border-indigo-600 bg-white text-slate-600 hover:text-indigo-600 rounded-md font-bold text-[10px] uppercase cursor-pointer"
                            >
                              Review Key
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {userAttempts.length === 0 && (
                    <p className="p-10 text-center text-xs text-slate-400 font-bold italic">
                      {t.noAttemptsYet}
                    </p>
                  )}
                </div>
              </div>

            </motion.div>
          )}

          {/* 4. ADMIN PANEL PLATFORM LEVEL */}
          {activeTab === "admin" && currentUser.role === "admin" && (
            <motion.div
              key="view-admin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AdminPanel lang={lang} currentUser={currentUser} />
            </motion.div>
          )}

        </AnimatePresence>
      </main>


      {/* GLOBAL FOOTER BRAND SLATE */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-6 px-4" id="main-footer">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono select-none">
          <div>
            <p className="font-bold text-slate-100 tracking-wide font-sans">EXAMSHALL BILINGUAL PORTAL</p>
            <p className="text-[10px] text-slate-500 mt-1">© 2026 Academic Evaluation Frameworks. All rights reserved.</p>
          </div>
          <div className="flex gap-4">
            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wide">SYSTEM OK</span>
            <span className="text-slate-600 font-bold px-2 py-0.5 border border-slate-800 bg-slate-950 rounded-lg">UTC 2026</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
