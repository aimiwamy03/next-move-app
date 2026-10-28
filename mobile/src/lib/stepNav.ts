import { Href } from 'expo-router';
import { StepAction } from '@/lib/recommendSteps';
import { ApplyProgress } from '@/store/AppStore';

/** Open a Steps action without marking it complete. */
export function openStep(
  router: { push: (href: Href) => void },
  action: StepAction,
  applyProgress: ApplyProgress,
) {
  const go = (href: Href) => router.push(href);
  switch (action.onKind) {
    case 'ss':
      go('/apply/ss-card');
      return;
    case 'bank':
      go('/apply/bank');
      return;
    case 'calfresh':
      go(
        applyProgress === 'sent'
          ? '/apply/sent'
          : applyProgress === 'ready_to_sign'
            ? '/apply/sign'
            : '/apply/expect/1',
      );
      return;
    case 'helper':
      go('/apply/helper');
      return;
    case 'housing':
      go('/resources/housing');
      return;
    case 'officer':
      go('/resources/officer');
      return;
    case 'employment':
      go('/apply/jobs');
      return;
  }
}
