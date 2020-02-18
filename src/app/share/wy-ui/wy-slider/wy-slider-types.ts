import { Observable } from 'rxjs';

export interface WySliderStyle {
  width?: string | null;
  height?: string | null;
  left?: string | null;
  bottom?: string |null;
}

export interface SliderEventObsererConfig {
  start: string;
  move: string;
  end: string;
  filters: (e: Event) => boolean;
  pluckKey: string[];
  startPlucked$?: Observable<number>;
  moveResolved$?: Observable<number>;
  end$?: Observable<Event>;
}

export type SliderValue = number | null;
