/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Quiz, User, QuizAttempt } from "../types";
import { api } from "../api";
import { localization } from "../localization";
import { 
  Hourglass, CheckSquare, AlertTriangle, Play, ChevronRight, ChevronLeft, 
  HelpCircle, RefreshCw, LogOut, Lock, Clock, Sparkles, Send 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface QuizInterfaceProps {
  lang: "en" | "bn";
  quiz: Quiz;
  currentUser: User;
  onQuizCompleted: (attempt: QuizAttempt) => void;
  onExit: () => void;
}

export default function QuizInterface({ lang, quiz, currentUser, onQuizCompleted, onExit }: QuizInterfaceProps) {
  const [loading, setLoading] = useState(true);
  const [lockedOut, setLockedOut] = useState(false);
  const [lockRemaining, setLockRemaining] = useState(0);
  const [hasRequestedRetake, setHasRequestedRetake] = useState(false);

  const [activeSession, setActiveSession] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<{ [questionIndex: number]: string }>({});
  const [secondsLeft, setSecondsLeft] = useState(quiz.durationMinutes * 60);
  const [timeSpentSeconds, setTimeSpentSeconds] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<{ en: string; bn: string } | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lockTimerRef = useRef<NodeJS.Timeout | null>(null);
  const t = localization[lang];

  useEffect(() => {
    checkAntiCheatLockout();
    return () => {
      clearTimers();
    };
  }, [quiz.id]);

  const clearTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (lockTimerRef.current) clearInterval(lockTimerRef.current);
  };

  const checkAntiCheatLockout = async () => {
    setLoading(true);
    setErrorText(null);
    try {
      const lockObj = await api.checkLockStatus(currentUser.id, quiz.id);
      if (lockObj.locked) {
        setLockedOut(true);
        setLockRemaining(lockObj.remainingSeconds);
        setHasRequestedRetake(lockObj.hasRequested);
        startLockTimer(lockObj.remainingSeconds);
      } else {
        setLockedOut(false);
        setLockRemaining(0);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startLockTimer = (initialSeconds: number) => {
    if (lockTimerRef.current) clearInterval(lockTimerRef.current);
    let rem = initialSeconds;
    lockTimerRef.current = setInterval(() => {
      rem -= 1;
      if (rem <= 0) {
        clearInterval(lockTimerRef.current!);
        setLockedOut(false);
        setLockRemaining(0);
      } else {
        setLockRemaining(rem);
      }
    }, 1000);
  };

  const startActiveExamSession = () => {
    setActiveSession(true);
    setAnswers({});
    setSecondsLeft(quiz.durationMinutes * 60);
    setTimeSpentSeconds(0);
    setCurrentIdx(0);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          submitExamScriptSilently();
          return 0;
        }
        setTimeSpentSeconds((ts) => ts + 1);
        return prev - 1;
      });
    }, 1000);
  };

  const selectOption = (optCode: "A" | "B" | "C" | "D") => {
    setAnswers({ ...answers, [currentIdx]: optCode });
  };

  const handleNext = () => {
    if (currentIdx < quiz.questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    }
  };

  const submitExamScriptSilently = async () => {
    setSubmitting(true);
    clearTimers();
    try {
      const attempt = await api.submitAttempt(
        currentUser.id,
        currentUser.name,
        currentUser.email,
        quiz.id,
        answers,
        timeSpentSeconds
      );
      onQuizCompleted(attempt);
    } catch (err: any) {
      console.error(err);
      setErrorText({
        en: err.errorEn || "Draft submission failed.",
        bn: err.errorBn || "পরীক্ষার খাতা জমা দেওয়া যায়নি।"
      });
    } finally {
      setSubmitting(false);
      setShowConfirmModal(false);
    }
  };

  const triggerRetakeRequest = async () => {
    setLoading(true);
    try {
      await api.requestRetake(currentUser.id, currentUser.name, currentUser.email, quiz.id);
      setHasRequestedRetake(true);
      alert(lang === "en" ? "Retake lockout request submitted to admin desk." : "পুনরায় পরীক্ষা দেওয়ার লক ছাড়পত্র আবেদন প্রশাসকের কাছে পাঠানো হয়েছে।");
    } catch (err: any) {
      alert(lang === "en" ? "Clearence request failed." : "ছাড়পত্র পাঠাতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  const headingTitle = lang === "en" ? quiz.titleEn : quiz.titleBn;

  // Format lock duration remaining string e.g. "11h 24m 5s"
  const formatLockPeriod = (sec: number) => {
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = sec % 60;
    if (lang === "en") {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else {
      return `${hours} ঘণ্টা ${minutes} মিনিট ${seconds} সেকেন্ড`;
    }
  };

  // Format countdown text e.g. "04:59"
  const formatCountdown = (rem: number) => {
    const minutes = Math.floor(rem / 60);
    const seconds = rem % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  return (
    <div className="bg-slate-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8" id="quiz-portal-container">
      <div className="max-w-3xl mx-auto">
        
        {/* Entrance Pre-flight checklist check */}
        <AnimatePresence mode="wait">
          
          {loading ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white p-12 rounded-3xl border border-slate-100 text-center shadow-lg space-y-4"
              id="quiz-portal-loader"
            >
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-700">
                {lang === "en" ? "Securing assessment parameters..." : "পরীক্ষার পোর্টাল প্রস্তুত করা হচ্ছে..."}
              </p>
            </motion.div>
          ) : lockedOut ? (
            
            // Lockout Block View
            <motion.div
              key="lockout"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-8 sm:p-12 rounded-3xl border border-rose-100 shadow-xl text-center space-y-6"
              id="quiz-lockout-banner"
            >
              <div className="mx-auto w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center border border-red-100 mb-2">
                <Lock className="w-8 h-8 animate-bounce" />
              </div>

              <div className="space-y-4 max-w-lg mx-auto">
                <h3 className="text-xl font-extrabold text-slate-800 tracking-tight font-sans">
                  {lang === "en" ? "Exam Lockout Engaged" : "পরীক্ষা লকআউট সক্রিয়"}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  {t.retakeLockMessage}
                </p>

                {/* Live timer remaining */}
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center gap-3 w-fit mx-auto mt-2 select-none">
                  <Clock className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-extrabold text-red-700 font-mono">
                    {formatLockPeriod(lockRemaining)}
                  </span>
                </div>
              </div>

              {/* Clearance action panel */}
              <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row justify-center items-center gap-3">
                {hasRequestedRetake ? (
                  <div className="py-2.5 px-5 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold uppercase rounded-lg flex items-center gap-2">
                    <Hourglass className="w-4 h-4 text-amber-500 animate-spin" />
                    {t.retakeRequested}
                  </div>
                ) : (
                  <button
                    onClick={triggerRetakeRequest}
                    id="btn-request-retake"
                    className="py-2.5 px-5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg cursor-pointer transform hover:scale-[1.01] transition-all"
                  >
                    {t.requestRetakeNow}
                  </button>
                )}
                
                <button
                  onClick={onExit}
                  id="btn-exit-lockout"
                  className="py-2.5 px-5 border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-slate-50 cursor-pointer transition-all"
                >
                  {t.backToDashboard}
                </button>
              </div>
            </motion.div>
          ) : !activeSession ? (
            
            // Quiz Prestart Screen
            <motion.div
              key="prestart"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-100 shadow-xl overflow-hidden relative"
              id="quiz-portal-lobby"
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-indigo-600"></div>
              
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-bold tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md uppercase">
                    {(quiz.classId || "").toUpperCase().replace("-", " ")} :: {(quiz.subjectId || "").toUpperCase()}
                  </span>
                  <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight font-sans mt-3">
                    {headingTitle}
                  </h3>
                </div>

                {/* Parameters badges */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase">{t.duration}</p>
                    <p className="text-lg font-extrabold text-slate-700 font-sans mt-1">
                      {quiz.durationMinutes} {lang === "en" ? "Minutes" : "মিনিট"}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase">{t.questionsCount}</p>
                    <p className="text-lg font-extrabold text-slate-700 font-sans mt-1">
                      {quiz.questions?.length || 0} {lang === "en" ? "MCQs" : "এমসিকিউ প্রশ্ন"}
                    </p>
                  </div>
                </div>

                {/* Instructions banner */}
                <div className="bg-slate-100/60 p-4 rounded-2xl text-xs text-slate-500 leading-relaxed font-semibold border border-slate-200/50 flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-slate-700">{lang === "en" ? "Notice on Academic Integrity" : "একাডেমিক সততা নোটিশ"}</h5>
                    <p className="mt-0.5">
                      {lang === "en" 
                        ? "Active anticontrol lock is active. Swapping tabs, windows, or requesting clearances locks your exam history. Retakes require administrative approvals." 
                        : "পরীক্ষাদানের সময় জানালা বা ট্যাব পরিবর্তন নিষিদ্ধ। কুইজ সাবমিট করার পর আগামী ১২ ঘণ্টার জন্য পোর্টাল লক হয়ে যাবে।"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-4">
                  <button
                    onClick={startActiveExamSession}
                    id="btn-lobby-start"
                    className="flex-1 py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transform hover:scale-[1.01] transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    {t.startQuiz}
                  </button>
                  <button
                    onClick={onExit}
                    id="btn-lobby-exit"
                    className="py-3 px-6 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl cursor-pointer transition-all uppercase text-xs font-bold"
                  >
                    {t.backToDashboard}
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            
            // ACTIVE STUDY EXAM TAKING FLOW ACTIVE
            <motion.div
              key="active-exam"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
              id="quiz-active-exam-lobby"
            >
              
              {/* Header Clock Dashboard Block */}
              <div className="bg-slate-800 text-white p-4 rounded-2xl shadow-md border border-slate-700/50 flex justify-between items-center gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="bg-indigo-600/20 p-2 rounded-lg border border-indigo-500/20">
                    <Sparkles className="w-5 h-5 text-indigo-400 animate-spin" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-300 font-mono">EXAMSHALL SYSTEM</h4>
                    <p className="text-sm font-bold text-slate-100 line-clamp-1">{headingTitle}</p>
                  </div>
                </div>

                {/* Fixed Countdown block */}
                <div className="py-2 px-4 bg-indigo-600 font-mono text-base font-extrabold rounded-xl flex items-center gap-2 border border-indigo-400/30 select-none shadow-sm">
                  <Hourglass className="w-4 h-4 animate-spin shrink-0" />
                  <span>{formatCountdown(secondsLeft)}</span>
                </div>
              </div>

              {/* Progress Indicator grid bubble list */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-wrap gap-2 justify-center items-center">
                {quiz.questions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIdx(i)}
                    id={`active-q-trigger-${i}`}
                    className={`w-9 h-9 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center border ${
                      currentIdx === i
                        ? "bg-slate-800 text-white border-slate-800 shadow-md"
                        : answers[i] !== undefined
                          ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                          : "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              {/* Active question layout card display */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xl space-y-6 relative">
                
                {/* Meta details tag */}
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400">
                  <span>Question Index: {currentIdx + 1} / {quiz.questions.length}</span>
                  <span className="text-indigo-600">Accuracy weight 1.0</span>
                </div>

                {/* Substantive texts */}
                <div className="space-y-2">
                  <h4 className="text-lg font-bold text-slate-800 leading-snug">
                    {quiz.questions[currentIdx].textEn}
                  </h4>
                  {quiz.questions[currentIdx].textBn !== quiz.questions[currentIdx].textEn && (
                    <p className="text-sm font-semibold text-slate-500 italic">
                      {quiz.questions[currentIdx].textBn}
                    </p>
                  )}
                </div>

                {/* Option checkboxes Touch buttons list */}
                <div className="space-y-3">
                  {[
                    { key: "A", idx: 0 },
                    { key: "B", idx: 1 },
                    { key: "C", idx: 2 },
                    { key: "D", idx: 3 }
                  ].map((item) => {
                    const optionEn = quiz.questions[currentIdx].optionsEn?.[item.idx] || "";
                    const optionBn = quiz.questions[currentIdx].optionsBn?.[item.idx] || "";
                    const isSelected = answers[currentIdx] === item.key;
                    
                    return (
                      <button
                        key={item.key}
                        id={`opt-btn-${currentIdx}-${item.key}`}
                        onClick={() => selectOption(item.key as any)}
                        className={`w-full p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center gap-4 ${
                          isSelected
                            ? "bg-indigo-50/80 border-indigo-600 text-indigo-900 shadow-sm"
                            : "bg-slate-50 hover:bg-slate-100/60 border-slate-100 hover:border-slate-200 text-slate-700"
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-lg text-xs font-extrabold flex items-center justify-center shrink-0 ${
                          isSelected ? "bg-indigo-600 text-white" : "bg-slate-250 border border-slate-300 text-slate-500"
                        }`}>
                          {item.key}
                        </div>
                        
                        <div className="text-sm">
                          <p className="font-bold">{optionEn}</p>
                          {optionBn !== optionEn && (
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">{optionBn}</p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Multi direction sliders pagination */}
                <div className="flex gap-4 border-t border-slate-100 pt-6">
                  <button
                    onClick={handlePrev}
                    id="btn-exam-prev"
                    disabled={currentIdx === 0}
                    className="flex-1 py-2 px-4 shadow-sm hover:bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-all disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4 inline mr-1" />
                    Previous
                  </button>
                  
                  {currentIdx < quiz.questions.length - 1 ? (
                    <button
                      onClick={handleNext}
                      id="btn-exam-next"
                      className="flex-1 py-2 px-4 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-all"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 inline ml-1" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowConfirmModal(true)}
                      id="btn-exam-submit-dialog"
                      className="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {t.submitQuiz}
                    </button>
                  )}
                </div>

              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Global Verification confirm modal popup dialog */}
        <AnimatePresence>
          {showConfirmModal && (
            <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4" id="confirm-submit-modal">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 max-w-md w-full shadow-2xl text-center space-y-4"
              >
                <div className="mx-auto w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center border border-amber-100">
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-lg font-bold text-slate-800 tracking-tight font-sans">
                    {t.confirmSubmitTitle}
                  </h4>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                    {t.confirmSubmitDesc}
                  </p>
                </div>

                {errorText && (
                  <div className="p-3 bg-red-50 text-[11px] text-red-700 font-bold uppercase leading-normal">
                    {lang === "en" ? errorText.en : errorText.bn}
                  </div>
                )}

                <div className="flex gap-2.5 pt-4">
                  <button
                    onClick={submitExamScriptSilently}
                    id="btn-modal-confirm"
                    disabled={submitting}
                    className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? "..." : t.confirm}
                  </button>
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    id="btn-modal-cancel"
                    disabled={submitting}
                    className="flex-1 py-2.5 px-4 bg-slate-100 border border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-slate-200 cursor-pointer"
                  >
                    {t.cancel}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
