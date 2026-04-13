import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Updates from "expo-updates";
import { captureException } from "@/utils/errorReporting";

type AppErrorBoundaryProps = {
  children: React.ReactNode;
};

type AppErrorBoundaryState = {
  hasError: boolean;
  errorMessage?: string;
};

export class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    captureException(error, {
      tags: { scope: "render-boundary" },
      extra: { componentStack: info.componentStack },
    });
  }

  handleReload = async () => {
    try {
      await Updates.reloadAsync();
    } catch (error) {
      captureException(error, { tags: { scope: "reload" } });
    }
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.subtitle}>
          The app hit an unexpected error. Reload to recover.
        </Text>
        {this.state.errorMessage ? (
          <Text style={styles.errorText}>{this.state.errorMessage}</Text>
        ) : null}
        <TouchableOpacity style={styles.button} onPress={this.handleReload}>
          <Text style={styles.buttonText}>Reload App</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Figtree",
  },
  subtitle: {
    color: "#CBD5E1",
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 20,
    fontFamily: "Figtree",
  },
  errorText: {
    color: "#FCA5A5",
    fontSize: 12,
    marginTop: 12,
    textAlign: "center",
    fontFamily: "Figtree",
  },
  button: {
    marginTop: 20,
    backgroundColor: "#FF5A5F",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontFamily: "Figtree",
  },
});
