import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Copy, 
  CheckCircle, 
  AlertCircle, 
  RefreshCcw, 
  Smartphone,
  ShieldCheck,
  Zap,
  Info,
  Share
} from 'lucide-react';
import { requestNotificationPermission, onMessageListener, isFCMSupported } from './services/firebaseService';

const App: React.FC = () => {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window 
      ? Notification.permission 
      : 'default'
  );
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [isIOSStandalone, setIsIOSStandalone] = useState<boolean>(true);
  const [fcmToken, setFcmToken] = useState<string>('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);

  useEffect(() => {
    // Check for iOS Standalone mode
    const checkStandalone = () => {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      const isStandalone = (window.navigator as any).standalone === true;
      // If it is iOS but NOT standalone, we need to warn user
      if (isIOS && !isStandalone) {
        setIsIOSStandalone(false);
      }
    };
    checkStandalone();

    // Check for environment support on mount
    isFCMSupported().then(supported => {
      setIsSupported(supported);
      if (supported && 'Notification' in window) {
        setPermissionStatus(Notification.permission);
      }
    });

    // Listen for foreground messages if permission is granted
    if (permissionStatus === 'granted') {
      onMessageListener()
        .then((payload) => {
          if (payload) {
            console.log('Foreground message received:', payload);
            setLastMessage(payload);
          }
        })
        .catch((err) => console.error('Failed to set message listener', err));
    }
  }, [permissionStatus]);

  const handleEnableNotifications = async () => {
    setIsRequesting(true);
    setError(null);
    try {
      const token = await requestNotificationPermission();
      if (token) {
        setFcmToken(token);
        setPermissionStatus('granted');
      } else {
        const currentPerm = 'Notification' in window ? Notification.permission : 'default';
        setPermissionStatus(currentPerm);
        if (currentPerm === 'denied') {
          setError('Permission denied. Please enable notifications in iOS Settings.');
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsRequesting(false);
    }
  };

  const copyToClipboard = () => {
    if (!fcmToken) return;
    navigator.clipboard.writeText(fcmToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const StatusPill = ({ status }: { status: NotificationPermission }) => {
    const configs = {
      default: { text: 'Undefined', bg: 'bg-gray-200', textCol: 'text-gray-600', icon: <Smartphone size={14} /> },
      granted: { text: 'Granted', bg: 'bg-green-100', textCol: 'text-green-700', icon: <ShieldCheck size={14} /> },
      denied: { text: 'Denied', bg: 'bg-red-100', textCol: 'text-red-700', icon: <AlertCircle size={14} /> },
    };
    const config = configs[status] || configs.default;

    return (
      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${config.bg} ${config.textCol}`}>
        {config.icon}
        {config.text}
      </div>
    );
  };

  // If we haven't checked support yet, show a clean loader
  if (isSupported === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2F2F7]">
        <RefreshCcw className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col safe-area-inset-top safe-area-inset-bottom">
      {/* Header */}
      <header className="px-6 py-8 flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">FCM Tester</h1>
        <p className="text-slate-500 font-medium">Verify iOS Push Notifications</p>
      </header>

      <main className="flex-1 px-4 space-y-6">
        {/* iOS Install Warning */}
        {!isIOSStandalone && (
          <section className="bg-amber-50 rounded-3xl p-6 border border-amber-200 space-y-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center gap-3 text-amber-800">
              <Info size={24} className="shrink-0" />
              <h2 className="text-lg font-bold">iOS Install Required</h2>
            </div>
            <p className="text-sm text-amber-700 leading-relaxed">
              To test Push Notifications on iOS 18+, you must add this app to your Home Screen.
            </p>
            <ol className="text-sm text-amber-700 space-y-2 list-decimal list-inside font-medium">
              <li className="flex items-center gap-2">Tap the Share icon <Share size={16} /></li>
              <li>Select "Add to Home Screen"</li>
              <li>Launch from Home Screen</li>
            </ol>
          </section>
        )}

        {/* General Support Warning (Desktop/Android legacy) */}
        {!isSupported && isIOSStandalone && (
          <section className="bg-red-50 rounded-3xl p-6 border border-red-200 space-y-4">
            <div className="flex items-center gap-3 text-red-800">
              <AlertCircle size={24} className="shrink-0" />
              <h2 className="text-lg font-bold">Not Supported</h2>
            </div>
            <p className="text-sm text-red-700 leading-relaxed">
              Push notifications are not supported in this browser environment. If you are on iOS, ensure you have installed the app.
            </p>
          </section>
        )}

        {/* Permission Status Card */}
        <section className={`bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4 ${!isSupported ? 'opacity-50 grayscale' : ''}`}>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-800">System Permission</h2>
            <StatusPill status={permissionStatus} />
          </div>
          
          {permissionStatus !== 'granted' && (
            <button
              onClick={handleEnableNotifications}
              disabled={isRequesting || !isSupported}
              className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all active:scale-95 ${
                isRequesting || !isSupported
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700'
              }`}
            >
              {isRequesting ? (
                <RefreshCcw className="animate-spin" size={20} />
              ) : (
                <Bell size={20} />
              )}
              {isRequesting ? 'Requesting...' : 'Enable Notifications'}
            </button>
          )}

          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm flex gap-2 items-start border border-red-100">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}
        </section>

        {/* Token Section */}
        {fcmToken && (
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Zap className="text-amber-500" size={18} />
                Registration Token
              </h2>
              <button 
                onClick={copyToClipboard}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                title="Copy Token"
              >
                {copied ? <CheckCircle className="text-green-500" size={20} /> : <Copy className="text-slate-400" size={20} />}
              </button>
            </div>
            
            <textarea
              readOnly
              value={fcmToken}
              className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-600 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            />
          </section>
        )}

        {/* Message History */}
        {lastMessage && (
          <section className="bg-slate-900 rounded-3xl p-6 shadow-xl text-white space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
              Last Received Message
            </h2>
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <p className="text-sm font-bold text-blue-300">{lastMessage?.notification?.title || 'No Title'}</p>
              <p className="text-xs text-slate-300 mt-1">{lastMessage?.notification?.body || 'No Body'}</p>
              <pre className="mt-3 text-[10px] bg-slate-950 p-2 rounded border border-slate-800 overflow-x-auto">
                {JSON.stringify(lastMessage.data || {}, null, 2)}
              </pre>
            </div>
          </section>
        )}
      </main>

      {/* Footer Branding */}
      <footer className="p-8 text-center mt-auto">
        <div className="inline-flex items-center gap-2 text-slate-400 text-sm font-medium">
          <span>Engineered for</span>
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" 
            alt="Apple" 
            className="h-4 w-4 opacity-30" 
          />
          <span>iOS 18+</span>
        </div>
      </footer>
    </div>
  );
};

export default App;