export type BreathTrack = {
  id: string;
  title: string;
  body: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  source: any;
};

/** Guided tracks for the Breathe tab — swipe to change. */
export const breathTracks: BreathTrack[] = [
  {
    id: 'tension-release',
    title: 'The Tension Release Meditation',
    body: 'Let the body soften. Sample guided track.',
    source: require('../../assets/audio/breathe/The_Tension_Release_Meditation.mp3'),
  },
  {
    id: 'breath-awareness',
    title: 'Six minute breath awareness',
    body: 'Follow the breath, moment by moment.',
    source: require('../../assets/audio/breathe/Six_minute_breath_awareness.mp3'),
  },
  {
    id: 'mountain',
    title: 'Mountain meditation',
    body: 'Steady like a mountain. Sit with what is.',
    source: require('../../assets/audio/breathe/Mountain_meditation.mp3'),
  },
  {
    id: 'compassionate',
    title: 'Compassionate Breath',
    body: 'Kind attention with each inhale and exhale.',
    source: require('../../assets/audio/breathe/Compassionate_Breath.mp3'),
  },
  {
    id: 'body-scan',
    title: 'Body scan mindfulness',
    body: 'Notice the body from head to toe.',
    source: require('../../assets/audio/breathe/Body_scan_mindfulness.mp3'),
  },
];
