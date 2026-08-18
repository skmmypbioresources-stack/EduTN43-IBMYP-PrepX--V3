import React, { useState, useEffect } from 'react';
import { Download, Monitor, Smartphone, CheckCircle, Share, PlusSquare, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = async (onShowIosGuide?: () => void) => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      if (onShowIosGuide) onShowIosGuide();
    } else {
      // General fallback guide
      if (onShowIosGuide) onShowIosGuide();
    }
  };

  return { deferredPrompt, isInstalled, isIOS, triggerInstall };
};

interface InstallPWAProps {
  variant?: 'navbar' | 'banner' | 'card';
}

export const InstallPWA: React.FC<InstallPWAProps> = ({ variant = 'navbar' }) => {
  const { isInstalled, isIOS, triggerInstall } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  if (isInstalled) {
    if (variant === 'navbar') return null;
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
        <CheckCircle className="w-3.5 h-3.5" /> Installed App
      </div>
    );
  }

  const handleInstallClick = () => {
    triggerInstall(() => setShowGuideModal(true));
  };

  return (
    <>
      {variant === 'navbar' && (
        <button
          onClick={handleInstallClick}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all animate-pulse"
          title="Install app on Windows, Mac, Chrome, or Mobile"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Install App</span>
          <span className="md:hidden">Install</span>
        </button>
      )}

      {variant === 'card' && (
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-xl border border-indigo-500/20 text-left relative overflow-hidden group">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all pointer-events-none" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0 border border-white/10">
                <Monitor className="w-6 h-6 text-emerald-400 hidden sm:block" />
                <Smartphone className="w-6 h-6 text-emerald-400 sm:hidden" />
              </div>
              <div>
                <h4 className="font-bold text-base text-white flex items-center gap-2">
                  Install PrepX on this Device
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Desktop & Mobile
                  </span>
                </h4>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  Run directly from your Desktop, Taskbar, Chrome, or Mobile Home Screen with instant camera QR scanning and offline access.
                </p>
              </div>
            </div>
            <button
              onClick={handleInstallClick}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 shrink-0 shadow-lg shadow-emerald-950 transition-all"
            >
              <Download className="w-4 h-4" />
              Install Now
            </button>
          </div>
        </div>
      )}

      {/* Manual Installation Guide Modal for iOS Safari / Fallback browsers */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl border border-slate-100 text-slate-900">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Install Application</h3>
                  <p className="text-xs text-slate-500">Add to your device home screen or desktop</p>
                </div>
              </div>
              <button onClick={() => setShowGuideModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {isIOS ? (
              <div className="space-y-4 bg-slate-50 p-4 rounded-xl text-sm border">
                <p className="font-semibold text-slate-800">For iPhone & iPad (Safari):</p>
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">1</span>
                  <span>Tap the <strong className="inline-flex items-center gap-1 font-bold text-blue-600"><Share className="w-4 h-4" /> Share button</strong> in Safari’s bottom bar.</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">2</span>
                  <span>Scroll down and tap <strong className="inline-flex items-center gap-1 font-bold text-blue-600"><PlusSquare className="w-4 h-4" /> Add to Home Screen</strong>.</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4 bg-slate-50 p-4 rounded-xl text-sm border">
                <p className="font-semibold text-slate-800">For Desktop / Chrome / Edge:</p>
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">1</span>
                  <span>Look at the right side of your Chrome/Edge browser address bar for the <strong className="text-blue-600">Install icon (computer with down arrow)</strong>.</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">2</span>
                  <span>Click <strong>Install</strong> to add GSIS PrepX directly to your Desktop and Taskbar.</span>
                </div>
              </div>
            )}

            <div className="mt-6">
              <button
                onClick={() => setShowGuideModal(false)}
                className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl text-sm hover:bg-slate-800"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
