import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useLanguage } from '@/shared/i18n';
import { supabaseGrowthMissionsService } from '@/shared/services/growthMissions';
import { useFamilyPoints } from '@/shared/state';
import { useGrowthMissions } from '@/shared/state/GrowthMissionsProvider';
import { AppButton, AppCard, AppScreen, ParentChildFilter, SectionTitle, StatusBadge } from '@/shared/ui';
import type { ChildInvestment, InvestmentProject } from '@/shared/types/family';
import { getMissionCountdown } from '@/shared/utils/growthMissions';

const MissionCard = ({
  childInvestments,
  project,
  onArchive,
}: {
  childInvestments?: ChildInvestment[];
  project: InvestmentProject;
  onArchive: (id: string) => void;
}) => {
  const { t } = useLanguage();
  const isActive = project.status === 'active';
  const projectInvestments = childInvestments?.filter((investment) => investment.projectId === project.id);

  return (
    <AppCard>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{project.title}</Text>
        <StatusBadge
          label={isActive ? t('missions.active') : t('missions.archived')}
          tone={isActive ? 'success' : 'muted'}
        />
      </View>
      {Boolean(project.description) && (
        <Text style={styles.cardDescription}>{project.description}</Text>
      )}
      <View style={styles.cardMeta}>
        <Text style={styles.metaText}>
          {t('missions.bonusLabel', {
            bonus: String(project.bonusPercent),
            days: String(project.durationDays),
          })}
        </Text>
        <Text style={styles.metaText}>
          {t('missions.range', {
            min: String(project.minAmount),
            max: String(project.maxAmount),
          })}
        </Text>
      </View>
      {isActive && (
        <View style={styles.actions}>
          <AppButton
            title={t('common.edit')}
            variant="secondary"
            onPress={() =>
              router.push({
                pathname: '/parent/create-growth-mission',
                params: { missionId: project.id },
              })
            }
            style={styles.actionButton}
          />
          <AppButton
            title={t('missions.archive')}
            variant="ghost"
            onPress={() => onArchive(project.id)}
            style={styles.actionButton}
          />
        </View>
      )}
      {projectInvestments && (
        <View style={styles.childInvestments}>
          {projectInvestments.length === 0 ? (
            <Text style={styles.childInvestmentEmpty}>{t('missions.childNoInvestments')}</Text>
          ) : (
            projectInvestments.map((investment) => {
              const countdown = getMissionCountdown(investment.maturesAt);
              const statusLabel = investment.claimedAt
                ? t('missions.claimedLabel')
                : countdown.ready
                  ? t('missions.readyToClaim')
                  : countdown.days > 0 || countdown.hours > 0
                    ? t('missions.dashboard.matureIn', {
                        days: String(countdown.days),
                        hours: String(countdown.hours),
                      })
                    : t('missions.dashboard.matureInMinutes', {
                        minutes: String(countdown.minutes),
                      });

              return (
                <View key={investment.id} style={styles.childInvestmentRow}>
                  <View style={styles.childInvestmentInfo}>
                    <Text style={styles.childInvestmentTitle}>
                      {t('missions.statInvested')}: {investment.amount}
                    </Text>
                    <Text style={styles.childInvestmentMeta}>
                      {t('missions.statExpected')}: {investment.payoutAmount}
                    </Text>
                  </View>
                  <StatusBadge
                    label={statusLabel}
                    tone={investment.claimedAt ? 'success' : countdown.ready ? 'warning' : 'muted'}
                  />
                </View>
              );
            })
          )}
        </View>
      )}
    </AppCard>
  );
};

