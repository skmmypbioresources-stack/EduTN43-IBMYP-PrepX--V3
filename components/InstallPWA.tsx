import React, { useState, useEffect } from 'react';
import { Download, Laptop, CheckCircle, Smartphone } from 'lucide-react';

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
    // Check if running in standalone mode (already installed desktop app)
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

  const downloadDesktopShortcut = () => {
    const appUrl = window.location.origin;
    const shortcutContent = `[InternetShortcut]\nURL=${appUrl}\nIconIndex=0\nIconFile=${appUrl}/favicon.ico\n`;
    const blob = new Blob([shortcutContent], { type: 'application/internet-shortcut' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'GSIS-IBMYP-PrepX.url';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

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
        }
      } catch (err) {
        console.warn('Native install prompt error, falling back to direct desktop shortcut:', err);
        downloadDesktopShortcut();
      }
    } else {
      // Direct 1-click Desktop Shortcut download
      downloadDesktopShortcut();
    }
  };

  return { 
    deferredPrompt, 
    isInstalled, 
    triggerDirectInstall,
    downloadDesktopShortcut
  };
};

interface InstallPWAProps {
  variant?: 'navbar' | 'banner' | 'card';
}

export const InstallPWA: React.FC<InstallPWAProps> = ({ variant = 'navbar' }) => {
  const { isInstalled, triggerDirectInstall } = usePWAInstall();
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (isInstalled) {
    if (variant === 'navbar') return null;
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold shadow-sm">
        <CheckCircle className="w-3.5 h-3.5" /> App Installed
      </div>
    );
  }

  const handleClick = () => {
    triggerDirectInstall();
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 4000);
  };

  return (
    <>
      {variant === 'navbar' && (
        <button
          onClick={handleClick}
          className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md shadow-emerald-950/20 transition-all cursor-pointer"
          title="Install app to Desktop"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Install to Desktop</span>
          <span className="md:hidden">Install</span>
        </button>
      )}

      {variant === 'card' && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-indigo-500/30 text-left relative overflow-hidden group">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl group-hover:bg-indigo-500/30 transition-all pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shrink-0 border border-white/20 shadow-lg shadow-indigo-950">
                <Laptop className="w-7 h-7 text-white hidden sm:block" />
                <Smartphone className="w-7 h-7 text-white sm:hidden" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h4 className="font-bold text-lg text-white">
                    Install GSIS PrepX on Desktop
                  </h4>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/40 uppercase tracking-wider">
                    Instant 1-Click Install
                  </span>
                </div>
                <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                  Click the button to immediately install the app to your Desktop and Taskbar for quick standalone access.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
              <button
                onClick={handleClick}
                className="flex-1 md:flex-initial bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black px-6 py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Install to Desktop
              </button>
            </div>
          </div>

          {downloadSuccess && (
            <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Installation triggered! If prompted by your browser, click <strong>Install</strong> to add to your desktop.</span>
            </div>
          )}
        </div>
      )}
    </>
  );
};
