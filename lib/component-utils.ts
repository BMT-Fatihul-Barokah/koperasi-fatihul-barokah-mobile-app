import { useEffect, useRef } from 'react';
import { InteractionManager } from 'react-native';

/**
 * Utility hook to safely mount components after interactions are complete
 * This helps prevent "unknown view tag" errors by ensuring components
 * are mounted at the right time in the React Native lifecycle
 */
export function useSafeMount<T>(initialValue: T): { current: T; isMounted: boolean } {
  const ref = useRef<T>(initialValue);
  const isMountedRef = useRef<boolean>(false);
  
  useEffect(() => {
    // Set mounted flag after interactions are complete
    const interactionPromise = InteractionManager.runAfterInteractions(() => {
      isMountedRef.current = true;
    });
    
    return () => {
      // Clean up
      isMountedRef.current = false;
      interactionPromise.cancel();
    };
  }, []);
  
  return { current: ref.current, isMounted: isMountedRef.current };
}

/**
 * Utility to delay rendering until after interactions
 * This helps with smoother transitions and prevents race conditions
 */
export function useDelayedRender(delay = 0): boolean {
  const [shouldRender, setShouldRender] = useState(false);
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      InteractionManager.runAfterInteractions(() => {
        setShouldRender(true);
      });
    }, delay);
    
    return () => clearTimeout(timeout);
  }, [delay]);
  
  return shouldRender;
}

// Fix missing import
import { useState } from 'react';
