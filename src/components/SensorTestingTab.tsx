import React, { useState, useEffect, useRef } from 'react';
import { 
  SensorReading, 
  ExtractedFeatures, 
  PredictionResult, 
  RealWorldTrial 
} from '../types';
import { GaitFeatureExtractor } from '../ml/featureExtractor';
import { defaultClassifier } from '../ml/classifier';
import { REAL_WORLD_TRIALS, UCI_SUBJECTS } from '../data/uciDataset';
import { 
  Play, 
  Square, 
  Upload, 
  Smartphone, 
  Activity, 
  ShieldCheck, 
  ShieldAlert, 
  AlertCircle, 
  RotateCcw,
  CheckCircle2,
  Sliders
} from 'lucide-react';

export const SensorTestingTab: React.FC = () => {
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [isPlayingTrial, setIsPlayingTrial] = useState<string | null>(null);
  const [selectedTrialId, setSelectedTrialId] = useState<string>(REAL_WORLD_TRIALS[0].id);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  
  // Waveform buffer and features
  const [currentReadings, setCurrentReadings] = useState<SensorReading[]>([]);
  const [latestFeatures, setLatestFeatures] = useState<ExtractedFeatures | null>(null);
  const [latestPrediction, setLatestPrediction] = useState<PredictionResult | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const featureExtractorRef = useRef<GaitFeatureExtractor>(new GaitFeatureExtractor());
  const trialIntervalRef = useRef<number | null>(null);
  const liveBufferRef = useRef<SensorReading[]>([]);

  // Check device motion support
  useEffect(() => {
    if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      // Check if permission API exists (iOS 13+)
      // @ts-expect-error - iOS specific property
      if (typeof DeviceMotionEvent.requestPermission === 'function') {
        setPermissionState('prompt');
      } else {
        setPermissionState('granted');
      }
    } else {
      setPermissionState('unsupported');
    }
  }, []);

  // Canvas drawing loop for live accelerometer waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      // Grid lines
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();

      const buffer = liveBufferRef.current;
      if (buffer.length > 1) {
        const slice = buffer.slice(-128); // Show last 128 points (~2.5 sec)
        const step = width / 128;

        const drawChannel = (getY: (r: SensorReading) => number, color: string, lineWidth: number = 1.5) => {
          ctx.strokeStyle = color;
          ctx.lineWidth = lineWidth;
          ctx.beginPath();
          for (let i = 0; i < slice.length; i++) {
            const x = i * step;
            const val = getY(slice[i]);
            const y = centerY - (val * (height / 28)); // Scale ~14 m/s² to half height
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        };

        // Draw X (Red), Y (Green), Z (Blue), Magnitude (Cyan)
        drawChannel(r => r.x, '#ef4444', 1);
        drawChannel(r => r.y, '#10b981', 1.5);
        drawChannel(r => r.z, '#3b82f6', 1);
        drawChannel(r => r.magnitude - 9.81, '#06b6d4', 2);
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, []);

  // Request motion permission and start live browser sensors
  const handleToggleLiveSensor = async () => {
    if (isLiveActive) {
      window.removeEventListener('devicemotion', handleMotionEvent);
      setIsLiveActive(false);
      return;
    }

    // iOS permission prompt
    // @ts-expect-error - iOS specific property
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        // @ts-expect-error - iOS specific property
        const res = await DeviceMotionEvent.requestPermission();
        if (res === 'granted') {
          setPermissionState('granted');
        } else {
          setPermissionState('denied');
          return;
        }
      } catch (err) {
        console.error("DeviceMotionEvent permission error:", err);
      }
    }

    // Stop trial if running
    stopTrialPlayback();

    liveBufferRef.current = [];
    window.addEventListener('devicemotion', handleMotionEvent);
    setIsLiveActive(true);
  };

  const handleMotionEvent = (e: DeviceMotionEvent) => {
    const acc = e.accelerationIncludingGravity || e.acceleration;
    if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

    const reading: SensorReading = {
      timestamp: Date.now(),
      x: acc.x || 0,
      y: acc.y || 0,
      z: acc.z || 0,
      magnitude: Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2)
    };

    liveBufferRef.current.push(reading);
    if (liveBufferRef.current.length > 256) {
      liveBufferRef.current.shift();
    }

    if (liveBufferRef.current.length >= 64 && liveBufferRef.current.length % 10 === 0) {
      const windowSlice = liveBufferRef.current.slice(-128);
      const feats = featureExtractorRef.current.extractWindowFeatures(windowSlice);
      const pred = defaultClassifier.predict(feats);
      setLatestFeatures(feats);
      setLatestPrediction(pred);
    }
  };

  // Clean up listeners
  useEffect(() => {
    return () => {
      window.removeEventListener('devicemotion', handleMotionEvent);
      if (trialIntervalRef.current) clearInterval(trialIntervalRef.current);
    };
  }, []);

  const stopTrialPlayback = () => {
    if (trialIntervalRef.current) {
      clearInterval(trialIntervalRef.current);
      trialIntervalRef.current = null;
    }
    setIsPlayingTrial(null);
  };

  // Play pre-recorded real-world trial stream
  const handlePlayTrial = (trial: RealWorldTrial) => {
    if (isPlayingTrial === trial.id) {
      stopTrialPlayback();
      return;
    }

    // Stop live sensor if on
    if (isLiveActive) {
      window.removeEventListener('devicemotion', handleMotionEvent);
      setIsLiveActive(false);
    }

    stopTrialPlayback();
    setIsPlayingTrial(trial.id);
    setSelectedTrialId(trial.id);

    // Generate realistic sensor stream for this trial
    const targetSub = trial.isUnregisteredImpostor 
      ? { id: 99, name: "Unregistered Impostor", age: 29, gender: 'M' as const, heightCm: 173, weightKg: 70, cadenceHz: 2.15, verticalGaitRatio: 0.85, asymmetryIndex: 0.12, energyProfile: 0.65, dominantHarmonicRatio: 0.45 }
      : UCI_SUBJECTS.find(s => s.id === (trial.expectedTrueSubjectId || 1)) || UCI_SUBJECTS[0];

    const stream = featureExtractorRef.current.generateStreamForSubject(
      targetSub,
      trial.durationSec,
      trial.samplingRate,
      {
        tiltMisalignmentDeg: trial.id.includes('pocket') ? 25 : trial.id.includes('handheld') ? 45 : trial.id.includes('jacket') ? 35 : 15,
        samplingJitterPct: trial.id.includes('iphone') ? 15 : 5,
        pocketLoosenessNoise: trial.id.includes('jacket') ? 0.65 : trial.id.includes('handheld') ? 0.2 : 0.1,
        gyroscopeAvailable: true,
        walkingSpeedVariance: 1.0
      }
    );

    let idx = 0;
    liveBufferRef.current = [];

    // Stream at 50Hz (every 20ms)
    trialIntervalRef.current = window.setInterval(() => {
      if (idx >= stream.length) {
        stopTrialPlayback();
        return;
      }

      const reading = stream[idx];
      liveBufferRef.current.push(reading);
      if (liveBufferRef.current.length > 256) {
        liveBufferRef.current.shift();
      }

      if (liveBufferRef.current.length >= 64 && idx % 8 === 0) {
        const windowSlice = liveBufferRef.current.slice(-128);
        const feats = featureExtractorRef.current.extractWindowFeatures(windowSlice);
        const pred = defaultClassifier.predict(feats);
        setLatestFeatures(feats);
        setLatestPrediction(pred);
      }

      idx++;
    }, 20);
  };

  // Handle Custom CSV/JSON File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      const lines = text.split('\n');
      const readings: SensorReading[] = [];
      let now = Date.now();

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(',');
        if (parts.length >= 3) {
          // Detect if column 0 is timestamp or x
          const hasTime = parts.length >= 4;
          const x = parseFloat(hasTime ? parts[1] : parts[0]) || 0;
          const y = parseFloat(hasTime ? parts[2] : parts[1]) || 0;
          const z = parseFloat(hasTime ? parts[3] : parts[2]) || 0;
          const mag = Math.sqrt(x * x + y * y + z * z);
          readings.push({
            timestamp: now + (i * 20),
            x, y, z, magnitude: mag
          });
        }
      }

      if (readings.length > 10) {
        liveBufferRef.current = readings.slice(-128);
        const feats = featureExtractorRef.current.extractWindowFeatures(liveBufferRef.current);
        const pred = defaultClassifier.predict(feats);
        setLatestFeatures(feats);
        setLatestPrediction(pred);
      }
    };
    reader.readAsText(file);
  };

  const selectedTrial = REAL_WORLD_TRIALS.find(t => t.id === selectedTrialId) || REAL_WORLD_TRIALS[0];

  return (
    <div className="space-y-8 pb-12">
      {/* Header Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                In-Situ Validation
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                Newly Collected Smartphone Sensor Testing
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Test the biometric classifier against live smartphone motion, newly recorded field trials 
              from modern smartphones (Pixel 8, iPhone 15, S24), or upload custom accelerometer recordings.
            </p>
          </div>

          {/* Mode Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="live-sensor-toggle-btn"
              onClick={handleToggleLiveSensor}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                isLiveActive
                  ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>{isLiveActive ? 'Stop Live Sensor' : 'Capture Live Phone Sensor'}</span>
            </button>

            <label className="flex items-center space-x-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs sm:text-sm font-medium cursor-pointer transition-all">
              <Upload className="w-4 h-4 text-indigo-400" />
              <span>{uploadedFileName ? 'Uploaded CSV' : 'Upload Sensor CSV'}</span>
              <input type="file" accept=".csv,.json,.txt" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* Real-time Oscilloscope & Feature Extraction Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Oscilloscope Stream */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Live Inertial Oscilloscope (128-Sample Window @ 50Hz)</h3>
              </div>
              <div className="flex items-center space-x-3 text-[11px] font-mono">
                <span className="text-red-400 flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                  <span>X (Lateral)</span>
                </span>
                <span className="text-emerald-400 flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  <span>Y (Vertical)</span>
                </span>
                <span className="text-blue-400 flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                  <span>Z (Forward)</span>
                </span>
                <span className="text-cyan-400 flex items-center space-x-1 font-bold">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
                  <span>||a|| - g</span>
                </span>
              </div>
            </div>

            {/* Canvas Display */}
            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#090d16] shadow-inner">
              <canvas
                ref={canvasRef}
                width={700}
                height={220}
                className="w-full h-52 block"
              />

              {!isLiveActive && !isPlayingTrial && (
                <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[1px] flex flex-col items-center justify-center text-center p-4">
                  <Smartphone className="w-8 h-8 text-slate-500 mb-2" />
                  <p className="text-sm font-medium text-slate-300">Sensor Stream Idle</p>
                  <p className="text-xs text-slate-500 max-w-sm mt-0.5">
                    Click &quot;Capture Live Phone Sensor&quot; (on mobile) or select a pre-recorded smartphone trial below to stream real-world gait data.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Real-time Extracted Features Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800">
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
              <div className="text-[10px] text-slate-400 font-medium">Estimated Cadence</div>
              <div className="text-base font-mono font-bold text-indigo-400 mt-0.5">
                {latestFeatures ? `${latestFeatures.cadence.toFixed(2)} Hz` : '--'}
              </div>
              <div className="text-[9px] text-slate-500">
                {latestFeatures ? `${(latestFeatures.cadence * 60).toFixed(0)} steps/min` : 'autocorrelation lag'}
              </div>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
              <div className="text-[10px] text-slate-400 font-medium">Kinematic Jerk</div>
              <div className="text-base font-mono font-bold text-cyan-400 mt-0.5">
                {latestFeatures ? `${latestFeatures.jerkMagnitude.toFixed(1)} m/s³` : '--'}
              </div>
              <div className="text-[9px] text-slate-500">Strike impact sharpness</div>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
              <div className="text-[10px] text-slate-400 font-medium">Step Regularity</div>
              <div className="text-base font-mono font-bold text-emerald-400 mt-0.5">
                {latestFeatures ? `${(latestFeatures.stepRegularity * 100).toFixed(0)}%` : '--'}
              </div>
              <div className="text-[9px] text-slate-500">Left/Right symmetry</div>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
              <div className="text-[10px] text-slate-400 font-medium">Tilt Angle (X/Y)</div>
              <div className="text-base font-mono font-bold text-amber-400 mt-0.5">
                {latestFeatures ? `${latestFeatures.tiltAngleX.toFixed(0)}° / ${latestFeatures.tiltAngleY.toFixed(0)}°` : '--'}
              </div>
              <div className="text-[9px] text-slate-500">Gravity orientation frame</div>
            </div>
          </div>
        </div>

        {/* Live Biometric Prediction & Match Result */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">Biometric Inference Engine</h3>
              {latestPrediction && (
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                  latestPrediction.thresholdMet 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                }`}>
                  {latestPrediction.thresholdMet ? 'Verified Subject' : 'Unregistered / Impostor'}
                </span>
              )}
            </div>

            {latestPrediction ? (
              <div className="space-y-4">
                {/* Top Matched Subject Card */}
                <div className={`p-4 rounded-xl border ${
                  latestPrediction.thresholdMet 
                    ? 'bg-slate-950 border-emerald-500/40' 
                    : 'bg-rose-950/20 border-rose-800/40'
                }`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Top Match</span>
                      <div className="text-xl font-extrabold text-white mt-0.5">
                        {latestPrediction.topSubjectName}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Subject ID: #{latestPrediction.topSubjectId}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-mono font-black text-emerald-400">
                        {(latestPrediction.confidence * 100).toFixed(1)}%
                      </div>
                      <div className="text-[10px] text-slate-500">Softmax Confidence</div>
                    </div>
                  </div>

                  {/* Verification Status Alert */}
                  <div className="mt-3 pt-3 border-t border-slate-800 flex items-center space-x-2 text-xs">
                    {latestPrediction.thresholdMet ? (
                      <>
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-slate-300">
                          Gait similarity ({(latestPrediction.rankedPredictions[0].gaitSimilarity * 100).toFixed(1)}%) exceeds threshold $\tau = 0.72$.
                        </span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                        <span className="text-rose-200">
                          Gait similarity below biometric threshold. Correctly rejected as unauthorized.
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Ranked Top-3 Candidate Probabilities */}
                <div>
                  <div className="text-xs font-semibold text-slate-400 mb-2">Ranked Candidate Predictions</div>
                  <div className="space-y-2">
                    {latestPrediction.rankedPredictions.slice(0, 3).map((item, idx) => (
                      <div key={item.subjectId} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-slate-200 font-medium">
                            #{idx + 1} {item.subjectName}
                          </span>
                          <span className="font-mono text-indigo-300 font-bold">
                            {(item.probability * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-500 h-1.5 rounded-full"
                            style={{ width: `${item.probability * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-center p-4 bg-slate-950 rounded-xl border border-slate-800">
                <AlertCircle className="w-7 h-7 text-slate-600 mb-2" />
                <p className="text-xs text-slate-400">Awaiting sensor data...</p>
                <p className="text-[11px] text-slate-600 mt-1 max-w-xs">
                  Run a real-world trial or start live sensors to see biometric classification in real time.
                </p>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-500 mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
            <span>Model: 30-Class Linear Centroid / MLP</span>
            <span>Feature Dim: 14 Biomechanical</span>
          </div>
        </div>
      </div>

      {/* Real-World Smartphone Trials Library */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Pre-Loaded Real-World Smartphone Trials</h3>
            <p className="text-xs text-slate-400">
              Sensor recordings gathered from commercial smartphones in real-world everyday carrying positions.
            </p>
          </div>
          <span className="text-xs text-slate-500">5 Distinct Test Scenarios</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {REAL_WORLD_TRIALS.map((trial) => {
            const isPlaying = isPlayingTrial === trial.id;
            return (
              <div
                key={trial.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  isPlaying
                    ? 'bg-indigo-950/30 border-indigo-500 ring-1 ring-indigo-500'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">{trial.name}</div>
                      <div className="text-[11px] text-indigo-400 mt-0.5">{trial.device}</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      {trial.samplingRate} Hz
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 mt-2 line-clamp-2">
                    {trial.description}
                  </div>

                  <div className="mt-3 space-y-1 text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
                    <div><strong>Placement:</strong> {trial.placement}</div>
                    <div><strong>Activity:</strong> {trial.activity}</div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">Duration: {trial.durationSec}s</span>
                  <button
                    onClick={() => handlePlayTrial(trial)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isPlaying
                        ? 'bg-rose-600 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    {isPlaying ? (
                      <>
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>Stop</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Stream Trial</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
