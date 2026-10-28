import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { DEMO_TODAY_KEY, demoWeekDoneExceptTodayKeys } from '@/lib/demoDate';
import { DEFAULT_HOME_LAYOUT, HomeLayout, marcusAnswers, marcusProfile } from '@/mock/data';

const STORAGE_KEY = 'next-move-session-v2';

export type ApplyProgress =
  | 'not_started'
  | 'expecting'
  | 'on_call'
  | 'form'
  | 'ready_to_sign'
  | 'signed'
  | 'sent';

export type Session = {
  onboarded: boolean;
  signedIn: boolean;
  firstName: string;
  phoneDigits: string;
  remindersEnabled: boolean;
  dayHome: number;
  isFirstDay: boolean;
  homeLayout: HomeLayout;
  checkInDoneToday: boolean;
  /** ISO date keys (YYYY-MM-DD) with a completed check-in. */
  checkInDaysDone: string[];
  checkInAnswers: Record<number, string[]>;
  stonesToday: number;
  applyProgress: ApplyProgress;
  formAnswers: Record<string, string | number>;
  formStep: number;
  signaturePaths: string[];
  faxConfirmationId: string | null;
  savedEventIds: string[];
  returnAfterBreathe: string | null;
  callPausedAt: number | null;
  /** Small life steps */
  hasSSCard: boolean;
  hasBankCard: boolean;
  appliedJobIds: string[];
  /** ZIP used for “near you” resources (editable). */
  zipCode: string;
};

const defaultSession = (): Session => ({
  onboarded: false,
  signedIn: false,
  firstName: marcusProfile.firstName,
  phoneDigits: marcusProfile.phone,
  remindersEnabled: false,
  dayHome: marcusProfile.dayHome,
  isFirstDay: false,
  homeLayout: DEFAULT_HOME_LAYOUT,
  // Always start needing today’s check-in; earlier days this week already done.
  checkInDoneToday: false,
  checkInDaysDone: demoWeekDoneExceptTodayKeys(),
  checkInAnswers: {},
  stonesToday: 0,
  applyProgress: 'ready_to_sign',
  formAnswers: {
    cash_and_bank: marcusAnswers.cash_and_bank,
    sleeping_situation: marcusAnswers.sleeping_situation,
    earned_income_month: marcusAnswers.earned_income_month,
  },
  formStep: 0,
  signaturePaths: [],
  faxConfirmationId: null,
  savedEventIds: [],
  returnAfterBreathe: null,
  callPausedAt: null,
  hasSSCard: false,
  hasBankCard: false,
  appliedJobIds: [],
  zipCode: '94607',
});

type Store = {
  ready: boolean;
  online: boolean;
  session: Session;
  patch: (partial: Partial<Session>) => void;
  setCheckInAnswer: (step: number, values: string[]) => void;
  finishCheckIn: () => void;
  setSignature: (paths: string[]) => void;
  clearSignature: () => void;
  pauseForBreathe: (returnTo: string) => void;
  clearBreatheReturn: () => void;
  saveEvent: (id: string) => void;
  markSSCardDone: () => void;
  clearSSCardDone: () => void;
  markBankCardDone: () => void;
  clearBankCardDone: () => void;
  applyToJob: (jobId: string) => void;
  signOut: () => void;
  deleteAll: () => Promise<void>;
  resetDemoToFirstDay: () => void;
};