const ParentGrowthMissionsScreen = () => {
  const { t } = useLanguage();
  const { children } = useFamilyPoints();
  const { projects, archiveMission, reload } = useGrowthMissions();
  const [confirmArchiveId, setConfirmArchiveId] = useState<string | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string | undefined>();
  const [selectedChildInvestments, setSelectedChildInvestments] = useState<ChildInvestment[]>([]);
  const [showArchived, setShowArchived] = useState(false);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const active   = projects.filter((p) => p.status === 'active');
  const archived = projects.filter((p) => p.status === 'archived');
  const visible  = showArchived ? archived : active;

  useEffect(() => {
    let isMounted = true;

    if (!selectedChildId) {
      setSelectedChildInvestments([]);
      return undefined;
    }

    supabaseGrowthMissionsService
      .fetchChildInvestments(selectedChildId)
      .then((investments) => {
        if (isMounted) {
          setSelectedChildInvestments(investments);
        }
      })
      .catch((error: unknown) => {
        console.warn('[ParentGrowthMissions] child investments filter failed', error);
        if (isMounted) {
          setSelectedChildInvestments([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedChildId]);

  const handleArchiveConfirm = async () => {
    if (!confirmArchiveId) return;
    await archiveMission(confirmArchiveId);
    setConfirmArchiveId(null);
  };

  return (
    <AppScreen title={t('missions.title')} subtitle={t('missions.subtitle')}>
      <ParentChildFilter
        childrenList={children}
        selectedChildId={selectedChildId}
        onChange={setSelectedChildId}
      />

      <SectionTitle
        title={showArchived ? t('missions.archived') : t('missions.active')}
        action={
          <AppButton
            title={showArchived ? t('missions.active') : t('missions.archived')}
            variant="ghost"
            onPress={() => setShowArchived((v) => !v)}
            style={styles.toggleButton}
          />
        }
      />
      {!showArchived && (
        <AppButton
          title={t('missions.createTitle')}
          onPress={() => router.push('/parent/create-growth-mission')}
        />
      )}

      {visible.length === 0 && (
        <AppCard>
          <Text style={styles.emptyText}>
            {showArchived ? t('missions.archivedEmpty') : t('missions.empty')}
          </Text>
        </AppCard>
      )}

      {visible.map((project) => (
        <MissionCard
          childInvestments={selectedChildId ? selectedChildInvestments : undefined}
          key={project.id}
          project={project}
          onArchive={(id) => setConfirmArchiveId(id)}
        />
      ))}

      {/* Archive confirmation modal */}
      <Modal
        animationType="fade"
        transparent
        visible={Boolean(confirmArchiveId)}
        onRequestClose={() => setConfirmArchiveId(null)}>
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setConfirmArchiveId(null)}
          />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('missions.archiveConfirmTitle')}</Text>
            <Text style={styles.modalText}>{t('missions.archiveConfirmText')}</Text>
            <View style={styles.modalActions}>
              <AppButton
                title={t('common.cancel')}
                variant="secondary"
                onPress={() => setConfirmArchiveId(null)}
                style={styles.actionButton}
              />
              <AppButton
                title={t('missions.archiveConfirm')}
                variant="ghost"
                onPress={handleArchiveConfirm}
                style={styles.actionButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
};

export default ParentGrowthMissionsScreen;

const styles = StyleSheet.create({
  cardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  cardTitle: {
    color: '#12314A',
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
  },
  cardDescription: {
    color: '#6B7B86',
    fontSize: 14,
    lineHeight: 21,
  },
  cardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  childInvestmentEmpty: {
    color: '#6B7B86',
    fontSize: 13,
    fontWeight: '700',
  },
  childInvestmentInfo: {
    flex: 1,
    gap: 3,
  },
  childInvestmentMeta: {
    color: '#6B7B86',
    fontSize: 13,
    fontWeight: '700',
  },
  childInvestmentRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  childInvestmentTitle: {
    color: '#12314A',
    fontSize: 14,
    fontWeight: '900',
  },
  childInvestments: {
    borderTopColor: '#ECE3CF',
    borderTopWidth: 1,
    gap: 8,
    paddingTop: 12,
  },
  metaText: {
    backgroundColor: '#EDF6FF',
    borderRadius: 8,
    color: '#2B6CB0',
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
  emptyText: {
    color: '#6B7B86',
    fontSize: 14,
    lineHeight: 21,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleButton: {
    paddingHorizontal: 10,
    paddingVertical: 9,
    minHeight: 42,
  },
  createButton: {
    minHeight: 42,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  // modal
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(18, 49, 74, 0.26)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalBackdrop: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#ECE3CF',
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    padding: 18,
    width: '88%',
  },
  modalTitle: {
    color: '#12314A',
    fontSize: 20,
    fontWeight: '900',
  },
  modalText: {
    color: '#6B7B86',
    fontSize: 14,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
});
