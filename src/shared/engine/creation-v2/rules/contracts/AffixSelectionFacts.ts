import {
  AffixCandidate,
  AffixCategory,
  CreationProductType,
  GongfaAffixRole,
} from '../../types';
import type { ElementType } from '@shared/types/constants';

export interface AffixSelectionBucketCaps {
  highTierTotal?: number;
  mythic?: number;
}

export interface AffixSelectionConstraints {
  categoryCaps: Partial<Record<AffixCategory, number>>;
  bucketCaps?: AffixSelectionBucketCaps;
  gongfaRoleCaps?: Partial<Record<GongfaAffixRole, number>>;
}

export interface SelectedGongfaSchoolPlan {
  primarySelected: boolean;
  primaryElement?: ElementType;
  resonanceCount: number;
  supportCount: number;
}

export interface AffixSelectionFacts {
  productType: CreationProductType;
  candidates: AffixCandidate[];
  remainingEnergy: number;
  inputTags: string[];
  maxSelections: number;
  selectionCount: number;
  selectedAffixIds: string[];
  selectedExclusiveGroups: string[];
  selectedCategoryCounts: Partial<Record<AffixCategory, number>>;
  selectionConstraints: AffixSelectionConstraints;
  elementBias?: ElementType;
  selectedGongfaSchoolPlan?: SelectedGongfaSchoolPlan;
}
