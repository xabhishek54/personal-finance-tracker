import { useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import {
  LayoutDashboard,
  ReceiptText,
  PieChart,
  HandCoins,
  Plus,
  Settings,
  LogOut,
  ChevronDown,
  Edit2,
  Trash2,
} from 'lucide-react';
import { useFinanceStore } from './store/useFinanceStore';
import { App as CapApp } from '@capacitor/app';
import Dashboard from './components/Dashboard';
import TransactionLog from './components/TransactionLog';
import BudgetAnalytics from './components/BudgetAnalytics';
import DebtsTracker from './components/DebtsTracker';
import SettingsPage from './components/SettingsPage';
import AddTransactionModal from './components/AddTransactionModal';
import OnboardingModal from './components/OnboardingModal';
import Login from './components/Auth/Login';
import SyncIndicator from './components/SyncIndicator';
import PromptModal from './components/PromptModal';
import ConfirmModal from './components/ConfirmModal';
import PullToRefresh from './components/PullToRefresh';
import { AuthProvider, useAuth } from './context/AuthContext';
import PinLoginScreen from './components/Auth/PinLoginScreen';

function PrivateRoute({ children }) {
  const { currentUser, loading, isPinVerified } = useAuth();
  if (loading) return null;
  if (!currentUser) return <Navigate to="/login" />;
  if (!isPinVerified) return <PinLoginScreen />;
  return children;
}

const SyncWrapper = ({ children }) => {
  const { currentUser } = useAuth();
  const initializeUserSync = useFinanceStore((state) => state.initializeUserSync);

  useEffect(() => {
    if (currentUser) {
      initializeUserSync(currentUser.uid);
    }
  }, [currentUser, initializeUserSync]);

  return <>{children}</>;
};

const PageTitleUpdater = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const titles = {
      '/': 'Dashboard | Personal Finance',
      '/logs': 'Transactions | Personal Finance',
      '/budgets': 'Budgets & Analytics | Personal Finance',
      '/debts': 'Lend & Borrow | Personal Finance',
      '/settings': 'Settings | Personal Finance',
      '/login': 'Login | Personal Finance',
    };
    document.title = titles[location.pathname] || 'Personal Finance Tracker';
  }, [location.pathname]);

  useEffect(() => {
    let lastTimeBackPress = 0;
    const timePeriodToExit = 2000;
    let toastTimeout;

    const setupBackButton = async () => {
      try {
        await CapApp.addListener('backButton', () => {
          const currentPath = window.location.pathname;
          if (currentPath !== '/' && currentPath !== '/login') {
            navigate('/');
          } else if (currentPath === '/') {
            if (new Date().getTime() - lastTimeBackPress < timePeriodToExit) {
              CapApp.exitApp();
            } else {
              lastTimeBackPress = new Date().getTime();
              const toast = document.createElement('div');
              toast.innerText = 'Tap again to exit';
              toast.className =
                'fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-[var(--text-main)] text-[var(--bg-surface)] px-4 py-2 rounded-full text-sm font-medium z-[9999] transition-opacity duration-300 shadow-xl';
              document.body.appendChild(toast);

              clearTimeout(toastTimeout);
              toastTimeout = setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => {
                  if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                  }
                }, 300);
              }, 2000);
            }
          }
        });
      } catch (e) {
        console.log('Capacitor App plugin not available for back button', e);
      }
    };

    setupBackButton();

    return () => {
      CapApp.removeAllListeners('backButton');
      clearTimeout(toastTimeout);
    };
  }, [navigate]);

  return null;
};

