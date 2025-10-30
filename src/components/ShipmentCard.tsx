import React, { useMemo } from 'react';
import { Pressable, PressableProps, StyleSheet, Text, View } from 'react-native';

import { Shipment } from '@/types';
import { formatShipmentSubtitle, formatShipmentTitle, formatAbsoluteTime } from '@/utils/format';
import { StatusPill } from './StatusPill';
import { useTheme } from '@/theme/ThemeProvider';

export type ShipmentCardProps = PressableProps & {
  shipment: Shipment;
  compactTimeline?: boolean;
  footer?: React.ReactNode;
};

const ShipmentCardComponent: React.FC<ShipmentCardProps> = ({
  shipment,
  compactTimeline = true,
  footer,
  style: externalStyle,
  ...pressableProps
}) => {
  const theme = useTheme();

  const latestUpdate = useMemo(() => {
    if (shipment.checkpoints.length === 0) {
      return null;
    }
    return shipment.checkpoints[shipment.checkpoints.length - 1];
  }, [shipment.checkpoints]);

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => {
        const resolvedExternalStyle =
          typeof externalStyle === 'function' ? externalStyle({ pressed }) : externalStyle;

        return [
          styles.container,
          {
            backgroundColor: theme.semantic.surface,
            borderColor: theme.semantic.border,
            opacity: pressed ? 0.95 : 1,
          },
          resolvedExternalStyle,
        ];
      }}
      {...pressableProps}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleColumn}>
          <Text style={[styles.title, { color: theme.semantic.text }]}>{formatShipmentTitle(shipment)}</Text>
          <Text style={[styles.subtitle, { color: theme.semantic.textMuted }]}>
            {formatShipmentSubtitle(shipment)}
          </Text>
        </View>
        <StatusPill status={shipment.status} />
      </View>
      {latestUpdate ? (
        <View style={styles.updateWrapper}>
          <Text style={[styles.updateLabel, { color: theme.semantic.text }]}>
            {latestUpdate.label}
          </Text>
          <Text style={[styles.updateMeta, { color: theme.semantic.textMuted }]}>
            {latestUpdate.location ? `${latestUpdate.location} · ` : ''}{formatAbsoluteTime(latestUpdate.timeIso)}
          </Text>
        </View>
      ) : null}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </Pressable>
  );
};

export const ShipmentCard = React.memo(ShipmentCardComponent);

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleColumn: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
  },
  updateWrapper: {
    gap: 4,
    paddingVertical: 4,
  },
  updateLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  updateMeta: {
    fontSize: 13,
  },
  footer: {
    marginTop: 4,
  },
});
