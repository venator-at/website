'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Database, Server, Cloud, Code, Globe, Cpu, Shield, Layers } from 'lucide-react';
import { signUpWithEmail, signInWithGoogle } from '@/lib/firebase/auth';
import {
  Ripple,
  TechOrbitDisplay,
  AnimatedForm,
} from '@/components/blocks/ModernAnimatedSignIn';
import type { IconConfig } from '@/components/blocks/ModernAnimatedSignIn';

const orbitIcons: IconConfig[] = [
  {
    component: () => <Database className="h-6 w-6 text-cyan-400" />,
    className: 'size-[36px] border-none bg-transparent',
    duration: 20,
    delay: 20,
    radius: 100,
    path: false,
    reverse: false,
  },
  {
    component: () => <Server className="h-6 w-6 text-emerald-400" />,
    className: 'size-[36px] border-none bg-transparent',
    duration: 20,
    delay: 10,
    radius: 100,
    path: false,
    reverse: false,
  },
  {
    component: () => <Cloud className="h-7 w-7 text-sky-400" />,
    className: 'size-[40px] border-none bg-transparent',
    radius: 170,
    duration: 25,
    path: false,
    reverse: false,
  },
  {
    component: () => <Code className="h-7 w-7 text-violet-400" />,
    className: 'size-[40px] border-none bg-transparent',
    radius: 170,
    duration: 25,
    delay: 20,
    path: false,
    reverse: false,
  },
  {
    component: () => <Globe className="h-6 w-6 text-blue-400" />,
    className: 'size-[36px] border-none bg-transparent',
    duration: 20,
    delay: 15,
    radius: 170,
    path: false,
    reverse: true,
  },
  {
    component: () => <Cpu className="h-8 w-8 text-pink-400" />,
    className: 'size-[44px] border-none bg-transparent',
    radius: 240,
    duration: 30,
    delay: 20,
    path: false,
    reverse: true,
  },
  {
    component: () => <Shield className="h-8 w-8 text-yellow-400" />,
    className: 'size-[44px] border-none bg-transparent',
    radius: 240,
    duration: 30,
    path: false,
    reverse: true,
  },
  {
    component: () => <Layers className="h-8 w-8 text-orange-400" />,
    className: 'size-[44px] border-none bg-transparent',
    radius: 240,
    duration: 30,
    delay: 60,
    path: false,
    reverse: true,
  },
];

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(_event: FormEvent<HTMLFormElement>) {
    setError('');
    if (password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein.');
      return;
    }
    setLoading(true);
    try {
      await signUpWithEmail(email, password);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignup() {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function goToLogin(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    router.push('/login');
  }

  const formFields = {
    header: 'Konto erstellen',
    subHeader: 'Starten Sie kostenlos mit der Architekturplanung',
    fields: [
      {
        label: 'E-Mail',
        required: true,
        type: 'email' as const,
        placeholder: 'ihre@email.de',
        onChange: (event: ChangeEvent<HTMLInputElement>) =>
          setEmail(event.target.value),
      },
      {
        label: 'Passwort',
        required: true,
        type: 'password' as const,
        placeholder: 'Mindestens 6 Zeichen',
        onChange: (event: ChangeEvent<HTMLInputElement>) =>
          setPassword(event.target.value),
      },
    ],
    submitButton: loading ? 'Konto wird erstellt…' : 'Konto erstellen',
    textVariantButton: 'Bereits registriert? Jetzt anmelden',
  };

  return (
    <section className="flex min-h-screen">
      {/* Left Side — orbit display */}
      <span className="relative flex flex-col justify-center w-1/2 max-lg:hidden overflow-hidden">
        <Ripple mainCircleSize={120} />
        <TechOrbitDisplay iconsArray={orbitIcons} text="Venator" />
        <Link
          href="/"
          className="absolute top-6 left-6 inline-flex items-center gap-2 z-10"
        >
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-sm font-bold">
            VN
          </div>
          <span className="text-lg font-bold text-slate-100">Venator</span>
        </Link>
      </span>

      {/* Right Side — form */}
      <span className="w-1/2 h-screen flex flex-col justify-center items-center max-lg:w-full max-lg:px-[10%] px-8">
        {/* Mobile logo */}
        <Link
          href="/"
          className="lg:hidden inline-flex items-center gap-2 mb-8"
        >
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-sm font-bold">
            VN
          </div>
          <span className="text-xl font-bold text-slate-100">Venator</span>
        </Link>

        <AnimatedForm
          {...formFields}
          fieldPerRow={1}
          onSubmit={handleSubmit}
          goTo={goToLogin}
          googleLogin="Mit Google registrieren"
          onGoogleLogin={handleGoogleSignup}
          errorField={error || undefined}
        />
      </span>
    </section>
  );
}

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = (err as { code: string }).code;
    switch (code) {
      case 'auth/email-already-in-use':
        return 'Ein Konto mit dieser E-Mail-Adresse existiert bereits.';
      case 'auth/weak-password':
        return 'Passwort muss mindestens 6 Zeichen lang sein.';
      case 'auth/invalid-email':
        return 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
      case 'auth/popup-closed-by-user':
        return 'Anmeldung abgebrochen.';
      default:
        return 'Etwas ist schiefgelaufen. Bitte erneut versuchen.';
    }
  }
  return 'Etwas ist schiefgelaufen. Bitte erneut versuchen.';
}
