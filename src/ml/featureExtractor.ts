import { SensorReading, ExtractedFeatures, SubjectProfile, DomainShiftParams } from '../types';

/**
 * Real-time signal processing and feature extraction for smartphone accelerometer signals.
 * Models the UCI HAR 561-feature extraction pipeline distilled to core biomechanical gait features.
 */
export class GaitFeatureExtractor {
  // Low-pass filter state for gravity separation (approx 0.3 Hz cutoff at 50Hz sampling)
  private gravX = 0;
  private gravY = 0;
  private gravZ = 9.81;
  private alpha = 0.8; // Smoothing factor for gravity isolation

  /**
   * Separates gravity from linear body acceleration using recursive low-pass filter
   */
  public separateGravity(reading: SensorReading): { bodyAcc: { x: number; y: number; z: number }; gravity: { x: number; y: number; z: number } } {
    this.gravX = this.alpha * this.gravX + (1 - this.alpha) * reading.x;
    this.gravY = this.alpha * this.gravY + (1 - this.alpha) * reading.y;
    this.gravZ = this.alpha * this.gravZ + (1 - this.alpha) * reading.z;

    const bodyX = reading.x - this.gravX;
    const bodyY = reading.y - this.gravY;
    const bodyZ = reading.z - this.gravZ;

    return {
      bodyAcc: { x: bodyX, y: bodyY, z: bodyZ },
      gravity: { x: this.gravX, y: this.gravY, z: this.gravZ }
    };
  }

  /**
   * Extracts biometric gait feature vector from a window of sensor readings (typically 64-128 samples)
   */
  public extractWindowFeatures(window: SensorReading[]): ExtractedFeatures {
    if (window.length === 0) {
      return {
        meanX: 0, meanY: 0, meanZ: 0,
        stdX: 0, stdY: 0, stdZ: 0,
        energyTotal: 0, cadence: 1.8,
        jerkMagnitude: 0, tiltAngleX: 0, tiltAngleY: 0,
        spectralPeakFreq: 1.8, spectralEntropy: 0.5, stepRegularity: 0.85
      };
    }

    const n = window.length;
    let sumX = 0, sumY = 0, sumZ = 0;
    let sumSqX = 0, sumSqY = 0, sumSqZ = 0;
    let totalEnergy = 0;

    for (let i = 0; i < n; i++) {
      const r = window[i];
      sumX += r.x;
      sumY += r.y;
      sumZ += r.z;
      sumSqX += r.x * r.x;
      sumSqY += r.y * r.y;
      sumSqZ += r.z * r.z;
      totalEnergy += (r.x * r.x + r.y * r.y + r.z * r.z);
    }

    const meanX = sumX / n;
    const meanY = sumY / n;
    const meanZ = sumZ / n;

    const stdX = Math.sqrt(Math.max(0, (sumSqX / n) - (meanX * meanX)));
    const stdY = Math.sqrt(Math.max(0, (sumSqY / n) - (meanY * meanY)));
    const stdZ = Math.sqrt(Math.max(0, (sumSqZ / n) - (meanZ * meanZ)));

    // Calculate Jerk magnitude (derivative of acceleration)
    let jerkSum = 0;
    for (let i = 1; i < n; i++) {
      const dt = Math.max(0.001, (window[i].timestamp - window[i - 1].timestamp) / 1000);
      const djx = (window[i].x - window[i - 1].x) / dt;
      const djy = (window[i].y - window[i - 1].y) / dt;
      const djz = (window[i].z - window[i - 1].z) / dt;
      jerkSum += Math.sqrt(djx * djx + djy * djy + djz * djz);
    }
    const jerkMagnitude = jerkSum / (n - 1 || 1);

    // Tilt angles from mean gravitational vector
    const tiltAngleX = Math.atan2(meanX, Math.sqrt(meanY * meanY + meanZ * meanZ)) * (180 / Math.PI);
    const tiltAngleY = Math.atan2(meanY, Math.sqrt(meanX * meanX + meanZ * meanZ)) * (180 / Math.PI);

    // Estimate dominant gait frequency via autocorrelation on vertical/magnitude channel
    const mags = window.map(w => w.magnitude);
    const magMean = mags.reduce((a, b) => a + b, 0) / n;
    const normMags = mags.map(m => m - magMean);

    // Autocorrelation across lags from 15 to 45 (corresponding to 1.1Hz to 3.3Hz at 50Hz)
    let bestLag = 27; // default ~1.85 Hz
    let maxCorr = -1;
    for (let lag = 15; lag < Math.min(50, Math.floor(n / 2)); lag++) {
      let corr = 0;
      let denom = 0;
      for (let i = 0; i < n - lag; i++) {
        corr += normMags[i] * normMags[i + lag];
        denom += normMags[i] * normMags[i];
      }
      if (denom > 0) {
        const normCorr = corr / denom;
        if (normCorr > maxCorr) {
          maxCorr = normCorr;
          bestLag = lag;
        }
      }
    }

    const estimatedDt = (window[n - 1].timestamp - window[0].timestamp) / (n - 1 || 1) / 1000;
    const samplingFreq = estimatedDt > 0 ? 1 / estimatedDt : 50;
    const cadence = Math.min(2.8, Math.max(1.2, samplingFreq / (bestLag || 27)));

    return {
      meanX, meanY, meanZ,
      stdX, stdY, stdZ,
      energyTotal: totalEnergy / n,
      cadence,
      jerkMagnitude,
      tiltAngleX,
      tiltAngleY,
      spectralPeakFreq: cadence,
      spectralEntropy: Math.min(0.95, Math.max(0.15, 0.45 + (stdX + stdY + stdZ) * 0.05)),
      stepRegularity: Math.max(0.2, Math.min(0.98, maxCorr > 0 ? maxCorr : 0.75))
    };
  }

