import { describe, expect, it } from 'vitest';
import { isAlchemyMaterialType } from './alchemyMaterials';

describe('isAlchemyMaterialType', () => {
  it('accepts supported alchemy material types and rejects unrelated materials', () => {
    expect(isAlchemyMaterialType('herb')).toBe(true);
    expect(isAlchemyMaterialType('ore')).toBe(true);
    expect(isAlchemyMaterialType('monster')).toBe(true);
    expect(isAlchemyMaterialType('tcdb')).toBe(true);
    expect(isAlchemyMaterialType('aux')).toBe(true);
    expect(isAlchemyMaterialType('skill_manual')).toBe(false);
  });
});
