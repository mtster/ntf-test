import React, { useState, useEffect, useRef } from 'react';
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
  Share,
  Trash2,
  Terminal,
  XCircle
} from 'lucide-react';
import { requestNotificationPermission, onMessageListener, isFCMSupported } from './services/firebaseService';

interface LogEntry {
  timestamp: string;
  type: 'info' | 'warn' | 'error';
  message: string;
}

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
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // --- Visual Debugger: Console Override ---
  useEffect(() => {
    const formatArgs = (args: any[]) => {
      return args.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch (e) {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' ');
    };

    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    console.log = (...args) => {
      originalLog(...args);
      addLog('info', formatArgs(args));
    };

    console.warn = (...args) => {
      originalWarn(...args);
      addLog('warn', formatArgs(args));
    };

    console.error = (...args) => {
      originalError(...args);
      addLog('error', formatArgs(args));
    };

    // Restore on unmount
    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  const addLog = (type: 'info' | 'warn' | 'error', message: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second:'2-digit' });
    setLogs(prev => [...prev, { timestamp, type, message }]);
  };

  // Scroll to bottom of logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // --- Initial Checks ---
  useEffect(() => {
    let mounted = true;

    const checkEnvironment = async () => {
      try {
        console.log('[App] Starting environment check...');
        
        // Standalone check
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        const isStandalone = (window.navigator as any).standalone === true;
        
        if (mounted) {
          if (isIOS && !isStandalone) {
            console.warn('[App] iOS detected but not in standalone mode.');
            setIsIOSStandalone(false);
          }
        }

        // FCM Support Check
        const supported = await isFCMSupported();
        console.log(`[App] FCM Supported: ${supported}`);
        
        if (mounted) {
          setIsSupported(supported);
          
          if (supported && 'Notification' in window) {
            setPermissionStatus(Notification.permission);
            console.log(`[App] Current Permission: ${Notification.permission}`);
            
            // Restore from Local Storage
            const savedToken = localStorage.getItem('fcm_token');
            if (savedToken) {
              console.log('[App] Restoring token from local storage.');
              setFcmToken(savedToken);
            }
          }
        }
      } catch (e) {
        console.error("[App] Initialization error:", e);
        // We do NOT set isSupported to false here to allow debugging on potential false negatives
      }
    };

    checkEnvironment();

    // REMOVED: Timeout logic that forces isSupported to false.
    // We want to allow the user to try clicking the button even if the check hangs.
    
    return () => { 
      mounted = false; 
    };
  }, []);

  // Message Listener
  useEffect(() => {
    // Attempt to listen if we think it's supported, OR if permission is granted (even if check failed)
    if ((isSupported || permissionStatus === 'granted')) {
      console.log('[App] Setting up foreground message listener...');
      onMessageListener()
        .then((payload) => {
          if (payload) {
            console.log('[App] Foreground message received:', payload);
            setLastMessage(payload);
          }
        })
        .catch((err) => {
            // Suppress noise in logs if it's just a support error
            // console.warn('[App] Message listener warning', err)
        });
    }
  }, [isSupported, permissionStatus]);

  const handleEnableNotifications = async () => {
    if (isRequesting) return;
    
    setIsRequesting(true);
    setError(null);
    console.log('[App] User clicked "Get Token" / "Enable Notifications"');

    try {
      const token = await requestNotificationPermission();
      if (token) {
        setFcmToken(token);
        localStorage.setItem('fcm_token', token);
        setPermissionStatus('granted');
        console.log('[App] Token retrieval flow complete.');
      } else {
        const currentPerm = 'Notification' in window ? Notification.permission : 'default';
        setPermissionStatus(currentPerm);
        if (currentPerm === 'denied') {
          setError('Permission denied. Go to Settings to enable.');
        }
      }
    } catch (err: any) {
      console.error('[App] Error in handleEnableNotifications:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleReset = () => {
    if (confirm("Clear token and reset state?")) {
      console.log('[App] Resetting state...');
      setFcmToken('');
      setLastMessage(null);
      localStorage.removeItem('fcm_token');
      setError(null);
      // Optional: don't reload to keep logs
      // window.location.reload(); 
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

  // Loading State - only if we truly haven't initialized anything and permission is default
  // If permission is already granted, we show the UI immediately
  if (isSupported === null && permissionStatus === 'default') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2F2F7]">
        <div className="text-center">
          <RefreshCcw className="animate-spin text-blue-600 mx-auto mb-2" size={32} />
          <p className="text-slate-500 text-sm">Initializing Environment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col safe-area-inset-top safe-area-inset-bottom pb-80">
      {/* Header */}
      <header className="px-6 py-8 flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">FCM Tester</h1>
        <p className="text-slate-500 font-medium">Verify iOS Push Notifications</p>
      </header>

      <main className="flex-1 px-4 space-y-6">
        {/* iOS Install Warning */}
        {!isIOSStandalone && (
          <section className="bg-amber-50 rounded-3xl p-6 border border-amber-200 space-y-4">
            <div className="flex items-center gap-3 text-amber-800">
              <Info size={24} className="shrink-0" />
              <h2 className="text-lg font-bold">iOS Install Required</h2>
            </div>
            <p className="text-sm text-amber-700 leading-relaxed">
              Add to Home Screen to enable Push API.
            </p>
          </section>
        )}

        {/* Not Supported Warning */}
        {/* We keep this but make it less intrusive if we are debugging */}
        {isSupported === false && isIOSStandalone && (
          <section className="bg-red-50 rounded-3xl p-6 border border-red-200 space-y-4">
            <div className="flex items-center gap-3 text-red-800">
              <AlertCircle size={24} className="shrink-0" />
              <h2 className="text-lg font-bold">Not Supported (Check Logs)</h2>
            </div>
            <p className="text-sm text-red-700 leading-relaxed">
              FCM reported as not supported. Attempting to force enable via button below is allowed for debugging.
            </p>
          </section>
        )}

        {/* Permission & Action Card */}
        <section className={`bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4`}>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-800">System Permission</h2>
            <StatusPill status={permissionStatus} />
          </div>
          
          <button
            onClick={handleEnableNotifications}
            disabled={isRequesting}
            className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all active:scale-95 ${
              isRequesting
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
              : 'bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700'
            }`}
          >
            {isRequesting ? (
              <RefreshCcw className="animate-spin" size={20} />
            ) : (
              <Bell size={20} />
            )}
            {isRequesting ? 'Processing...' : (permissionStatus === 'granted' ? 'Re-Fetch Token' : 'Enable Notifications')}
          </button>

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
              <div className="flex gap-2">
                <button 
                  onClick={handleReset}
                  className="p-2 hover:bg-red-50 hover:text-red-500 text-slate-400 rounded-full transition-colors"
                >
                  <Trash2 size={20} />
                </button>
                <button 
                  onClick={copyToClipboard}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  {copied ? <CheckCircle className="text-green-500" size={20} /> : <Copy className="text-slate-400" size={20} />}
                </button>
              </div>
            </div>
            
            <textarea
              readOnly
              value={fcmToken}
              className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-600 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            />
          </section>
        )}

        {/* Message History */}
        {lastMessage && (
          <section className="bg-slate-900 rounded-3xl p-6 shadow-xl text-white space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
              Message Received
            </h2>
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 overflow-hidden">
               <pre className="text-[10px] whitespace-pre-wrap font-mono text-blue-200">
                 {JSON.stringify(lastMessage, null, 2)}
               </pre>
            </div>
          </section>
        )}
      </main>

      {/* Visual Debug Console (Fixed Bottom) */}
      <div className="fixed bottom-0 left-0 right-0 h-72 bg-slate-950 text-white border-t-2 border-slate-800 shadow-2xl flex flex-col z-50">
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-green-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Debug Console</span>
          </div>
          <button onClick={() => setLogs([])} className="text-[10px] px-2 py-1 bg-slate-800 rounded hover:bg-slate-700 text-slate-300">
            Clear Logs
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 font-mono text-[10px] space-y-1">
          {logs.length === 0 && <span className="text-slate-600 italic">No logs yet...</span>}
          {logs.map((log, i) => (
            <div key={i} className={`flex gap-2 ${
              log.type === 'error' ? 'text-red-400' : 
              log.type === 'warn' ? 'text-amber-400' : 'text-slate-300'
            }`}>
              <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
              <span className="break-all">{log.message}</span>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
};

export default App;