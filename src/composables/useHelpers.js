import { computed } from 'vue';
import { useQuasar } from 'quasar';

export function useHelpers() {
  const $q = useQuasar();
  
  const iconColor = computed(() => $q.dark.isActive ? 'grey-4' : 'grey-8');

  return {
    iconColor,
  }
}
