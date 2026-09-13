export interface SubjectProfile {
  id: number;
  name: string;
  age: number;
  gender: 'M' | 'F';
  heightCm: number;
  weightKg: number;
  cadenceHz: number; // Stride frequency in Hz (e.g. 1.6 - 2.1)
  verticalGaitRatio: number;
  asymmetryIndex: number; // Left vs right leg asymmetry (0.01 - 0.09)
  energyProfile: number; // Average dynamic energy
  dominantHarmonicRatio: number;
}

export type ActivityType = 
  | 'WALKING' 
  | 'WALKING_UPSTAIRS' 
  | 'WALKING_DOWNSTAIRS' 
  | 'SITTING' 
  | 'STANDING' 
  | 'LAYING';

export interface SensorReading {
  timestamp: number;
  x: number;
  y: number;
  z: number;
  magnitude: number;
}

export interface ExtractedFeatures {
  meanX: number;
  meanY: number;
  meanZ: number;
  stdX: number;
  stdY: number;
  stdZ: number;
  energyTotal: number;
  cadence: number;
  jerkMagnitude: number;
  tiltAngleX: number;
  tiltAngleY: number;
  spectralPeakFreq: number;
  spectralEntropy: number;
  stepRegularity: number;
}

export interface PredictionResult {
  topSubjectId: number;
  topSubjectName: string;
  confidence: number;
  rankedPredictions: {
    subjectId: number;
    subjectName: string;
    probability: number;
    gaitSimilarity: number;
  }[];
  isUnknownOrImpostor: boolean;
  thresholdMet: boolean;
}

export interface EvaluationMetrics {
  top1Accuracy: number;
  top3Accuracy: number;
  top5Accuracy: number;
  macroPrecision: number;
  macroRecall: number;
  macroF1: number;
  equalErrorRate: number; // EER for biometric verification
  totalSamples: number;
  trainSamples: number;
  valSamples: number;
  testSamples: number;
  activityBreakdown: Record<ActivityType, { accuracy: number; samples: number }>;
}

export type SplitMethod = 'temporal_block' | 'random_window_leaky' | 'cross_activity';

export interface DomainShiftParams {
  tiltMisalignmentDeg: number; // 0 to 90 degrees
  samplingJitterPct: number; // 0 to 50%
  pocketLoosenessNoise: number; // 0 to 1
  gyroscopeAvailable: boolean;
  walkingSpeedVariance: number; // 0.5 to 1.5
}

export interface RealWorldTrial {
  id: string;
  name: string;
  device: string;
  placement: string;
  activity: string;
  samplingRate: number;
  description: string;
  durationSec: number;
  expectedTrueSubjectId?: number;
  isUnregisteredImpostor?: boolean;
}
