import { useCallback, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { useLanguage } from '@/shared/i18n';
import { useGrowthMissions } from '@/shared/state/GrowthMissionsProvider';
import { useFamilyPoints } from '@/shared/state';
import { useActiveChild } from '@/shared/state/useActiveChild';
import { AppButton, AppCard, AppScreen, AppTextInput, SectionTitle, StatusBadge } from '@/shared/ui';
import { getMissionCountdown } from '@/shared/utils/growthMissions';
import { applySavingsSkills } from '@/shared/utils/leveling';
import { getBalance } from '@/shared/utils/points';
import type { InvestmentProject } from '@/shared/types/family';

// ── Deposit Modal ─────────────────────────────────────────────────────────────

const DepositModal = ({
  project,
  effectiveBonusPercent,
  skillBonusPercent,
  balance,
  visible,
  onClose,
  onDeposit,
}: {
  project: InvestmentProject;
  effectiveBonusPercent: number;
  skillBonusPercent: number;
  balance: number;
  visible: boolean;
  onClose: () => void;
  onDeposit: (amount: number) => Promise<void>;
}) => {
  const { t } = useLanguage();
  const [amountStr, setAmountStr] = useState('');
  const [message, setMessage]     = useState('');
  const [loading, setLoading]     = useState(false);

  const amount  = parseInt(amountStr, 10);
  const payout  = !isNaN(amount) && amount > 0
    ? amount + Math.floor((amount * effectiveBonusPercent) / 100)
    : null;

  const handleDeposit = async () => {
    if (isNaN(amount) || amount < project.minAmount || amount > project.maxAmount) {
      setMessage(t('missions.depositInvalid'));
      return;
    }
    if (amount > balance) {
      setMessage(t('missions.depositInsufficient'));
      return;
    }
    setLoading(true);
    try {
      await onDeposit(amount);
      setMessage(t('missions.depositSuccess'));
      setAmountStr('');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAmountStr('');
    setMessage('');
    onClose();
  };

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={handleClose} />
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{project.title}</Text>
          <Text style={styles.modalSubtitle}>
            {t('missions.bonusLabel', {
              bonus: String(effectiveBonusPercent),
              days: String(project.durationDays),
            })}
            {skillBonusPercent > 0 ? ` (+${skillBonusPercent}%)` : ''}
          </Text>
          <Text style={styles.balanceText}>
            {t('missions.depositBalance', { balance: String(balance) })}
          </Text>

          <AppTextInput
            label={t('missions.depositAmountLabel', {
              min: String(project.minAmount),
              max: String(project.maxAmount),
            })}
            value={amountStr}
            onChangeText={(v) => {
              setAmountStr(v);
              setMessage('');
            }}
            keyboardType="number-pad"
            placeholder={String(project.minAmount)}
          />

          {payout !== null && (
            <View style={styles.payoutPreview}>
              <Text style={styles.payoutText}>
                {t('missions.payoutLabel', { payout: String(payout) })}
              </Text>
            </View>
          )}

          {Boolean(message) && (
            <Text style={styles.messageText}>{message}</Text>
          )}

          <View style={styles.modalActions}>
            <AppButton
              title={t('common.cancel')}
              variant="secondary"
              onPress={handleClose}
              style={styles.actionButton}
            />
            <AppButton
              title={
                loading
                  ? t('common.saving')
                  : t('missions.depositConfirm', { amount: amountStr || '…' })
              }
              onPress={handleDeposit}
              style={styles.actionButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ── Main screen ───────────────────────────────────────────────────────────────

const ChildGrowthMissionsScreen = () => {
  const { t } = useLanguage();
  const { projects, myInvestments, deposit, claim, reload } = useGrowthMissions();
  const { childSkillUnlocks, pointTransactions } = useFamilyPoints();
  const { activeChildId } = useActiveChild();

  // Refetch every time the screen comes into focus
  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const balance = getBalance(pointTransactions, activeChildId ?? '');
  const activeProjects = projects.filter((p) => p.status === 'active');

  const [selectedProject, setSelectedProject] = useState<InvestmentProject | null>(null);
  const [claimingId, setClaimingId]            = useState<string | null>(null);
  const [claimMessage, setClaimMessage]        = useState<{ id: string; text: string } | null>(null);

  const activeInvestments = myInvestments.filter((inv) => !inv.claimedAt);
  const claimedInvestments = myInvestments.filter((inv) => inv.claimedAt);
  // Projects where child already has an active (unclaimed) investment
  const investedProjectIds = new Set(activeInvestments.map((inv) => inv.projectId));
  const getSavingsPreview = (project: InvestmentProject) =>
    applySavingsSkills({
      bonusPercent: project.bonusPercent,
      durationDays: project.durationDays,
      unlocks: childSkillUnlocks,
      childId: activeChildId,
    });

  const handleDeposit = async (amount: number) => {
    if (!selectedProject) return;
    await deposit(selectedProject.id, amount);
    setSelectedProject(null);
  };

  const handleClaim = async (investmentId: string) => {
    setClaimingId(investmentId);
    try {
      await claim(investmentId);
      setClaimMessage({ id: investmentId, text: t('missions.claimSuccess') });
    } catch {
      setClaimMessage({ id: investmentId, text: t('missions.claimError') });
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <AppScreen title={t('missions.title')}>
      {/* ── Available missions ── */}
      <SectionTitle title={t('missions.availableTitle')} />

      {activeProjects.length === 0 && (
        <AppCard>
          <Text style={styles.emptyText}>{t('missions.empty')}</Text>
        </AppCard>
      )}

      {activeProjects.map((project) => {
        const alreadyInvested = investedProjectIds.has(project.id);
        const savingsPreview = getSavingsPreview(project);
        const skillBonusPercent = Math.max(0, savingsPreview.bonusPercent - project.bonusPercent);
        return (
          <AppCard key={project.id} style={alreadyInvested ? styles.projectCardInvested : undefined}>
            <Text style={styles.projectTitle}>{project.title}</Text>
            {Boolean(project.description) && (
              <Text style={styles.projectDescription}>{project.description}</Text>
            )}
            <View style={styles.metaRow}>
              <Text style={styles.metaChip}>
                {t('missions.bonusLabel', {
                  bonus: String(savingsPreview.bonusPercent),
                  days:  String(project.durationDays),
                })}
                {skillBonusPercent > 0 ? ` (+${skillBonusPercent}%)` : ''}
              </Text>
              <Text style={styles.metaChip}>
                {t('missions.range', {
                  min: String(project.minAmount),
                  max: String(project.maxAmount),
                })}
              </Text>
            </View>
            {alreadyInvested ? (
              <Text style={styles.alreadyInvestedText}>{t('missions.alreadyInvested')}</Text>
            ) : (
              <AppButton
                title={t('missions.depositButton')}
                onPress={() => setSelectedProject(project)}
              />
            )}
          </AppCard>
        );
      })}

      {/* ── My investments ── */}
      <SectionTitle title={t('missions.myTitle')} />

      {activeInvestments.length === 0 && (
        <AppCard>
          <Text style={styles.emptyText}>{t('missions.myEmpty')}</Text>
        </AppCard>
      )}

      {activeInvestments.map((inv) => {
        const { days, hours, minutes, ready } = getMissionCountdown(inv.maturesAt);
        const isClaiming = claimingId === inv.id;
        const msg = claimMessage?.id === inv.id ? claimMessage.text : null;
        return (
          <AppCard key={inv.id}>
            <View style={styles.invHeader}>
              <Text style={styles.invTitle}>{inv.projectTitle ?? '—'}</Text>
              {ready ? (
                <StatusBadge label={t('missions.readyToClaim')} tone="success" />
              ) : (
                <StatusBadge
                  label={
                    days > 0 || hours > 0
                      ? t('missions.matureIn', { days: String(days), hours: String(hours) })
                      : t('missions.matureInMinutes', { minutes: String(minutes) })
                  }
                  tone="muted"
                />
              )}
            </View>
            <Text style={styles.invMeta}>
              {inv.amount} → {inv.payoutAmount} {t('common.pointsShort')}
              {' '}(+{inv.bonusPercent}%)
            </Text>
            {Boolean(msg) && <Text style={styles.messageText}>{msg}</Text>}
            {ready && !inv.claimedAt && (
              <AppButton
                title={isClaiming ? t('common.saving') : t('missions.claimButton', { payout: String(inv.payoutAmount) })}
                onPress={() => handleClaim(inv.id)}
              />
            )}
          </AppCard>
        );
      })}

      {/* ── History (claimed) ── */}
      {claimedInvestments.length > 0 && (
        <>
          <SectionTitle title={t('missions.claimedLabel')} />
          {claimedInvestments.map((inv) => (
            <AppCard key={inv.id}>
              <View style={styles.invHeader}>
                <Text style={styles.invTitle}>{inv.projectTitle ?? '—'}</Text>
                <StatusBadge label={t('missions.claimedLabel')} tone="success" />
              </View>
              <Text style={styles.invMeta}>
                {inv.amount} → {inv.payoutAmount} {t('common.pointsShort')}
              </Text>
            </AppCard>
          ))}
        </>
      )}

      {/* ── Deposit modal ── */}
      {selectedProject && (
        <DepositModal
          project={selectedProject}
          effectiveBonusPercent={getSavingsPreview(selectedProject).bonusPercent}
          skillBonusPercent={Math.max(0, getSavingsPreview(selectedProject).bonusPercent - selectedProject.bonusPercent)}
          balance={balance}
          visible={Boolean(selectedProject)}
          onClose={() => setSelectedProject(null)}
          onDeposit={handleDeposit}
        />
      )}
    </AppScreen>
  );
};

export default ChildGrowthMissionsScreen;

const styles = StyleSheet.create({
  emptyText: {
    color: '#6B7B86',
    fontSize: 14,
    lineHeight: 21,
  },
  // available project card
  projectTitle: {
    color: '#12314A',
    fontSize: 18,
    fontWeight: '900',
  },
  projectDescription: {
    color: '#6B7B86',
    fontSize: 14,
    lineHeight: 21,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaChip: {
    backgroundColor: '#EDF6FF',
    borderRadius: 8,
    color: '#2B6CB0',
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  // investment card
  invHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  invTitle: {
    color: '#12314A',
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  invMeta: {
    color: '#6B7B86',
    fontSize: 14,
  },
  messageText: {
    color: '#12314A',
    fontSize: 13,
  },
  projectCardInvested: {
    opacity: 0.65,
  },
  alreadyInvestedText: {
    color: '#6B7B86',
    fontSize: 13,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  // modal
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(18, 49, 74, 0.26)',
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
    paddingBottom: 32,
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
    width: '100%',
  },
  modalTitle: {
    color: '#12314A',
    fontSize: 20,
    fontWeight: '900',
  },
  modalSubtitle: {
    color: '#2B6CB0',
    fontSize: 14,
    fontWeight: '600',
  },
  balanceText: {
    color: '#6B7B86',
    fontSize: 14,
  },
  payoutPreview: {
    backgroundColor: '#EDF6FF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  payoutText: {
    color: '#2B6CB0',
    fontSize: 15,
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
});
