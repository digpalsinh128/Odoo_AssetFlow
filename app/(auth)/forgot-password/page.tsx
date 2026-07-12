"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4 relative overflow-hidden">
      {/* Decorative background blur objects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -z-10 animate-pulse delay-700"></div>

      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-md border border-slate-800 p-8 rounded-2xl shadow-2xl transition-all duration-300 hover:border-slate-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
            Reset Password
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            {!submitted
              ? "Enter your email to receive reset instructions"
              : "Check your email inbox"}
          </p>
        </div>

        {submitted ? (
          <div className="space-y-6">
            <div className="p-4 bg-emerald-950/50 border border-emerald-800 text-emerald-300 rounded-lg text-sm text-center">
              If an account is associated with <span className="font-semibold">{email}</span>, we have sent instructions to reset your password.
            </div>
            <Link
              href="/login"
              className="block w-full text-center bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium rounded-lg px-4 py-3 transition-all duration-200"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-200"
                placeholder="name@company.com"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium rounded-lg px-4 py-3 transition-all duration-200 shadow-lg shadow-indigo-900/20 active:scale-[0.98]"
            >
              Send Reset Instructions
            </button>

            <div className="mt-8 text-center border-t border-slate-800 pt-6">
              <Link
                href="/login"
                className="text-xs text-purple-400 hover:text-purple-300 font-semibold transition-colors"
              >
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
