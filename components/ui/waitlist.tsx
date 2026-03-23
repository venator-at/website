'use client'
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { addToWaitlist } from '@/lib/firebase/waitlist';

type SubmitState = 'idle' | 'loading' | 'success' | 'duplicate' | 'error';

export const WaitlistComponent = () => {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<SubmitState>('idle');

  const isEmailValid = email.trim() !== '' && email.includes('@');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isEmailValid) return;

    setState('loading');
    try {
      const result = await addToWaitlist(email);
      setState(result.alreadyExists ? 'duplicate' : 'success');
      setEmail('');
    } catch {
      setState('error');
    }
  };

  const isDone = state === 'success' || state === 'duplicate';

  return (
    <div className="relative rounded-2xl border border-slate-700 bg-slate-900/50 backdrop-blur-sm p-8 md:p-12 overflow-hidden">
      {/* Inner glow */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-400/5 via-transparent to-transparent" />

      <div className="relative flex flex-col items-center text-center gap-6 max-w-lg mx-auto">
        {!isDone ? (
          <>
            <motion.h2
              initial={{ opacity: 0, y: -16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.5 }}
              className="text-3xl md:text-4xl font-bold tracking-tight text-slate-50"
            >
              Get early access
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="text-slate-400 text-base leading-relaxed"
            >
              Venator is launching soon. Join the waitlist and be the first to plan your architecture with AI.
            </motion.p>

            <motion.form
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              onSubmit={handleSubmit}
              className="flex w-full max-w-sm flex-col sm:flex-row gap-3"
            >
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={state === 'loading'}
                className="flex-1 rounded-lg bg-slate-800 border border-slate-600 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400/60 disabled:opacity-60 transition-colors"
              />
              <button
                type="submit"
                disabled={!isEmailValid || state === 'loading'}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {state === 'loading' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>Join <ArrowRight className="h-4 w-4" /></>
                )}
              </button>
            </motion.form>

            {state === 'error' && (
              <p className="text-sm text-red-400">Something went wrong. Please try again.</p>
            )}
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center gap-4 py-4"
          >
            <CheckCircle2 className="h-14 w-14 text-cyan-400" strokeWidth={1.5} />
            <h2 className="text-2xl font-bold text-slate-50">
              {state === 'duplicate' ? "You're already on the list!" : "You're on the list!"}
            </h2>
            <p className="text-slate-400">
              {state === 'duplicate'
                ? "We already have your email. We'll notify you when Venator launches."
                : "Thanks for joining. We'll notify you as soon as Venator is ready."}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};
