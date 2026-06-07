/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TranslationSet {
  appName: string;
  tagline: string;
  languageToggle: string;
  dashboard: string;
  leaderboard: string;
  profile: string;
  adminConsole: string;
  logout: string;
  welcomeBack: string;
  allClasses: string;
  chooseSubject: string;
  noQuizzesAvailable: string;
  startQuiz: string;
  duration: string;
  questionsCount: string;
  quizActiveHeading: string;
  timeLeft: string;
  submitQuiz: string;
  confirmSubmitTitle: string;
  confirmSubmitDesc: string;
  cancel: string;
  confirm: string;
  retakeLockMessage: string;
  retakeRequested: string;
  requestRetakeNow: string;
  scoreReport: string;
  perfectScore: string;
  passed: string;
  failed: string;
  yourScore: string;
  accuracy: string;
  timeSpent: string;
  reviewAnswers: string;
  printCertificate: string;
  dispatchScorecard: string;
  backToDashboard: string;
  correctAnswer: string;
  explanation: string;
  notAnswered: string;
  globalRankings: string;
  rank: string;
  student: string;
  averageAccuracy: string;
  totalFinished: string;
  points: string;
  guestBadge: string;
  adminBadge: string;
  emailLabel: string;
  passwordLabel: string;
  nameLabel: string;
  permitCodeLabel: string;
  hasPermitCheckbox: string;
  loginBtn: string;
  registerBtn: string;
  enterAsGuestBtn: string;
  toggleAuthModeRegister: string;
  toggleAuthModeLogin: string;
  permitCodePlaceholder: string;
  forgotPasswordBtn: string;
  demoHint: string;
  adminPanelTitle: string;
  statsOverview: string;
  quizEditorTab: string;
  csvImportTab: string;
  aiGeneratorTab: string;
  retakeApprovalsTab: string;
  userManagementTab: string;
  statsTotalQuizzes: string;
  statsTotalAttempts: string;
  statsTotalStudents: string;
  statsAverageScore: string;
  createQuizBtn: string;
  editQuizBtn: string;
  deleteQuizBtn: string;
  draftBadge: string;
  publishedBadge: string;
  saveDraft: string;
  publishQuiz: string;
  deleteConfirm: string;
  csvHelpText: string;
  csvPlaceholder: string;
  validateCsv: string;
  publishCsv: string;
  aiHelpText: string;
  aiPromptLabel: string;
  aiPromptPlaceholder: string;
  aiUploadLabel: string;
  aiGenerateBtn: string;
  aiGeneratingNotice: string;
  pendingApprovals: string;
  approveRetake: string;
  rejectRetake: string;
  userTableRole: string;
  promoteBtn: string;
  demoteBtn: string;
  subjectScience: string;
  subjectMath: string;
  subjectEnglish: string;
  subjectIct: string;
  subjectHistory: string;
  class6: string;
  class7: string;
  class8: string;
  class9: string;
  class10: string;
  noAttemptsYet: string;
}