const Ctx = createContext<Store | null>(null);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  // Web: paint immediately; hydrate session in the background.
  const [ready, setReady] = useState(Platform.OS === 'web');
  const [online, setOnline] = useState(true);
  const [session, setSession] = useState<Session>(defaultSession);

  useEffect(() => {
    let mounted = true;
    let unsub = () => {};
    const failSafe = setTimeout(() => {
      if (mounted) setReady(true);
    }, 800);
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw && mounted) {
          const parsed = JSON.parse(raw) as Partial<Session>;
          const merged = { ...defaultSession(), ...parsed };
          // Demo: prior week days done; today always starts unchecked.
          merged.checkInDaysDone = demoWeekDoneExceptTodayKeys();
          merged.checkInDoneToday = false;
          merged.checkInAnswers = {};
          setSession(merged);
        }
      } catch {
        // Corrupt storage: start fresh.
      } finally {
        if (mounted) {
          clearTimeout(failSafe);
          setReady(true);
        }
      }
    })();
    try {
      unsub = NetInfo.addEventListener((state) => {
        setOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
      });
    } catch {
      // NetInfo can fail on some web embeds; stay online.
    }
    return () => {
      mounted = false;
      clearTimeout(failSafe);
      unsub();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session)).catch(() => {});
  }, [session, ready]);

  const patch = useCallback((partial: Partial<Session>) => {
    setSession((s) => ({ ...s, ...partial }));
  }, []);

  const setCheckInAnswer = useCallback((step: number, values: string[]) => {
    setSession((s) => ({
      ...s,
      checkInAnswers: { ...s.checkInAnswers, [step]: values },
    }));
  }, []);

  const finishCheckIn = useCallback(() => {
    setSession((s) => {
      const days = s.checkInDaysDone.includes(DEMO_TODAY_KEY)
        ? s.checkInDaysDone
        : [...s.checkInDaysDone, DEMO_TODAY_KEY].sort();
      return {
        ...s,
        checkInDoneToday: true,
        checkInDaysDone: days,
        stonesToday: Math.max(1, s.stonesToday + 1),
      };
    });
  }, []);

  const setSignature = useCallback((paths: string[]) => {
    setSession((s) => ({ ...s, signaturePaths: paths }));
  }, []);

  const clearSignature = useCallback(() => {
    setSession((s) => ({ ...s, signaturePaths: [] }));
  }, []);

  const pauseForBreathe = useCallback((returnTo: string) => {
    setSession((s) => ({
      ...s,
      returnAfterBreathe: returnTo,
      callPausedAt: Date.now(),
    }));
  }, []);

  const clearBreatheReturn = useCallback(() => {
    setSession((s) => ({ ...s, returnAfterBreathe: null }));
  }, []);

  const saveEvent = useCallback((id: string) => {
    setSession((s) => ({
      ...s,
      savedEventIds: s.savedEventIds.includes(id) ? s.savedEventIds : [...s.savedEventIds, id],
    }));
  }, []);

  const markSSCardDone = useCallback(() => {
    setSession((s) => {
      if (s.hasSSCard) return s;
      return { ...s, hasSSCard: true, stonesToday: s.stonesToday + 1 };
    });
  }, []);

  const clearSSCardDone = useCallback(() => {
    setSession((s) => ({ ...s, hasSSCard: false }));
  }, []);

  const markBankCardDone = useCallback(() => {
    setSession((s) => {
      if (s.hasBankCard) return s;
      return { ...s, hasBankCard: true, stonesToday: s.stonesToday + 1 };
    });
  }, []);

  const clearBankCardDone = useCallback(() => {
    setSession((s) => ({ ...s, hasBankCard: false }));
  }, []);

  const applyToJob = useCallback((jobId: string) => {
    setSession((s) => ({
      ...s,
      appliedJobIds: s.appliedJobIds.includes(jobId) ? s.appliedJobIds : [...s.appliedJobIds, jobId],
      stonesToday: s.stonesToday + 1,
    }));
  }, []);

  const signOut = useCallback(() => {
    setSession((s) => ({
      ...defaultSession(),
      homeLayout: s.homeLayout,
      signedIn: false,
      onboarded: false,
    }));
  }, []);

  const deleteAll = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setSession(defaultSession());
  }, []);

  const resetDemoToFirstDay = useCallback(() => {
    setSession((s) => ({
      ...s,
      isFirstDay: true,
      dayHome: 1,
      // Today not checked in yet; rest of the week already did.
      checkInDoneToday: false,
      checkInDaysDone: demoWeekDoneExceptTodayKeys(),
      checkInAnswers: {},
      stonesToday: 0,
      applyProgress: 'not_started',
      hasSSCard: false,
      hasBankCard: false,
      appliedJobIds: [],
    }));
  }, []);

  const value = useMemo(
    () => ({
      ready,
      online,
      session,
      patch,
      setCheckInAnswer,
      finishCheckIn,
      setSignature,
      clearSignature,
      pauseForBreathe,
      clearBreatheReturn,
      saveEvent,
      markSSCardDone,
      clearSSCardDone,
      markBankCardDone,
      clearBankCardDone,
      applyToJob,
      signOut,
      deleteAll,
      resetDemoToFirstDay,
    }),
    [
      ready,
      online,
      session,
      patch,
      setCheckInAnswer,
      finishCheckIn,
      setSignature,
      clearSignature,
      pauseForBreathe,
      clearBreatheReturn,
      saveEvent,
      markSSCardDone,
      clearSSCardDone,
      markBankCardDone,
      clearBankCardDone,
      applyToJob,
      signOut,
      deleteAll,
      resetDemoToFirstDay,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAppStore must be used inside AppStoreProvider');
  return ctx;
}
