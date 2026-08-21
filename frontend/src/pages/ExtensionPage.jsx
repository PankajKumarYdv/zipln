import { motion } from 'framer-motion';
import { GlassCard } from '../components/GlassCard.jsx';
import { Link } from 'react-router-dom';

const fade = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
};

export function ExtensionPage() {
  return (
    <div className="relative overflow-hidden pt-24 pb-32">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute top-0 right-0 h-[600px] w-[600px] translate-x-1/3 -translate-y-1/4 rounded-full bg-violet-300/30 blur-3xl" />
        <div className="absolute top-1/2 left-0 h-[500px] w-[500px] -translate-x-1/3 -translate-y-1/2 rounded-full bg-sky-300/20 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6">
        <div className="flex flex-col items-center text-center">
          
          <motion.div
            variants={{ show: { transition: { staggerChildren: 0.1 } } }}
            initial="initial"
            animate="show"
            className="flex flex-col items-center"
          >
            <motion.div variants={fade} className="mb-6 inline-flex rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-semibold text-indigo-600 ring-1 ring-inset ring-indigo-500/20">
              New Feature
            </motion.div>
            <motion.h1
              variants={fade}
              className="font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl"
            >
              Shorten links faster with our{' '}
              <span className="bg-gradient-to-r from-indigo-500 to-cyan-500 bg-clip-text text-transparent">
                Chrome Extension
              </span>
            </motion.h1>
            <motion.p variants={fade} className="mt-6 max-w-2xl text-lg text-slate-600">
              Transform long URLs into sleek short links directly from your browser. 
              Our Chrome extension is designed for speed and productivity, integrating 
              seamlessly into your daily workflow.
            </motion.p>

            <motion.div variants={fade} className="mt-10 grid gap-8 sm:grid-cols-3 text-left">
              <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <h4 className="font-semibold text-slate-900">One-Click Shortening</h4>
                <p className="mt-1 text-sm text-slate-600">Instantly shorten your current active tab with a single click from the popup menu.</p>
              </div>
              <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <h4 className="font-semibold text-slate-900">Smart Context Menus</h4>
                <p className="mt-1 text-sm text-slate-600">Right-click any link on a webpage or highlight text to securely shorten it on the fly.</p>
              </div>
              <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <h4 className="font-semibold text-slate-900">Auto-Clipboard Copy</h4>
                <p className="mt-1 text-sm text-slate-600">Generated short URLs are automatically copied to your clipboard, ready to be pasted.</p>
              </div>
            </motion.div>
            
            <motion.div variants={fade} className="mt-12 flex flex-wrap justify-center gap-4">
              <a
                href="/url-shortener-extension.zip"
                download
                className="btn-primary px-8 py-3.5 text-base flex items-center gap-2 shadow-lg shadow-indigo-500/25"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Download Extension (.zip)
              </a>
              <Link to="/" className="btn-ghost px-8 py-3.5 text-base">
                Back to Home
              </Link>
            </motion.div>

            <motion.div variants={fade} className="mt-16 w-full max-w-2xl border-t border-slate-200 pt-8 text-left">
              <h3 className="font-display text-xl font-semibold text-slate-900 text-center">How to install (Developer Mode)</h3>
              <ol className="mt-6 space-y-4 text-sm text-slate-600">
                <li className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-700">1</span>
                  <span className="mt-1">Download and extract the <strong className="text-slate-900">.zip</strong> file above.</span>
                </li>
                <li className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-700">2</span>
                  <span className="mt-1">Open Chrome and go to <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-indigo-600">chrome://extensions/</code></span>
                </li>
                <li className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-700">3</span>
                  <span className="mt-1">Enable <strong>Developer mode</strong> in the top right corner.</span>
                </li>
                <li className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-700">4</span>
                  <span className="mt-1">Click <strong>Load unpacked</strong> and select the extracted folder.</span>
                </li>
              </ol>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
