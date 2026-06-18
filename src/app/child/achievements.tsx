import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FP } from '@/constants/theme';
import { useLanguage, type TranslationKey } from '@/shared/i18n';
import { useActiveChild, useFamilyPoints } from '@/shared/state';
import { AppButton, AppCard, AppScreen, LevelHeroCard, SegmentedControl, StatusBadge } from '@/shared/ui';
import type { ChildAchievementId, ChildSkillId } from '@/shared/types/family';
import {
  ACHIEVEMENT_DEFINITIONS,
  getChildAchievements,
  getChildLevelProgressFromXp,
  getChildProgress,
  getSkillRank,
  SKILL_DEFINITIONS,
} from '@/shared/utils/leveling';
import { getBalance } from '@/shared/utils/points';

type LevelTab = 'skills' | 'achievements';

const skillTitleKeys: Record<ChildSkillId, TranslationKey> = {
  task_bonus: 'child.skill.taskBonus.title',
  savings_speed: 'child.skill.savingsSpeed.title',
  savings_yield: 'child.skill.savingsYield.title',
  combo_bonus: 'child.skill.comboBonus.title',
  quest_chain: 'child.skill.questChain.title',
  savings_master: 'child.skill.savingsMaster.title',
  legend_badge: 'child.skill.legendBadge.title',
};

const skillDescriptionKeys: Record<ChildSkillId, TranslationKey> = {
  task_bonus: 'child.skill.taskBonus.description',
  savings_speed: 'child.skill.savingsSpeed.description',
  savings_yield: 'child.skill.savingsYield.description',
  combo_bonus: 'child.skill.comboBonus.description',
  quest_chain: 'child.skill.questChain.description',
  savings_master: 'child.skill.savingsMaster.description',
  legend_badge: 'child.skill.legendBadge.description',
};

const achievementTitleKeys: Record<ChildAchievementId, TranslationKey> = {
  first_task: 'child.achievement.firstTask.title',
  tasks_10: 'child.achievement.tasks10.title',
  tasks_25: 'child.achievement.tasks25.title',
  tasks_50: 'child.achievement.tasks50.title',
  first_investment: 'child.achievement.firstInvestment.title',
  first_investment_payout: 'child.achievement.firstInvestmentPayout.title',
  streak_3: 'child.achievement.streak3.title',
  first_reward: 'child.achievement.firstReward.title',
  savings_profit_100: 'child.achievement.savingsProfit100.title',
};

const achievementDescriptionKeys: Record<ChildAchievementId, TranslationKey> = {
  first_task: 'child.achievement.firstTask.description',
  tasks_10: 'child.achievement.tasks10.description',
  tasks_25: 'child.achievement.tasks25.description',
  tasks_50: 'child.achievement.tasks50.description',
  first_investment: 'child.achievement.firstInvestment.description',
  first_investment_payout: 'child.achievement.firstInvestmentPayout.description',
  streak_3: 'child.achievement.streak3.description',
  first_reward: 'child.achievement.firstReward.description',
  savings_profit_100: 'child.achievement.savingsProfit100.description',
};

