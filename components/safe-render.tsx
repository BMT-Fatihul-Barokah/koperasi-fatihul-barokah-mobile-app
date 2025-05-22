import React, { useState, useEffect, useRef } from 'react';
import { InteractionManager, View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Logger } from '../lib/logger';

/**
 * A component that safely renders its children
 * after native interactions have completed.
 * 
 * This helps prevent "unknown view tag" errors and crashes by ensuring
 * components are mounted at the right time in the React Native lifecycle.
 */
export function SafeRender({
  children,
  placeholder,
  delay = 0,
  fallback = null
}: {
  children: React.ReactNode;
  placeholder?: React.ReactNode;
  delay?: number;
  fallback?: React.ReactNode;
}) {
  const [isReady, setIsReady] = useState(false);
  const isMountedRef = useRef(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Set mounted ref
    isMountedRef.current = true;
    
    try {
      // Wait for any animations/interactions to finish, plus optional delay
      const interactionPromise = InteractionManager.runAfterInteractions(() => {
        // Only update state if component is still mounted
        if (isMountedRef.current) {
          // Add a small delay to ensure the UI thread is completely free
          setTimeout(() => {
            if (isMountedRef.current) {
              setIsReady(true);
            }
          }, Platform.OS === 'android' ? Math.max(delay, 100) : delay);
        }
      });

      return () => {
        // Mark as unmounted to prevent state updates after unmounting
        isMountedRef.current = false;
        interactionPromise.cancel();
      };
    } catch (error) {
      Logger.error('SafeRender', 'Error in SafeRender', error);
      setHasError(true);
      return () => {
        isMountedRef.current = false;
      };
    }
  }, [delay]);

  // If there was an error during setup, show fallback
  if (hasError) {
    return fallback || (
      <View style={styles.errorContainer}>
        <ActivityIndicator size="small" color="#FF6B6B" />
      </View>
    );
  }

  // Show placeholder while waiting for interactions to complete
  if (!isReady) {
    return placeholder || (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#007BFF" />
      </View>
    );
  }

  // Render children when ready
  return <>{children}</>;
}

/**
 * Higher Order Component wrapper for SafeRender
 * Use this to wrap components that might cause rendering issues
 */
export function withSafeRender<P extends object>(
  Component: React.ComponentType<P>,
  options: { delay?: number; placeholder?: React.ReactNode; fallback?: React.ReactNode } = {}
) {
  const SafeRenderWrapper = (props: P) => {
    try {
      return (
        <SafeRender 
          delay={options.delay} 
          placeholder={options.placeholder}
          fallback={options.fallback}
        >
          <Component {...props} />
        </SafeRender>
      );
    } catch (error) {
      Logger.error('SafeRender', 'Error in withSafeRender HOC', error);
      return options.fallback || null;
    }
  };
  
  // Set display name for debugging
  const displayName = Component.displayName || Component.name || 'Component';
  SafeRenderWrapper.displayName = `withSafeRender(${displayName})`;
  
  return SafeRenderWrapper;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8F8',
  },
});
