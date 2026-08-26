import {
  COMPATIBILITY_RULES,
  evaluateCompatibility,
  getBikeSpecDefinition,
  type CompatibilityBike,
  type CompatibilityRuleCode,
} from '@goweskit/bike-domain';
import type {
  Bike,
  CompatibilityCandidateInput,
  CompatibilityEvaluationResponse,
  CompatibilityRule,
  User,
} from '@goweskit/contracts';

import { AppError } from '../errors.js';

export interface CompatibilityBikeSource {
  getBike(user: User, bikeId: string): Promise<Bike>;
}

function toRuleResponse(
  rule: (typeof COMPATIBILITY_RULES)[number],
): CompatibilityRule {
  const standard = getBikeSpecDefinition(rule.bikeSpecCode);
  return {
    code: rule.code,
    label: rule.label,
    bikeSpecCode: rule.bikeSpecCode,
    candidateLabel: rule.candidateLabel,
    values: standard?.values.map((value) => ({ ...value })) ?? [],
    provenance: { ...rule.provenance },
  };
}

function toDomainBike(bike: Bike): CompatibilityBike {
  return {
    specs: Object.fromEntries(
      bike.specs.map((spec) => [
        spec.standardCode,
        spec.knowledge === 'known' && spec.value !== null
          ? { knowledge: 'known' as const, value: spec.value }
          : { knowledge: 'unknown' as const },
      ]),
    ),
  };
}

export class CompatibilityService {
  public constructor(private readonly bikeSource: CompatibilityBikeSource) {}

  public listRules(): CompatibilityRule[] {
    return COMPATIBILITY_RULES.map(toRuleResponse);
  }

  public getRule(code: CompatibilityRuleCode): CompatibilityRule {
    const rule = COMPATIBILITY_RULES.find(
      (candidate) => candidate.code === code,
    );
    if (rule === undefined) {
      throw new AppError(
        'COMPATIBILITY_RULE_NOT_FOUND',
        'Compatibility rule not found.',
        404,
      );
    }
    return toRuleResponse(rule);
  }

  public async evaluate(
    user: User,
    bikeId: string,
    candidates: CompatibilityCandidateInput[],
  ): Promise<CompatibilityEvaluationResponse> {
    const bike = await this.bikeSource.getBike(user, bikeId);
    return evaluateCompatibility(toDomainBike(bike), candidates);
  }
}
