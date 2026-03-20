import { createContext } from 'react';
import type { RouterSnapshot } from '../types';

export const RouterContext = createContext<RouterSnapshot | null>(null);