export const localization: { en: TranslationSet; bn: TranslationSet } = {
  en: {
    appName: "EXAMSHALL",
    tagline: "Full-Stack Bilingual Examination Portal",
    languageToggle: "বাংলা",
    dashboard: "Dashboard",
    leaderboard: "Leaderboard",
    profile: "My Profile",
    adminConsole: "Admin Console",
    logout: "Log Out",
    welcomeBack: "Welcome Back",
    allClasses: "All Academic Classes",
    chooseSubject: "Choose a Subject Directory",
    noQuizzesAvailable: "No quizzes available for this catalog path.",
    startQuiz: "Start Quiz Session",
    duration: "Duration",
    questionsCount: "Questions",
    quizActiveHeading: "Live Interactive Examination",
    timeLeft: "Time Remaining",
    submitQuiz: "Submit Final Script",
    confirmSubmitTitle: "Are you sure you want to outer submit?",
    confirmSubmitDesc: "This will finalize your answers and lock your portal state. This action cannot be undone.",
    cancel: "Cancel",
    confirm: "Yes, Submit",
    retakeLockMessage: "This assessment is locked due to the 12-hour anti-cheat limit. You must wait for the countdown or request immediate administrative clearance.",
    retakeRequested: "Clearance Request Pending Approval",
    requestRetakeNow: "Request Admin Approval to Retake Now",
    scoreReport: "Academic Evaluation Score Report",
    perfectScore: "Distinction Performance!",
    passed: "PASSED",
    failed: "FAILED",
    yourScore: "Your Score",
    accuracy: "Total Accuracy",
    timeSpent: "Time Consumed",
    reviewAnswers: "Detailed Questionnaire Review",
    printCertificate: "Print Verified PDF Certificate",
    dispatchScorecard: "Dispatch Scorecard to Email",
    backToDashboard: "Return to Main Dashboard",
    correctAnswer: "Verified Answer",
    explanation: "Academic Explanation & Rationale",
    notAnswered: "Unanswered Question",
    globalRankings: "Student Leaderboard Rankings",
    rank: "Rank",
    student: "Student",
    averageAccuracy: "Average Accuracy",
    totalFinished: "Finished Sessions",
    points: "Talent Points",
    guestBadge: "GUEST STUDENT",
    adminBadge: "ADMINISTRATOR",
    emailLabel: "Email Address",
    passwordLabel: "Account Password",
    nameLabel: "Your Full Name",
    permitCodeLabel: "Developer Permit Code",
    hasPermitCheckbox: "Registering as Academic Admin",
    loginBtn: "Sign In Securely",
    registerBtn: "Register Student Account",
    enterAsGuestBtn: "Instant Guest Student Mode",
    toggleAuthModeRegister: "Don't have an account? Sign Up Now",
    toggleAuthModeLogin: "Already have an account? Sign In Now",
    permitCodePlaceholder: "Enter 'devpermit123' if registered admin",
    forgotPasswordBtn: "Credentials Reset Prompt",
    demoHint: "Preseeded Accounts: Admin (admin@quiz.com / admin123) | Student (student@quiz.com / student123)",
    adminPanelTitle: "EXAMSHALL Platform Control Deck",
    statsOverview: "Academic Platform Pulse",
    quizEditorTab: "Quiz Editor Workspace",
    csvImportTab: "Bulk CSV Spreadsheet Importer",
    aiGeneratorTab: "AI Automated MCQ Generator",
    retakeApprovalsTab: "Active Retake Approvals",
    userManagementTab: "User Manager",
    statsTotalQuizzes: "Total Published Quizzes",
    statsTotalAttempts: "Total Handed In Scripts",
    statsTotalStudents: "Total Enrolled Profiles",
    statsAverageScore: "General Average Accuracy",
    createQuizBtn: "Register New Quiz",
    editQuizBtn: "Modify Elements",
    deleteQuizBtn: "Purge Quiz",
    draftBadge: "WORK DRAFT",
    publishedBadge: "LIVE ON PORTAL",
    saveDraft: "Save Work-In-Progress as Draft",
    publishQuiz: "Publish Instantly online",
    deleteConfirm: "Are you certain you want to delete this resource completely?",
    csvHelpText: "Paste questions in a CSV layout. Format layout headers are: Question, Option A, Option B, Option C, Option D, Correct Option (A/B/C/D), Explanation. We will render a live preview grid prior to final batch upload.",
    csvPlaceholder: "e.g., What is the capital of Bangladesh?,Dhaka,Chittagong,Sylhet,Khulna,A,Dhaka is the official capital city of Bangladesh.",
    validateCsv: "Audit Layout Formatting",
    publishCsv: "Publish Bulk CSV Elements",
    aiHelpText: "EXAMSHALL utilizes gemini-3.5-flash. You can write a prompt or upload an image worksheet and ask the AI to copy/extract specific question numbers (e.g., 'Copy questions 8, 19, 20'). The AI will copy ONLY those questions, transcribe and translate them into a bilingual format, and completely strip the original question numbers.",
    aiPromptLabel: "AI Command Synthesis Text Prompt",
    aiPromptPlaceholder: "e.g., 'Copy questions 8, 9, 20' or 'Generate 5 questions on photosynthesis'",
    aiUploadLabel: "Multimedia Textbook Reference Image File (Optional OCR Support)",
    aiGenerateBtn: "Invoke AI Assessment Generation Engine",
    aiGeneratingNotice: "Analyzing multimedia assets via Gemini... Please wait.",
    pendingApprovals: "Pending Academic retake Unlock Requests",
    approveRetake: "Clear Lock (Approve)",
    rejectRetake: "Deny Clearance",
    userTableRole: "Access Rights Role",
    promoteBtn: "Escalate to Admin",
    demoteBtn: "Revoke Privileges",
    subjectScience: "General Science",
    subjectMath: "Mathematics",
    subjectEnglish: "English Language",
    subjectIct: "ICT & Digital Tech",
    subjectHistory: "History & Culture",
    class6: "Class Six (6)",
    class7: "Class Seven (7)",
    class8: "Class Eight (8)",
    class9: "Class Nine (9)",
    class10: "Class Ten (10)",
    noAttemptsYet: "You haven't completed any assessments under this logged-in account structure yet."
  },
  bn: {
    appName: "এক্সামশল (EXAMSHALL)",
    tagline: "ফুল-স্ট্যাক দ্বিভাষিক পরীক্ষা পোর্টাল",
    languageToggle: "English",
    dashboard: "ড্যাশবোর্ড",
    leaderboard: "লিডারবোর্ড",
    profile: "আমার প্রোফাইল",
    adminConsole: "অ্যাডমিন কনসোল",
    logout: "লগ আউট",
    welcomeBack: "স্বাগতম",
    allClasses: "সকল একাডেমিক ক্লাস",
    chooseSubject: "বিষয় ডিরেক্টরি নির্বাচন করুন",
    noQuizzesAvailable: "এই ক্যাটালগ পথের অধীনে কোন কুইজ উপলভ্য নেই।",
    startQuiz: "কুইজ সেশন শুরু করুন",
    duration: "সময়সীমা",
    questionsCount: "প্রশ্নসংখ্যা",
    quizActiveHeading: "লাইভ ইন্টারঅ্যাক্টিভ পরীক্ষা",
    timeLeft: "অবশিষ্ট সময়",
    submitQuiz: "ফাইনাল স্ক্রিপ্ট জমা দিন",
    confirmSubmitTitle: "আপনি কি নিশ্চিতভাবে জমা দিতে চান?",
    confirmSubmitDesc: "এটি আপনার উত্তরসমূহ চূড়ান্ত করবে এবং আপনার অ্যাকাউন্ট লক করবে। এই কার্যক্রম আর পরিবর্তন করা যাবে না।",
    cancel: "বাতিল",
    confirm: "হ্যাঁ, জমা দিন",
    retakeLockMessage: "১২-ঘণ্টার লকআউট সুরক্ষার কারণে এই পরীক্ষাটি বর্তমানে নিষ্ক্রিয় রয়েছে। অনুগ্রহ করে পূর্ব নির্ধারিত সময় পর্যন্ত অপেক্ষা করুন অথবা তাৎক্ষণিক ছাড়পত্রের জন্য অ্যাডমিনকে আবেদন করুন।",
    retakeRequested: "অ্যাডমিন অনুমোদনের আবেদন পেন্ডিং রয়েছে",
    requestRetakeNow: "পরীক্ষায় পুনরায় অংশগ্রহণের জন্য অনুমোদনের আবেদন করুন",
    scoreReport: "একাডেমিক মূল্যায়ন স্কোর রিপোর্ট",
    perfectScore: "অনন্য কৃতিত্বপূর্ণ পারফরম্যান্স!",
    passed: "উত্তীর্ণ (PASSED)",
    failed: "অকৃতকার্য (FAILED)",
    yourScore: "আপনার স্কোর",
    accuracy: "মোট নির্ভুলতা",
    timeSpent: "ব্যয়িত সময়",
    reviewAnswers: "বিস্তারিত প্রশ্নাবলী এবং উত্তরের পর্যালোচনা",
    printCertificate: "যাচাইকৃত পিডিএফ সার্টিফিকেট প্রিন্ট করুন",
    dispatchScorecard: "ইমেইলে স্কোরকার্ড প্রেরণ করুন",
    backToDashboard: "মূল ড্যাশবোর্ডে ফিরে যান",
    correctAnswer: "যাচাইকৃত সঠিক উত্তর",
    explanation: "একাডেমিক ব্যাখ্যা এবং যৌক্তিকতা",
    notAnswered: "উত্তর দেওয়া হয়নি",
    globalRankings: "শীর্ষ শিক্ষার্থীর লিডারবোর্ড র‍্যাংকিং",
    rank: "র‍্যাংক",
    student: "শিক্ষার্থী",
    averageAccuracy: "গড় নির্ভুলতা",
    totalFinished: "সম্পন্ন সেশন",
    points: "ট্যালেন্ট পয়েন্ট",
    guestBadge: "অতিথি শিক্ষার্থী (GUEST)",
    adminBadge: "প্রধান প্রশাসক (ADMIN)",
    emailLabel: "ইমেইল এড্রেস",
    passwordLabel: "অ্যাকাউন্ট পাসওয়ার্ড",
    nameLabel: "আপনার পূর্ণ নাম",
    permitCodeLabel: "ডেভেলপার পারমিট কোড (Permit Code)",
    hasPermitCheckbox: "প্রশাসক (Admin) হিসেবে নিবন্ধন করুন",
    loginBtn: "সুরক্ষিত লগইন",
    registerBtn: "শিক্ষার্থী অ্যাকাউন্ট নিবন্ধন",
    enterAsGuestBtn: "তাৎক্ষণিক অতিথি মোডে প্রবেশ",
    toggleAuthModeRegister: "অ্যাকাউন্ট নেই? এখনই সাইন আপ করুন",
    toggleAuthModeLogin: "ইতিমধ্যে অ্যাকাউন্ট আছে? সাইন ইন করুন",
    permitCodePlaceholder: "নিবন্ধনের জন্য 'devpermit123' ব্যবহার করুন",
    forgotPasswordBtn: "পাসওয়ার্ড রিসেট প্রম্পট",
    demoHint: "ডেমো অ্যাকাউন্টসমূহ: অ্যাডমিন (admin@quiz.com / admin123) | শিক্ষার্থী (student@quiz.com / student123)",
    adminPanelTitle: "এক্সামশল প্ল্যাটফর্ম কন্ট্রোল ডেক",
    statsOverview: "একাডেমিক প্ল্যাটফর্ম পালস",
    quizEditorTab: "কুইজ এডিটর ওয়ার্কস্পেস",
    csvImportTab: "বাল্ক সিএসভি ইমপোর্টার",
    aiGeneratorTab: "এআই স্বয়ংক্রিয় এমসিকিউ নির্মাতা",
    retakeApprovalsTab: "পুনরায় পরীক্ষা অংশগ্রহণের অনুমোদন",
    userManagementTab: "ব্যবহারকারী ব্যবস্থাপক",
    statsTotalQuizzes: "মোট প্রকাশিত কুইজসমূহ",
    statsTotalAttempts: "মোট জমাকৃত পরীক্ষার খাতা",
    statsTotalStudents: "মোট নিবন্ধিত প্রোফাইল",
    statsAverageScore: "সাধারণ গড় নির্ভুলতা",
    createQuizBtn: "নতুন কুইজ তৈরি করুন",
    editQuizBtn: "উপাদান পরিবর্তন করুন",
    deleteQuizBtn: "কুইজ মুছে ফেলুন",
    draftBadge: "খসড়া ফাইল (DRAFT)",
    publishedBadge: "লাইভ পোর্টাল (LIVE)",
    saveDraft: "খসড়া হিসেবে প্রগতি সংরক্ষণ করুন",
    publishQuiz: "তাৎক্ষণিক পোর্টালে প্রকাশ করুন",
    deleteConfirm: "আপনি কি নিশ্চিতভাবে এই কুইজটি চিরতরে মুছে ফেলতে চান?",
    csvHelpText: "সিএসভি বিন্যাসে আপনার এমসিকিউ প্যাটার্ন টাইপ অথবা পেস্ট করুন। বিন্যাসের ক্রমানুসারী কলামগুলো হলো: প্রশ্ন, অপশন এ, অপশন বি, অপশন সি, অপশন ডি, সঠিক অপশন (A/B/C/D), ব্যাখ্যা। আপলোডের পূর্বে একটি লাইভ প্রিভিউ প্রদর্শন করা হবে।",
    csvPlaceholder: "যেমন, বাংলাদেশের রাজধানী কোনটি?,ঢাকা,চট্টগ্রাম,সিলেট,খুলনা,A,ঢাকা বাংলাদেশের প্রাতিষ্ঠানিক রাজধানী।",
    validateCsv: "প্যাটার্ন ও ফরম্যাট অডিট করুন",
    publishCsv: "প্রকাশ করুন বাল্ক এমসিকিউ তালিকা",
    aiHelpText: "এক্সামশল gemini-3.5-flash ব্যবহার করে। আপনি প্রম্পট লিখতে পারেন বা কোনো কোশ্চেন শিটের ছবি আপলোড করে নির্দিষ্ট কিছু প্রশ্নের নম্বর কপি করতে বলতে পারেন (যেমন: '৮, ৯ এবং ২০ নম্বর প্রশ্নগুলো কপি করো')। এআই শুধুমাত্র নির্দিষ্ট প্রশ্নগুলো নম্বর ছাড়াই কপি করে দেবে এবং উভয় ভাষায় অনুবাদ প্রিভিউ করবে।",
    aiPromptLabel: "এআই নির্দেশাবলী লিখে দেওয়ার ইনপুট",
    aiPromptPlaceholder: "যেমন: '৮, ৯ এবং ২০ নম্বর প্রশ্নগুলো কপি করো' অথবা 'সালোকসংশ্লেষণ এর ওপর ৫টি প্রশ্ন তৈরি করো'",
    aiUploadLabel: "পাঠ্যপুস্তক বা খাতার ছবি আপলোড করুন (OCR সাপোর্ট)",
    aiGenerateBtn: "এআই স্বয়ংক্রিয় কোশ্চেন জেনারেটর চালু করুন",
    aiGeneratingNotice: "জেমিনির মাধ্যমে ছবি/প্রম্পট বৈশ্লেষণ করা হচ্ছে... অনুগ্রহ করে অপেক্ষা করুন।",
    pendingApprovals: "পুনরায় পরীক্ষা দেওয়ার মুলতবি আবেদনসমূহ",
    approveRetake: "লকআউট শিথিল করুন (অনুমোদন)",
    rejectRetake: "আবেদন নাকচ করুন",
    userTableRole: "প্ল্যাটফর্ম অ্যাক্সেস রোল",
    promoteBtn: "অ্যাডমিন পদে উন্নীত করুন",
    demoteBtn: "অ্যাডমিন পদ থেকে প্রত্যাহার করুন",
    subjectScience: "সাধারণ বিজ্ঞান",
    subjectMath: "গণিত",
    subjectEnglish: "ইংরেজি ভাষা",
    subjectIct: "আইসিটি ও তথ্যপ্রযুক্তি",
    subjectHistory: "ইতিহাস ও সংস্কৃতি",
    class6: "ষষ্ঠ শ্রেণী (৬ষ্ঠ)",
    class7: "সপ্তম শ্রেণী (৭ম)",
    class8: "অষ্টম শ্রেণী (৮ম)",
    class9: "নবম শ্রেণী (৯ম)",
    class10: "দশম শ্রেণী (১০ম)",
    noAttemptsYet: "আপনি এই অ্যাকাউন্টের অধীনে এখনও কোনো পরীক্ষা সম্পন্ন করেননি।"
  }
};
