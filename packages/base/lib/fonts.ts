import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import { Instrument_Serif } from 'next/font/google';
import { cn } from './utils';

const instrumentSerif = Instrument_Serif({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  style: ['normal', 'italic'],
});

export const fonts = cn(
  GeistSans.variable,
  GeistMono.variable,
  instrumentSerif.variable,
  'touch-manipulation font-sans antialiased'
);
