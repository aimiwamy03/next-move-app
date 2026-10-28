import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCOUNTS_KEY = 'next-move-accounts-v1';

export type AccountRecord = {
  phoneDigits: string;
  pin: string;
  firstName?: string;
  onboarded?: boolean;
};

type AccountMap = Record<string, AccountRecord>;

/** Demo: Marcus already has an account. PIN is 1234. */
const DEMO_SEED: AccountMap = {
  '5105550100': {
    phoneDigits: '5105550100',
    pin: '1234',
    firstName: 'Marcus',
    onboarded: true,
  },
};

async function readAccounts(): Promise<AccountMap> {
  try {
    const raw = await AsyncStorage.getItem(ACCOUNTS_KEY);
    if (!raw) {
      await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(DEMO_SEED));
      return { ...DEMO_SEED };
    }
    return { ...DEMO_SEED, ...(JSON.parse(raw) as AccountMap) };
  } catch {
    return { ...DEMO_SEED };
  }
}

async function writeAccounts(map: AccountMap) {
  await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(map));
}

/**
 * Auth helpers. Mock/local today.
 * Swap lookup / pin verify for your backend later.
 */
export const authProvider = {
  async lookup(phoneDigits: string): Promise<{ exists: boolean; account?: AccountRecord }> {
    const map = await readAccounts();
    const account = map[phoneDigits];
    if (!account?.pin) return { exists: false };
    return { exists: true, account };
  },

  async verifyPin(phoneDigits: string, pin: string): Promise<{ ok: true; account: AccountRecord } | { ok: false; error: string }> {
    const map = await readAccounts();
    const account = map[phoneDigits];
    if (!account?.pin) {
      return { ok: false, error: 'No account found for this number.' };
    }
    if (account.pin !== pin) {
      return { ok: false, error: "That PIN didn't match. Try again." };
    }
    return { ok: true, account };
  },

  async setPin(phoneDigits: string, pin: string, extras?: Partial<AccountRecord>) {
    if (!/^\d{4}$/.test(pin)) {
      return { ok: false as const, error: 'Choose a 4-digit PIN.' };
    }
    const map = await readAccounts();
    map[phoneDigits] = {
      phoneDigits,
      pin,
      firstName: extras?.firstName ?? map[phoneDigits]?.firstName,
      onboarded: extras?.onboarded ?? map[phoneDigits]?.onboarded ?? false,
    };
    await writeAccounts(map);
    return { ok: true as const };
  },

  async markOnboarded(phoneDigits: string, firstName: string) {
    const map = await readAccounts();
    if (!map[phoneDigits]) return;
    map[phoneDigits] = { ...map[phoneDigits], firstName, onboarded: true };
    await writeAccounts(map);
  },

  async deleteAccount(phoneDigits: string) {
    const map = await readAccounts();
    delete map[phoneDigits];
    await writeAccounts(map);
  },
};
