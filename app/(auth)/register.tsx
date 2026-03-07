import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useAuthStore } from '../../src/presentation/stores/authStore';
import { UserRole } from '../../src/shared/types';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/shared/constants/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, status, error, clearError } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('athlete');

  const isLoading = status === 'loading';

  const handleRegister = async () => {
    clearError();
    await register({ fullName: fullName.trim(), email: email.trim(), password, role });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>🏋️</Text>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join FitCoach today</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Role selector */}
          <View style={styles.field}>
            <Text style={styles.label}>I AM A</Text>
            <View style={styles.roleRow}>
              {(['athlete', 'coach'] as UserRole[]).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.roleOption,
                    role === r && styles.roleOptionActive,
                    role === r && r === 'coach' && styles.roleOptionCoach,
                  ]}
                  onPress={() => setRole(r)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.roleEmoji}>{r === 'athlete' ? '🏃' : '💪'}</Text>
                  <Text
                    style={[
                      styles.roleLabel,
                      role === r && styles.roleLabelActive,
                    ]}
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>FULL NAME</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="John Doe"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>EMAIL</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>PASSWORD</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="At least 8 characters"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.footerLink}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  inner: {
    padding: Spacing.xl,
    paddingTop: Spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logo: {
    fontSize: 52,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    letterSpacing: 1,
  },
  form: {
    gap: Spacing.md,
  },
  errorBanner: {
    backgroundColor: `${Colors.error}18`,
    borderWidth: 1,
    borderColor: `${Colors.error}40`,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSize.sm,
  },
  field: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    letterSpacing: 2,
    fontWeight: '600',
  },
  roleRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  roleOption: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  roleOptionActive: {
    borderColor: Colors.athlete,
    backgroundColor: Colors.athleteSubtle,
  },
  roleOptionCoach: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySubtle,
  },
  roleEmoji: {
    fontSize: 28,
  },
  roleLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 1,
  },
  roleLabelActive: {
    color: Colors.textPrimary,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: FontSize.md,
    fontWeight: '700',
    letterSpacing: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  footerText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  footerLink: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
});
