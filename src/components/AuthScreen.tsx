/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { api } from "../api";
import { User } from "../types";
import { localization } from "../localization";
import { LogIn, UserPlus, ShieldAlert, Compass, Sparkles, HelpCircle, AlertTriangle, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AuthScreenProps {
  lang: "en" | "bn";
  onAuthSuccess: (user: User) => void;
  onLanguageToggle: () => void;
}

export default function AuthScreen({ lang, onAuthSuccess, onLanguageToggle }: AuthScreenProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [permitCode, setPermitCode] = useState("");
  const [guestName, setGuestName] = useState("");
  const [showGuestForm, setShowGuestForm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<{ en: string; bn: string } | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  const t = localization[lang];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const user = await api.login(email, password);
      onAuthSuccess(user);
    } catch (err: any) {
      console.error(err);
      setErrorMsg({
        en: err.errorEn || "Authentication failed. Validate credentials and try again.",
        bn: err.errorBn || "লগইন ব্যর্থ হয়েছে। অনুগ্রহ করে আপনার ইমেইল ও পাসওয়ার্ড পুনরায় পরীক্ষা করুন।"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const user = await api.register(
        email,
        password,
        name,
        isAdmin ? "admin" : "student",
        isAdmin ? permitCode : undefined
      );
      setSuccessMsg(lang === "en" ? "Registration success! Sign in now." : "নিবন্ধন সফল হয়েছে! অনুগ্রহ করে সাইন ইন করুন।");
      setIsRegister(false);
      setPassword("");
    } catch (err: any) {
      console.error(err);
      setErrorMsg({
        en: err.errorEn || "Registration failed. Verify details.",
        bn: err.errorBn || "নিবন্ধন অসম্পূর্ণ রয়ে গিয়েছে। অনুগ্রহ করে সঠিক তথ্য প্রদান করুন।"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGuestEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const guest = await api.guestLogin(guestName);
      onAuthSuccess(guest);
    } catch (err: any) {
      console.error(err);
      setErrorMsg({
        en: err.errorEn || "Failed to issue Guest session.",
        bn: err.errorBn || "গেস্ট অ্যাক্সেস সেশন চালু করতে সমস্যা হয়েছে।"
      });
    } finally {
      setLoading(false);
    }
  };

  const preseedDemo = (emailVal: string, passVal: string) => {
    setEmail(emailVal);
    setPassword(passVal);
    setIsRegister(false);
    setShowGuestForm(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between" id="auth-screen-container">
      {/* Upper Status Ribbon */}
      <header className="bg-white border-b border-slate-100 py-3 px-6 shadow-xs flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 text-white p-2 rounded-xl flex items-center justify-center">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="font-sans font-bold tracking-tight text-xl text-slate-800">EXAMSHALL</h1>
            <p className="text-[10px] text-slate-500 font-mono tracking-wider">PORTAL :: GLOBAL</p>
          </div>
        </div>
        
        <button
          onClick={onLanguageToggle}
          id="lang-toggle-btn"
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white shadow-xs font-sans text-xs font-semibold text-slate-700 hover:bg-slate-50 uppercase tracking-wider cursor-pointer transform hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
          {t.languageToggle}
        </button>
      </header>

      {/* Main Form Centerpiece */}
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white max-w-md w-full rounded-2xl border border-slate-100 shadow-xl overflow-hidden"
          id="auth-card"
        >
          {/* Header Title Accent */}
          <div className="bg-indigo-600 px-6 py-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-700 to-violet-600 opacity-90"></div>
            <div className="relative z-10 flex flex-col items-center">
              <Sparkles className="w-8 h-8 text-indigo-200 mb-2" />
              <h2 className="text-2xl font-bold font-sans tracking-tight text-white mb-1">
                {t.appName}
              </h2>
              <p className="text-xs text-indigo-100 font-medium tracking-wide">
                {t.tagline}
              </p>
            </div>
            {/* Visual ripple effect bottom */}
            <div className="absolute -bottom-1 left-0 right-0 h-4 bg-white rounded-t-2xl"></div>
          </div>

          <div className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {/* Form Toggles */}
              <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                <button
                  type="button"
                  id="tab-toggle-login"
                  onClick={() => { setIsRegister(false); setShowGuestForm(false); setErrorMsg(null); }}
                  className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg cursor-pointer transition-all ${
                    !isRegister && !showGuestForm ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {lang === "en" ? "Sign In" : "সাইন ইন করুন"}
                </button>
                <button
                  type="button"
                  id="tab-toggle-register"
                  onClick={() => { setIsRegister(true); setShowGuestForm(false); setErrorMsg(null); }}
                  className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg cursor-pointer transition-all ${
                    isRegister && !showGuestForm ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {lang === "en" ? "Register Student" : "শিক্ষার্থী নিবন্ধন"}
                </button>
                <button
                  type="button"
                  id="tab-toggle-guest"
                  onClick={() => { setShowGuestForm(true); setIsRegister(false); setErrorMsg(null); }}
                  className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg cursor-pointer transition-all ${
                    showGuestForm ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {lang === "en" ? "Guest Play" : "অতিথি মোড"}
                </button>
              </div>

              {/* Status Indicator Alerts */}
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border-l-4 border-red-500 p-3 mb-4 rounded-r-lg text-xs flex items-start gap-2.5"
                  id="auth-error-alert"
                >
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-red-800">{lang === "en" ? "System Notification" : "সিস্টেম নোটিফিকেশন"}</h5>
                    <p className="text-red-700 leading-relaxed font-medium">
                      {lang === "en" ? errorMsg.en : errorMsg.bn}
                    </p>
                  </div>
                </motion.div>
              )}

              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-emerald-50 border-l-4 border-emerald-500 p-3 mb-4 rounded-r-lg text-xs text-emerald-800 font-medium"
                  id="auth-success-alert"
                >
                  {successMsg}
                </motion.div>
              )}

              {/* Render dynamic forms */}
              {showGuestForm ? (
                <motion.form
                  key="guest-form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onSubmit={handleGuestEntry}
                  className="space-y-4"
                  id="guest-auth-form"
                >
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="field-guest-name">
                      {t.nameLabel}
                    </label>
                    <input
                      type="text"
                      className="w-full text-sm py-2 px-3 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 rounded-lg outline-hidden text-slate-800 placeholder-slate-400 bg-slate-50/50"
                      id="field-guest-name"
                      required
                      placeholder={lang === "en" ? "Type your name to start instantly..." : "আপনার সম্পূর্ণ নাম লিখুন..."}
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    id="guest-submit-btn"
                    disabled={loading}
                    className="w-full flex justify-center items-center gap-2 text-sm bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2 px-4 rounded-lg transform hover:scale-[1.01] cursor-pointer transition-all disabled:opacity-50"
                  >
                    <Compass className="w-4 h-4" />
                    {loading ? "..." : t.enterAsGuestBtn}
                  </button>
                </motion.form>
              ) : isRegister ? (
                <motion.form
                  key="register-form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onSubmit={handleRegister}
                  className="space-y-4"
                  id="register-auth-form"
                >
                  {/* Name Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="reg-name">
                      {t.nameLabel}
                    </label>
                    <input
                      type="text"
                      className="w-full text-sm py-2 px-3 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 rounded-lg outline-hidden text-slate-800 placeholder-slate-400 bg-slate-50/50"
                      id="reg-name"
                      required
                      placeholder={lang === "en" ? "Sajid Hasan" : "সাজিদ হাসান"}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  {/* Email Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="reg-email">
                      {t.emailLabel}
                    </label>
                    <input
                      type="email"
                      className="w-full text-sm py-2 px-3 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 rounded-lg outline-hidden text-slate-800 placeholder-slate-400 bg-slate-50/50"
                      id="reg-email"
                      required
                      placeholder="student@quiz.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  {/* Password Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="reg-password">
                      {t.passwordLabel}
                    </label>
                    <input
                      type="password"
                      className="w-full text-sm py-2 px-3 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 rounded-lg outline-hidden text-slate-800 placeholder-slate-400 bg-slate-50/50"
                      id="reg-password"
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  {/* Administrative Permit Toggle */}
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAdmin}
                        id="reg-is-admin"
                        onChange={(e) => {
                          setIsAdmin(e.target.checked);
                          setErrorMsg(null);
                        }}
                        className="w-4 h-4 rounded-md text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                      {t.hasPermitCheckbox}
                    </label>
                    
                    <AnimatePresence>
                      {isAdmin && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 overflow-hidden"
                        >
                          <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="reg-permit">
                            {t.permitCodeLabel} <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="reg-permit"
                            className="w-full text-sm py-1.5 px-3 border border-amber-300 focus:border-amber-500 rounded-lg outline-hidden text-slate-800 bg-amber-50/30"
                            placeholder={t.permitCodePlaceholder}
                            value={permitCode}
                            onChange={(e) => setPermitCode(e.target.value)}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <button
                    type="submit"
                    id="register-submit-btn"
                    disabled={loading}
                    className="w-full flex justify-center items-center gap-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transform hover:scale-[1.01] cursor-pointer transition-all disabled:opacity-50"
                  >
                    <UserPlus className="w-4 h-4" />
                    {loading ? "..." : t.registerBtn}
                  </button>
                </motion.form>
              ) : (
                <motion.form
                  key="login-form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onSubmit={handleLogin}
                  className="space-y-4"
                  id="login-auth-form"
                >
                  {/* Email Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="log-email">
                      {t.emailLabel}
                    </label>
                    <input
                      type="email"
                      className="w-full text-sm py-2 px-3 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 rounded-lg outline-hidden text-slate-800 placeholder-slate-400 bg-slate-50/50"
                      id="log-email"
                      required
                      placeholder="e.g., student@quiz.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  {/* Password Input */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider" htmlFor="log-password">
                        {t.passwordLabel}
                      </label>
                      <button
                        type="button"
                        id="forgot-password"
                        onClick={() => alert(lang === "en" ? "For this evaluation portal, use the supplied preseeded accounts list below." : "এই প্রোটোটাইপ ইভ্যালুয়েশনের জন্য নিচের তালিকাভুক্ত অ্যাকাউন্টসমূহ ব্যবহার করুন।")}
                        className="text-[11px] font-semibold text-indigo-500 hover:text-indigo-600 focus:outline-hidden"
                      >
                        {t.forgotPasswordBtn}
                      </button>
                    </div>
                    <input
                      type="password"
                      className="w-full text-sm py-2 px-3 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 rounded-lg outline-hidden text-slate-800 placeholder-slate-400 bg-slate-50/50"
                      id="log-password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    id="login-submit-btn"
                    disabled={loading}
                    className="w-full flex justify-center items-center gap-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transform hover:scale-[1.01] cursor-pointer transition-all disabled:opacity-50"
                  >
                    <LogIn className="w-4 h-4" />
                    {loading ? "..." : t.loginBtn}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>

      {/* Preseeded Hints Area */}
      <footer className="bg-slate-100/80 border-t border-slate-200 py-5 px-6" id="auth-screen-footer">
        <div className="max-w-2xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between text-slate-500">
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-5 h-5 text-indigo-500 animate-bounce" />
            <p className="text-xs font-medium leading-normal">
              {t.demoHint}
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => preseedDemo("admin@quiz.com", "admin123")}
              id="hint-admin"
              className="py-1 px-2.5 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold uppercase cursor-pointer"
            >
              Demo Admin (অ্যাডমিন)
            </button>
            <button
              onClick={() => preseedDemo("student@quiz.com", "student123")}
              id="hint-student"
              className="py-1 px-2.5 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold uppercase cursor-pointer"
            >
              Demo Student (ছাত্র)
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
