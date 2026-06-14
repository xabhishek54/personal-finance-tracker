import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import LoadingScreen from '../components/LoadingScreen';

import { Capacitor } from '@capacitor/core';
import { useFinanceStore } from '../store/useFinanceStore';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('finance_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(() => !localStorage.getItem('finance_user'));

  const [isPinVerified, setIsPinVerified] = useState(() => {
    const saved = localStorage.getItem('finance_user');
    if (!saved) return false;

    const pin = localStorage.getItem('finance_user_pin');
    if (!pin) return true;

    const platforms = useFinanceStore.getState().pinPlatforms || {
      app: true,
      mobileWeb: true,
      desktopWeb: true,
    };

    let pinRequired = true;
    const isNative = Capacitor.isNativePlatform();
    const isMobileWeb = !isNative && window.innerWidth < 768;
    const isDesktopWeb = !isNative && window.innerWidth >= 768;

    if (isNative && !platforms.app) pinRequired = false;
    if (isMobileWeb && !platforms.mobileWeb) pinRequired = false;
    if (isDesktopWeb && !platforms.desktopWeb) pinRequired = false;

    return !pinRequired;
  });
  const [hasPinSetup, setHasPinSetup] = useState(() => !!localStorage.getItem('finance_user_pin'));

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        localStorage.setItem('finance_user', JSON.stringify({ uid: user.uid, email: user.email }));
        // Check if PIN is required
        const pin = localStorage.getItem('finance_user_pin');
        setHasPinSetup(!!pin);

        let pinRequired = !!pin;
        if (pinRequired) {
          const platforms = useFinanceStore.getState().pinPlatforms || {
            app: true,
            mobileWeb: true,
            desktopWeb: true,
          };
          const isNative = Capacitor.isNativePlatform();
          const isMobileWeb = !isNative && window.innerWidth < 768;
          const isDesktopWeb = !isNative && window.innerWidth >= 768;

          if (isNative && !platforms.app) pinRequired = false;
          if (isMobileWeb && !platforms.mobileWeb) pinRequired = false;
          if (isDesktopWeb && !platforms.desktopWeb) pinRequired = false;
        }

        setIsPinVerified(!pinRequired);
      } else {
        localStorage.removeItem('finance_user');
        setIsPinVerified(false);
      }
      setCurrentUser(user);
      // Slight delay to allow animations and local data to init
      setTimeout(() => setLoading(false), 500);
    });

    return unsubscribe;
  }, []);

  const verifyPin = (pinStr) => {
    const savedPin = localStorage.getItem('finance_user_pin');
    if (savedPin === pinStr) {
      setIsPinVerified(true);
      return true;
    }
    return false;
  };

  const setupPin = (newPin) => {
    localStorage.setItem('finance_user_pin', newPin);
    setHasPinSetup(true);
    setIsPinVerified(true);
  };

  const removePin = () => {
    localStorage.removeItem('finance_user_pin');
    setHasPinSetup(false);
    setIsPinVerified(true);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        isPinVerified,
        hasPinSetup,
        verifyPin,
        setupPin,
        removePin,
        setIsPinVerified, // Exporting in case biometric unlocks it
      }}
    >
      {loading ? <LoadingScreen /> : children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
