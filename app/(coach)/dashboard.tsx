import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/presentation/stores/authStore';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/shared/constants/theme';

export default function CoachDashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const acciones = [
    {
      emoji: '👥',
      titulo: 'Clientes',
      descripcion: 'Gestiona tus atletas',
      ruta: '/(coach)/clients',
      color: Colors.primary,
      subtle: Colors.primarySubtle,
    },
    {
      emoji: '📋',
      titulo: 'Rutinas',
      descripcion: 'Crea y asigna rutinas',
      ruta: '/(coach)/routines',
      color: '#7C3AED',
      subtle: '#F5F3FF',
    },
    {
      emoji: '🥗',
      titulo: 'Nutrición',
      descripcion: 'Planes de alimentación',
      ruta: '/(coach)/nutrition',
      color: '#059669',
      subtle: '#ECFDF5',
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cabecera */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.accentBar} />
            <View>
              <Text style={styles.greeting}>Bienvenido 👋</Text>
              <Text style={styles.name}>{user?.fullName ?? 'Coach'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutText}>Salir</Text>
          </TouchableOpacity>
        </View>

        {/* Accesos directos */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCESOS RÁPIDOS</Text>
          <View style={styles.grid}>
            {acciones.map((accion) => (
              <TouchableOpacity
                key={accion.titulo}
                style={[styles.accionCard, { borderColor: accion.color + '30' }]}
                onPress={() => router.push(accion.ruta as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.accionIcon, { backgroundColor: accion.subtle }]}>
                  <Text style={styles.accionEmoji}>{accion.emoji}</Text>
                </View>
                <Text style={[styles.accionTitulo, { color: accion.color }]}>{accion.titulo}</Text>
                <Text style={styles.accionDesc}>{accion.descripcion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  accentBar: { width: 4, height: 40, backgroundColor: Colors.primary, borderRadius: 2 },
  greeting: { fontSize: FontSize.sm, color: Colors.textSecondary },
  name: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  logoutBtn: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  logoutText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' },
  section: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
  sectionLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, letterSpacing: 2, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  accionCard: {
    width: '47%', backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg, borderWidth: 1.5,
    padding: Spacing.md, gap: Spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  accionIcon: {
    width: 48, height: 48, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  accionEmoji: { fontSize: 24 },
  accionTitulo: { fontSize: FontSize.md, fontWeight: '800' },
  accionDesc: { fontSize: FontSize.xs, color: Colors.textSecondary },
});
