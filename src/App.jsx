import { useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  Navigate,
  useLocation,
} from 'react-router-dom';
import {
  LayoutDashboard,
  ReceiptText,
  PieChart,
  Plus,
  Settings,
  Wallet,
  LogOut,
  ChevronDown,
  Edit2,
  Trash2,
} from 'lucide-react';
import { useFinanceStore } from './store/useFinanceStore';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';
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
import { AuthProvider, useAuth } from './context/AuthContext';

function PrivateRoute({ children }) {
  const { currentUser, loading } = useAuth();
  if (loading) return null;
  return currentUser ? children : <Navigate to="/login" />;
}

// Auth synchronization component wrapper to access AuthContext
const SyncWrapper = ({ children }) => {
  const { currentUser } = useAuth();
  const initializeUserSync = useFinanceStore((state) => state.initializeUserSync);

  useEffect(() => {
    if (currentUser) {
      const cleanup = initializeUserSync(currentUser.uid);
      return () => {
        if (cleanup) cleanup();
      };
    }
  }, [currentUser, initializeUserSync]);

  return <>{children}</>;
};

const PageTitleUpdater = () => {
  const location = useLocation();
  useEffect(() => {
    const titles = {
      '/': 'Dashboard | Finance Tracker',
      '/logs': 'Transactions | Finance Tracker',
      '/budgets': 'Analytics | Finance Tracker',
      '/debts': 'Debts | Finance Tracker',
      '/settings': 'Settings | Finance Tracker',
      '/login': 'Login | Finance Tracker',
    };
    document.title = titles[location.pathname] || 'Finance Tracker';
  }, [location.pathname]);
  return null;
};