const ChildAchievementsScreen = () => {
  const { t } = useLanguage();
  const { activeChild, activeChildId, activeChildName } = useActiveChild();
  const [activeTab, setActiveTab] = useState<LevelTab>('skills');
  const {
    childAchievements,
    childProgress,
    childSkillUnlocks,
    pointTransactions,
    rewardRedemptions,
    taskSubmissions,
    tasks,
    unlockSkill,
  } = useFamilyPoints();

  const progress = getChildProgress(
    { childProgress, childSkillUnlocks, taskSubmissions, tasks },
    activeChildId,
  );
  const balance = getBalance(pointTransactions, activeChildId);
  const levelProgress = getChildLevelProgressFromXp(progress.xp);
  const hasLegendBadge = getSkillRank(childSkillUnlocks, activeChildId, 'legend_badge') > 0;
  const achievements = getChildAchievements({
    tasks,
    submissions: taskSubmissions,
    pointTransactions,
    rewardRedemptions,
    childId: activeChildId,
  });

  return (
    <AppScreen
      title={t('child.level.title')}
      subtitle={t('child.level.subtitle', { name: activeChildName || t('common.child') })}>
      <LevelHeroCard
        avatarColor={activeChild?.avatarColor}
        avatarLabel={activeChildName || t('common.child')}
        detailLabel={
          levelProgress.isMaxLevel
            ? t('child.level.maxed')
            : t('child.level.toLevel', { level: levelProgress.level + 1 })
        }
        levelLabel={t('child.level.levelShort', { level: levelProgress.level })}
        progress={levelProgress.progressPercent}
        rankLabel={hasLegendBadge ? t('child.level.legendStatus') : levelProgress.rank}
        skillLabel={t('child.level.skillPoints', { count: progress.unspentSkillPoints })}
        xpLabel={
          levelProgress.isMaxLevel
            ? t('child.level.maxXpSummary', { total: levelProgress.totalXp })
            : `${levelProgress.currentLevelXp} / ${levelProgress.nextLevelXp} XP`
        }
      />

      <SegmentedControl<LevelTab>
        options={[
          { label: t('child.level.tabSkills'), value: 'skills' },
          { label: t('child.level.tabAchievements'), value: 'achievements' },
        ]}
        value={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'skills' && (
        <View style={styles.list}>
          {SKILL_DEFINITIONS.map((skill) => {
            const rank = getSkillRank(childSkillUnlocks, activeChildId, skill.id);
            const minLevel = skill.minLevel ?? 1;
            const isLevelLocked = progress.level < minLevel;
            const canUnlock = !isLevelLocked && progress.unspentSkillPoints > 0 && rank < skill.maxRank;

            return (
              <AppCard key={skill.id}>
                <View style={styles.row}>
                  <View style={styles.textCol}>
                    <Text style={styles.title}>{t(skillTitleKeys[skill.id])}</Text>
                    <Text style={styles.meta}>{t(skillDescriptionKeys[skill.id])}</Text>
                  </View>
                  <StatusBadge
                    label={t('child.level.rank', { rank, max: skill.maxRank })}
                    tone={rank > 0 ? 'success' : 'muted'}
                  />
                </View>
                <AppButton
                  title={rank >= skill.maxRank ? t('child.level.maxed') : t('child.level.unlock')}
                  subtitle={
                    canUnlock
                      ? t('child.level.spendPoint')
                      : rank >= skill.maxRank
                        ? undefined
                        : isLevelLocked
                          ? t('child.level.requiresLevel', { level: minLevel })
                          : t('child.level.noSkillPoints')
                  }
                  disabled={!canUnlock}
                  variant="secondary"
                  onPress={() => unlockSkill({ childId: activeChildId, skillId: skill.id })}
                />
              </AppCard>
            );
          })}
        </View>
      )}

      {activeTab === 'achievements' && (
        <View style={styles.list}>
          {achievements.map((achievement) => {
            const storedAchievement = childAchievements.find(
              (item) =>
                item.childId === activeChildId && item.achievementId === achievement.id,
            );
            const definition = ACHIEVEMENT_DEFINITIONS.find((item) => item.id === achievement.id);
            const xpReward = definition?.xpReward ?? achievement.xpReward;

            return (
              <AppCard key={achievement.id}>
                <View style={styles.row}>
                  <View style={styles.textCol}>
                    <Text style={styles.title}>{t(achievementTitleKeys[achievement.id])}</Text>
                    <Text style={styles.meta}>{t(achievementDescriptionKeys[achievement.id])}</Text>
                  </View>
                  <StatusBadge
                    label={achievement.unlocked ? t('child.level.unlocked') : `+${xpReward} XP`}
                    tone={achievement.unlocked ? 'success' : 'muted'}
                  />
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${Math.round((achievement.progress / achievement.target) * 100)}%` as `${number}%` }]} />
                </View>
                <Text style={styles.meta}>
                  {t('child.level.progressCount', {
                    current: storedAchievement?.progress ?? achievement.progress,
                    target: achievement.target,
                  })}
                </Text>
              </AppCard>
            );
          })}
        </View>
      )}
    </AppScreen>
  );
};

export default ChildAchievementsScreen;

const styles = StyleSheet.create({
  levelTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  levelNumber: {
    color: FP.text,
    fontSize: 34,
    fontWeight: '900',
  },
  legendLevelCard: {
    backgroundColor: '#FFF4D1',
    borderColor: '#D89B21',
    borderWidth: 1,
  },
  legendLevelNumber: {
    color: '#8A5A00',
  },
  legendMeta: {
    color: '#6F4D08',
  },
  list: {
    gap: 12,
  },
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  textCol: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: FP.text,
    fontSize: 18,
    fontWeight: '900',
  },
  meta: {
    color: FP.textSub,
    fontSize: 14,
    lineHeight: 20,
  },
  progressTrack: {
    backgroundColor: 'rgba(102,58,0,0.12)',
    borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: 999,
    borderWidth: 1,
    height: 10,
    overflow: 'hidden',
    padding: 1,
  },
  progressFill: {
    backgroundColor: FP.accent,
    borderRadius: 999,
    height: '100%',
  },
  legendProgressFill: {
    backgroundColor: '#D89B21',
  },
});
