/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { LeaderboardEntry, QuizAttempt, Quiz } from "../types";
import { api } from "../api";
import { localization } from "../localization";
import { 
  Award, Medal, BookmarkCheck, Calendar, Activity, RefreshCw, 
  Filter, ClipboardList, Timer, CheckCircle2, User, Trophy, BookOpen, Layers
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LeaderboardProps {
  lang: "en" | "bn";
  userId: string;
  quizzes: Quiz[];
  onReviewAttempt: (attempt: QuizAttempt, quiz: Quiz) => void;
  initialSelectedQuizId?: string;
  onSelectQuizId?: (quizId: string) => void;
}

export default function Leaderboard({ 
  lang, 
  userId, 
  quizzes, 
  onReviewAttempt,
  initialSelectedQuizId,
  onSelectQuizId
}: LeaderboardProps) {
  // Main sub-navigation tab: "rankings" | "result-sheets" | "history"
  const [subTab, setSubTab] = useState<"rankings" | "result-sheets" | "history">(
    initialSelectedQuizId ? "result-sheets" : "rankings"
  );

  // Leaderboard filters
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");

  // Result sheet states
  const [selectedQuizId, setSelectedQuizId] = useState<string>(initialSelectedQuizId || "");
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [quizLoading, setQuizLoading] = useState<boolean>(false);

  // General leaderboard and user history
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [history, setHistory] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(false);

  const t = localization[lang];

  // Sync incoming initial selected quiz id
  useEffect(() => {
    if (initialSelectedQuizId) {
      setSubTab("result-sheets");
      setSelectedQuizId(initialSelectedQuizId);
    }
  }, [initialSelectedQuizId]);

  const handleSelectQuizId = (qId: string) => {
    setSelectedQuizId(qId);
    if (onSelectQuizId) {
      onSelectQuizId(qId);
    }
  };

  // Load rankings and history on filter changes or mounting
  useEffect(() => {
    fetchLeaderboardData();
  }, [userId, selectedClass, selectedSubject]);

  // Load specific quiz result sheet when a quiz gets selected
  useEffect(() => {
    if (selectedQuizId) {
      fetchQuizResultSheet(selectedQuizId);
    }
  }, [selectedQuizId]);

  const fetchLeaderboardData = async () => {
    setLoading(true);
    try {
      const bData = await api.fetchLeaderboard(
        selectedClass || undefined,
        selectedSubject || undefined
      );
      setBoard(bData);

      const hData = await api.fetchUserAttempts(userId);
      setHistory(hData);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizResultSheet = async (qId: string) => {
    setQuizLoading(true);
    try {
      const attempts = await api.fetchQuizAttempts(qId);
      setQuizAttempts(attempts);
    } catch (err) {
      console.error(err);
    } finally {
      setQuizLoading(false);
    }
  };

  const getRankBadgeClass = (index: number) => {
    if (index === 0) return "text-amber-500 bg-amber-50 border border-amber-100";
    if (index === 1) return "text-slate-400 bg-slate-50 border border-slate-100";
    if (index === 2) return "text-amber-700 bg-amber-50 border border-amber-100";
    return "text-slate-500 bg-slate-50 border border-slate-100";
  };

  const getMedalIcon = (index: number) => {
    if (index === 0) return <Medal className="w-5 h-5 text-amber-500 animate-bounce" />;
    if (index === 1) return <Medal className="w-5 h-5 text-slate-400" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-700" />;
    return <span className="font-bold text-xs">{index + 1}</span>;
  };

  const formatTime = (totalSeconds: number): string => {
    if (!totalSeconds || isNaN(totalSeconds)) return "N/A";
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.round(totalSeconds % 60);
    return lang === "en" ? `${mins}m ${secs}s` : `${mins}মি. ${secs}সে.`;
  };

  // Static translations lists for class & subjects
  const classes = [
    { id: "class-6", en: "Class 6", bn: "৬ষ্ঠ শ্রেণী" },
    { id: "class-7", en: "Class 7", bn: "৭ম শ্রেণী" },
    { id: "class-8", en: "Class 8", bn: "৮ম শ্রেণী" },
    { id: "class-9", en: "Class 9", bn: "৯ম শ্রেণী" },
    { id: "class-10", en: "Class 10", bn: "১০ম শ্রেণী text" }
  ];

  const subjects = [
    { id: "science", en: "General Science", bn: "বিজ্ঞান" },
    { id: "math", en: "Mathematics", bn: "গণিত" },
    { id: "english", en: "English Language", bn: "ইংরেজি" },
    { id: "ict", en: "ICT & Digital Tech", bn: "আইসিটি" },
    { id: "history", en: "History & culture", bn: "ইতিহাস ও সংস্কৃতি" }
  ];

  const getTranslation = (list: { id: string, en: string, bn: string }[], id: string, defaultText: string) => {
    const item = list.find((it) => it.id === id);
    if (!item) return defaultText;
    return lang === "en" ? item.en : item.bn;
  };

  // Computed metrics for result sheets
  const averageAccuracyQuiz = quizAttempts.length > 0 
    ? Math.round(quizAttempts.reduce((sum, current) => sum + current.percentage, 0) / quizAttempts.length)
    : 0;

  const highestScoreQuiz = quizAttempts.length > 0
    ? Math.max(...quizAttempts.map((a) => a.score))
    : 0;

  // Filter quizzes based on selected Class and Subject to make search easy inside result sheets
  const filteredQuizzes = quizzes.filter((q) => {
    if (selectedClass && q.classId !== selectedClass) return false;
    if (selectedSubject && q.subjectId !== selectedSubject) return false;
    return true;
  });

  return (
    <div className="bg-slate-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8" id="leaderboard-module-container">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Brand/Heading of leaderboard */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 shadow-xs border border-slate-100 rounded-3xl">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 text-white p-3 rounded-2xl shadow-sm">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 font-sans tracking-tight">
                {lang === "en" ? "Academic Merit & Result Office" : "মেধা তালিকা ও পরীক্ষার ফলাফল কেন্দ্র"}
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                {lang === "en" ? "Bilingual class and subject based rankings combined with live student result sheets." : "বাংলাদেশ শিক্ষাক্রম অনুযায়ী শ্রেণিভিত্তিক ও বিষয়ভিত্তিক মেধা তালিকা এবং ফলাফল পত্র।"}
              </p>
            </div>
          </div>
          
          {/* Subnavigation Pill Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/50 w-full md:w-auto overflow-x-auto shrink-0">
            <button
              onClick={() => setSubTab("rankings")}
              className={`flex-1 md:flex-none py-2 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                subTab === "rankings" 
                  ? "bg-white text-indigo-700 shadow-xs" 
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              <Award className="w-4 h-4 text-amber-500" />
              {lang === "en" ? "Rankings" : "মেধা তালিকা"}
            </button>
            <button
              onClick={() => {
                setSubTab("result-sheets");
                if (!selectedQuizId && filteredQuizzes.length > 0) {
                  setSelectedQuizId(filteredQuizzes[0].id);
                }
              }}
              className={`flex-1 md:flex-none py-2 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                subTab === "result-sheets" 
                  ? "bg-white text-indigo-700 shadow-xs" 
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              <ClipboardList className="w-4 h-4 text-emerald-500" />
              {lang === "en" ? "Result Sheets" : "ফলাফল পত্র (Result Sheets)"}
            </button>
            <button
              onClick={() => setSubTab("history")}
              className={`flex-1 md:flex-none py-2 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                subTab === "history" 
                  ? "bg-white text-indigo-700 shadow-xs" 
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              <Activity className="w-4 h-4 text-indigo-500" />
              {lang === "en" ? "My Records" : "আমার অগ্রগতি"}
            </button>
          </div>
        </div>

        {/* SUBTAB 1: CLASS AND SUBJECT-BASED RANKINGS */}
        {subTab === "rankings" && (
          <div className="space-y-6">
            {/* Filter Section Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <Filter className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-extrabold uppercase text-slate-500 font-mono">
                  {lang === "en" ? "Class & Subject Filter Filters" : "শ্রেণি ও বিষয় ফিল্টারিং ব্যবস্থা"}
                </span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                {/* Class selector */}
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 py-2 px-4 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none w-full sm:w-48 appearance-none cursor-pointer"
                >
                  <option value="">{lang === "en" ? "Select Grade Class (All)" : "সকল শ্রেণি (All Classes)"}</option>
                  {classes.map((cl) => (
                    <option key={cl.id} value={cl.id}>{lang === "en" ? cl.en : cl.bn}</option>
                  ))}
                </select>

                {/* Subject Selector */}
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 py-2 px-4 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none w-full sm:w-48 appearance-none cursor-pointer"
                >
                  <option value="">{lang === "en" ? "Select Subject Directory (All)" : "সকল বিষয় (All Subjects)"}</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>{lang === "en" ? sub.en : sub.bn}</option>
                  ))}
                </select>
              </div>
            </div>

            {loading && (
              <div className="flex items-center justify-center p-8 bg-white border border-slate-100 rounded-3xl shadow-sm">
                <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin mr-2" />
                <span className="text-xs font-bold text-slate-650">Refining rankings database...</span>
              </div>
            )}

            {!loading && (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-black uppercase text-slate-700 tracking-wider">
                      {lang === "en" ? "Class & Subject Base Merit Leaderboard" : "শ্রেণি ও বিষয়ভিত্তিক মেধা তালিকা"}
                    </span>
                  </div>
                  {/* Status Badges */}
                  <div className="flex gap-2">
                    {selectedClass && (
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-150 py-0.5 px-2.5 rounded-md font-bold uppercase">
                        {getTranslation(classes, selectedClass, "")}
                      </span>
                    )}
                    {selectedSubject && (
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-150 py-0.5 px-2.5 rounded-md font-bold uppercase">
                        {getTranslation(subjects, selectedSubject, "")}
                      </span>
                    )}
                    {!selectedClass && !selectedSubject && (
                      <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 py-0.5 px-2.5 rounded-md font-bold uppercase font-mono">
                        {lang === "en" ? "Global Board" : "সার্বজনীন তালিকা"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/70 text-slate-500 font-extrabold border-b border-slate-200 text-[10px] uppercase tracking-wider">
                        <th className="p-4 w-16">{lang === "en" ? "Rank" : "র‌্যাংক"}</th>
                        <th className="p-4">{lang === "en" ? "Student Account" : "শিক্ষার্থী"}</th>
                        <th className="p-4 text-center">{lang === "en" ? "Finished Exams" : "সম্পন্ন পরীক্ষা"}</th>
                        <th className="p-4 text-center">{lang === "en" ? "Average Accuracy" : "গড় নির্ভুলতা"}</th>
                        <th className="p-4 text-right pr-8">{lang === "en" ? "Talent Points" : "ট্যালেন্ট পয়েন্ট"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {board.map((entry, idx) => {
                        const isCurUser = entry.email.toLowerCase() === entry.email.toLowerCase(); // matches email
                        return (
                          <tr key={entry.email} className={`border-b border-slate-100 hover:bg-slate-50/50 ${isCurUser ? "bg-indigo-50/20" : ""}`}>
                            <td className="p-4">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${getRankBadgeClass(idx)}`}>
                                {getMedalIcon(idx)}
                              </div>
                            </td>
                            <td className="p-4">
                              <p className="font-extrabold text-slate-800 text-sm leading-snug">{entry.username}</p>
                              <p className="text-[10px] font-mono text-slate-400 font-medium">{entry.email}</p>
                            </td>
                            <td className="p-4 text-center text-slate-700 font-black text-sm">{entry.totalAttempts}</td>
                            <td className="p-4 text-center text-emerald-700 font-black text-sm">{entry.averageScorePercentage}%</td>
                            <td className="p-4 text-right pr-8 font-black text-indigo-700 tracking-tight text-sm font-sans">
                              {entry.points}
                            </td>
                          </tr>
                        );
                      })}

                      {board.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-12 text-center text-slate-400 font-semibold italic text-xs">
                            {lang === "en" ? "No scores posted under this selected path criteria." : "নির্বাচিত শ্রেণি বা বিষয়ে এখনও কোনো পরীক্ষা সম্পূর্ণ করা হয়নি।"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SUBTAB 2: EXAM SPECIFIC RESULT SHEETS */}
        {subTab === "result-sheets" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Quizzes Selector Panel */}
            <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-150">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-extrabold uppercase text-slate-800 font-sans">
                    {lang === "en" ? "Select Exam Subject" : "পরীক্ষা কেন্দ্র সিলেক্ট করুন"}
                  </span>
                </div>
                <span className="text-[9px] font-bold bg-slate-100 text-slate-500 py-0.5 px-2 rounded font-mono">
                  {filteredQuizzes.length} {lang === "en" ? "EXAMS" : "টি পরীক্ষা"}
                </span>
              </div>

              {/* Filtering Controls inside result sheets */}
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    handleSelectQuizId(""); // reset selected exam
                  }}
                  className="bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-700 py-2 px-2.5 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                >
                  <option value="">{lang === "en" ? "All Grades" : "সকল শ্রেণি"}</option>
                  {classes.map((cl) => (
                    <option key={cl.id} value={cl.id}>{lang === "en" ? cl.en.replace("Class ", "") : cl.bn.split(" ")[0]}</option>
                  ))}
                </select>

                <select
                  value={selectedSubject}
                  onChange={(e) => {
                    setSelectedSubject(e.target.value);
                    handleSelectQuizId(""); // reset selected exam
                  }}
                  className="bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-700 py-2 px-2.5 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                >
                  <option value="">{lang === "en" ? "All Subjects" : "সকল বিষয়"}</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>{lang === "en" ? sub.en : sub.bn}</option>
                  ))}
                </select>
              </div>

              {/* Scrollable list of quizzes */}
              <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                {filteredQuizzes.map((quiz) => {
                  const isSelected = selectedQuizId === quiz.id;
                  return (
                    <button
                      key={quiz.id}
                      onClick={() => handleSelectQuizId(quiz.id)}
                      className={`w-full p-4.5 rounded-2xl text-left border cursor-pointer transition-all flex flex-col gap-2 relative overflow-hidden group ${
                        isSelected 
                          ? "bg-slate-800 text-white border-slate-800 shadow-md" 
                          : "bg-slate-50 hover:bg-slate-100/50 border-slate-200/50"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className={`text-[9px] font-bold uppercase py-0.5 px-2 rounded-md ${
                          isSelected ? "bg-slate-700 text-slate-100" : "bg-white text-slate-500 border border-slate-200"
                        }`}>
                          {getTranslation(classes, quiz.classId, "")}
                        </span>
                        <span className={`text-[9px] font-bold uppercase py-0.5 px-2 rounded-md ${
                          isSelected ? "bg-slate-700 text-emerald-300" : "bg-emerald-50 text-emerald-700"
                        }`}>
                          {getTranslation(subjects, quiz.subjectId, "")}
                        </span>
                      </div>

                      <h4 className={`text-xs font-extrabold tracking-tight leading-tight line-clamp-2 ${
                        isSelected ? "text-white" : "text-slate-800 group-hover:text-indigo-600"
                      }`}>
                        {lang === "en" ? quiz.titleEn : quiz.titleBn}
                      </h4>

                      <div className={`text-[9px] font-mono flex items-center gap-2 pt-1.5 ${
                        isSelected ? "text-slate-400" : "text-slate-500"
                      }`}>
                        <span>{quiz.questions?.length || 0} Questions</span>
                        <span>•</span>
                        <span>{quiz.durationMinutes} mins</span>
                      </div>
                    </button>
                  );
                })}

                {filteredQuizzes.length === 0 && (
                  <p className="p-8 text-center text-slate-400 italic font-semibold text-xs border border-dashed border-slate-200 rounded-xl">
                    {lang === "en" ? "No quizzes found under filters." : "কোনো পরীক্ষা খুঁজে পাওয়া যায়নি।"}
                  </p>
                )}
              </div>
            </div>

            {/* Right Detailed Result Sheet Panel */}
            <div className="lg:col-span-8 space-y-6">
              {selectedQuizId ? (
                (() => {
                  const selectedQuizObj = quizzes.find((q) => q.id === selectedQuizId);
                  if (!selectedQuizObj) return null;

                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      {/* Top Header Card */}
                      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3 relative overflow-hidden">
                        <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-50 text-emerald-500/20 rounded-bl-full flex items-center justify-end p-2.5 font-bold text-xs">
                          SHEET
                        </div>

                        <div className="flex gap-2">
                          <span className="text-[10px] bg-indigo-50 border border-indigo-150 text-indigo-700 font-extrabold py-0.5 px-2.5 rounded-md uppercase">
                            {getTranslation(classes, selectedQuizObj.classId, "")}
                          </span>
                          <span className="text-[10px] bg-emerald-50 border border-emerald-150 text-emerald-700 font-extrabold py-0.5 px-2.5 rounded-md uppercase">
                            {getTranslation(subjects, selectedQuizObj.subjectId, "")}
                          </span>
                        </div>

                        <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-tight leading-snug">
                          {lang === "en" ? selectedQuizObj.titleEn : selectedQuizObj.titleBn}
                        </h3>

                        <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
                          {lang === "en" ? "Official Examination Result Sheets" : "অফিশিয়াল পরীক্ষার চূড়ান্ত খাতা পরিসংখ্যান পত্র"}
                        </p>
                      </div>

                      {/* Diagnostic metrics matrices */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-5 bg-white border border-slate-100 rounded-2xl flex items-center gap-3.5 shadow-xs">
                          <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{lang === "en" ? "Average Class Accuracy" : "গড় নির্ভুলতা হার"}</p>
                            <p className="text-xl font-extrabold text-slate-800 mt-1">{averageAccuracyQuiz}%</p>
                          </div>
                        </div>

                        <div className="p-5 bg-white border border-slate-100 rounded-2xl flex items-center gap-3.5 shadow-xs">
                          <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl">
                            <Layers className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{lang === "en" ? "Total Handed Scripts" : "মোট জমাকৃত খাতা"}</p>
                            <p className="text-xl font-extrabold text-slate-800 mt-1">{quizAttempts.length}</p>
                          </div>
                        </div>

                        <div className="p-5 bg-white border border-slate-100 rounded-2xl flex items-center gap-3.5 shadow-xs">
                          <div className="bg-amber-50 text-amber-600 p-2.5 rounded-xl">
                            <Award className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{lang === "en" ? "Record Peak Score" : "সর্বোচ্চ স্কোর রেকর্ড"}</p>
                            <p className="text-xl font-extrabold text-slate-800 mt-1">
                              {highestScoreQuiz} / {selectedQuizObj.questions?.length || 0}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Main Attempts List Worksheet */}
                      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                          <span className="text-xs font-black uppercase text-slate-700 tracking-wider">
                            {lang === "en" ? "Merit Order Result Sheet" : "মেরিট পজিশন ভিত্তিক ফলাফল শীট"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {lang === "en" ? "Sorted by highest correctness & speed" : "অধিক নির্ভুলতা এবং কম সময় অনুযায়ী সাজানো"}
                          </span>
                        </div>

                        {quizLoading ? (
                          <div className="flex items-center justify-center p-12">
                            <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin mr-2" />
                            <span className="text-xs font-bold text-slate-500">Unlocking exam metrics...</span>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-slate-50/70 text-slate-500 font-extrabold border-b border-slate-200 text-[10px] uppercase tracking-wider">
                                  <th className="p-4 w-16">{lang === "en" ? "Rank #" : "ক্রমিক"}</th>
                                  <th className="p-4">{lang === "en" ? "Student Details" : "শিক্ষার্থীর নাম ও ইমেইল"}</th>
                                  <th className="p-4 text-center">{lang === "en" ? "Accuracy %" : "সঠিক উত্তর / শতকরা হার"}</th>
                                  <th className="p-4 text-center">{lang === "en" ? "Duration Taken" : "ব্যয়িত সময়"}</th>
                                  <th className="p-4 text-center">{lang === "en" ? "Attempt Date" : "জমার তারিখ"}</th>
                                  <th className="p-4 text-right pr-6">{lang === "en" ? "Action" : "পর্যালোচনা"}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {quizAttempts.map((att, idx) => {
                                  const isSelf = att.userId === userId;
                                  return (
                                    <tr 
                                      key={att.id} 
                                      className={`border-b border-slate-100 hover:bg-slate-50/50 ${
                                        isSelf ? "bg-indigo-50/30 font-semibold border-l-4 border-l-indigo-600" : ""
                                      }`}
                                    >
                                      <td className="p-4">
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${getRankBadgeClass(idx)} font-bold text-xs`}>
                                          {idx + 1}
                                        </div>
                                      </td>
                                      <td className="p-4">
                                        <p className="font-extrabold text-slate-800 flex items-center gap-1.5 leading-snug">
                                          {att.username}
                                          {isSelf && (
                                            <span className="text-[8px] bg-indigo-100 text-indigo-700 py-0.2 px-1 text-[8px] rounded uppercase font-black uppercase font-mono tracking-tight">Me</span>
                                          )}
                                        </p>
                                        <p className="text-[10px] font-mono text-slate-400 font-medium">{att.email}</p>
                                      </td>
                                      <td className="p-4 text-center">
                                        <span className={`inline-block py-0.5 px-2 rounded-md font-mono font-black text-xs ${
                                          att.percentage >= 60 ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
                                        }`}>
                                          {att.score} / {att.totalQuestions} ({att.percentage}%)
                                        </span>
                                      </td>
                                      <td className="p-4 text-center font-mono font-bold text-slate-600 text-xs">
                                        {formatTime(att.timeSpentSeconds)}
                                      </td>
                                      <td className="p-4 text-center text-slate-400 text-[10px] font-mono">
                                        {new Date(att.completedAt).toLocaleDateString()}
                                      </td>
                                      <td className="p-4 text-right pr-6">
                                        <button
                                          onClick={() => onReviewAttempt(att, selectedQuizObj)}
                                          className="py-1 px-3 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-indigo-600 font-extrabold text-[10.5px] uppercase tracking-wide rounded-lg cursor-pointer transition-all"
                                        >
                                          {lang === "en" ? "Review" : "মূল্যায়ন"}
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}

                                {quizAttempts.length === 0 && (
                                  <tr>
                                    <td colSpan={6} className="p-12 text-center text-slate-405 font-semibold italic">
                                      {lang === "en" ? "No attempts submitted on this exam yet." : "এই পরীক্ষায় এখনও কেউ অংশগ্রহণ করেনি।"}
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })()
              ) : (
                <div className="h-full min-h-[350px] bg-white border border-dashed border-slate-250 rounded-3xl p-8 flex flex-col justify-center items-center text-center space-y-4">
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-full text-slate-400 shrink-0">
                    <ClipboardList className="w-10 h-10 text-slate-350" />
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-slate-700">
                      {lang === "en" ? "No Exam Selected" : "কোনো পরীক্ষা সিলেক্ট করা হয়নি"}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      {lang === "en" ? "Please select one exam from the left directories listing index to query its full diagnostic student merit result sheet." : "বামদিকের পরীক্ষার তালিকা থেকে যেকোনো একটি পরীক্ষা সিলেক্ট করে তার সম্পূর্ণ ক্লাস মেরিট ও ফলাফল পর্যালোচনা পত্র দেখুন।"}
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* SUBTAB 3: PERSONAL ATTEMPT HISTORY CARDS */}
        {subTab === "history" && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xl" id="leaderboard-history">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
              <div className="bg-indigo-50 p-2.5 rounded-xl border border-indigo-100">
                <Activity className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800 font-sans tracking-tight">
                  {lang === "en" ? "My Personal Assessment Record Sheet" : "আমার পরীক্ষার ব্যক্তিগত ফলাফল সূচী"}
                </h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Personal Exam History and Transcript</p>
              </div>
            </div>

            <div className="space-y-4">
              {history.map((att) => {
                const matchingQuiz = quizzes.find((q) => q.id === att.quizId);
                return (
                  <div key={att.id} className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <BookmarkCheck className="w-4 h-4 text-emerald-650 shrink-0" />
                        <h4 className="text-xs font-bold text-slate-800 leading-tight">
                          {lang === "en" ? att.quizTitleEn : att.quizTitleBn}
                        </h4>
                      </div>
                      
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-semibold text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(att.completedAt).toLocaleDateString()}
                        </span>
                        <span>Class: {(att.classId || "").toUpperCase().replace("-", " ")}</span>
                        <span>Subject: {(att.subjectId || "").toUpperCase()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-stretch sm:self-auto justify-between sm:justify-start pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                      <div className="text-right">
                        <span className={`inline-block py-0.5 px-2 rounded-md font-mono text-[10.5px] font-extrabold tracking-tight ${
                          att.percentage >= 60 ? "bg-emerald-150/10 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700"
                        }`}>
                          {att.score} / {att.totalQuestions} ({att.percentage}%)
                        </span>
                      </div>

                      {matchingQuiz && (
                        <button
                          onClick={() => onReviewAttempt(att, matchingQuiz)}
                          className="py-1.5 px-3 bg-white border border-slate-250 hover:border-slate-350 text-slate-700 text-[11px] tracking-wider uppercase font-extrabold rounded-lg cursor-pointer transform hover:scale-[1.01] transition-all"
                        >
                          {lang === "en" ? "Review" : "পর্যালোচনা"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {history.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400 font-semibold italic">
                  {t.noAttemptsYet}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