export default function App() {
  const {
    theme,
    workspaces,
    activeWorkspaceId,
    switchWorkspace,
    addWorkspace,
    renameWorkspace,
    deleteWorkspace,
  } = useFinanceStore();
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

  useEffect(() => {
    // Handle Quick Add Deep Links & URL parameters
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
    { id: 'logs', icon: ReceiptText, label: 'Logs', path: '/logs' },
    { id: 'budgets', icon: PieChart, label: 'Budgets', path: '/budgets' },
    { id: 'debts', icon: ReceiptText, label: 'Debts', path: '/debts' },
    { id: 'settings', icon: Settings, label: 'Settings', path: '/settings' },
  ];

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
                  <div className="flex h-screen overflow-hidden bg-[var(--bg-space)] transition-colors duration-200">
                    {/* Desktop Sidebar Rail */}
                    <aside className="hidden lg:flex flex-col w-20 bg-[var(--bg-surface)] border-r border-[var(--bg-surface-lit)] items-center py-6 gap-8 z-10 shrink-0 relative">
                      <div className="flex flex-col items-center gap-2">
                        <button
                          onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
                          className="w-12 h-12 rounded-2xl bg-[var(--bg-surface)] border border-[var(--bg-surface-lit)] flex items-center justify-center shadow-lg shadow-[var(--accent-glow)] hover:scale-105 active:scale-95 transition-all overflow-hidden"
                          title={`Current Mode: ${activeWorkspace.name}`}
                        >
                          <img src="/favicon.png" alt="Logo" className="w-8 h-8 object-contain" />
                        </button>
                      </div>

                      {/* Workspace Dropdown */}
                      {showWorkspaceMenu && (
                        <div className="absolute top-16 left-20 bg-[var(--bg-surface)] border border-[var(--bg-surface-lit)] rounded-xl shadow-xl z-50 w-48 py-2 animate-[popIn_150ms_ease-out]">
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
                              <div className="flex pr-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => handleRenameWorkspace(w, e)}
                                  className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent-violet)]"
                                >
                                  <Edit2 size={12} />
                                </button>
                                {workspaces.length > 1 && (
                                  <button
                                    onClick={(e) => handleDeleteWorkspace(w, e)}
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

                      <nav className="flex flex-col gap-4 flex-1">
                        {navItems.map((item) => (
                          <NavLink
                            key={item.id}
                            to={item.path}
                            className={({ isActive }) =>
                              `p-3 rounded-xl transition-all duration-200 ${
                                isActive
                                  ? 'bg-[var(--accent-violet)] text-white shadow-md shadow-[var(--accent-glow)]'
                                  : 'text-[var(--text-muted)] hover:bg-[var(--bg-surface-lit)] hover:text-[var(--text-main)]'
                              }`
                            }
                            title={item.label}
                          >
                            <item.icon size={24} />
                          </NavLink>
                        ))}
                      </nav>

                      <button
                        onClick={() => signOut(auth)}
                        className="mt-auto p-3 rounded-xl transition-all duration-200 text-[var(--text-muted)] hover:bg-[var(--status-red)]/10 hover:text-[var(--status-red)] mb-4"
                        title="Log Out"
                      >
                        <LogOut size={24} />
                      </button>
                    </aside>

                    {/* Main Content Area */}
                    <main className="flex-1 overflow-y-auto pb-28 lg:pb-0 page-enter relative">
                      {/* Mobile Workspace Switcher */}
                      <div className="lg:hidden absolute top-4 left-4 z-[90]">
                        <button
                          onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
                          className="px-3 py-1.5 rounded-full bg-[var(--bg-surface)] border border-[var(--bg-surface-lit)] shadow-sm text-xs font-bold flex items-center gap-2 active:scale-95 transition-transform"
                        >
                          <div className="w-5 h-5 flex items-center justify-center shrink-0">
                            <img
                              src="/favicon.png"
                              alt="Logo"
                              className="w-full h-full object-contain"
                            />
                          </div>
                          {activeWorkspace.name}
                          <ChevronDown size={12} className="text-[var(--text-muted)]" />
                        </button>
                        {showWorkspaceMenu && (
                          <div className="absolute top-full left-0 mt-2 bg-[var(--bg-surface)] border border-[var(--bg-surface-lit)] rounded-xl shadow-xl w-48 py-2 animate-[popIn_150ms_ease-out]">
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
                                <div className="flex pr-2">
                                  <button
                                    onClick={(e) => handleRenameWorkspace(w, e)}
                                    className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent-violet)]"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  {workspaces.length > 1 && (
                                    <button
                                      onClick={(e) => handleDeleteWorkspace(w, e)}
                                      className="p-1.5 text-[var(--text-muted)] hover:text-[var(--status-red)]"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>
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
                      </div>

                      <div className="max-w-5xl mx-auto p-4 pt-16 md:p-6 lg:pt-8 lg:p-8 min-h-full">
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/logs" element={<TransactionLog />} />
                          <Route path="/budgets" element={<BudgetAnalytics />} />
                          <Route path="/debts" element={<DebtsTracker />} />
                          <Route path="/settings" element={<SettingsPage />} />
                        </Routes>
                      </div>
                    </main>

                    {/* Mobile Bottom Navigation Bar */}
                    <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 w-full glass-nav flex items-center justify-around px-4 z-50 pb-safe">
                      {navItems.map((item) => (
                        <NavLink
                          key={item.id}
                          to={item.path}
                          className={({ isActive }) =>
                            `flex flex-col items-center gap-1 transition-colors duration-200 ${
                              isActive ? 'text-[var(--accent-violet)]' : 'text-[var(--text-muted)]'
                            }`
                          }
                        >
                          <item.icon size={20} />
                          <span className="text-[10px] font-medium">{item.label}</span>
                        </NavLink>
                      ))}

                      {/* Mobile FAB */}
                      <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-14 bg-[var(--accent-violet)] text-white rounded-full flex items-center justify-center shadow-lg shadow-[var(--accent-glow)] active:scale-95 transition-transform duration-150"
                      >
                        <Plus size={28} />
                      </button>

                      <button
                        onClick={() => signOut(auth)}
                        className="flex flex-col items-center gap-1 p-2 min-w-[64px] rounded-xl transition-colors text-[var(--text-muted)] hover:text-[var(--status-red)]"
                      >
                        <LogOut size={20} />
                        <span className="text-[10px] font-medium">Log Out</span>
                      </button>
                    </nav>

                    {/* Desktop FAB */}
                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="hidden lg:flex fixed bottom-8 right-8 w-16 h-16 bg-[var(--accent-violet)] text-white rounded-full items-center justify-center shadow-lg shadow-[var(--accent-glow)] hover:scale-105 active:scale-95 transition-transform duration-150 z-50"
                    >
                      <Plus size={32} />
                    </button>

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
                </PrivateRoute>
              }
            />
          </Routes>
        </Router>
      </SyncWrapper>
    </AuthProvider>
  );
}