function AppContent() {
  const { logout } = useAuth();
  const {
    theme,
    workspaces,
    activeWorkspaceId,
    switchWorkspace,
    addWorkspace,
    renameWorkspace,
    deleteWorkspace,
    syncWithSupabase,
  } = useFinanceStore();

  const location = useLocation();
  const navigate = useNavigate();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [promptConfig, setPromptConfig] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);

  const activeWorkspace = workspaces?.find((w) => w.id === activeWorkspaceId) || {
    name: 'Personal',
    id: 'personal',
  };

  const handleAddWorkspace = () => {
    setShowWorkspaceMenu(false);
    setPromptConfig({
      title: 'New Mode',
      placeholder: 'e.g. Business, Trip',
      onSubmit: (name) => addWorkspace(name),
    });
  };

  const handleRenameWorkspace = (w, e) => {
    e.stopPropagation();
    setShowWorkspaceMenu(false);
    setPromptConfig({
      title: 'Rename Mode',
      initialValue: w.name,
      onSubmit: (newName) => renameWorkspace(w.id, newName),
    });
  };

  const handleDeleteWorkspace = (w, e) => {
    e.stopPropagation();
    setShowWorkspaceMenu(false);
    if (workspaces.length <= 1) {
      alert('You must have at least one mode.');
      return;
    }
    setConfirmConfig({
      title: 'Delete Mode?',
      description: `Are you sure you want to delete "${w.name}" and ALL its transactions? This cannot be undone.`,
      onConfirm: () => deleteWorkspace(w.id),
    });
  };

  // Global Keyboard Shortcut listener: Alt+N or N (when not focused on input)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName);
      if (!isInput && (e.key === 'n' || e.key === 'N' || (e.altKey && e.key.toLowerCase() === 'n'))) {
        e.preventDefault();
        setIsAddModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleAddParam = () => {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('action') === 'add') {
        setIsAddModalOpen(true);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    handleAddParam();

    try {
      CapApp.addListener('appUrlOpen', (data) => {
        if (data.url.includes('action=add')) {
          setIsAddModalOpen(true);
        }
      });
    } catch (e) {
      console.log('Capacitor App plugin not available', e);
    }

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { id: 'logs', icon: ReceiptText, label: 'Transactions', path: '/logs' },
    { id: 'budgets', icon: PieChart, label: 'Budgets', path: '/budgets' },
    { id: 'debts', icon: HandCoins, label: 'Lend & Borrow', path: '/debts' },
    { id: 'settings', icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const handleRefresh = async () => {
    window.dispatchEvent(new Event('manual-sync'));
    await syncWithSupabase(true);
  };

  const isSettingsPage = location.pathname === '/settings';

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-space)] transition-colors duration-200">
      {/* Desktop Sidebar - Standardized 240px (w-60) */}
      <aside className="hidden lg:flex flex-col w-60 bg-[var(--bg-surface)] border-r border-[var(--bg-surface-lit)] py-6 px-4 gap-6 z-10 shrink-0 relative">
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
            aria-label="Switch Mode"
            className="w-full h-12 px-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--bg-surface-lit)] flex items-center justify-between shadow-sm hover:border-[var(--accent-violet)]/50 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <img
                src="/favicon.png"
                alt="Logo"
                className="w-7 h-7 object-contain shrink-0"
              />
              <span className="font-bold text-sm truncate">
                {activeWorkspace.name}
              </span>
            </div>
            <ChevronDown size={16} className="text-[var(--text-muted)] shrink-0" />
          </button>
        </div>

        {/* Workspace Dropdown */}
        {showWorkspaceMenu && (
          <div className="absolute top-20 left-4 right-4 bg-[var(--bg-surface)] border border-[var(--bg-surface-lit)] rounded-xl shadow-xl z-50 py-2 animate-[popIn_150ms_ease-out]">
            <div className="px-3 py-1.5 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Modes
            </div>
            {workspaces?.map((w) => (
              <div key={w.id} className="flex items-center group">
                <button
                  onClick={() => {
                    switchWorkspace(w.id);
                    setShowWorkspaceMenu(false);
                  }}
                  className={`flex-1 text-left px-4 py-2 text-sm transition-colors ${activeWorkspaceId === w.id ? 'text-[var(--accent-violet)] font-bold bg-[var(--accent-violet)]/10' : 'hover:bg-[var(--bg-surface-lit)]'}`}
                >
                  {w.name}
                </button>
                <div className="flex pr-2">
                  <button
                    onClick={(e) => handleRenameWorkspace(w, e)}
                    title="Rename"
                    className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent-violet)]"
                  >
                    <Edit2 size={12} />
                  </button>
                  {workspaces.length > 1 && (
                    <button
                      onClick={(e) => handleDeleteWorkspace(w, e)}
                      title="Delete"
                      className="p-1.5 text-[var(--text-muted)] hover:text-[var(--status-red)]"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div className="border-t border-[var(--bg-surface-lit)] mt-2 pt-2">
              <button
                onClick={handleAddWorkspace}
                className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-[var(--bg-surface-lit)] text-[var(--text-main)]"
              >
                <Plus size={14} /> New Mode
              </button>
            </div>
          </div>
        )}

        {/* Sidebar Add Transaction Button */}
        {!isSettingsPage && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full py-2.5 px-4 bg-[var(--accent-violet)] text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-[var(--accent-glow)] hover:opacity-95 active:scale-[0.98] transition-all text-sm"
          >
            <Plus size={18} />
            <span>Add Transaction</span>
            <span className="ml-auto text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono hidden xl:inline-block">N</span>
          </button>
        )}

        <nav className="flex flex-col gap-1.5 flex-1 mt-2">
          {navItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                `p-2.5 px-3.5 rounded-xl flex items-center gap-3 transition-all duration-150 font-medium text-sm ${
                  isActive
                    ? 'bg-[var(--accent-violet)] text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:bg-[var(--bg-surface-lit)] hover:text-[var(--text-main)]'
                }`
              }
            >
              <item.icon size={18} />
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <button
          onClick={logout}
          aria-label="Log Out"
          className="mt-auto p-2.5 px-3.5 rounded-xl flex items-center gap-3 transition-all duration-150 font-medium text-sm text-[var(--text-muted)] hover:bg-[var(--status-red)]/10 hover:text-[var(--status-red)]"
        >
          <LogOut size={18} />
          <span>Log Out</span>
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex flex-col page-enter relative">
        <PullToRefresh onRefresh={handleRefresh}>
          {/* Mobile Header Bar with Mode Switcher & Settings Icon */}
          <div className="lg:hidden flex items-center justify-between px-4 py-2.5 border-b border-[var(--bg-surface-lit)] bg-[var(--bg-surface)]/95 backdrop-blur-md z-[80] sticky top-0">
            <button
              onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
              aria-label="Switch Mode"
              className="px-3 py-1.5 rounded-full bg-[var(--bg-surface-lit)] shadow-sm text-xs font-bold flex items-center gap-2 active:scale-95 transition-transform"
            >
              <img
                src="/favicon.png"
                alt="Logo"
                className="w-4 h-4 object-contain"
              />
              <span className="truncate max-w-[120px]">{activeWorkspace.name}</span>
              <ChevronDown size={12} className="text-[var(--text-muted)]" />
            </button>

            <button
              onClick={() => navigate('/settings')}
              aria-label="Settings"
              className={`p-2 rounded-full transition-colors ${
                isSettingsPage ? 'bg-[var(--accent-violet)] text-white' : 'bg-[var(--bg-surface-lit)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Settings size={18} />
            </button>
          </div>

          {/* Mobile Workspace Dropdown */}
          {showWorkspaceMenu && (
            <div className="lg:hidden absolute top-12 left-4 z-[95] bg-[var(--bg-surface)] border border-[var(--bg-surface-lit)] rounded-xl shadow-xl w-56 py-2 animate-[popIn_150ms_ease-out]">
              <div className="px-3 py-1.5 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Modes
              </div>
              {workspaces?.map((w) => (
                <div key={w.id} className="flex items-center">
                  <button
                    onClick={() => {
                      switchWorkspace(w.id);
                      setShowWorkspaceMenu(false);
                    }}
                    className={`flex-1 text-left px-4 py-2 text-sm transition-colors ${activeWorkspaceId === w.id ? 'text-[var(--accent-violet)] font-bold bg-[var(--accent-violet)]/10' : 'hover:bg-[var(--bg-surface-lit)]'}`}
                  >
                    {w.name}
                  </button>
                </div>
              ))}
              <div className="border-t border-[var(--bg-surface-lit)] mt-2 pt-2">
                <button
                  onClick={handleAddWorkspace}
                  className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-[var(--bg-surface-lit)]"
                >
                  <Plus size={14} /> New Mode
                </button>
              </div>
            </div>
          )}

          <div className="max-w-7xl mx-auto p-4 pt-4 pb-20 md:p-6 lg:p-8 lg:pb-8 min-h-full">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/logs" element={<TransactionLog />} />
              <Route path="/budgets" element={<BudgetAnalytics />} />
              <Route path="/debts" element={<DebtsTracker />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </div>
        </PullToRefresh>
      </main>

      {/* Mobile Docked Bottom Navigation Bar with Docked Center '+' Button */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 w-full glass-nav flex items-center justify-around px-1 z-50 pb-safe border-t border-[var(--bg-surface-lit)]">
        {/* Destination 1: Home */}
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-colors ${
              isActive ? 'text-[var(--accent-violet)] font-bold' : 'text-[var(--text-muted)]'
            }`
          }
        >
          <LayoutDashboard size={18} />
          <span className="text-[11px] font-medium">Home</span>
        </NavLink>

        {/* Destination 2: Transactions */}
        <NavLink
          to="/logs"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-colors ${
              isActive ? 'text-[var(--accent-violet)] font-bold' : 'text-[var(--text-muted)]'
            }`
          }
        >
          <ReceiptText size={18} />
          <span className="text-[11px] font-medium">Txns</span>
        </NavLink>

        {/* Docked Center Raised '+' Button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          aria-label="Add Transaction"
          className="w-12 h-12 -mt-4 bg-[var(--accent-violet)] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[var(--accent-glow)] active:scale-95 transition-transform shrink-0"
        >
          <Plus size={24} />
        </button>

        {/* Destination 3: Budgets */}
        <NavLink
          to="/budgets"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-colors ${
              isActive ? 'text-[var(--accent-violet)] font-bold' : 'text-[var(--text-muted)]'
            }`
          }
        >
          <PieChart size={18} />
          <span className="text-[11px] font-medium">Budgets</span>
        </NavLink>

        {/* Destination 4: Lend */}
        <NavLink
          to="/debts"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-colors ${
              isActive ? 'text-[var(--accent-violet)] font-bold' : 'text-[var(--text-muted)]'
            }`
          }
        >
          <HandCoins size={18} />
          <span className="text-[11px] font-medium">Lend</span>
        </NavLink>
      </nav>

      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
      <OnboardingModal
        isOpen={!useFinanceStore((state) => state.hasCompletedOnboarding)}
        onClose={() => useFinanceStore.getState().completeOnboarding()}
      />
      <PromptModal
        isOpen={!!promptConfig}
        title={promptConfig?.title}
        description={promptConfig?.description}
        initialValue={promptConfig?.initialValue}
        placeholder={promptConfig?.placeholder}
        onClose={() => setPromptConfig(null)}
        onSubmit={promptConfig?.onSubmit}
      />
      <ConfirmModal
        isOpen={!!confirmConfig}
        title={confirmConfig?.title}
        description={confirmConfig?.description}
        onClose={() => setConfirmConfig(null)}
        onConfirm={confirmConfig?.onConfirm}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SyncWrapper>
        <SyncIndicator />
        <Router>
          <PageTitleUpdater />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <PrivateRoute>
                  <AppContent />
                </PrivateRoute>
              }
            />
          </Routes>
        </Router>
      </SyncWrapper>
    </AuthProvider>
  );
}
