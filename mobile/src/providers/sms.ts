import { MOCK_SMS_CODE } from '@/theme/tokens';

/**
 * SMS provider interface. Mock is the default.
 * Swap MockSmsProvider for a real Twilio (or similar) client later.
 */
export interface SmsProvider {
  sendCode(phoneDigits: string): Promise<{ ok: true } | { ok: false; error: string }>;
  verifyCode(phoneDigits: string, code: string): Promise<{ ok: true } | { ok: false; error: string }>;
}

class MockSmsProvider implements SmsProvider {
  private lastCode = MOCK_SMS_CODE;

  async sendCode(phoneDigits: string) {
    if (phoneDigits.length !== 10) {
      return { ok: false as const, error: 'Enter a 10-digit phone number.' };
    }
    // Demo always uses 123456. Logged for local debugging.
    this.lastCode = MOCK_SMS_CODE;
    console.log(`[MockSms] code for ${phoneDigits}: ${this.lastCode}`);
    return { ok: true as const };
  }

  async verifyCode(_phoneDigits: string, code: string) {
    if (code === this.lastCode) return { ok: true as const };
    return { ok: false as const, error: "That code didn't match. It happens. Try it again, or get a new one." };
  }
}

export const smsProvider: SmsProvider = new MockSmsProvider();
