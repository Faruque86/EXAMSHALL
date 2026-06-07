/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { QuizAttempt, Quiz } from "../types";
import { api } from "../api";
import { localization } from "../localization";
import { 
  Award, CheckCircle2, XCircle, Printer, Mail, Compass, HelpCircle, 
  ArrowRight, FileText, Check, AlertCircle, Share2, Sparkles, RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ResultsDisplayProps {
  lang: "en" | "bn";
  attempt: QuizAttempt;
  quiz: Quiz;
  onExit: () => void;
  onViewResultSheet?: () => void;
}

export default function ResultsDisplay({ lang, attempt, quiz, onExit, onViewResultSheet }: ResultsDisplayProps) {
  const [emailAddress, setEmailAddress] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const t = localization[lang];

  // Pass threshold is 60%
  const isPassed = attempt.percentage >= 60;

  const handlePrintCertificate = () => {
    window.print();
  };

  const handleDispatchScorecard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailAddress.trim()) return;

    setSending(true);
    setStatusMsg(null);
    try {
      const response = await api.sendScorecardEmail(attempt.id, emailAddress);
      setStatusMsg({
        type: "success",
        text: lang === "en" ? response.messageEn : response.messageBn
      });
      setEmailAddress("");
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: lang === "en" ? "Failed to transmit scorecard email." : "ইমেইলে স্কোরকার্ড পাঠাতে সমস্যা হয়েছে।"
      });
    } finally {
      setSending(false);
    }
  };

  const formatSpentTime = (sec: number) => {
    const minutes = Math.floor(sec / 60);
    const seconds = sec % 60;
    if (lang === "en") {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${minutes} মিনিট ${seconds} সেকেন্ড`;
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8" id="results-display-container">
      {/* Decorative certificate printable page element */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-academic-certificate, #printable-academic-certificate * {
            visibility: visible;
          }
          #printable-academic-certificate {
            position: absolute;
            left: 0;
            top: 0;
            width: 100vw;
            height: 100vh;
            border: 10px double #4f46e5;
            padding: 40px;
            text-align: center;
          }
        }
      `}</style>

      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Upper Performance Card Centerpiece */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden relative"
          id="scorecard-evaluation-center"
        >
          {/* Accent banner matching pass status */}
          <div className={`h-3 ${isPassed ? "bg-emerald-500" : "bg-amber-500"}`}></div>

          <div className="p-8 sm:p-12 text-center space-y-6 relative">
            
            {/* Stamp badge */}
            <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center border-4 ${
              isPassed 
                ? "bg-emerald-50 border-emerald-500 text-emerald-600" 
                : "bg-amber-50 border-amber-500 text-amber-600"
            }`}>
              <Award className="w-10 h-10 animate-pulse" />
            </div>

            <div className="space-y-2">
              <span className={`inline-block py-1 px-3 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${
                isPassed ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
              }`}>
                {isPassed ? t.passed : t.failed}
              </span>
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight font-sans">
                {t.scoreReport}
              </h2>
              <p className="text-xs text-slate-500 leading-snug font-semibold select-none italic">
                {lang === "en" ? quiz.titleEn : quiz.titleBn}
              </p>
            </div>

            {/* Performance Indicators Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-md mx-auto pt-4 border-t border-b border-slate-150 py-6">
              <div>
                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">{t.yourScore}</p>
                <p className="text-2xl font-extrabold text-slate-700 font-sans mt-1">
                  {attempt.score} <span className="text-sm font-semibold text-slate-400">/ {attempt.totalQuestions}</span>
                </p>
              </div>
              <div>
                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">{t.accuracy}</p>
                <p className="text-2xl font-extrabold text-slate-700 font-sans mt-1">
                  {attempt.percentage}%
                </p>
              </div>
              <div>
                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">{t.timeSpent}</p>
                <p className="text-sm font-extrabold text-slate-700 font-sans mt-2">
                  {formatSpentTime(attempt.timeSpentSeconds)}
                </p>
              </div>
            </div>

            {/* Print Certificate and score dispatcher buttons */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-2">
              <button
                onClick={handlePrintCertificate}
                id="btn-print-pdf"
                className="w-full sm:w-auto py-2.5 px-5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transform hover:scale-[1.01] transition-all shadow-sm"
              >
                <Printer className="w-4 h-4 shrink-0" />
                {t.printCertificate}
              </button>

              <button
                onClick={() => setShowEmailForm(!showEmailForm)}
                id="btn-score-dispatch"
                className="w-full sm:w-auto py-2.5 px-5 border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 cursor-pointer bg-white transition-all shadow-xs"
              >
                <Mail className="w-4 h-4 shrink-0 text-slate-400" />
                {t.dispatchScorecard}
              </button>
            </div>

            {/* Email dispatch popup form drawer */}
            <AnimatePresence>
              {showEmailForm && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleDispatchScorecard}
                  className="bg-slate-50 border border-slate-100 p-4 rounded-2xl max-w-sm mx-auto space-y-3"
                  id="form-scorecard-dispatcher"
                >
                  <label className="block text-left text-[11px] font-bold text-slate-600" htmlFor="target-dispatch-email">
                    {lang === "en" ? "Recipient Email Address" : "প্রাপকের ইমেইল ঠিকানা"}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      id="target-dispatch-email"
                      required
                      className="flex-1 text-xs py-1.5 px-3 border border-slate-200 focus:border-indigo-500 rounded-lg outline-hidden bg-white text-slate-800 font-semibold"
                      placeholder="e.g., student@quiz.com"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                    />
                    <button
                      type="submit"
                      id="btn-confirm-dispatch"
                      disabled={sending}
                      className="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase rounded-lg cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {sending ? "..." : "Send"}
                    </button>
                  </div>

                  {statusMsg && (
                    <p className={`text-[11px] font-bold text-left leading-normal ${statusMsg.type === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>
                      {statusMsg.text}
                    </p>
                  )}
                </motion.form>
              )}
            </AnimatePresence>

          </div>
        </motion.div>


         {/* Invisible Print Certificate layout template targetable by CSS print rule */}
         <div id="printable-academic-certificate" className="hidden border-8 border-indigo-600 p-12 bg-white text-center space-y-6 max-w-4xl mx-auto rounded-3xl" style={{ fontFamily: "serif" }}>
            <div className="border border-slate-200 p-8 space-y-4">
              <h2 className="text-3xl font-bold uppercase tracking-widest text-indigo-900">Certificate of Completion / কৃতিত্বের শংসাপত্র</h2>
              <p className="text-xl text-slate-500 italic mt-2">This declares that / এটি প্রত্যয়ন করে যে</p>
              <h1 className="text-4xl font-extrabold tracking-wide text-slate-800 uppercase py-2 border-b border-indigo-100 w-fit mx-auto">{attempt.username}</h1>
              <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-medium">
                has successfully passed the educational assessment task / কৃতিত্বের সাথে পরীক্ষা সম্পন্ন করেছেন:<br/>
                <span className="font-extrabold text-indigo-700 italic">"{lang === 'en' ? quiz.titleEn : quiz.titleBn}"</span><br/>
                with a precision score accuracy of / এবং অর্জন করেছেন <span className="font-extrabold text-slate-800">{attempt.percentage}% accuracy</span>.
              </p>
              
              <div className="flex justify-between items-center max-w-lg mx-auto pt-10 text-slate-400 font-bold text-xs uppercase tracking-wider">
                <div>
                  <p className="border-t border-slate-300 pt-2 text-slate-600">Registrar Sign / সিগনেচার</p>
                  <p className="text-[10px] text-slate-400">EXAMSHALL PORTALLED DESK</p>
                </div>
                <div>
                  <p className="border-t border-slate-300 pt-2 text-slate-600">Completion Date / তারিখ</p>
                  <p className="text-[10px] text-slate-400 font-mono">{new Date(attempt.completedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
         </div>


        {/* Questionnaire Review list */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xl space-y-6" id="results-answers-review">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3">
            {t.reviewAnswers}
          </h3>

          <div className="space-y-6">
            {quiz.questions.map((q, idx) => {
              const attemptAnswer = attempt.answers[idx];
              const isCorrect = attemptAnswer === q.correctOption;
              const optionIndexMap: { [key: string]: number } = { A: 0, B: 1, C: 2, D: 3 };

              return (
                <div key={q.id} className="p-4 bg-slate-50 border border-slate-150 rounded-2xl text-xs space-y-3">
                  {/* Meta tag */}
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="font-extrabold text-slate-400">Question #{idx + 1}</span>
                    
                    {attemptAnswer === undefined ? (
                      <span className="bg-slate-200 text-slate-700 py-0.5 px-2 rounded-md font-bold uppercase text-[9px] tracking-wider">
                        {t.notAnswered}
                      </span>
                    ) : isCorrect ? (
                      <span className="bg-emerald-100 text-emerald-800 py-0.5 px-2 rounded-md font-bold uppercase text-[9px] tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        CORRECT ({attemptAnswer})
                      </span>
                    ) : (
                      <span className="bg-rose-100 text-rose-800 py-0.5 px-2 rounded-md font-bold uppercase text-[9px] tracking-wider flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        INCORRECT ({attemptAnswer})
                      </span>
                    )}
                  </div>

                  {/* Questionnaire strings */}
                  <div className="space-y-1">
                    <p className="font-bold text-slate-800">{q.textEn}</p>
                    {q.textBn !== q.textEn && (
                      <p className="text-[11px] text-slate-500 font-semibold italic">{q.textBn}</p>
                    )}
                  </div>

                  {/* List of option lines */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-semibold text-slate-700">
                    {["A", "B", "C", "D"].map((letter, oi) => {
                      const isOptionCorrect = q.correctOption === letter;
                      const isOptionSelected = attemptAnswer === letter;
                      
                      let optionBg = "bg-slate-50 border-slate-100";
                      if (isOptionCorrect) {
                        optionBg = "bg-emerald-50 border-emerald-250 text-emerald-800";
                      } else if (isOptionSelected) {
                        optionBg = "bg-rose-50 border-rose-250 text-rose-800";
                      }

                      const optionEn = q.optionsEn?.[oi];
                      const optionBn = q.optionsBn?.[oi];

                      return (
                        <div key={letter} className={`p-2 border rounded-xl flex items-center gap-2 ${optionBg}`}>
                          <span className="font-extrabold uppercase">{letter}:</span>
                          <div>
                            <span>{optionEn}</span>
                            {optionBn !== optionEn && (
                              <span className="text-slate-400 font-medium ml-1">/ {optionBn}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Academic rationale explanation block */}
                  <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl leading-relaxed text-[11px] text-slate-600 font-medium">
                    <span className="font-extrabold uppercase tracking-wide text-indigo-700 block mb-1">
                      {t.explanation}::
                    </span>
                    <p className="text-slate-800 font-semibold">{q.explanationEn}</p>
                    {q.explanationBn !== q.explanationEn && (
                      <p className="text-slate-500 italic mt-0.5">{q.explanationBn}</p>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* Back navigation buttons */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
          <button
            onClick={onExit}
            id="results-back-btn"
            className="w-full sm:w-auto py-3 px-6 bg-slate-150 hover:bg-slate-200 text-slate-700 font-bold border border-slate-250 rounded-xl text-xs uppercase cursor-pointer"
          >
            {t.backToDashboard}
          </button>
          
          {onViewResultSheet && (
            <button
              onClick={onViewResultSheet}
              id="results-sheet-btn"
              className="w-full sm:w-auto py-3 px-6 bg-indigo-600 hover:bg-slate-900 border border-indigo-600 text-white font-bold rounded-xl text-xs uppercase cursor-pointer flex items-center justify-center gap-1.5 transition-all shadow-sm"
            >
              <Award className="w-4 h-4 text-amber-300" />
              {lang === "en" ? "View Exam Result Sheet" : "পরীক্ষার ফলাফল পত্র (Result Sheet) দেখুন"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