  /**
   * Generates realistic synthetic/simulated sensor stream for testing real-world trials & UCI profiles
   */
  public generateStreamForSubject(
    subject: SubjectProfile,
    durationSec: number = 10,
    samplingRate: number = 50,
    domainShift?: DomainShiftParams
  ): SensorReading[] {
    const readings: SensorReading[] = [];
    const totalSamples = durationSec * samplingRate;
    const dt = 1000 / samplingRate;
    const now = Date.now();

    const tilt = domainShift ? (domainShift.tiltMisalignmentDeg * Math.PI) / 180 : 0;
    const jitter = domainShift ? domainShift.samplingJitterPct / 100 : 0;
    const looseness = domainShift ? domainShift.pocketLoosenessNoise : 0;
    const speedVar = domainShift ? domainShift.walkingSpeedVariance : 1.0;

    const baseCadence = subject.cadenceHz * speedVar;
    const omega = 2 * Math.PI * baseCadence;

    let timeAcc = now;

    for (let i = 0; i < totalSamples; i++) {
      const t = (i / samplingRate);
      
      // Biomechanical gait model:
      // Vertical (Y or Z depending on orientation): primary bounce at 2 * step frequency (stride has 2 steps)
      const vertOsc = Math.sin(2 * omega * t) * 1.8 * subject.verticalGaitRatio 
                    + Math.sin(4 * omega * t) * 0.4 * subject.dominantHarmonicRatio;
      
      // Anteroposterior (forward): surge at step frequency with subject asymmetry
      const fwdOsc = Math.sin(omega * t) * 0.9 + Math.cos(2 * omega * t) * (subject.asymmetryIndex * 3.5);
      
      // Mediolateral (lateral side-to-side): pelvic sway at half the step frequency (1 stride)
      const latOsc = Math.cos(omega * t) * 0.6;

      // Base gravity (phone upright or tilted)
      const gX = 9.81 * Math.sin(tilt);
      const gY = 9.81 * Math.cos(tilt);
      const gZ = 0.2;

      // Pocket looseness generates non-linear parasitic high-frequency harmonics and noise
      const noiseAmp = 0.15 + looseness * 1.2;
      const pocketWobble = looseness > 0 ? Math.sin(omega * 3.5 * t) * looseness * 1.5 : 0;

      const rawX = latOsc + gX + (Math.random() - 0.5) * noiseAmp;
      const rawY = vertOsc + gY + pocketWobble + (Math.random() - 0.5) * noiseAmp;
      const rawZ = fwdOsc + gZ + (Math.random() - 0.5) * noiseAmp;

      const mag = Math.sqrt(rawX * rawX + rawY * rawY + rawZ * rawZ);

      // Jitter in timestamp
      const jitterDelta = (Math.random() - 0.5) * dt * jitter;
      timeAcc += (dt + jitterDelta);

      readings.push({
        timestamp: timeAcc,
        x: Number(rawX.toFixed(4)),
        y: Number(rawY.toFixed(4)),
        z: Number(rawZ.toFixed(4)),
        magnitude: Number(mag.toFixed(4))
      });
    }

    return readings;
  }
}
