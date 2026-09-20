import { useState, useEffect } from 'react';
import { getStats, getLanguageStats } from '../../lib/fetch';
import styles from './Stats.module.scss';

export default function Stats() {
  const [stats, setStats] = useState(null);
  const [languageStats, setLanguageStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [statsData, langStatsData] = await Promise.all([
          getStats(),
          getLanguageStats()
        ]);
        setStats(statsData);
        setLanguageStats(langStatsData);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className={styles.stats}>
        <div className={styles.loading}>Loading statistics...</div>
      </div>
    );
  }

  return (
    <div className={styles.stats}>
      <h2>📊 Database Statistics</h2>
      {stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <span className={styles.number}>{stats.total_hadiths?.toLocaleString() || '36,104'}</span>
            <span className={styles.label}>Total Hadiths</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.number}>{stats.total_translations?.toLocaleString() || '223,217'}</span>
            <span className={styles.label}>Total Translations</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.number}>{stats.total_books?.toLocaleString() || '10'}</span>
            <span className={styles.label}>Books</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.number}>{stats.total_chapters?.toLocaleString() || '407'}</span>
            <span className={styles.label}>Chapters</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.number}>{(stats.languages_available?.length || 0).toLocaleString()}</span>
            <span className={styles.label}>Languages</span>
          </div>
        </div>
      )}
    </div>
  );
}
