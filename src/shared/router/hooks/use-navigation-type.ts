import type { RouterNavigationType } from '../types';
import { useRouter } from './use-router';

export function useNavigationType(): RouterNavigationType {
  return useRouter().navigationType;
}
