import {ComponentType} from 'react';
import {FlaskConical, Hospital, Landmark, LayoutGrid, Scissors, Store, Utensils, Wrench} from '../assets/icons/icons';

export type IconType = ComponentType<{color?: string; size?: number; strokeWidth?: number}>;

export const categories: {name: string; Icon: IconType}[] = [
  {name: 'Clinic', Icon: Hospital}, {name: 'Lab', Icon: FlaskConical},
  {name: 'Salon', Icon: Scissors}, {name: 'Bank', Icon: Landmark},
  {name: 'Restaurant', Icon: Utensils}, {name: 'Workshop', Icon: Wrench},
  {name: 'Pharmacy', Icon: Store}, {name: 'More', Icon: LayoutGrid},
];
