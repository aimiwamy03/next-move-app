import React, { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { safeBack } from '@/lib/nav';
import {
  BackButton,
  Body,
  Field,
  H1,
  MainButton,
  NavRow,
  Option,
  OverwhelmedButton,
  Screen,
  Spacer,
  Tiny,
} from '@/components/ui';
import { formSteps } from '@/mock/data';
import { useAppStore } from '@/store/AppStore';
import { api } from '@/providers/api';

export default function FormStep() {
  const router = useRouter();
  const { step: stepParam } = useLocalSearchParams<{ step: string }>();
  const step = Math.min(formSteps.length - 1, Math.max(0, Number(stepParam) || 0));
  const data = formSteps[step];
  const { session, patch, pauseForBreathe } = useAppStore();

  const existing = session.formAnswers[data.field];
  const [money, setMoney] = useState(
    typeof existing === 'number' ? String(existing) : existing ? String(existing) : '',
  );
  const [option, setOption] = useState(typeof existing === 'string' ? existing : '');
  const [error, setError] = useState<string | null>(null);

  const saveAndNext = async () => {
    setError(null);
    let value: string | number = option;
    if (data.kind === 'money') {
      const cleaned = money.replace(/[^0-9.]/g, '');
      if (cleaned === '') {
        setError('Enter an amount, even if it is 0.');
        return;
      }
      const n = Number(cleaned);
      if (Number.isNaN(n) || n < 0) {
        setError('Enter a number 0 or higher.');
        return;
      }
      if (n > 1000000) {
        setError('That amount looks too high. Double-check it.');
        return;
      }
      value = n;
    } else if (!option) {
      setError('Pick one to continue, or go back.');
      return;
    }

    const formAnswers = { ...session.formAnswers, [data.field]: value };
    patch({ formAnswers, formStep: step });
    await api.saveApplicationPartial({ [data.field]: value });

    if (step >= formSteps.length - 1) {
      patch({ applyProgress: 'ready_to_sign' });
      router.replace('/apply/sign');
      return;
    }
    router.push(`/apply/form/${step + 1}`);
  };

  return (
    <Screen>
      <NavRow
        left={<BackButton onPress={() => (step === 0 ? safeBack(router) : router.push(`/apply/form/${step - 1}`))} />}
        right={
          <Body muted>
            {step + 1} of {formSteps.length}
          </Body>
        }
      />
      <Spacer max={60} />
      <H1>{data.question}</H1>
      <Body muted style={{ marginTop: 10 }}>
        {data.hint}
      </Body>

      {data.kind === 'money' ? (
        <Field
          value={money ? `$ ${money}` : ''}
          onChangeText={(t) => {
            setMoney(t.replace(/[^0-9.]/g, ''));
            setError(null);
          }}
          keyboardType="decimal-pad"
          placeholder="$ 0"
          style={{ marginTop: 28, fontSize: 22 }}
        />
      ) : (
        <View style={{ gap: 12, marginTop: 28 }}>
          {data.options?.map((o) => (
            <Option
              key={o.value}
              title={o.label}
              selected={option === o.value}
              onPress={() => {
                setOption(o.value);
                setError(null);
              }}
            />
          ))}
        </View>
      )}

      {error ? <Body style={{ marginTop: 12, color: '#8E4A2C' }}>{error}</Body> : null}

      <Spacer />
      <MainButton label="Next" onPress={saveAndNext} style={{ marginBottom: 14 }} />
      <OverwhelmedButton
        onPress={() => {
          pauseForBreathe(`/apply/form/${step}`);
          router.push('/breathe');
        }}
      />
      <Tiny>Your answers save as you go.</Tiny>
    </Screen>
  );
}
