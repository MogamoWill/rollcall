import type { ChecklistPhase } from '@/types';

export interface TemplateItem {
  title: string;
  phase: ChecklistPhase;
}

export const DEFAULT_TEMPLATES: Record<ChecklistPhase, TemplateItem[]> = {
  pre_prod: [
    { title: 'Brief client valid\u00e9', phase: 'pre_prod' },
    { title: 'Rep\u00e9rage effectu\u00e9', phase: 'pre_prod' },
    { title: 'Shot list pr\u00e9par\u00e9e', phase: 'pre_prod' },
    { title: '\u00c9quipement v\u00e9rifi\u00e9 et charg\u00e9', phase: 'pre_prod' },
    { title: 'Batteries charg\u00e9es', phase: 'pre_prod' },
    { title: 'Cartes m\u00e9moire format\u00e9es', phase: 'pre_prod' },
    { title: 'Autorisations de tournage', phase: 'pre_prod' },
    { title: 'Plan de route / itin\u00e9raire', phase: 'pre_prod' },
    { title: 'M\u00e9t\u00e9o v\u00e9rifi\u00e9e', phase: 'pre_prod' },
    { title: 'Contact client confirm\u00e9', phase: 'pre_prod' },
  ],
  production: [
    { title: 'Check son (niveaux, micro)', phase: 'production' },
    { title: 'Check image (balance blancs, expo)', phase: 'production' },
    { title: 'Color checker tourn\u00e9', phase: 'production' },
    { title: 'Plans de coupe film\u00e9s', phase: 'production' },
    { title: 'Shot list compl\u00e9t\u00e9e', phase: 'production' },
    { title: 'Fichiers v\u00e9rifi\u00e9s sur carte', phase: 'production' },
    { title: 'Notes terrain prises', phase: 'production' },
    { title: 'Mat\u00e9riel rang\u00e9 et compt\u00e9', phase: 'production' },
    { title: 'Rien oubli\u00e9 sur le lieu', phase: 'production' },
  ],
  post_prod: [
    { title: 'Fichiers d\u00e9charg\u00e9s et backup\u00e9s', phase: 'post_prod' },
    { title: 'Double backup v\u00e9rifi\u00e9', phase: 'post_prod' },
    { title: 'Cartes re-format\u00e9es', phase: 'post_prod' },
    { title: 'D\u00e9rush effectu\u00e9', phase: 'post_prod' },
    { title: 'Montage premi\u00e8re version', phase: 'post_prod' },
    { title: '\u00c9talonnage', phase: 'post_prod' },
    { title: 'Sound design / mix audio', phase: 'post_prod' },
    { title: 'Export final', phase: 'post_prod' },
    { title: 'Livraison client', phase: 'post_prod' },
    { title: 'Archivage projet', phase: 'post_prod' },
  ],
};

export const PHASE_CONFIG: Record<ChecklistPhase, { label: string; icon: string; color: string }> = {
  pre_prod: { label: 'Pr\u00e9-production', icon: 'clipboard-text-outline', color: '#3B82F6' },
  production: { label: 'Tournage', icon: 'video-outline', color: '#F59E0B' },
  post_prod: { label: 'Post-production', icon: 'movie-edit', color: '#8B5CF6' },
};
