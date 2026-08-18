import React, { useState, useEffect } from 'react';
import { 
  Download, Monitor, Smartphone, CheckCircle, Share, PlusSquare, X, 
  Chrome, Laptop, Apple, Globe, Copy, Check, ExternalLink, HelpCircle
} from 'lucide-react';

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
  const [isAndroid, setIsAndroid] = useState<boolean>(false);
  const [isWindows, setIsWindows] = useState<boolean>(false);
  const [isMac, setIsMac] = useState<boolean>(false);
  const [isChrome, setIsChrome] = useState<boolean>(false);
  const [isEdge, setIsEdge] = useState<boolean>(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed app)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    setIsInstalled(isStandalone);

    // Platform and browser sniffing for tailored guides
    const userAgent = (window.navigator.userAgent || '').toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidDevice = /android/.test(userAgent);
    const isWin = /windows|win32|win64/.test(userAgent);
    const isMacDevice = /macintosh|mac os x/.test(userAgent) && !isIosDevice;
    const isEdgeBrowser = /edg\//.test(userAgent);
    const isChromeBrowser = /chrome|crios/.test(userAgent) && !isEdgeBrowser;

    setIsIOS(isIosDevice);
    setIsAndroid(isAndroidDevice);
    setIsWindows(isWin);
    setIsMac(isMacDevice);
    setIsChrome(isChromeBrowser);
    setIsEdge(isEdgeBrowser);

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

  const triggerInstall = async (onShowGuide?: () => void) => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.warn('Direct install prompt error:', err);
        if (onShowGuide) onShowGuide();
      }
    } else {
      // If browser has already handled or requires browser-level click
      if (onShowGuide) onShowGuide();
    }
  };

  return { 
    deferredPrompt, 
    isInstalled, 
    isIOS, 
    isAndroid, 
    isWindows, 
    isMac, 
    isChrome, 
    isEdge, 
    triggerInstall 
  };
};

interface InstallPWAProps {
  variant?: 'navbar' | 'banner' | 'card';
}

export const InstallPWA: React.FC<InstallPWAProps> = ({ variant = 'navbar' }) => {
  const { 
    deferredPrompt, 
    isInstalled, 
    isIOS, 
    isAndroid, 
    isWindows, 
    isMac, 
    isChrome, 
    isEdge, 
    triggerInstall 
  } = usePWAInstall();

  const [showGuideModal, setShowGuideModal] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [activeTab, setActiveTab] = useState<'auto' | 'windows' | 'mac' | 'android' | 'ios'>('auto');

  useEffect(() => {
    if (isIOS) setActiveTab('ios');
    else if (isAndroid) setActiveTab('android');
    else if (isWindows) setActiveTab('windows');
    else if (isMac) setActiveTab('mac');
    else setActiveTab('windows');
  }, [isIOS, isAndroid, isWindows, isMac]);

  if (isInstalled) {
    if (variant === 'navbar') return null;
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold shadow-sm">
        <CheckCircle className="w-3.5 h-3.5" /> App Installed
      </div>
    );
  }

  const handleInstallClick = () => {
    triggerInstall(() => setShowGuideModal(true));
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <>
      {variant === 'navbar' && (
        <button
          onClick={handleInstallClick}
          className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md shadow-emerald-950/20 transition-all cursor-pointer animate-pulse"
          title="Install app on Windows, Mac, Chrome, or Mobile"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Install App</span>
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
                    Install GSIS PrepX App
                  </h4>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/40 uppercase tracking-wider">
                    Windows • Laptop • Mobile
                  </span>
                </div>
                <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                  Install directly onto your device for instant launch, standalone window mode, desktop taskbar access, and instant mobile camera QR scanning.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
              <button
                onClick={handleInstallClick}
                className="flex-1 md:flex-initial bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black px-6 py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                {deferredPrompt ? 'Install Now' : 'Install on This Device'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Platform-Specific Installation Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl border border-slate-200 text-slate-900 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">How to Install GSIS PrepX</h3>
                  <p className="text-xs text-slate-400">Available for Desktop, Laptops & Mobile</p>
                </div>
              </div>
              <button 
                onClick={() => setShowGuideModal(false)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Platform Selector Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto p-1.5 gap-1 text-xs font-bold">
              <button
                onClick={() => setActiveTab('windows')}
                className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'windows' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" /> Windows / Laptop
              </button>
              <button
                onClick={() => setActiveTab('android')}
                className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'android' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" /> Android
              </button>
              <button
                onClick={() => setActiveTab('ios')}
                className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'ios' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Apple className="w-3.5 h-3.5" /> iPhone / iPad
              </button>
              <button
                onClick={() => setActiveTab('mac')}
                className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'mac' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" /> Mac
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-6 overflow-y-auto space-y-4 text-sm flex-1">
              
              {activeTab === 'windows' && (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 font-medium">
                    Install in Google Chrome or Microsoft Edge on Windows 10/11 or any laptop:
                  </div>

                  <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <div>
                      <p className="font-bold text-slate-800">Method A (Address Bar):</p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Look at the far right side of your browser URL/address bar for the <strong>Install icon (monitor with down arrow or ⨁)</strong> and click it.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <div>
                      <p className="font-bold text-slate-800">Method B (Chrome/Edge Menu):</p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Click the <strong>three dots menu (⋮ or ...)</strong> in the top-right corner of your browser ➔ click <strong>"Save and share"</strong> or <strong>"Apps"</strong> ➔ click <strong>"Install GSIS PrepX"</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'android' && (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-medium">
                    Install on any Android smartphone or tablet:
                  </div>

                  <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <div>
                      <p className="font-bold text-slate-800">Open in Chrome or Samsung Internet</p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Tap the <strong>three dots menu (⋮)</strong> in the top-right corner of Chrome.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <div>
                      <p className="font-bold text-slate-800">Tap "Install App" or "Add to Home Screen"</p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Confirm installation. A dedicated GSIS PrepX app icon will appear on your phone home screen!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'ios' && (
                <div className="space-y-3">
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 font-medium">
                    Install on iPhone or iPad (via Safari):
                  </div>

                  <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <div>
                      <p className="font-bold text-slate-800">Tap the Share Button</p>
                      <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
                        In Safari, tap the <strong className="inline-flex items-center gap-1 text-purple-600"><Share className="w-3.5 h-3.5" /> Share icon</strong> at the bottom of your screen.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <div>
                      <p className="font-bold text-slate-800">Select "Add to Home Screen"</p>
                      <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
                        Scroll down and tap <strong className="inline-flex items-center gap-1 text-purple-600"><PlusSquare className="w-3.5 h-3.5" /> Add to Home Screen</strong>, then tap <strong>Add</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'mac' && (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-100 border border-slate-300 rounded-xl text-xs text-slate-800 font-medium">
                    Install on Apple Mac (macOS):
                  </div>

                  <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <div>
                      <p className="font-bold text-slate-800">Chrome / Edge on Mac:</p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Click the <strong>Install icon (⨁)</strong> in the right of the address bar.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <div>
                      <p className="font-bold text-slate-800">Safari on macOS Sonoma / Sequoia:</p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Click <strong>File</strong> in the top menu bar ➔ <strong>Add to Dock...</strong>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Link Share Helper */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500 truncate">
                  App Link: {window.location.origin}
                </span>
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedUrl ? 'Copied Link' : 'Copy Link'}
                </button>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowGuideModal(false)}
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close Guide
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
