import React, { useState, useEffect } from 'react';
import { InteractionManager, View, ActivityIndicator, StyleSheet } from 'react-native';

/**
 * A Higher Order Component that safely renders its children
 * after native interactions have completed.
 * 
 * This helps prevent "unknown view tag" errors by ensuring
 * components are mounted at the right time in the React Native lifecycle.
 */
export function SafeRender({
  children,
  placeholder,
  delay = 0
}: {
  children: React.ReactNode;
  placeholder?: React.ReactNode;
  delay?: number;
}) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait for any animations/interactions to finish, plus optional delay
    const interactionPromise = InteractionManager.runAfterInteractions(() => {
      // Add a small delay to ensure the UI thread is completely free
      setTimeout(() => {
        setIsReady(true);
      }, delay);
    });

    return () => {
      interactionPromise.cancel();
    };
  }, [delay]);

  if (!isReady) {
    // Show placeholder or default loading indicator
    return placeholder || (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#007BFF" />
      </View>
    );
  }

  return <>{children}</>;
}

/**
 * Higher Order Component wrapper for SafeRender
 * Use this to wrap components that might cause "unknown view tag" errors
 */
export function withSafeRender<P extends object>(
  Component: React.ComponentType<P>,
  options: { delay?: number; placeholder?: React.ReactNode } = {}
) {
  return function SafeRenderWrapper(props: P) {
    return (
      <SafeRender delay={options.delay} placeholder={options.placeholder}>
        <Component {...props} />
      </SafeRender>
    );
  };
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
