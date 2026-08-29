import { describe, expect, it } from 'vitest';
import {
  DIAGNOSTIC_SYMPTOMS,
  getDiagnosticSymptomById,
  getDiagnosticSymptomsByCategory,
  searchDiagnosticSymptoms,
} from './diagnostics.js';

describe('Bicycle Diagnostics Domain', () => {
  it('contains comprehensive common cycling symptoms with inspection steps and torque specs', () => {
    expect(DIAGNOSTIC_SYMPTOMS.length).toBeGreaterThanOrEqual(6);

    for (const symptom of DIAGNOSTIC_SYMPTOMS) {
      expect(symptom.id).toBeDefined();
      expect(symptom.title.length).toBeGreaterThan(5);
      expect(symptom.description.length).toBeGreaterThan(10);
      expect(symptom.probableCauses.length).toBeGreaterThanOrEqual(2);
      expect(symptom.inspectionSteps.length).toBeGreaterThanOrEqual(2);
      expect(symptom.quickFix.length).toBeGreaterThan(10);
      expect(symptom.proShopRecommendedIf.length).toBeGreaterThan(10);
      expect(symptom.standardTorqueNm).toBeDefined();
    }
  });

  it('finds symptom by ID correctly', () => {
    const bb = getDiagnosticSymptomById('bb_creak');
    expect(bb).toBeDefined();
    expect(bb?.category).toBe('frame_bottom_bracket');
    expect(bb?.title).toContain('Creak');
  });

  it('filters symptoms by category', () => {
    const brakes = getDiagnosticSymptomsByCategory('brakes');
    expect(brakes.length).toBeGreaterThanOrEqual(2);
    expect(brakes.every((s) => s.category === 'brakes')).toBe(true);
  });

  it('searches symptoms by query keyword', () => {
    const results = searchDiagnosticSymptoms('rantai');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some((r) => r.id === 'chain_skip')).toBe(true);
  });
});
