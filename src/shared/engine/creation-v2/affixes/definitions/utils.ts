import { ScalableParam } from "../types";

const QUALITY_COEFFICIENT_STEP = 0.125;

export function qualityScaledCoefficient(base: number): ScalableParam {
  return {
    base,
    scale: 'quality',
    coefficient: base * QUALITY_COEFFICIENT_STEP,
  };
}