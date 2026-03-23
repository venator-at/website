'use client'
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { InView } from 'react-intersection-observer';

type Mode = 'light' | 'dark';

interface Props {
  mode: Mode;
}

export const WaitlistComponent = ({ mode }: Props) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (email.trim() === '' || !email.includes('@')) {
      return;
    }
    setSubmitted(true);
    setEmail('');
  };

  const isEmailValid = email.trim() !== '' && email.includes('@');

  return (
    <div className="flex justify-center items-center py-20">
      <InView triggerOnce threshold={0.5}>
        {({ inView, ref }) => (
          <div
            ref={ref}
            className={`${
              mode === 'dark'
                ? 'bg-black/60 border border-zinc-600 backdrop-blur-md'
                : 'bg-white'
            } w-full max-w-md mx-auto rounded-xl ${submitted ? 'p-1' : 'p-6'} z-50`}
          >
            {!submitted ? (
              <div>
                <div className="text-center">
                  <motion.h2
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : -20 }}
                    transition={{ duration: 0.5 }}
                    className={`${
                      mode === 'dark' ? 'text-white' : 'text-gray-800'
                    } text-3xl font-bold mb-4`}
                  >
                    Join the waitlist
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: inView ? 1 : 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className={`${
                      mode === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    } text-sm mb-6`}
                  >
                    Be the first to access Venator when it launches. Enter your email to secure your spot.
                  </motion.p>
                </div>
                <motion.form
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 20 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="flex items-center justify-center"
                  onSubmit={handleSubmit}
                >
                  <input
                    type="email"
                    placeholder="Your email"
                    className="flex-1 w-full bg-zinc-900 appearance-none rounded-l-full py-2 px-4 text-gray-200 placeholder-gray-500 leading-tight focus:outline-none border border-zinc-600 focus:border-cyan-400/60"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <motion.button
                    type="submit"
                    disabled={!isEmailValid}
                    className={`bg-cyan-500 text-black font-semibold py-[9px] px-6 rounded-r-full focus:outline-none ${
                      isEmailValid
                        ? 'cursor-pointer hover:bg-cyan-400'
                        : 'cursor-not-allowed opacity-40'
                    }`}
                  >
                    Join
                  </motion.button>
                </motion.form>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 20 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-center py-6"
              >
                <motion.h2
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className={`${
                    mode === 'dark' ? 'text-white' : 'text-gray-800'
                  } text-2xl font-bold mb-4`}
                >
                  You&apos;re on the list!
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className={`${
                    mode === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  } mb-6`}
                >
                  Thanks for joining. We&apos;ll notify you as soon as Venator is ready.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="text-cyan-400 w-16 h-16 mx-auto mb-4"
                  >
                    <path
                      fillRule="evenodd"
                      d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </motion.div>
              </motion.div>
            )}
          </div>
        )}
      </InView>
    </div>
  );
};
