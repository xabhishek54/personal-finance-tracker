import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { LayoutDashboard, ReceiptText, PieChart, Plus, Settings, Wallet, LogOut } from 'lucide-react';
import { useFinanceStore } from './store/useFinanceStore';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';
import Dashboard from './components/Dashboard';
import TransactionLog from './components/TransactionLog';
import BudgetAnalytics from './components/BudgetAnalytics';
import DebtsTracker from './components/DebtsTracker';
import SettingsPage from './components/SettingsPage';
import AddTransactionModal from './components/AddTransactionModal';
import Login from './components/Auth/Login';
import { AuthProvider, useAuth } from './context/AuthContext';

function PrivateRoute({ children }) {
  const { currentUser, loading } = useAuth();
  if (loading) return null;
  return currentUser ? children : <Navigate to="/login" />;
}

export default function App() {
  const theme = useFinanceStore((state) => state.theme);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Auth synchronization component wrapper to access AuthContext
  const SyncWrapper = ({ children }) => {
    const { currentUser } = useAuth();
    const initializeUserSync = useFinanceStore(state => state.initializeUserSync);
    
    useEffect(() => {
      if (currentUser) {
        const cleanup = initializeUserSync(currentUser.uid);
        return () => {
          if (cleanup) cleanup();
        };
      }
    }, [currentUser, initializeUserSync]);
    
    return children;
  };

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
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <PrivateRoute>
              <div className="flex h-screen overflow-hidden bg-[var(--bg-space)] transition-colors duration-200">
                {/* Desktop Sidebar Rail */}
                <aside className="hidden lg:flex flex-col w-20 bg-[var(--bg-surface)] border-r border-[var(--bg-surface-lit)] items-center py-6 gap-8 z-10 shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[var(--accent-violet)] to-purple-400 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-[var(--accent-glow)]">
                    F
                  </div>
                  
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
                <main className="flex-1 overflow-y-auto pb-20 lg:pb-0 page-enter relative">
                  <div className="max-w-5xl mx-auto p-4 md:p-6 lg:p-8 min-h-full">
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
                <nav className="lg:hidden absolute bottom-0 left-0 right-0 h-16 glass-nav flex items-center justify-around px-4 z-20 pb-safe">
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

                <AddTransactionModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
              </div>
            </PrivateRoute>
          } />
        </Routes>
        </Router>
      </SyncWrapper>
    </AuthProvider>
  );
}
