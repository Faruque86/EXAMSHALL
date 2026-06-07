/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Quiz, Question, RetakeRequest, SystemStats, User } from "../types";
import { api } from "../api";
import { localization } from "../localization";
import { 
  BarChart2, BookOpen, Plus, Trash, Edit3, HelpCircle, Save, FileSpreadsheet, 
  Sparkles, ShieldCheck, CheckCircle2, AlertCircle, FileUp, Sparkle, RefreshCw, Users, ShieldAlert,
  PlusCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AdminPanelProps {
  lang: "en" | "bn";
  currentUser: User;
}

type ActiveTab = "stats" | "editor" | "csv" | "ai" | "retakes" | "users";

export default function AdminPanel({ lang, currentUser }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("stats");
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [retakeRequests, setRetakeRequests] = useState<RetakeRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<{ en: string; bn: string } | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);

  // Quiz Editor Form Fields
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [quizForm, setQuizForm] = useState<Partial<Quiz>>({
    titleEn: "",
    titleBn: "",
    classId: "class-9",
    subjectId: "science",
    durationMinutes: 10,
    isPublished: true,
    questions: []
  });
  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
    textEn: "",
    textBn: "",
    optionsEn: ["", "", "", ""],
    optionsBn: ["", "", "", ""],
    correctOption: "A",
    explanationEn: "",
    explanationBn: ""
  });
  const [editQuestionIndex, setEditQuestionIndex] = useState<number | null>(null);

  // CSV Bulk Importer States
  const [csvText, setCsvText] = useState("");
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [csvQuizTitleEn, setCsvQuizTitleEn] = useState("");
  const [csvQuizTitleBn, setCsvQuizTitleBn] = useState("");
  const [csvClassId, setCsvClassId] = useState<Quiz["classId"]>("class-9");
  const [csvSubjectId, setCsvSubjectId] = useState<Quiz["subjectId"]>("science");
  const [csvDuration, setCsvDuration] = useState(10);

  // AI Generator States
  interface UploadedImage {
    base64: string;
    mime: string;
    fileName: string;
  }
  const [aiImages, setAiImages] = useState<UploadedImage[]>([]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiClassId, setAiClassId] = useState<Quiz["classId"]>("class-9");
  const [aiSubjectId, setAiSubjectId] = useState<Quiz["subjectId"]>("science");
  const [aiImageBase64, setAiImageBase64] = useState<string>("");
  const [aiImageMime, setAiImageMime] = useState<string>("");
  const [aiPreviewData, setAiPreviewData] = useState<Partial<Quiz> | null>(null);
  
  // Custom configurations for AI generator
  const [aiQuestionCount, setAiQuestionCount] = useState<number>(5);
  const [aiAccumulate, setAiAccumulate] = useState<boolean>(false);
  const [selectedQuizToAppendId, setSelectedQuizToAppendId] = useState<string>("");
  const [quizIdPendingDelete, setQuizIdPendingDelete] = useState<string | null>(null);

  const t = localization[lang];

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const fetchAdminData = async () => {
    setLoading(true);
    setApiError(null);
    try {
      if (activeTab === "stats" || activeTab === "editor") {
        const statsData = await api.fetchStats();
        setStats(statsData);
      }
      if (activeTab === "editor" || activeTab === "csv" || activeTab === "ai") {
        const allQuizzes = await api.fetchQuizzes();
        setQuizzes(allQuizzes);
      }
      if (activeTab === "retakes") {
        const reqs = await api.fetchPendingRetakes();
        setRetakeRequests(reqs);
      }
      if (activeTab === "users") {
        const allUsers = await api.fetchUsers();
        setUsers(allUsers);
      }
    } catch (err: any) {
      console.error(err);
      setApiError({
        en: err.errorEn || "Failed to retrieve administrative records.",
        bn: err.errorBn || "প্রশাসনিক ফাইল লোড করতে ব্যর্থ হয়েছে।"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearNotifications = () => {
    setApiError(null);
    setApiSuccess(null);
  };

  // Quiz Editor Functions
  const handleAddNewQuestion = () => {
    const textEn = currentQuestion.textEn ? currentQuestion.textEn.trim() : "";
    const textBn = currentQuestion.textBn ? currentQuestion.textBn.trim() : "";

    const finalTextEn = textEn || textBn;
    const finalTextBn = textBn || textEn;

    if (!finalTextEn) {
      alert(lang === "en" ? "Question text must be filled." : "প্রশ্নের বিষয়বস্তু পূরণ করা আবশ্যক।");
      return;
    }

    const safeOptionsEn = currentQuestion.optionsEn?.map((o, idx) => {
      const enVal = o ? o.trim() : "";
      const bnVal = currentQuestion.optionsBn?.[idx] ? currentQuestion.optionsBn[idx].trim() : "";
      return enVal || bnVal;
    }) || [];

    const safeOptionsBn = currentQuestion.optionsBn?.map((o, idx) => {
      const bnVal = o ? o.trim() : "";
      const enVal = currentQuestion.optionsEn?.[idx] ? currentQuestion.optionsEn[idx].trim() : "";
      return bnVal || enVal;
    }) || [];

    if (safeOptionsEn.length < 4 || safeOptionsBn.length < 4 || safeOptionsEn.some(s => !s) || safeOptionsBn.some(b => !b)) {
      alert(lang === "en" ? "All four options are required." : "৪টি অপশন পূরণ করা আবশ্যক।");
      return;
    }

    const expEn = currentQuestion.explanationEn ? currentQuestion.explanationEn.trim() : "";
    const expBn = currentQuestion.explanationBn ? currentQuestion.explanationBn.trim() : "";

    const questionToSave: Question = {
      id: currentQuestion.id || "q-" + Math.random().toString(36).substr(2, 9),
      textEn: finalTextEn,
      textBn: finalTextBn,
      optionsEn: safeOptionsEn,
      optionsBn: safeOptionsBn,
      correctOption: currentQuestion.correctOption as any,
      explanationEn: expEn || expBn || "",
      explanationBn: expBn || expEn || ""
    };

    const updatedQuestions = [...(quizForm.questions || [])];
    if (editQuestionIndex !== null) {
      updatedQuestions[editQuestionIndex] = questionToSave;
      setEditQuestionIndex(null);
    } else {
      updatedQuestions.push(questionToSave);
    }

    setQuizForm({ ...quizForm, questions: updatedQuestions });
    // Reset question form
    setCurrentQuestion({
      textEn: "",
      textBn: "",
      optionsEn: ["", "", "", ""],
      optionsBn: ["", "", "", ""],
      correctOption: "A",
      explanationEn: "",
      explanationBn: ""
    });
  };

  const editQuestionFromList = (index: number) => {
    const q = (quizForm.questions || [])[index];
    setCurrentQuestion({ ...q });
    setEditQuestionIndex(index);
  };

  const removeQuestionFromList = (index: number) => {
    const updatedQuestions = (quizForm.questions || []).filter((_, i) => i !== index);
    setQuizForm({ ...quizForm, questions: updatedQuestions });
  };

  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    const titleEn = quizForm.titleEn ? quizForm.titleEn.trim() : "";
    const titleBn = quizForm.titleBn ? quizForm.titleBn.trim() : "";

    const finalTitleEn = titleEn || titleBn;
    const finalTitleBn = titleBn || titleEn;

    if (!finalTitleEn || !quizForm.questions || quizForm.questions.length === 0) {
      setApiError({
        en: "Please ensure quiz title and at least one question exists.",
        bn: "কুইজের শিরোনাম এবং অন্তত একটি প্রশ্ন প্রদান করা আবশ্যক।"
      });
      return;
    }

    setLoading(true);
    setApiError(null);
    try {
      const finalForm = {
        ...quizForm,
        titleEn: finalTitleEn,
        titleBn: finalTitleBn
      };
      if (selectedQuiz) {
        await api.updateQuiz(selectedQuiz.id, finalForm);
        setApiSuccess(lang === "en" ? "Quiz updated successfully." : "কুইজের উপাদানসমূহ সফলভাবে পরিমার্জিত হয়েছে।");
      } else {
        await api.createQuiz({
          ...finalForm,
          createdBy: currentUser.name
        });
        setApiSuccess(lang === "en" ? "Quiz created and published." : "নতুন কুইজ তৈরি ও প্রকাশ করা হয়েছে।");
      }

      setQuizForm({
        titleEn: "",
        titleBn: "",
        classId: "class-9",
        subjectId: "science",
        durationMinutes: 10,
        isPublished: true,
        questions: []
      });
      setSelectedQuiz(null);
      fetchAdminData();
    } catch (err: any) {
      console.error(err);
      setApiError({
        en: err.errorEn || "Failed to commit quiz changes.",
        bn: err.errorBn || "কুইজ ডাটাবেজে সংরক্ষণ করতে সমস্যা হয়েছে।"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEditQuiz = (q: Quiz) => {
    setSelectedQuiz(q);
    setQuizForm({ ...q });
    setErrorMsgForQuestion(null);
  };

  const handleDeleteQuiz = async (id: string) => {
    setLoading(true);
    try {
      await api.deleteQuiz(id);
      setApiSuccess(lang === "en" ? "Quiz purged." : "কুইজটি মুছে ফেলা হয়েছে।");
      fetchAdminData();
    } catch (err: any) {
      setApiError({
        en: err.errorEn || "Purge unsuccessful.",
        bn: err.errorBn || "কুইজটি মুছে ফেলা যায়নি।"
      });
    } finally {
      setLoading(false);
    }
  };

  const getClassLabel = (classId: string) => {
    const key = (classId || "").replace("-", "");
    return (t as any)[key] || classId;
  };

  const getSubjectName = (subjId: string) => {
    switch (subjId) {
      case "science": return t.subjectScience;
      case "math": return t.subjectMath;
      case "english": return t.subjectEnglish;
      case "ict": return t.subjectIct;
      case "history": return t.subjectHistory;
      default: return subjId;
    }
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    setLoading(true);
    try {
      await api.updateQuiz(id, { isPublished: !currentStatus });
      setApiSuccess(lang === "en" ? "Quiz publish state updated." : "কুইজের স্ট্যাটাস পরিবর্তন করা হয়েছে।");
      fetchAdminData();
    } catch (err: any) {
      setApiError({
        en: err.message || "Failed to update publish state.",
        bn: err.message_bn || "কুইজ স্ট্যাটাস পরিবর্তন করা যায়নি।"
      });
    } finally {
      setLoading(false);
    }
  };

  // CSV Bulk Parser
  const [errorMsgForQuestion, setErrorMsgForQuestion] = useState<string | null>(null);

  const handleParseCsv = () => {
    setErrorMsgForQuestion(null);
    if (!csvText.trim()) return;

    try {
      const rows = csvText.split("\n").filter(r => r.trim() !== "");
      const parsedQuestions: any[] = [];

      rows.forEach((row, i) => {
        // Handle comma splitting with double quotes grouping safely
        const matches = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || row.split(",");
        const cleanParts = matches.map(part => part.replace(/^"|"$/g, "").trim());

        if (cleanParts.length < 6) return; // incomplete row

        const [question, optA, optB, optC, optD, correct, explanation] = cleanParts;

        if (!question || !optA || !optB || !optC || !optD || !correct) return;

        let formattedCorrect: 'A' | 'B' | 'C' | 'D' = "A";
        const trimmedC = correct.toUpperCase().trim();
        if (["A", "B", "C", "D"].includes(trimmedC)) {
          formattedCorrect = trimmedC as any;
        }

        parsedQuestions.push({
          id: `csv-${i}-${Date.now()}`,
          textEn: question,
          textBn: question, // fallback En to Bn as default
          optionsEn: [optA, optB, optC, optD],
          optionsBn: [optA, optB, optC, optD],
          correctOption: formattedCorrect,
          explanationEn: explanation || "",
          explanationBn: explanation || ""
        });
      });

      if (parsedQuestions.length === 0) {
        throw new Error("No clean rows parsed. Verify column separation.");
      }

      setCsvPreview(parsedQuestions);
      setApiSuccess(lang === "en" ? `Parsed ${parsedQuestions.length} questions successfully. Review preview grid.` : `${parsedQuestions.length}টি প্রশ্ন পার্স করা হয়েছে। কুইজ পাবলিশ বাটনে ক্লিক করুন।`);
    } catch (err: any) {
      setErrorMsgForQuestion(err.message || "CSV parse fault.");
    }
  };

  const handlePublishCsvQuiz = async () => {
    const titleEn = csvQuizTitleEn ? csvQuizTitleEn.trim() : "";
    const titleBn = csvQuizTitleBn ? csvQuizTitleBn.trim() : "";

    const finalTitleEn = titleEn || titleBn;
    const finalTitleBn = titleBn || titleEn;

    if (!finalTitleEn || csvPreview.length === 0) {
      alert(lang === "en" ? "Title and validated csv questions are key." : "কুইজের শিরোনাম এবং পার্সড প্রশ্নপত্র প্রদান বাধ্যতামূলক।");
      return;
    }

    setLoading(true);
    setApiError(null);
    try {
      await api.createQuiz({
        titleEn: finalTitleEn,
        titleBn: finalTitleBn,
        classId: csvClassId,
        subjectId: csvSubjectId,
        durationMinutes: Number(csvDuration) || 10,
        isPublished: true,
        questions: csvPreview
      });

      setApiSuccess(lang === "en" ? "CSV Quiz Cataloged and Published." : "সিএসভি কুইজ ডাটাবেজে অন্তর্ভুক্ত ও সচল করা হয়েছে।");
      setCsvText("");
      setCsvPreview([]);
      setCsvQuizTitleEn("");
      setCsvQuizTitleBn("");
      fetchAdminData();
    } catch (err: any) {
      setApiError({
        en: err.errorEn || "Publish failed.",
        bn: err.errorBn || "প্রকাশ করতে সমস্যা হয়েছে।"
      });
    } finally {
      setLoading(false);
    }
  };

  // Image upload handler OCR base64 with support for multiple images up to 8
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (aiImages.length + files.length > 8) {
      alert(lang === "en" ? "You can upload up to 8 images maximum." : "আপনি সর্বোচ্চ ৮টি ছবি আপলোড করতে পারবেন।");
      return;
    }

    const loadedImages: UploadedImage[] = [];
    let processed = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) {
        alert(lang === "en" ? `File '${file.name}' is not a valid image.` : `'${file.name}' ফাইলটি কোনো ছবি নয়।`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        loadedImages.push({
          base64,
          mime: file.type,
          fileName: file.name
        });

        processed++;
        if (processed === files.length) {
          setAiImages((prev) => [...prev, ...loadedImages]);
          setApiSuccess(lang === "en" ? `${files.length} images added to upload list.` : `${files.length}টি ছবি আপলোড তালিকায় যুক্ত করা হয়েছে।`);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAiImage = (indexToRemove: number) => {
    setAiImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setApiSuccess(lang === "en" ? "Image removed." : "ছবিটি সরানো হয়েছে।");
  };

  const handleAiQuizGeneration = async () => {
    if (!aiPrompt.trim() && aiImages.length === 0) {
      alert(lang === "en" ? "Type instructions or upload worksheets/images." : "প্রম্পট লিখুন অথবা অন্তত একটি ছবি আপলোড করুন।");
      return;
    }

    setLoading(true);
    setApiError(null);
    if (!aiAccumulate) {
      setAiPreviewData(null);
    }
    try {
      const payloadImages = aiImages.map(img => ({ base64: img.base64, mime: img.mime }));
      const generatedQuiz = await api.aiGenerateQuiz(
        aiPrompt,
        aiClassId,
        aiSubjectId,
        undefined,
        undefined,
        payloadImages,
        lang,
        aiQuestionCount
      );
      
      if (aiAccumulate && aiPreviewData && aiPreviewData.questions) {
        const mergedQuestions = [...aiPreviewData.questions, ...(generatedQuiz.questions || [])];
        setAiPreviewData({
          ...generatedQuiz,
          questions: mergedQuestions
        });
      } else {
        setAiPreviewData(generatedQuiz);
      }
      setApiSuccess(lang === "en" ? "Questions successfully generated." : "প্রশ্নপত্র সফলভাবে তৈরি করা হয়েছে।");
    } catch (err: any) {
      console.error(err);
      setApiError({
        en: err.errorEn || "AI Synthesis disrupted.",
        bn: err.errorBn || "এআই মডিউল প্রশ্নপত্র তৈরি করতে পারেনি।"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyAiGeneratedQuiz = async () => {
    if (!aiPreviewData || !aiPreviewData.questions || aiPreviewData.questions.length === 0) return;
    setLoading(true);
    try {
      await api.createQuiz({
        titleEn: aiPreviewData.titleEn || "Gemini AI Synthesis",
        titleBn: aiPreviewData.titleBn || "জেমিনি এআই কুইজ",
        classId: aiClassId,
        subjectId: aiSubjectId,
        durationMinutes: 10,
        isPublished: true,
        questions: aiPreviewData.questions as any[]
      });
      setApiSuccess(lang === "en" ? "AI generated quiz published live!" : "এআই দ্বারা নির্মিত কুইজটি সফলভাবে পোর্টালে প্রকাশ করা হয়েছে!");
      setAiPreviewData(null);
      setAiPrompt("");
      setAiImageBase64("");
      setAiImages([]);
      fetchAdminData();
    } catch (err: any) {
      setApiError({
        en: err.errorEn || "Failed to finalize generated AI quiz.",
        bn: err.errorBn || "এআই কুইজ পোর্টালে প্রকাশ করতে সমস্যা হয়েছে।"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAppendToExistingQuiz = async () => {
    if (!selectedQuizToAppendId) {
      alert(lang === "en" ? "Please select a target quiz first." : "প্রথমে অনুগ্রহ করে একটি কুইজ নির্বাচন করুন।");
      return;
    }
    if (!aiPreviewData || !aiPreviewData.questions || aiPreviewData.questions.length === 0) return;
    
    setLoading(true);
    try {
      const existingQuiz = quizzes.find(q => q.id === selectedQuizToAppendId);
      if (!existingQuiz) {
        alert(lang === "en" ? "Selected quiz not found." : "নির্বাচিত কুইজটি পাওয়া যায়নি।");
        return;
      }
      const updatedQuestions = [...(existingQuiz.questions || []), ...aiPreviewData.questions];
      await api.updateQuiz(existingQuiz.id, {
        questions: updatedQuestions
      });
      setApiSuccess(
        lang === "en"
          ? `Successfully appended ${aiPreviewData.questions.length} questions to '${existingQuiz.titleEn}'`
          : `'${existingQuiz.titleBn}' কুইজে সফলভাবে আরও ${aiPreviewData.questions.length}টি প্রশ্ন যুক্ত করা হয়েছে!`
      );
      setAiPreviewData(null);
      setAiPrompt("");
      setAiImages([]);
      setSelectedQuizToAppendId("");
      fetchAdminData();
    } catch (err: any) {
      setApiError({
        en: err.messageEn || "Failed to append questions to selected quiz.",
        bn: err.messageBn || "নির্বাচিত কুইজে প্রশ্নসমূহ যুক্ত করতে ব্যর্থ হয়েছে।"
      });
    } finally {
      setLoading(false);
    }
  };

  // Lock clearances approving
  const handleRetakeLockClearance = async (requestId: string, outcome: "approved" | "rejected") => {
    setLoading(true);
    try {
      await api.approveRetake(requestId, outcome);
      setApiSuccess(lang === "en" ? `Retake lock request ${outcome}.` : `পরীক্ষার রিটেক আবেদন ${outcome === 'approved' ? 'অনুমোদন' : 'প্রত্যাখ্যান'} করা হয়েছে।`);
      fetchAdminData();
    } catch (err: any) {
      setApiError({
        en: err.errorEn || "Approval state failed.",
        bn: err.errorBn || "অনুমোদন ফাইল প্রসেস করা সম্ভব হয়নি।"
      });
    } finally {
      setLoading(false);
    }
  };

  // Promotions engine update user role
  const handleUserRoleUpdate = async (userId: string, newRole: "admin" | "student") => {
    setLoading(true);
    try {
      await api.updateUserRole(userId, newRole);
      setApiSuccess(lang === "en" ? "User privileges set successfully." : "ব্যবহারকারীর অধিকার সফলভাবে পরিবর্তন করা হয়েছে।");
      fetchAdminData();
    } catch (err: any) {
      setApiError({
        en: err.errorEn || "Failed to update privileges.",
        bn: err.errorBn || "অধিকার আপডেট করা যায়নি।"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-6 px-4 sm:px-6 lg:px-8" id="admin-panel-container">
      <div className="max-w-7xl mx-auto">
        
        {/* Admin Header Title */}
        <div className="bg-slate-800 text-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-700/50 mb-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900/60 opacity-90"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-500/25 p-3 rounded-xl border border-indigo-400/20">
                <ShieldCheck className="w-8 h-8 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold font-sans tracking-tight">{t.adminPanelTitle}</h2>
                <p className="text-xs text-slate-300 font-mono mt-0.5 tracking-wider uppercase">
                  {lang === "en" ? "Live Administrative Operation Deck" : "লাইভ প্রশাসনিক কন্ট্রোল ডেক"} -- {currentUser.name}
                </p>
              </div>
            </div>
            
            {/* Action quick status tags */}
            <div className="text-[10px] font-mono bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5 self-start md:self-center">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              PORTAL ENG_BN ACTIVE
            </div>
          </div>
        </div>

        {/* Global Notifications Alert Handler */}
        {(apiError || apiSuccess) && (
          <div className="my-4 space-y-2">
            {apiError && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex justify-between items-start" id="api-error-alert">
                <div className="flex gap-2.5">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-red-800">{lang === "en" ? "Operation Exception" : "প্রক্রিয়া জটিলতা"}</h5>
                    <p className="text-sm font-semibold text-red-700">{lang === "en" ? apiError.en : apiError.bn}</p>
                  </div>
                </div>
                <button onClick={handleClearNotifications} className="text-slate-400 hover:text-slate-600 font-sans text-xs font-bold uppercase cursor-pointer">dismiss</button>
              </div>
            )}
            {apiSuccess && (
              <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-xl flex justify-between items-start" id="api-success-alert">
                <div className="flex gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-emerald-800">{lang === "en" ? "Operation Success" : "প্রক্রিয়া সফল"}</h5>
                    <p className="text-sm font-semibold text-emerald-700">{apiSuccess}</p>
                  </div>
                </div>
                <button onClick={handleClearNotifications} className="text-slate-400 hover:text-slate-600 font-sans text-xs font-bold uppercase cursor-pointer">dismiss</button>
              </div>
            )}
          </div>
        )}

        {/* Administration Tab Switch Board */}
        <div className="flex flex-wrap bg-white p-1.5 rounded-xl border border-slate-100 shadow-xs mb-6 gap-1" id="admin-tabs">
          {[
            { id: "stats", label: t.statsOverview, icon: BarChart2 },
            { id: "editor", label: t.quizEditorTab, icon: BookOpen },
            { id: "csv", label: t.csvImportTab, icon: FileSpreadsheet },
            { id: "ai", label: t.aiGeneratorTab, icon: Sparkles },
            { id: "retakes", label: t.retakeApprovalsTab, icon: RefreshCw },
            { id: "users", label: t.userManagementTab, icon: Users }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                id={`admin-btn-tab-${tab.id}`}
                onClick={() => { setActiveTab(tab.id as any); handleClearNotifications(); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider cursor-pointer border border-transparent transition-all ${
                  activeTab === tab.id 
                    ? "bg-slate-800 text-white font-bold shadow-md" 
                    : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Loading Indicator Spinner */}
        {loading && (
          <div className="flex items-center justify-center p-12 bg-white/50 border border-slate-100 rounded-2xl mb-6">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
            <span className="ml-3 text-sm font-bold text-slate-700 font-sans">
              {lang === "en" ? "Processing records..." : "নথিপত্র প্রস্তুত হচ্ছে..."}
            </span>
          </div>
        )}

        {/* Dashboard Tabs Content */}
        <AnimatePresence mode="wait">
          
          {/* STATS OVERVIEW SECTION */}
          {activeTab === "stats" && stats && (
            <motion.div
              key="tab-stats"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
              id="admin-module-stats"
            >
              {/* Stats Grid Dashboard */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: t.statsTotalQuizzes, value: stats.totalQuizzes, bg: "bg-indigo-50 border-indigo-100 text-indigo-800" },
                  { label: t.statsTotalAttempts, value: stats.totalAttempts, bg: "bg-teal-50 border-teal-100 text-teal-800" },
                  { label: t.statsTotalStudents, value: stats.totalStudents, bg: "bg-amber-50 border-amber-100 text-amber-800" },
                  { label: t.statsAverageScore, value: `${stats.averageScore}%`, bg: "bg-rose-50 border-rose-100 text-rose-800" }
                ].map((st, i) => (
                  <div key={i} className={`p-6 rounded-2xl border-2 ${st.bg} shadow-xs`}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">{st.label}</p>
                    <p className="text-3xl font-extrabold tracking-tight font-sans">{st.value}</p>
                  </div>
                ))}
              </div>

              {/* Bento Box Charts SVG */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Score Spread Chart Element */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6 flex items-center gap-1.5">
                    <BarChart2 className="w-4 h-4 text-indigo-500" />
                    {lang === "en" ? "Academic Score Spread Distribution Matrix" : "একাডেমিক গ্রেড জোন ও স্কোর বণ্টন ম্যাট্রিক্স"}
                  </h3>
                  
                  <div className="space-y-4">
                    {stats.scoreDistribution.map((range, i) => {
                      const total = stats.totalAttempts || 1;
                      const pct = Math.round((range.count / total) * 100);
                      return (
                        <div key={i}>
                          <div className="flex justify-between items-center text-xs text-slate-600 mb-1 font-medium">
                            <span>{range.range}</span>
                            <span className="font-bold text-slate-700">{range.count} {lang === "en" ? "attempts" : "বার"} ({pct}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.5, delay: i * 0.1 }}
                              className="bg-indigo-600 h-full rounded-full"
                            ></motion.div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Subject Breakdowns Chart */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-emerald-500" />
                    {lang === "en" ? "Interactive Session Attempts per Academic Subject" : "বিষয়ভিত্তিক অংশগ্রহণ এবং সেশন মূল্যায়ন"}
                  </h3>

                  <div className="space-y-4">
                    {[
                      { key: "science", label: t.subjectScience, value: stats.subjectAttempts?.science || 0, color: "bg-emerald-500" },
                      { key: "math", label: t.subjectMath, value: stats.subjectAttempts?.math || 0, color: "bg-blue-500" },
                      { key: "english", label: t.subjectEnglish, value: stats.subjectAttempts?.english || 0, color: "bg-purple-500" },
                      { key: "ict", label: t.subjectIct, value: stats.subjectAttempts?.ict || 0, color: "bg-amber-500" },
                      { key: "history", label: t.subjectHistory, value: stats.subjectAttempts?.history || 0, color: "bg-rose-500" }
                    ].map((subj, i) => {
                      const total = (
                        Number(stats.subjectAttempts?.science || 0) +
                        Number(stats.subjectAttempts?.math || 0) +
                        Number(stats.subjectAttempts?.english || 0) +
                        Number(stats.subjectAttempts?.ict || 0) +
                        Number(stats.subjectAttempts?.history || 0)
                      ) || 1;
                      const pct = Math.round((subj.value / total) * 100);
                      return (
                        <div key={subj.key}>
                          <div className="flex justify-between items-center text-xs text-slate-600 mb-1 font-medium">
                            <span>{subj.label}</span>
                            <span className="font-bold text-slate-700">{subj.value} {lang === "en" ? "students" : "শিক্ষার্থী"}</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${subj.value > 0 ? (subj.value / total) * 100 : 0}%` }}
                              transition={{ duration: 0.5, delay: i * 0.1 }}
                              className={`${subj.color} h-full rounded-full`}
                            ></motion.div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </motion.div>
          )}


          {/* QUIZ WORKSPACE EDITOR CRUD */}
          {activeTab === "editor" && (
            <motion.div
              key="tab-editor"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
              id="admin-module-editor"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form Input Block Sidebar */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-6">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3 mb-4">
                    {selectedQuiz ? (lang === "en" ? "Edit Quiz Registry" : "বর্তমান কুইজ সংশোধন") : (lang === "en" ? "Register New Quiz Schema" : "নতুন কুইজ তৈরি")}
                  </h3>

                  <form onSubmit={handleSaveQuiz} className="space-y-4" id="form-quiz-creator">
                    <div>
                      {lang === "en" ? (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="quiz-title-en">Quiz Title (English)</label>
                          <input
                            type="text"
                            id="quiz-title-en"
                            required
                            className="w-full text-xs py-2 px-3 border border-slate-200 outline-hidden hover:border-slate-300 focus:border-indigo-500 rounded-lg text-slate-800 placeholder-slate-400 bg-slate-50/20"
                            placeholder="e.g., General Mechanics assessment"
                            value={quizForm.titleEn || ""}
                            onChange={(e) => setQuizForm({ ...quizForm, titleEn: e.target.value })}
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="quiz-title-bn">কুইজের শিরোনাম (বাংলা)</label>
                          <input
                            type="text"
                            id="quiz-title-bn"
                            required
                            className="w-full text-xs py-2 px-3 border border-slate-200 outline-hidden hover:border-slate-300 focus:border-indigo-500 rounded-lg text-slate-800 placeholder-slate-400 bg-slate-50/20"
                            placeholder="উদা: গতিবিজ্ঞান ভিত্তিক সমীকরণ"
                            value={quizForm.titleBn || ""}
                            onChange={(e) => setQuizForm({ ...quizForm, titleBn: e.target.value })}
                          />
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="quiz-class">Class Taxonomies</label>
                        <select
                          id="quiz-class"
                          className="w-full text-xs py-2 px-3 border border-slate-200 outline-hidden rounded-lg text-slate-800 bg-slate-50/20"
                          value={quizForm.classId}
                          onChange={(e) => setQuizForm({ ...quizForm, classId: e.target.value as any })}
                        >
                          <option value="class-6">{t.class6}</option>
                          <option value="class-7">{t.class7}</option>
                          <option value="class-8">{t.class8}</option>
                          <option value="class-9">{t.class9}</option>
                          <option value="class-10">{t.class10}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="quiz-subject">Subject Taxonomy</label>
                        <select
                          id="quiz-subject"
                          className="w-full text-xs py-2 px-3 border border-slate-200 outline-hidden rounded-lg text-slate-800 bg-slate-50/20"
                          value={quizForm.subjectId}
                          onChange={(e) => setQuizForm({ ...quizForm, subjectId: e.target.value as any })}
                        >
                          <option value="science">{t.subjectScience}</option>
                          <option value="math">{t.subjectMath}</option>
                          <option value="english">{t.subjectEnglish}</option>
                          <option value="ict">{t.subjectIct}</option>
                          <option value="history">{t.subjectHistory}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="quiz-duration">
                          {lang === "en" ? "Duration (Minutes)" : "সময়সীমা (মিনিট)"}
                        </label>
                        <input
                          type="number"
                          id="quiz-duration"
                          min="1"
                          max="180"
                          required
                          className="w-full text-xs py-2 px-3 border border-slate-200 outline-hidden focus:border-indigo-500 rounded-lg text-slate-800 bg-slate-50/20 font-mono"
                          value={quizForm.durationMinutes || ""}
                          onChange={(e) => setQuizForm({ ...quizForm, durationMinutes: Number(e.target.value) || 10 })}
                          placeholder="e.g. 15"
                        />
                      </div>

                                  {lang === "en" ? (
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1" htmlFor="q-text-en">Question Text (English)</label>
                          <input
                            type="text"
                            id="q-text-en"
                            className="w-full text-xs py-2 px-3 border border-slate-200 outline-hidden focus:border-indigo-500 rounded-lg text-slate-800"
                            placeholder="e.g., What is formula for acceleration?"
                            value={currentQuestion.textEn || ""}
                            onChange={(e) => setCurrentQuestion({ ...currentQuestion, textEn: e.target.value })}
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1" htmlFor="q-text-bn">প্রশ্নের ধরণ / বিষয়বস্তু (বাংলা)</label>
                          <input
                            type="text"
                            id="q-text-bn"
                            className="w-full text-xs py-2 px-3 border border-slate-200 outline-hidden focus:border-indigo-500 rounded-lg text-slate-800"
                            placeholder="উদা: ত্বরণের গাণিতিক সূত্র কোনটি?"
                            value={currentQuestion.textBn || ""}
                            onChange={(e) => setCurrentQuestion({ ...currentQuestion, textBn: e.target.value })}
                          />
                        </div>
                      )}

                      {/* Options Setup Options */}
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                          {lang === "en" ? "Options & Indicators" : "অপশন এবং সঠিক উত্তরসূচক"}
                        </label>
                        {[
                          { key: "A", idx: 0 },
                          { key: "B", idx: 1 },
                          { key: "C", idx: 2 },
                          { key: "D", idx: 3 }
                        ].map((item) => (
                          <div key={item.key} className="grid grid-cols-1 sm:grid-cols-9 gap-2 items-center">
                            <span className="text-xs font-bold text-slate-500 col-span-1">
                              {lang === "en" ? `Opt ${item.key}:` : `অপশন ${item.key}:`}
                            </span>
                            {lang === "en" ? (
                              <input
                                type="text"
                                id={`opt-en-${item.key}`}
                                className="w-full text-xs py-1.5 px-2.5 border border-slate-200 rounded-lg col-span-8"
                                placeholder={`Option ${item.key} (English)`}
                                value={currentQuestion.optionsEn?.[item.idx] || ""}
                                onChange={(e) => {
                                  const ops = [...(currentQuestion.optionsEn || ["", "", "", ""])];
                                  ops[item.idx] = e.target.value;
                                  setCurrentQuestion({ ...currentQuestion, optionsEn: ops });
                                }}
                              />
                            ) : (
                              <input
                                type="text"
                                id={`opt-bn-${item.key}`}
                                className="w-full text-xs py-1.5 px-2.5 border border-slate-200 rounded-lg col-span-8"
                                placeholder={`অপশন ${item.key} (বাংলা)`}
                                value={currentQuestion.optionsBn?.[item.idx] || ""}
                                onChange={(e) => {
                                  const ops = [...(currentQuestion.optionsBn || ["", "", "", ""])];
                                  ops[item.idx] = e.target.value;
                                  setCurrentQuestion({ ...currentQuestion, optionsBn: ops });
                                }}
                              />
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1" htmlFor="q-correct">
                            {lang === "en" ? "Correct Option" : "সঠিক উত্তর"}
                          </label>
                          <select
                            id="q-correct"
                            className="w-full text-xs py-2 px-3 border border-slate-200 outline-hidden rounded-lg text-slate-800 bg-white"
                            value={currentQuestion.correctOption}
                            onChange={(e) => setCurrentQuestion({ ...currentQuestion, correctOption: e.target.value as any })}
                          >
                            <option value="A">{lang === "en" ? "Option A" : "অপশন A"}</option>
                            <option value="B">{lang === "en" ? "Option B" : "অপশন B"}</option>
                            <option value="C">{lang === "en" ? "Option C" : "অপশন C"}</option>
                            <option value="D">{lang === "en" ? "Option D" : "অপশন D"}</option>
                          </select>
                        </div>
                        <div>
                          {lang === "en" ? (
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 mb-1" htmlFor="q-exp-en">Explanation (English)</label>
                              <input
                                type="text"
                                id="q-exp-en"
                                className="w-full text-xs py-2 px-3 border border-slate-200 outline-hidden rounded-lg text-slate-800"
                                placeholder="Explain why A is correct"
                                value={currentQuestion.explanationEn || ""}
                                onChange={(e) => setCurrentQuestion({ ...currentQuestion, explanationEn: e.target.value })}
                              />
                            </div>
                          ) : (
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 mb-1" htmlFor="q-exp-bn">ব্যাখ্যা (বাংলা)</label>
                              <input
                                type="text"
                                id="q-exp-bn"
                                className="w-full text-xs py-2 px-3 border border-slate-200 outline-hidden rounded-lg text-slate-800"
                                placeholder="ব্যাখ্যা করুন কেন সঠিক"
                                value={currentQuestion.explanationBn || ""}
                                onChange={(e) => setCurrentQuestion({ ...currentQuestion, explanationBn: e.target.value })}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        id="save-question-btn"
                        onClick={handleAddNewQuestion}
                        className="py-1.5 px-4 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-lg cursor-pointer transition-all"
                      >
                        {editQuestionIndex !== null ? (lang === "en" ? "Apply Changes" : "পরিবর্তনসমূহ সংরক্ষণ") : (lang === "en" ? "Incorporate Question" : "প্রশ্ন যুক্ত করুন")}
                      </button>
                    </div>

                    {/* Published Actions buttons */}
                    <div className="flex gap-2 border-t border-slate-100 pt-4">
                      <button
                        type="submit"
                        id="save-quiz-btn"
                        className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg uppercase tracking-wider cursor-pointer transform transition-all shadow-md"
                      >
                        <Save className="w-4 h-4 inline-block mr-1" />
                        {selectedQuiz ? (lang === "en" ? "Update Entire Quiz" : "সম্পূর্ণ কুইজ আপডেট করুন") : (lang === "en" ? "Publish Quiz" : "কুইজ প্রকাশ করুন")}
                      </button>
                      
                      {selectedQuiz && (
                        <button
                          type="button"
                          id="cancel-edit-btn"
                          onClick={() => {
                            setSelectedQuiz(null);
                            setQuizForm({
                              titleEn: "",
                              titleBn: "",
                              classId: "class-9",
                              subjectId: "science",
                              durationMinutes: 10,
                              isPublished: true,
                              questions: []
                            });
                          }}
                          className="py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg uppercase tracking-wider"
                        >
                          {t.cancel}
                        </button>
                      )}
                    </div>

                  </form>
                </div>
              </div>


              {/* Live Questionnaire Review sidebar panel */}
              <div className="lg:col-span-1 space-y-6">
                
                {/* Embedded Active Questions List */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 border-b border-slate-100 pb-2">
                    {lang === "en" ? "Interactive Question Sheet" : "কুইজে অন্তর্ভুক্ত প্রশ্নপত্রসমূহের সুচী"} ({quizForm.questions?.length || 0})
                  </h3>

                  {(!quizForm.questions || quizForm.questions.length === 0) ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      {lang === "en" ? "No questions loaded to sheet. Add using subform builder." : "কুইজে কোনো প্রশ্ন যুক্ত করা হয়নি। সাব-ফর্ম এডিটর ব্যবহার করুন।"}
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                      {quizForm.questions.map((q, i) => (
                        <div key={q.id} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs space-y-2 relative">
                          <div className="flex justify-between items-start pr-12">
                            <span className="font-extrabold text-indigo-700 font-mono">#{i + 1}</span>
                            <div className="flex gap-1.5 absolute right-2 top-2">
                              <button onClick={() => editQuestionFromList(i)} className="text-slate-500 hover:text-slate-800 cursor-pointer">
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => removeQuestionFromList(i)} className="text-slate-500 hover:text-red-600 cursor-pointer">
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{q.textEn}</p>
                            {q.textBn !== q.textEn && (
                              <p className="text-[10px] text-slate-500 mt-0.5">{q.textBn}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div> {/* Close sidebar container */}
            </div> {/* Close grid container */}

            {/* Database quizzes index listings - Full Width Table */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                  {lang === "en" ? "Published Quiz Catalogs Index" : "প্রকাশিত কুইজ ক্যাটালগ সুচী"} ({quizzes.length})
                </h3>
              </div>

              {quizzes.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  {lang === "en" ? "No quizzes published to portal catalog database." : "পোর্টাল ক্যাটালগ ডেটাবেজে কোনো কুইজ পাওয়া যায়নি।"}
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Header line aligning to grid cols */}
                  <div className="hidden md:grid grid-cols-12 gap-4 bg-slate-50/75 border border-slate-100 rounded-xl px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    <div className="col-span-4">{lang === "en" ? "Quiz Title / Details" : "কুইজের শিরোনাম / বিবরণ"}</div>
                    <div className="col-span-2 text-center">{lang === "en" ? "Subject Category" : "বিষয় ক্যাটাগরি"}</div>
                    <div className="col-span-2 text-center">{lang === "en" ? "Questions" : "প্রশ্নসংখ্যা"}</div>
                    <div className="col-span-2 text-center">{lang === "en" ? "Minutes" : "সময়"}</div>
                    <div className="col-span-1 text-center">{lang === "en" ? "Status" : "স্ট্যাটাস"}</div>
                    <div className="col-span-1 text-right pr-4">{lang === "en" ? "Actions" : "কার্যক্রম"}</div>
                  </div>

                  <div className="space-y-2.5 max-h-[40rem] overflow-y-auto pr-1">
                    {quizzes.map((q) => (
                      <div 
                        key={q.id} 
                        className="p-4 border border-slate-100 hover:border-slate-200/80 rounded-2xl bg-white hover:bg-slate-50/30 transition-all shadow-xs flex flex-col md:grid md:grid-cols-12 gap-4 items-center"
                      >
                        {/* Title & Detail Col */}
                        <div className="col-span-4 w-full text-left">
                          <p className="font-extrabold text-slate-800 text-sm md:text-[13px] tracking-tight leading-snug">
                            {lang === "en" ? q.titleEn : q.titleBn}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1 italic font-medium leading-normal">
                            {lang === "en" ? q.titleBn : q.titleEn}
                          </p>
                          {/* Mobile only badges */}
                          <div className="flex gap-1.5 mt-2 md:hidden">
                            <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md select-none">
                              {getClassLabel(q.classId)}
                            </span>
                            <span className="text-[9px] font-bold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-md select-none">
                              {getSubjectName(q.subjectId)}
                            </span>
                          </div>
                        </div>

                        {/* Subject Category Col */}
                        <div className="col-span-2 w-full text-center hidden md:block">
                          <div className="inline-flex flex-col items-center justify-center p-2 bg-slate-50 border border-slate-100 rounded-xl min-w-[7.5rem] shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
                            <span className="text-[9px] text-slate-400 font-bold tracking-wider uppercase leading-none mb-0.5">
                              {getClassLabel(q.classId)}
                            </span>
                            <span className="text-[11px] text-slate-700 font-extrabold text-center leading-tight">
                              {getSubjectName(q.subjectId)}
                            </span>
                          </div>
                        </div>

                        {/* Questions Col */}
                        <div className="col-span-2 w-full text-center flex justify-between md:justify-center items-center md:block border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
                          <span className="text-xs text-slate-400 font-bold md:hidden">{lang === "en" ? "Questions" : "প্রশ্নসংখ্যা"}</span>
                          <span className="text-xs md:text-sm font-black text-slate-800 font-mono">
                            {q.questions?.length || 0}
                          </span>
                        </div>

                        {/* Minutes Col */}
                        <div className="col-span-2 w-full text-center flex justify-between md:justify-center items-center md:block border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
                          <span className="text-xs text-slate-400 font-bold md:hidden">{lang === "en" ? "Duration" : "সময়"}</span>
                          <div className="text-center font-mono">
                            <span className="inline md:block text-xs md:text-sm font-black text-slate-800 leading-none">
                              {q.durationMinutes || 15}
                            </span>
                            <span className="inline md:block text-[9px] text-slate-400 font-bold tracking-wide md:mt-0.5 uppercase ml-1 md:ml-0">
                              {lang === "en" ? "mins" : "মিনিট"}
                            </span>
                          </div>
                        </div>

                        {/* Status Col */}
                        <div className="col-span-1 w-full text-center flex justify-between md:justify-center items-center md:block border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
                          <span className="text-xs text-slate-400 font-bold md:hidden">{lang === "en" ? "Status" : "স্ট্যাটাস"}</span>
                          <button
                            onClick={() => handleTogglePublish(q.id, q.isPublished)}
                            className={`inline-flex items-center justify-center px-4 py-1.5 border rounded-full text-xs cursor-pointer font-bold transition-all text-center select-none active:scale-95 ${
                              q.isPublished
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/60"
                                : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
                            }`}
                          >
                            {q.isPublished 
                              ? "Publish Quiz" 
                              : (lang === "en" ? "Set Draft" : "খসড়া হিসেবে")}
                          </button>
                        </div>

                        {/* Actions Col */}
                        <div className="col-span-1 w-full text-right flex justify-between md:justify-end items-center gap-1.5 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100 pr-1">
                          <span className="text-xs text-slate-400 font-bold md:hidden">{lang === "en" ? "Actions" : "কার্যক্রম"}</span>
                          <div className="flex gap-1.5 items-center">
                            {quizIdPendingDelete === q.id ? (
                              <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 rounded-lg p-0.5">
                                <span className="text-[9px] text-rose-600 font-bold px-0.5">
                                  {lang === "en" ? "Sure?" : "মুছবেন?"}
                                </span>
                                <button 
                                  onClick={async () => {
                                    await handleDeleteQuiz(q.id);
                                    setQuizIdPendingDelete(null);
                                  }} 
                                  className="px-1 py-0.5 bg-rose-500 hover:bg-rose-600 text-white rounded text-[9px] cursor-pointer font-bold transition-transform active:scale-95"
                                >
                                  {lang === "en" ? "Yes" : "হ্যাঁ"}
                                </button>
                                <button 
                                  onClick={() => setQuizIdPendingDelete(null)} 
                                  className="px-1 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[9px] cursor-pointer font-medium transition-transform active:scale-95"
                                >
                                  {lang === "en" ? "No" : "না"}
                                </button>
                              </div>
                            ) : (
                              <>
                                <button 
                                  onClick={() => handleSelectEditQuiz(q)} 
                                  className="p-1 px-1.5 bg-white border border-slate-200 rounded-lg hover:border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-xs" 
                                  title={lang === "en" ? "Edit Quiz" : "কুইজ পরিবর্তন করুন"}
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => setQuizIdPendingDelete(q.id)} 
                                  className="p-1 px-1.5 bg-white border border-rose-100 hover:border-rose-300 text-rose-600 hover:bg-rose-50 transition-colors shadow-xs" 
                                  title={lang === "en" ? "Purge Quiz" : "কুইজটি মুছে ফেলুন"}
                                >
                                  <Trash className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

          {/* BULK CSV IMPORTER SECTION */}
          {activeTab === "csv" && (
            <motion.div
              key="tab-csv"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-6"
              id="admin-module-csv"
            >
              <div className="max-w-4xl space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3">
                  {t.csvImportTab}
                </h3>
                <p className="text-xs text-slate-500 bg-slate-100 border border-slate-200 rounded-xl p-4 leading-relaxed font-semibold">
                  <FileSpreadsheet className="w-5 h-5 text-indigo-600 inline mr-1" />
                  {t.csvHelpText}
                </p>

                {/* CSV Meta elements fields */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="csv-t-en">Quiz Title English</label>
                    <input
                      type="text"
                      id="csv-t-en"
                      className="w-full text-xs py-2 px-3 border border-slate-200 rounded-lg"
                      placeholder="e.g., Bulk Photosynthesis exam"
                      value={csvQuizTitleEn}
                      onChange={(e) => setCsvQuizTitleEn(e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="csv-t-bn">Quiz Title Bangla</label>
                    <input
                      type="text"
                      id="csv-t-bn"
                      className="w-full text-xs py-2 px-3 border border-slate-200 rounded-lg"
                      placeholder="উদা: উদ্ভিদের শারীরতত্ত্ব পরীক্ষা"
                      value={csvQuizTitleBn}
                      onChange={(e) => setCsvQuizTitleBn(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="csv-dur">Minutes</label>
                    <input
                      type="number"
                      id="csv-dur"
                      className="w-full text-xs py-2 px-3 border border-slate-200 rounded-lg"
                      value={csvDuration}
                      onChange={(e) => setCsvDuration(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="csv-class">Class Catalog Path</label>
                    <select
                      id="csv-class"
                      className="w-full text-xs py-2.5 px-3 border border-slate-200 rounded-lg"
                      value={csvClassId}
                      onChange={(e) => setCsvClassId(e.target.value as any)}
                    >
                      <option value="class-6">{t.class6}</option>
                      <option value="class-7">{t.class7}</option>
                      <option value="class-8">{t.class8}</option>
                      <option value="class-9">{t.class9}</option>
                      <option value="class-10">{t.class10}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="csv-subject">Subject Catalog Path</label>
                    <select
                      id="csv-subject"
                      className="w-full text-xs py-2.5 px-3 border border-slate-200 rounded-lg"
                      value={csvSubjectId}
                      onChange={(e) => setCsvSubjectId(e.target.value as any)}
                    >
                      <option value="science">{t.subjectScience}</option>
                      <option value="math">{t.subjectMath}</option>
                      <option value="english">{t.subjectEnglish}</option>
                      <option value="ict">{t.subjectIct}</option>
                      <option value="history">{t.subjectHistory}</option>
                    </select>
                  </div>
                </div>

                {/* Comma paste area */}
                <div>
                  <textarea
                    id="csv-raw-textbox"
                    rows={6}
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                    className="w-full p-4 border border-indigo-200 rounded-xl focus:border-indigo-500 font-mono text-xs text-slate-800 leading-normal"
                    placeholder={t.csvPlaceholder}
                  />
                </div>

                <div className="flex gap-2.5">
                  <button
                    onClick={handleParseCsv}
                    id="csv-btn-validate"
                    className="py-2.5 px-6 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs uppercase tracking-wider rounded-lg cursor-pointer"
                  >
                    {t.validateCsv}
                  </button>
                  {csvPreview.length > 0 && (
                    <button
                      onClick={handlePublishCsvQuiz}
                      id="csv-btn-publish"
                      className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg cursor-pointer"
                    >
                      {t.publishCsv}
                    </button>
                  )}
                </div>

                {/* Live Parser spreadsheet review grid */}
                {csvPreview.length > 0 && (
                  <div className="mt-6 border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="bg-slate-100 p-3 text-xs font-bold text-slate-600">CSV Sheet Preview Grid ({csvPreview.length} questions mapped)</div>
                    <div className="overflow-x-auto max-h-72">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                            <th className="p-3">#</th>
                            <th className="p-3">Question</th>
                            <th className="p-3">Options</th>
                            <th className="p-3">Correct Option</th>
                            <th className="p-3">Explanation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {csvPreview.map((cq, i) => (
                            <tr key={cq.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                              <td className="p-3 font-bold text-slate-400">{i + 1}</td>
                              <td className="p-3 font-semibold text-slate-800">{cq.textEn}</td>
                              <td className="p-3 text-slate-500 pr-4">
                                <ul className="list-disc pl-3">
                                  {cq.optionsEn.map((op: string, oi: number) => <li key={oi}>{op}</li>)}
                                </ul>
                              </td>
                              <td className="p-3 font-extrabold text-indigo-700">{cq.correctOption}</td>
                              <td className="p-3 italic text-slate-500 line-clamp-2 mt-2">{cq.explanationEn}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          )}

          {/* GEMINI AI AUTOMATED MCQ GENERATOR */}
          {activeTab === "ai" && (
            <motion.div
              key="tab-ai"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-6"
              id="admin-module-ai"
            >
              <div className="max-w-4xl space-y-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-indigo-500 animate-pulse" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2 flex-1">
                    {t.aiGeneratorTab}
                  </h3>
                </div>

                <p className="text-xs text-slate-500 bg-indigo-50 border border-indigo-100/50 leading-relaxed font-semibold p-4 rounded-xl">
                  <Sparkle className="w-4 h-4 text-indigo-600 inline mr-1" />
                  {t.aiHelpText}
                </p>

                {/* Multimodal class subject directories selecting config */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="ai-class">Associate to Class Level</label>
                    <select
                      id="ai-class"
                      className="w-full text-xs py-2 bg-white px-3 border border-slate-200 rounded-lg outline-hidden"
                      value={aiClassId}
                      onChange={(e) => setAiClassId(e.target.value as any)}
                    >
                      <option value="class-6">{t.class6}</option>
                      <option value="class-7">{t.class7}</option>
                      <option value="class-8">{t.class8}</option>
                      <option value="class-9">{t.class9}</option>
                      <option value="class-10">{t.class10}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="ai-subject">Associate to Subject catalog</label>
                    <select
                      id="ai-subject"
                      className="w-full text-xs py-2 bg-white px-3 border border-slate-200 rounded-lg outline-hidden"
                      value={aiSubjectId}
                      onChange={(e) => setAiSubjectId(e.target.value as any)}
                    >
                      <option value="science">{t.subjectScience}</option>
                      <option value="math">{t.subjectMath}</option>
                      <option value="english">{t.subjectEnglish}</option>
                      <option value="ict">{t.subjectIct}</option>
                      <option value="history">{t.subjectHistory}</option>
                    </select>
                  </div>
                  <div className="flex flex-col justify-center">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 font-sans">Generation Behavior</label>
                    <label className="relative flex items-center gap-2 cursor-pointer select-none py-1">
                      <input
                        type="checkbox"
                        checked={aiAccumulate}
                        onChange={(e) => setAiAccumulate(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-[11px] text-slate-700 font-semibold leading-tight">
                        {lang === "en" ? "Accumulate with previous" : "আগের প্রশ্নের সাথে যোগ করুন"}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Prompt instructions text area */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="ai-prompt-input">{t.aiPromptLabel}</label>
                  <textarea
                    id="ai-prompt-input"
                    rows={3}
                    className="w-full p-4 border border-slate-200 rounded-xl focus:border-indigo-500 text-xs text-slate-800 outline-hidden font-medium"
                    placeholder={t.aiPromptPlaceholder}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                  />
                </div>

                {/* Multimedia asset upload element OCR */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between gap-1.5">
                    <span className="flex items-center gap-1.5">
                      <FileUp className="w-4 h-4 text-slate-500" />
                      {t.aiUploadLabel}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {aiImages.length} / 8
                    </span>
                  </label>
                  <input
                    type="file"
                    id="ocr-worksheet-input"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-white hover:file:bg-slate-900 file:cursor-pointer"
                  />
                  {aiImages.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-2">
                      {aiImages.map((img, idx) => (
                        <div key={idx} className="relative group border border-slate-200 rounded-lg p-1 bg-white flex flex-col items-center">
                          <div className="w-12 h-12 rounded bg-slate-100 overflow-hidden relative">
                            <img src={`data:${img.mime};base64,${img.base64}`} alt={img.fileName} className="w-full h-full object-cover" />
                          </div>
                          <span className="text-[9px] text-slate-500 truncate w-full text-center mt-1 block px-1" title={img.fileName}>
                            {img.fileName}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveAiImage(idx)}
                            className="absolute top-1 right-1 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-0.5 shadow-md hover:scale-110 transition-transform cursor-pointer"
                            title="Remove image"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* AI Invocation trigger */}
                <button
                  onClick={handleAiQuizGeneration}
                  disabled={loading}
                  id="btn-trigger-ai"
                  className="w-full sm:w-auto py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg cursor-pointer transform hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-white shrink-0" />
                  {t.aiGenerateBtn}
                </button>

                {/* Submitting AI state notifications */}
                {loading && (
                  <div className="p-4 bg-slate-100 border border-slate-200 text-xs text-slate-600 leading-normal flex items-center gap-2 font-semibold rounded-xl">
                    <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin shrink-0" />
                    {t.aiGeneratingNotice}
                  </div>
                )}

                {/* AI generated preview container */}
                {aiPreviewData && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-5 border border-indigo-100 bg-indigo-50/20 rounded-2xl space-y-4"
                    id="ai-preview-zone"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-indigo-100 pb-3 gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">
                          {lang === "en" ? "AI Generated Quiz Preview" : "এআই দ্বারা নির্মিত কুইজ প্রিভিউ"}
                        </h4>
                        <p className="text-xs text-indigo-700 font-semibold italic mt-0.5">
                          {lang === "en" ? aiPreviewData.titleEn : aiPreviewData.titleBn}
                        </p>
                      </div>
                      <button
                        onClick={handleApplyAiGeneratedQuiz}
                        id="btn-apply-ai-quiz"
                        className="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold uppercase rounded-lg cursor-pointer shrink-0 transition-colors"
                      >
                        Publish as New Quiz
                      </button>
                    </div>

                    {/* Interactive panel to append to existing quiz or reset */}
                    <div className="bg-white/90 backdrop-blur-sm border border-slate-200/60 p-4 rounded-xl space-y-3 shadow-xs">
                      <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                        <span>
                          {lang === "en" ? "Merge / Append questions to before-generated active Quiz:" : "পূর্বে প্রকাশিত কোনো কুইজে এই প্রশ্নপত্র যোগ করুন:"}
                        </span>
                        <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-mono font-bold">
                          {aiPreviewData.questions?.length || 0} Questions Ready
                        </span>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                        <select
                          className="flex-1 text-xs py-1.5 px-2 border border-slate-200 rounded-lg outline-hidden bg-white cursor-pointer font-medium"
                          value={selectedQuizToAppendId}
                          onChange={(e) => setSelectedQuizToAppendId(e.target.value)}
                        >
                          <option value="">
                            {lang === "en" ? "-- Select standard quiz targeting to append results --" : "-- যোগ করার জন্য কুইজ নির্বাচন করুন --"}
                          </option>
                          {quizzes.map((q) => (
                            <option key={q.id} value={q.id}>
                              [{q.classId?.toUpperCase()}] {lang === "en" ? q.titleEn : q.titleBn} ({q.questions?.length || 0} questions parsed)
                            </option>
                          ))}
                        </select>
                        
                        <button
                          onClick={handleAppendToExistingQuiz}
                          disabled={!selectedQuizToAppendId || loading}
                          className="py-1.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase rounded-lg cursor-pointer transition-all disabled:opacity-40"
                        >
                          {lang === "en" ? "Append to Quiz" : "কুইজে যোগ করুন"}
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => {
                            setAiPreviewData(null);
                            setApiSuccess(lang === "en" ? "Gemini results cleared." : "কুইজ তালিকা পরিষ্কার করা হয়েছে।");
                          }}
                          className="py-1.5 px-3 border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-bold uppercase rounded-lg cursor-pointer transition-all"
                        >
                          {lang === "en" ? "Clear List" : "তালিকা মুছুন"}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                      {aiPreviewData.questions?.map((q: any, idx: number) => (
                        <div key={idx} className="p-3 bg-white border border-slate-100 rounded-xl text-xs space-y-2">
                          <span className="font-extrabold text-indigo-700 font-mono">Question #{idx + 1}</span>
                          <div>
                            <p className="font-bold text-slate-800">{q.textEn}</p>
                            {q.textBn !== q.textEn && (
                              <p className="text-[10px] text-slate-500 font-medium mt-0.5">{q.textBn}</p>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 font-semibold">
                            {["A", "B", "C", "D"].map((letter, oIdx) => (
                              <div key={letter} className={`p-1.5 border rounded-lg ${q.correctOption === letter ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-slate-50 border-slate-100"}`}>
                                <span className="font-bold mr-1">{letter}:</span> 
                                {q.optionsEn?.[oIdx]}
                                {q.optionsBn?.[oIdx] !== q.optionsEn?.[oIdx] && (
                                  <span className="text-[10px] text-slate-400">/ {q.optionsBn?.[oIdx]}</span>
                                )}
                              </div>
                            ))}
                          </div>

                          <div className="text-[10px] bg-indigo-50 border border-indigo-100/50 p-2 rounded-lg text-slate-600 leading-normal">
                            <span className="font-extrabold uppercase">Explanation / ব্যাখ্যা::</span> {q.explanationEn}
                            {q.explanationBn !== q.explanationEn && (
                              <>
                                <br />
                                <span className="italic">{q.explanationBn}</span>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

              </div>
            </motion.div>
          )}

          {/* ACTIVE RETAKE APPROVALS TAB */}
          {activeTab === "retakes" && (
            <motion.div
              key="tab-retakes"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs"
              id="admin-module-retakes"
            >
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3 mb-4">
                {t.pendingApprovals}
              </h3>

              {retakeRequests.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400 font-semibold">
                  {lang === "en" ? "Splendid! There are no pending 12-hour retake lockout requests." : "চমৎকার! বর্তমানে পুনরায় পরীক্ষা প্রদানের কোনো লকআউট ছাড়পত্র আবেদন পেন্ডিং নেই।"}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                        <th className="p-3">Student Name</th>
                        <th className="p-3">Email Address</th>
                        <th className="p-3">Target Quiz Session</th>
                        <th className="p-3">Requested At</th>
                        <th className="p-3">Clearance Decision</th>
                      </tr>
                    </thead>
                    <tbody>
                      {retakeRequests.map((req) => (
                        <tr key={req.id} className="border-b border-slate-100 hover:bg-slate-50/50" id={`retake-item-${req.id}`}>
                          <td className="p-3 font-bold text-slate-800">{req.username}</td>
                          <td className="p-3 font-mono text-slate-500">{req.email}</td>
                          <td className="p-3 font-semibold text-indigo-700">{lang === "en" ? req.quizTitleEn : req.quizTitleBn}</td>
                          <td className="p-3 text-slate-500">{new Date(req.requestedAt).toLocaleString()}</td>
                          <td className="p-3 flex gap-1.5 pt-4">
                            <button
                              onClick={() => handleRetakeLockClearance(req.id, "approved")}
                              className="py-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer transition-all"
                            >
                              {t.approveRetake}
                            </button>
                            <button
                              onClick={() => handleRetakeLockClearance(req.id, "rejected")}
                              className="py-1 px-3 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-lg cursor-pointer transition-all"
                            >
                              {t.rejectRetake}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

          {/* USER MANAGEMENT TAB */}
          {activeTab === "users" && (
            <motion.div
              key="tab-users"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs"
              id="admin-module-users"
            >
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3 mb-4">
                {t.userManagementTab}
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <th className="p-3">User Name</th>
                      <th className="p-3">Credential Identifier (Email)</th>
                      <th className="p-3">Status Attributes</th>
                      <th className="p-3">Security Role Level</th>
                      <th className="p-3">Modify Status Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="p-3 font-bold text-slate-800">{u.name}</td>
                        <td className="p-3 font-mono text-slate-500">{u.email}</td>
                        <td className="p-3">
                          {u.isGuest ? (
                            <span className="bg-amber-100 text-amber-800 py-0.5 px-2 rounded-md font-extrabold text-[9px] uppercase tracking-wider">{t.guestBadge}</span>
                          ) : (
                            <span className="bg-slate-100 text-slate-700 py-0.5 px-2 rounded-md font-extrabold text-[9px] uppercase tracking-wider">REG CUSTOMER</span>
                          )}
                        </td>
                        <td className="p-3">
                          {u.role === "admin" ? (
                            <span className="bg-indigo-600 text-white font-extrabold text-[9px] tracking-wider py-0.5 px-2 rounded-md uppercase flex items-center w-fit gap-1 shadow-sm">
                              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                              {t.adminBadge}
                            </span>
                          ) : (
                            <span className="bg-slate-200 text-slate-800 font-extrabold text-[9px] tracking-wider py-0.5 px-2 rounded-md uppercase">STUDENT</span>
                          )}
                        </td>
                        <td className="p-3 pt-4">
                          {u.role === "student" ? (
                            <button
                              onClick={() => handleUserRoleUpdate(u.id, "admin")}
                              className="py-1 px-3 bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-100 font-bold rounded-lg cursor-pointer transition-all uppercase text-[10px]"
                            >
                              {t.promoteBtn}
                            </button>
                          ) : (
                            u.id !== "user-admin" && (
                              <button
                                onClick={() => handleUserRoleUpdate(u.id, "student")}
                                className="py-1 px-3 bg-red-50 border border-red-100 hover:bg-red-100 text-red-600 font-bold rounded-lg cursor-pointer transition-all uppercase text-[10px]"
                              >
                                {t.demoteBtn}
                              </button>
                            )
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

      </div>
    </div>
  );
}
