import { SafeAreaView, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';

interface ContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  scrollable?: boolean;
}

export function Container({ children, style, scrollable = false }: ContainerProps) {
  const content = (
    <View style={[styles.container, style]}>
      {children}
    </View>
  );

  if (scrollable) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {content}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
});
