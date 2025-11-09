import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Package, CheckCircle, AlertCircle } from 'lucide-react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { useAuth } from '@/stores/useAuth';
import { RootStackParamList } from '@/navigation/types';

export const ProfileScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = useAuth((state) => state.user);

  // Extract user info
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const email = user?.email || 'No email';
  const isEmailVerified = user?.emailVerified || false;

  // Generate initials from display name
  const initials = useMemo(() => {
    const nameParts = displayName.split(' ');
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    return displayName.slice(0, 2).toUpperCase();
  }, [displayName]);

  // Format member since date from Firebase user creation time
  const memberSince = useMemo(() => {
    if (user?.metadata?.creationTime) {
      const date = new Date(user.metadata.creationTime);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    return 'Recently';
  }, [user]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.semantic.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: theme.colors.primaryTeal }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
        >
          <ArrowLeft color="#FFFFFF" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.primaryTeal }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={[styles.name, { color: theme.semantic.text }]}>{displayName}</Text>
          <Text style={[styles.memberSince, { color: theme.semantic.textMuted }]}>
            Member since {memberSince}
          </Text>
          {/* Email Verification Status */}
          <View style={styles.verificationBadge}>
            {isEmailVerified ? (
              <>
                <CheckCircle color={theme.colors.success} size={16} />
                <Text style={[styles.verificationText, { color: theme.colors.success }]}>
                  Email Verified
                </Text>
              </>
            ) : (
              <>
                <AlertCircle color={theme.colors.warning} size={16} />
                <Text style={[styles.verificationText, { color: theme.colors.warning }]}>
                  Email Not Verified
                </Text>
              </>
            )}
          </View>
        </View>

        <View style={[styles.statsContainer, { backgroundColor: theme.semantic.surface }]}>
          <View style={styles.statItem}>
            <Package color={theme.colors.primaryTeal} size={24} />
            <Text style={[styles.statValue, { color: theme.semantic.text }]}>42</Text>
            <Text style={[styles.statLabel, { color: theme.semantic.textMuted }]}>Total Shipments</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.semantic.border }]} />
          <View style={styles.statItem}>
            <Package color={theme.colors.accent} size={24} />
            <Text style={[styles.statValue, { color: theme.semantic.text }]}>8</Text>
            <Text style={[styles.statLabel, { color: theme.semantic.textMuted }]}>Active</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.semantic.border }]} />
          <View style={styles.statItem}>
            <Package color={theme.colors.success} size={24} />
            <Text style={[styles.statValue, { color: theme.semantic.text }]}>34</Text>
            <Text style={[styles.statLabel, { color: theme.semantic.textMuted }]}>Delivered</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.semantic.text }]}>Contact Information</Text>

          <View style={[styles.infoCard, { backgroundColor: theme.semantic.surface, borderColor: theme.semantic.border }]}>
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: `${theme.colors.primaryTeal}14` }]}>
                <Mail color={theme.colors.primaryTeal} size={20} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.semantic.textMuted }]}>Email</Text>
                <Text style={[styles.infoValue, { color: theme.semantic.text }]}>{email}</Text>
              </View>
            </View>

            <View style={[styles.infoDivider, { backgroundColor: theme.semantic.border }]} />

            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: `${theme.colors.primaryTeal}14` }]}>
                <Phone color={theme.colors.primaryTeal} size={20} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.semantic.textMuted }]}>Phone</Text>
                <Text style={[styles.infoValue, { color: theme.semantic.text }]}>
                  {user?.phoneNumber || 'Not provided'}
                </Text>
              </View>
            </View>

            <View style={[styles.infoDivider, { backgroundColor: theme.semantic.border }]} />

            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: `${theme.colors.primaryTeal}14` }]}>
                <MapPin color={theme.colors.primaryTeal} size={20} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.semantic.textMuted }]}>Address</Text>
                <Text style={[styles.infoValue, { color: theme.semantic.text }]}>
                  123 Main Street{'\n'}Toronto, ON M5V 3A8{'\n'}Canada
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.semantic.text }]}>Account Details</Text>

          <View style={[styles.infoCard, { backgroundColor: theme.semantic.surface, borderColor: theme.semantic.border }]}>
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: `${theme.colors.accent}14` }]}>
                <Calendar color={theme.colors.accent} size={20} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.semantic.textMuted }]}>Account Type</Text>
                <Text style={[styles.infoValue, { color: theme.semantic.text }]}>Premium</Text>
              </View>
            </View>

            <View style={[styles.infoDivider, { backgroundColor: theme.semantic.border }]} />

            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: `${theme.colors.accent}14` }]}>
                <Package color={theme.colors.accent} size={20} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.semantic.textMuted }]}>Default Carrier</Text>
                <Text style={[styles.infoValue, { color: theme.semantic.text }]}>Canada Post</Text>
              </View>
            </View>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.editButton,
            {
              backgroundColor: theme.colors.primaryTeal,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
          accessibilityRole="button"
        >
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 14,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  verificationText: {
    fontSize: 13,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  statDivider: {
    width: 1,
    marginHorizontal: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  infoCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
    gap: 4,
  },
  infoLabel: {
    fontSize: 13,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  infoDivider: {
    height: 1,
    marginVertical: 8,
  },
  editButton: {
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
