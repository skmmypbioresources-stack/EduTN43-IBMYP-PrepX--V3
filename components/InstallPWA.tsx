import React, { useState, useEffect } from 'react';
import { 
  Download, Laptop, CheckCircle, Smartphone, Monitor, ShieldCheck, 
  Terminal, ArrowDownToLine, Sparkles 
} from 'lucide-react';
import { downloadWindowsDesktopInstaller, downloadDirectDesktopShortcut } from '../services/desktopInstaller';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    return (window as any).__pwaPrompt || null;
  });
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    // Check if running in standalone mode (already running as installed desktop application)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    setIsInstalled(isStandalone);

    const updatePrompt = () => {
      if ((window as any).__pwaPrompt) {
        setDeferredPrompt((window as any).__pwaPrompt);
      }
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).__pwaPrompt = e;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      (window as any).__pwaPrompt = null;
    };

    window.addEventListener('pwa_prompt_ready', updatePrompt);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    updatePrompt();

    return () => {
      window.removeEventListener('pwa_prompt_ready', updatePrompt);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerDirectInstall = async () => {
    const promptEvent = deferredPrompt || (window as any).__pwaPrompt;
    
    if (promptEvent && typeof promptEvent.prompt === 'function') {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice && choice.outcome === 'accepted') {
          setIsInstalled(true);
          (window as any).__pwaPrompt = null;
          setDeferredPrompt(null);
          return true;
        }
      } catch (err) {
        console.warn('Native install prompt error, falling back to desktop shortcut generator:', err);
      }
    }
    
    // Download desktop shortcut and launcher
    downloadDirectDesktopShortcut(window.location.origin, 'GSIS IBMYP - PrepX Attendance');
    return false;
  };

  const runWindowsInstaller = () => {
    downloadWindowsDesktopInstaller(window.location.origin, 'GSIS PrepX Attendance');
  };

  return { 
    deferredPrompt, 
    isInstalled, 
    triggerDirectInstall,
    runWindowsInstaller
  };
};

interface InstallPWAProps {
  variant?: 'navbar' | 'banner' | 'card';
}

export const InstallPWA: React.FC<InstallPWAProps> = ({ variant = 'navbar' }) => {
  const { isInstalled, triggerDirectInstall, runWindowsInstaller } = usePWAInstall();
  const [notification, setNotification] = useState<string | null>(null);

  if (isInstalled) {
    if (variant === 'navbar') return null;
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold shadow-sm">
        <CheckCircle className="w-4 h-4 text-emerald-600" /> Desktop App Installed
      </div>
    );
  }

  const handleInstallClick = async () => {
    const accepted = await triggerDirectInstall();
    if (accepted) {
      setNotification('App installed successfully to your desktop & start menu!');
    } else {
      setNotification('Desktop app shortcut downloaded! Double-click to launch.');
    }
    setTimeout(() => setNotification(null), 5000);
  };

  const handleWindowsInstallerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    runWindowsInstaller();
    setNotification('Windows desktop installer (.cmd) downloaded! Run it to create a permanent desktop icon.');
    setTimeout(() => setNotification(null), 6000);
  };

  return (
    <>
      {variant === 'navbar' && (
        <button
          onClick={handleInstallClick}
          className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-black px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md shadow-emerald-950/20 transition-all cursor-pointer"
          title="Install as dedicated desktop software"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Install Desktop App</span>
          <span className="md:hidden">Install</span>
        </button>
      )}

      {variant === 'card' && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-indigo-500/30 text-left relative overflow-hidden group">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl group-hover:bg-indigo-500/30 transition-all pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shrink-0 border border-white/20 shadow-xl shadow-indigo-950">
                <Monitor className="w-8 h-8 text-white hidden sm:block" />
                <Smartphone className="w-8 h-8 text-white sm:hidden" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <h4 className="font-extrabold text-lg text-white tracking-tight">
                    Install GSIS PrepX Desktop Software
                  </h4>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-black px-2.5 py-0.5 rounded-full border border-emerald-500/40 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Standalone Desktop App
                  </span>
                </div>
                <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                  Installs a permanent desktop icon and standalone window application. Stays on your Windows/Mac desktop and Start Menu with no browser bars and instant camera QR scanning.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
              <button
                onClick={handleInstallClick}
                className="bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black px-6 py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Install to Desktop
              </button>

              <button
                onClick={handleWindowsInstallerClick}
                className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700 font-bold px-4 py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                title="Download Windows Desktop shortcut installer script"
              >
                <Terminal className="w-3.5 h-3.5 text-blue-400" />
                Windows Installer (.cmd)
              </button>
            </div>
          </div>

          {notification && (
            <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{notification}</span>
            </div>
          )}
        </div>
      )}
    </>
  );
};
