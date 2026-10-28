/**
 * Fax provider interface. Mock is the default.
 * Never send to a real number without Amy's go-ahead.
 */
export interface FaxProvider {
  send(params: {
    county: string;
    formLabel: string;
    signaturePresent: boolean;
  }): Promise<{ ok: true; confirmationId: string } | { ok: false; error: string; offline?: boolean }>;
}

class MockFaxProvider implements FaxProvider {
  async send(params: {
    county: string;
    formLabel: string;
    signaturePresent: boolean;
  }) {
    if (!params.signaturePresent) {
      return { ok: false as const, error: 'Add your signature before sending.' };
    }
    const confirmationId = `mock-fax-${Date.now()}`;
    console.log(`[MockFax] sent ${params.formLabel} to ${params.county}: ${confirmationId}`);
    await new Promise((r) => setTimeout(r, 600));
    return { ok: true as const, confirmationId };
  }
}

export const faxProvider: FaxProvider = new MockFaxProvider();
