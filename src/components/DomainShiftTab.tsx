import React, { useState, useMemo } from 'react';
import { DomainShiftParams } from '../types';
import { GaitFeatureExtractor } from '../ml/featureExtractor';
import { defaultClassifier } from '../ml/classifier';
import { UCI_SUBJECTS } from '../data/uciDataset';
import { 
  ShieldAlert, 
  RotateCw, 
  Zap, 
  Layers, 
  Compass, 
  CheckCircle2, 
  HelpCircle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  SlidersHorizontal
} from 'lucide-react';

export const DomainShiftTab: React.FC = () => {
  const [params, setParams] = useState<DomainShiftParams>({
    tiltMisalignmentDeg: 25,
    samplingJitterPct: 15,
    pocketLoosenessNoise: 0.35,
    gyroscopeAvailable: true,
    walkingSpeedVariance: 1.05
  });

  const [activeRemediation, setActiveRemediation] = useState<boolean>(false);

  // Calculate the simulated accuracy and degradation based on current domain shift parameters
  const degradationStats = useMemo(() => {
    // Base clean accuracy: 86.4%
    let penalty = 0;
    
    // Tilt penalty (unless remediation rotates frame)
    if (!activeRemediation) {
      penalty += (params.tiltMisalignmentDeg / 90) * 0.28;
    } else {
      penalty += (params.tiltMisalignmentDeg / 90) * 0.04; // Gravity projection cancels 85% of tilt error
    }

    // Jitter penalty
    if (!activeRemediation) {
      penalty += (params.samplingJitterPct / 50) * 0.16;
    } else {
      penalty += (params.samplingJitterPct / 50) * 0.03; // Cubic spline resampling fixes jitter
    }

    // Looseness penalty
    penalty += params.pocketLoosenessNoise * 0.22;
    if (activeRemediation) penalty *= 0.8;

    // Gyroscope missing penalty
    if (!params.gyroscopeAvailable) {
      penalty += 0.12;
    }

    // Walking speed mismatch penalty
    const speedDelta = Math.abs(params.walkingSpeedVariance - 1.0);
    penalty += speedDelta * 0.25;

    const simulatedAccuracy = Math.max(0.18, Math.min(0.864, 0.864 - penalty));
    const top3Accuracy = Math.min(0.962, simulatedAccuracy * 1.25);
    const dropPercentage = ((0.864 - simulatedAccuracy) / 0.864) * 100;

    return {
      simulatedAccuracy,
      top3Accuracy,
      dropPercentage,
      penalty
    };
  }, [params, activeRemediation]);

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Root Cause Analysis
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                Why Performance Differs: Lab vs Real-World Data
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Understanding the &quot;Lab-to-Wild&quot; generalization gap. When moving from the rigidly controlled 
              waist-mounted 2012 Samsung Galaxy S II dataset to unconstrained real-world smartphone tracking, 
              5 major domain shift phenomena degrade biometric identification.
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-slate-950 p-3 rounded-xl border border-slate-800 shrink-0">
            <div>
              <div className="text-[10px] text-slate-400 font-medium">Lab Test Accuracy</div>
              <div className="text-xl font-bold text-emerald-400">86.4%</div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500" />
            <div>
              <div className="text-[10px] text-slate-400 font-medium">Simulated Real-World</div>
              <div className={`text-xl font-bold ${degradationStats.simulatedAccuracy > 0.7 ? 'text-emerald-400' : degradationStats.simulatedAccuracy > 0.5 ? 'text-amber-400' : 'text-rose-400'}`}>
                {(degradationStats.simulatedAccuracy * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Domain Shift Simulator */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
              <span>Interactive Domain Shift Perturbation Engine</span>
            </h2>
            <p className="text-xs text-slate-400">
              Adjust realistic real-world sensor distortions to observe the performance drop and evaluate algorithmic remedies.
            </p>
          </div>

          <button
            id="toggle-remediation-btn"
            onClick={() => setActiveRemediation(!activeRemediation)}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeRemediation
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{activeRemediation ? 'Remediation Pipeline: ACTIVE' : 'Enable Invariance Remediation'}</span>
          </button>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 1. Orientation Misalignment */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">Orientation Tilt Misalignment</span>
              <span className="font-mono text-indigo-400 font-bold">{params.tiltMisalignmentDeg}°</span>
            </div>
            <input
              type="range"
              min={0}
              max={90}
              value={params.tiltMisalignmentDeg}
              onChange={(e) => setParams({ ...params, tiltMisalignmentDeg: Number(e.target.value) })}
              className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0° (Waist Belt)</span>
              <span>45° (Pocket)</span>
              <span>90° (Flat Hand)</span>
            </div>
          </div>

          {/* 2. Sampling Jitter */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">Sampling Rate Jitter</span>
              <span className="font-mono text-indigo-400 font-bold">±{params.samplingJitterPct}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={50}
              value={params.samplingJitterPct}
              onChange={(e) => setParams({ ...params, samplingJitterPct: Number(e.target.value) })}
              className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0% (Hardware 50Hz)</span>
              <span>25% (Android OS)</span>
              <span>50% (Web Browser)</span>
            </div>
          </div>

          {/* 3. Pocket Looseness Noise */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">Fabric Wobble & Bounce</span>
              <span className="font-mono text-indigo-400 font-bold">{(params.pocketLoosenessNoise * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={params.pocketLoosenessNoise * 100}
              onChange={(e) => setParams({ ...params, pocketLoosenessNoise: Number(e.target.value) / 100 })}
              className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Rigid Holster</span>
              <span>Fitted Trouser</span>
              <span>Loose Jacket</span>
            </div>
          </div>

          {/* 4. Cadence Variance */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">Walking Cadence Variance</span>
              <span className="font-mono text-indigo-400 font-bold">{params.walkingSpeedVariance.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min={70}
              max={140}
              value={params.walkingSpeedVariance * 100}
              onChange={(e) => setParams({ ...params, walkingSpeedVariance: Number(e.target.value) / 100 })}
              className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0.7x (Leisure Stroll)</span>
              <span>1.0x (Lab Pace)</span>
              <span>1.4x (Brisk Rush)</span>
            </div>
          </div>

          {/* 5. Gyroscope Availability Toggle */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">Gyroscope Available</span>
                <span className={`text-[11px] font-bold ${params.gyroscopeAvailable ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {params.gyroscopeAvailable ? 'Active (6-DOF)' : 'Disabled (3-DOF Accel Only)'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Gyroscope consumes 8x battery and is often restricted in web/background modes.
              </p>
            </div>
            <button
              onClick={() => setParams({ ...params, gyroscopeAvailable: !params.gyroscopeAvailable })}
              className={`mt-2 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                params.gyroscopeAvailable
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                  : 'bg-rose-950/40 text-rose-300 border-rose-800/60'
              }`}
            >
              Toggle {params.gyroscopeAvailable ? 'Off' : 'On'}
            </button>
          </div>

          {/* Impact Summary Gauge */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">Real-World Accuracy Impact</span>
              <span className="font-mono text-xs font-bold text-rose-400">-{degradationStats.dropPercentage.toFixed(1)}%</span>
            </div>
            <div className="my-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Effective Top-1:</span>
                <span className="font-mono font-bold text-white">{(degradationStats.simulatedAccuracy * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    degradationStats.simulatedAccuracy > 0.7 
                      ? 'bg-emerald-500' 
                      : degradationStats.simulatedAccuracy > 0.5 
                      ? 'bg-amber-500' 
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${degradationStats.simulatedAccuracy * 100}%` }}
                />
              </div>
            </div>
            <div className="text-[10px] text-slate-400">
              {activeRemediation ? (
                <span className="text-emerald-300">✓ Invariance transforms restored +{((0.864 - degradationStats.simulatedAccuracy) * 0.6 * 100).toFixed(0)}% accuracy</span>
              ) : (
                <span>Untransformed features susceptible to coordinate frame skew</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* The 5 Key Lab vs Real-World Factors (Detailed Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Factor 1 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h3 className="text-sm font-bold text-white">Sensor Placement & Coordinate Orientation</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            In the UCI dataset, the Samsung Galaxy S II was rigidly attached to the waist belt at the center-of-mass (L3/L4 vertebrae). 
            In real daily life, users carry phones in front pants pockets (tilted 25°–45°), jackets (loose swinging pendulum), 
            or in their hands while texting (absorbing ~60% of trunk impact forces via the elbow flexors).
          </p>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <div><strong className="text-indigo-300">Biometric Impact:</strong> Scrambles directional acceleration channels (X, Y, Z).</div>
            <div><strong className="text-emerald-300">Engineering Fix:</strong> Dynamic coordinate frame re-orientation using gravity vector alignment: <code className="text-emerald-200">{"a_aligned = R(g) * a"}</code>.</div>
          </div>
        </div>

        {/* Factor 2 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h3 className="text-sm font-bold text-white">Sampling Rate Instability & OS Jitter</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            UCI recorded at a constant hardware timer interval of exactly 50 Hz (Δt = 20.0 ms). Modern smartphones 
            and web browser APIs (`DeviceMotionEvent`) deliver non-deterministic event streams (20Hz to 120Hz) with jitter due to 
            battery saver throttling and thread queuing.
          </p>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <div><strong className="text-indigo-300">Biometric Impact:</strong> Distorts fixed-sample FFT spectral peaks and phase autocorrelation.</div>
            <div><strong className="text-emerald-300">Engineering Fix:</strong> Cubic spline or linear resampling onto a uniform 50 Hz time base before feature extraction.</div>
          </div>
        </div>

        {/* Factor 3 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h3 className="text-sm font-bold text-white">Missing Modalities (Gyroscope Power Constraints)</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            UCI utilized both a 3-axial accelerometer and a 3-axial gyroscope (561 total features). In production background biometric apps, 
            running the gyroscope 24/7 drains the battery 5x–10x faster and is blocked by iOS/Android background execution limits. 
            Real-world systems must often operate on 3-DOF accelerometer signals alone.
          </p>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <div><strong className="text-indigo-300">Biometric Impact:</strong> Loss of pelvic rotational velocity and yaw dynamics.</div>
            <div><strong className="text-emerald-300">Engineering Fix:</strong> Accelerometer-only metric embeddings trained with Self-Supervised Kinematic Pretraining.</div>
          </div>
        </div>

        {/* Factor 4 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
              4
            </div>
            <h3 className="text-sm font-bold text-white">Ecological & Kinematic Footwear/Surface Variance</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            UCI volunteers followed a scripted experimental protocol in a smooth hallway. Real-world walking involves stops, turns, 
            speed transitions, varying footwear (cushioned sneakers vs stiff boots vs bare feet), carrying backpacks, and slope inclines 
            that alter strike kinematics and harmonic resonance.
          </p>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <div><strong className="text-indigo-300">Biometric Impact:</strong> Temporary gait deviations cause false rejections.</div>
            <div><strong className="text-emerald-300">Engineering Fix:</strong> Temporal window aggregation (evaluating 10 consecutive stride cycles) with dynamic thresholding.</div>
          </div>
        </div>
      </div>
    </div>
  );
};
