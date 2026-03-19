You are given a task to integrate an existing React component in the codebase

The codebase should support:
- shadcn project structure  
- Tailwind CSS
- Typescript

If it doesn't, provide instructions on how to setup project via shadcn CLI, install Tailwind or Typescript.

Determine the default path for components and styles. 
If default path for components is not /components/ui, provide instructions on why it's important to create this folder
Copy-paste this component to /components/ui folder:
```tsx
venator-landing.tsx
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// --- TYPE DEFINITIONS FOR PROPS ---
interface NavLink { label: string; href: string; }
interface Feature { title: string; description: string; tags: string[]; imageContent?: React.ReactNode; }
interface Stat { value: string; label: string; }

export interface LandingPageProps {
  logo?: { initials: React.ReactNode; name: React.ReactNode; };
  navLinks?: NavLink[];
  actionButton?: { label: string; onClick?: () => void; };
  hero?: { titleLine1: React.ReactNode; titleLine2Gradient: React.ReactNode; subtitle: React.ReactNode; };
  ctaButtons?: { primary: { label: string; onClick?: () => void; }; secondary: { label: string; onClick?: () => void; }; };
  features?: Feature[];
  stats?: Stat[];
  showAnimatedBackground?: boolean;
}

// --- INTERNAL ANIMATED BACKGROUND COMPONENT ---
const AuroraBackground: React.FC = () => {
    const mountRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!mountRef.current) return;
        const currentMount = mountRef.current;
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.domElement.style.position = 'fixed';
        renderer.domElement.style.top = '0';
        renderer.domElement.style.left = '0';
        renderer.domElement.style.zIndex = '0';
        renderer.domElement.style.display = 'block';
        currentMount.appendChild(renderer.domElement);
        const material = new THREE.ShaderMaterial({
            uniforms: { iTime: { value: 0 }, iResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) } },
            vertexShader: `void main() { gl_Position = vec4(position, 1.0); }`,
            fragmentShader: `
                uniform float iTime; uniform vec2 iResolution;
                #define NUM_OCTAVES 3
                float rand(vec2 n) { return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453); }
                float noise(vec2 p){ vec2 ip=floor(p);vec2 u=fract(p);u=u*u*(3.0-2.0*u);float res=mix(mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);return res*res; }
                float fbm(vec2 x) { float v=0.0;float a=0.3;vec2 shift=vec2(100);mat2 rot=mat2(cos(0.5),sin(0.5),-sin(0.5),cos(0.50));for(int i=0;i<NUM_OCTAVES;++i){v+=a*noise(x);x=rot*x*2.0+shift;a*=0.4;}return v;}
                void main() {
                    vec2 p=((gl_FragCoord.xy)-iResolution.xy*0.5)/iResolution.y*mat2(6.,-4.,4.,6.);vec4 o=vec4(0.);float f=2.+fbm(p+vec2(iTime*5.,0.))*.5;
                    for(float i=0.;i++<35.;){vec2 v=p+cos(i*i+(iTime+p.x*.08)*.025+i*vec2(13.,11.))*3.5;float tailNoise=fbm(v+vec2(iTime*.5,i))*.3*(1.-(i/35.));vec4 auroraColors=vec4(.1+.3*sin(i*.2+iTime*.4),.3+.5*cos(i*.3+iTime*.5),.7+.3*sin(i*.4+iTime*.3),1.);vec4 currentContribution=auroraColors*exp(sin(i*i+iTime*.8))/length(max(v,vec2(v.x*f*.015,v.y*1.5)));float thinnessFactor=smoothstep(0.,1.,i/35.)*.6;o+=currentContribution*(1.+tailNoise*.8)*thinnessFactor;}
                    o=tanh(pow(o/100.,vec4(1.6)));gl_FragColor=o*1.5;
                }`
        });
        const geometry = new THREE.PlaneGeometry(2, 2);
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        let animationFrameId: number;
        const animate = () => { animationFrameId = requestAnimationFrame(animate); material.uniforms.iTime.value += 0.016; renderer.render(scene, camera); };
        const handleResize = () => { renderer.setSize(window.innerWidth, window.innerHeight); material.uniforms.iResolution.value.set(window.innerWidth, window.innerHeight); };
        window.addEventListener('resize', handleResize);
        animate();
        return () => { cancelAnimationFrame(animationFrameId); window.removeEventListener('resize', handleResize); if (currentMount.contains(renderer.domElement)) currentMount.removeChild(renderer.domElement); renderer.dispose(); material.dispose(); geometry.dispose(); };
    }, []);
    return <div ref={mountRef} className="fixed inset-0 z-0 pointer-events-none" />;
};

// --- DEFAULT DATA ---
const defaultData = {
  logo: { initials: 'VN', name: 'Venator' },
  navLinks: [ { label: 'Features', href: '#features' }, { label: 'How it Works', href: '#how-it-works' }, { label: 'Tech Stack', href: '#tech-stack' } ],
  actionButton: { label: 'Start Project' },
  hero: { titleLine1: 'Plan your next', titleLine2Gradient: 'Software Architecture', subtitle: 'An interactive platform that guides beginners and junior developers through planning complex software projects with AI-powered recommendations.', },
  ctaButtons: { primary: { label: 'Start Project Wizard' }, secondary: { label: 'View Examples' }, },
  features: [ { title: 'Structured Planning', description: 'Step-by-step wizard to choose your Backend, Database, Hosting, and more.', tags: ['Wizard', 'Step-by-Step'] }, { title: 'AI Recommendations', description: 'Get tailored technology suggestions with pros, cons, and beginner-friendliness.', tags: ['Claude AI', 'Guidance'] }, { title: 'Interactive Graph', description: 'Visualize your decisions as a dynamic architecture graph with React Flow.', tags: ['React Flow', 'Visualization'] }, ],
  stats: [ { value: '10+', label: 'Tech Categories' }, { value: '100%', label: 'Beginner Friendly' }, { value: '24/7', label: 'AI Advisor' }, ],
};

// --- MAIN CUSTOMIZABLE PORTFOLIO COMPONENT ---
const LandingPage: React.FC<LandingPageProps> = ({
  logo = defaultData.logo,
  navLinks = defaultData.navLinks,
  actionButton = defaultData.actionButton,
  hero = defaultData.hero,
  ctaButtons = defaultData.ctaButtons,
  features = defaultData.features,
  stats = defaultData.stats,
  showAnimatedBackground = true,
}) => {
  return (
    <div className="bg-background text-foreground geist-font min-h-screen relative overflow-hidden">
      {showAnimatedBackground && <AuroraBackground />}
      <div className="relative z-10 w-full">
        <nav className="w-full px-6 py-4">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-border backdrop-blur-md border border-border flex items-center justify-center">
                        <span className="geist-font text-sm font-bold text-foreground">{logo.initials}</span>
                    </div>
                    <span className="geist-font text-lg font-medium text-foreground">{logo.name}</span>
                </div>
                <div className="hidden md:flex items-center space-x-8">
                    {navLinks.map(link => (
                        <a key={link.label} href={link.href} className="text-muted-foreground hover:text-foreground transition-colors inter-font text-sm">{link.label}</a>
                    ))}
                </div>
                <button onClick={actionButton.onClick} className="glass-button px-4 py-2 rounded-lg text-foreground text-sm font-medium inter-font border border-border bg-background/50 backdrop-blur-md hover:bg-accent hover:text-accent-foreground transition-colors">{actionButton.label}</button>
            </div>
        </nav>
        <div className="divider h-px w-full bg-border" />
        <main id="about" className="w-full min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-6 py-20 pb-32">
            <div className="max-w-6xl mx-auto text-center">
                <div className="mb-8 float-animation">
                    <h1 className="md:text-6xl lg:text-7xl leading-[1.1] geist-font text-5xl font-light text-foreground tracking-tight mb-4">
                        {hero.titleLine1}
                        <span className="gradient-text block tracking-tight font-medium bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">{hero.titleLine2Gradient}</span>
                    </h1>
                    <p className="md:text-xl max-w-3xl leading-relaxed inter-font text-lg font-light text-muted-foreground mx-auto">{hero.subtitle}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                    <button onClick={ctaButtons.primary.onClick} className="primary-button bg-foreground text-background hover:bg-foreground/90 px-6 py-3 rounded-lg font-medium text-sm min-w-[160px] transition-colors shadow-lg">{ctaButtons.primary.label}</button>
                    <button onClick={ctaButtons.secondary.onClick} className="glass-button min-w-[160px] inter-font text-sm font-medium text-foreground rounded-lg px-6 py-3 border border-border backdrop-blur-sm bg-background/30 hover:bg-accent/50 transition-colors">{ctaButtons.secondary.label}</button>
                </div>
                <div className="divider mb-16 h-px w-full bg-border/50" />
                <div id="features" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
                    {features.map((feature, index) => (
                        <div key={index} className="glass-card rounded-2xl p-6 text-left border border-border bg-card/30 backdrop-blur-md hover:bg-card/60 transition-colors shadow-sm">
                            <div className="project-image rounded-xl h-32 mb-4 flex items-center justify-center bg-muted/50 overflow-hidden">{feature.imageContent}</div>
                            <h3 className="text-lg font-medium text-card-foreground mb-2 geist-font">{feature.title}</h3>
                            <p className="text-muted-foreground text-sm inter-font mb-4">{feature.description}</p>
                            <div className="flex flex-wrap gap-2">
                                {feature.tags.map(tag => (
                                    <span key={tag} className="skill-badge px-2 py-1 rounded text-xs text-muted-foreground bg-secondary/80 border border-border/50">{tag}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="divider mb-16 h-px w-full bg-border/50" />
                <div id="stats" className="flex flex-col sm:flex-row justify-center items-center gap-8 text-center">
                    {stats.map((stat, index) => (
                        <React.Fragment key={stat.label}>
                            <div>
                                <div className="text-3xl md:text-4xl font-light text-foreground mb-1 geist-font tracking-tight">{stat.value}</div>
                                <div className="text-muted-foreground text-sm inter-font font-normal">{stat.label}</div>
                            </div>
                            {index < stats.length - 1 && <div className="hidden sm:block w-px h-12 bg-gradient-to-b from-transparent via-border to-transparent" />}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </main>
      </div>
    </div>
  );
};

export { LandingPage };

demo.tsx
import { LandingPage, LandingPageProps } from "@/components/ui/venator-landing";

const customLandingData: LandingPageProps = {
  logo: {
    initials: 'VN',
    name: 'Venator',
  },
  navLinks: [
    { label: 'Overview', href: '#about' },
    { label: 'Capabilities', href: '#features' },
    { label: 'Design', href: '#stats' },
  ],
  actionButton: {
    label: 'Login',
    onClick: () => alert('Navigating to login...'),
  },
  hero: {
    titleLine1: 'Design your app\'s',
    titleLine2Gradient: 'Architecture with AI',
    subtitle: 'Venator takes your project idea and builds a comprehensive tech stack and visual architecture graph tailored to your needs.',
  },
  ctaButtons: {
    primary: {
      label: 'Try the Wizard',
      onClick: () => { document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); },
    },
    secondary: {
      label: 'Read the Docs',
      onClick: () => { window.location.href = '/docs'; },
    },
  },
  features: [
    { 
      title: 'Next.js App Router', 
      description: 'Built with the latest React Server Components and Server Actions for optimal performance.',
      tags: ['Next.js 15', 'TypeScript'] 
    },
    { 
      title: 'Supabase Integration', 
      description: 'Seamless authentication and PostgreSQL database setup out of the box.',
      tags: ['Auth', 'PostgreSQL'] 
    },
    { 
      title: 'Claude AI Powered', 
      description: 'Leveraging Anthropic\'s Claude 3.5 Sonnet to provide expert architectural advices.',
      tags: ['AI', 'Anthropic API'],
      imageContent: <div className="text-4xl text-white/50">✨</div>
    },
  ],
  stats: [
    { value: 'Step-by-Step', label: 'Guided Planning' },
    { value: 'AI Generated', label: 'Architecture Graphs' },
    { value: 'Production', label: 'Ready Tech Stacks' },
  ],
  showAnimatedBackground: true,
};

const DemoOne = () => {
  return <LandingPage {...customLandingData} />;
};

export { DemoOne };

```

Install NPM dependencies:
```bash
npm install three
```

Extend existing Tailwind 4 index.css with this code (or if project uses Tailwind 3, extend tailwind.config.js or globals.css):
```css
@import "tailwindcss";
@import "tw-animate-css";

/* Venator Animation Overrides */
@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

.float-animation {
  animation: float 6s ease-in-out infinite;
}
```

Implementation Guidelines
 1. Analyze the component structure and identify all required dependencies
 2. Review the component's arguments and state
 3. Identify any required context providers or hooks and install them
 4. Questions to Ask
 - What data/props will be passed to this component?
 - Are there any specific state management requirements?
 - Are there any required assets (images, icons, etc.)?
 - What is the expected responsive behavior?
 - What is the best place to use this component in the app?

Steps to integrate
 0. Copy paste all the code above in the correct directories
 1. Install external dependencies
 2. Fill image assets with actual SVGs or components for the Venator features
 3. Use lucide-react icons for svgs or logos if component requires them
