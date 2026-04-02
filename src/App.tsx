import { useState } from "react";

type HedgingLevel = "low" | "medium" | "high";
type TimingFlag = "on_time" | "delayed";
type TensionLevel = "none" | "mild" | "high";
type VocAnomalyLevel = "none" | "mild" | "high";
type HeatRiseLevel = "none" | "slight" | "sharp";
type VisualFlag = "clear" | "smoke_visible";

type CandidateReading =
  | "ordinary_okay"
  | "guarded_or_strained"
  | "benign_environmental_variation"
  | "possible_local_hazard";

type AmbiguityLevel = "low" | "medium" | "high";
type RecommendedMode =
  | "neutral_acknowledgment"
  | "cautious_clarification"
  | "cautious_verification";

type AllowedResponse =
  | "neutral_acknowledgment"
  | "gentle_follow_up"
  | "inspect_prompt";

type ResponseClass = AllowedResponse | "none";

type AllowedResponseBand =
  | "narrow_acknowledgment"
  | "low_pressure_clarifying"
  | "low_pressure_verification";

type Pacing = "neutral" | "gentle";
type TrustUpdate = "none" | "blocked";
type MemoryPressure = "none";

type DeniedAction =
  | "strong_distress_claim"
  | "memory_commit"
  | "relationship_state_change"
  | "alarm_state_overreach"
  | "emergency_shutdown_overreach";

interface WordingObserverEmission {
  observer: "wording";
  clipped: boolean;
  warmth_delta: number;
  hedging: HedgingLevel;
}

interface TimingObserverEmission {
  observer: "timing";
  reply_delay_ms: number;
  baseline_delay_ms: number;
  timing_flag: TimingFlag;
}

interface SelfReportObserverEmission {
  observer: "self_report_context";
  literal_self_report: string;
  recent_sidestep: boolean;
  recent_tension: TensionLevel;
}

interface SmellObserverEmission {
  observer: "smell";
  voc_anomaly: VocAnomalyLevel;
  source_confidence: "low";
}

interface ThermalObserverEmission {
  observer: "thermal";
  heat_rise: HeatRiseLevel;
  temperature_delta_c: number;
}

interface VisualObserverEmission {
  observer: "visual";
  visible_smoke: false;
  visual_flag: VisualFlag;
}

interface InteractionalScenarioFrame {
  key: "interactional";
  label: "Interactional cue";
  scenario_id: string;
  baseline_id: string;
  user_input: string;
  observer_emissions: {
    wording: WordingObserverEmission;
    timing: TimingObserverEmission;
    selfReport: SelfReportObserverEmission;
  };
}

interface EnvironmentalScenarioFrame {
  key: "environmental";
  label: "Environmental cue";
  scenario_id: string;
  baseline_id: string;
  user_input: string;
  observer_emissions: {
    smell: SmellObserverEmission;
    thermal: ThermalObserverEmission;
    visual: VisualObserverEmission;
  };
}

type ScenarioFrame = InteractionalScenarioFrame | EnvironmentalScenarioFrame;
type ScenarioKey = ScenarioFrame["key"];

interface CandidateScore {
  label: CandidateReading;
  score: number;
}

interface InterpretationSynthesis {
  candidate_readings: CandidateScore[];
  ambiguity: AmbiguityLevel;
  recommended_mode: RecommendedMode;
  triggered_signals: string[];
  synthesis_notes: string[];
}

interface BehaviorMediation {
  allowed_response_band: AllowedResponseBand;
  pacing: Pacing;
  trust_update: TrustUpdate;
  memory_pressure: MemoryPressure;
}

interface DeniedDecision {
  action: DeniedAction;
  reason: string;
}

interface GovernorDecision {
  allow: AllowedResponse[];
  deny: DeniedDecision[];
  memory_write: "none";
  response_class: ResponseClass;
  final_response: string;
}

type ObserverEmission =
  | WordingObserverEmission
  | TimingObserverEmission
  | SelfReportObserverEmission
  | SmellObserverEmission
  | ThermalObserverEmission
  | VisualObserverEmission;

type PacketView = Record<string, unknown>;

const scenarios: Record<ScenarioKey, ScenarioFrame> = {
  interactional: {
    key: "interactional",
    label: "Interactional cue",
    scenario_id: "bounded-weak-signal-001",
    baseline_id: "reply-timing-baseline-a",
    user_input: "I'm fine.",
    observer_emissions: {
      wording: {
        observer: "wording",
        clipped: true,
        warmth_delta: -0.42,
        hedging: "low",
      },
      timing: {
        observer: "timing",
        reply_delay_ms: 12800,
        baseline_delay_ms: 6400,
        timing_flag: "delayed",
      },
      selfReport: {
        observer: "self_report_context",
        literal_self_report: "fine",
        recent_sidestep: true,
        recent_tension: "mild",
      },
    },
  },
  environmental: {
    key: "environmental",
    label: "Environmental cue",
    scenario_id: "bounded-weak-signal-002",
    baseline_id: "room-baseline-b",
    user_input: "Something smells weird.",
    observer_emissions: {
      smell: {
        observer: "smell",
        voc_anomaly: "mild",
        source_confidence: "low",
      },
      thermal: {
        observer: "thermal",
        heat_rise: "slight",
        temperature_delta_c: 1.7,
      },
      visual: {
        observer: "visual",
        visible_smoke: false,
        visual_flag: "clear",
      },
    },
  },
};

const mediationDisplayLabels: Record<keyof BehaviorMediation, string> = {
  allowed_response_band: "response band",
  pacing: "pacing",
  trust_update: "trust update",
  memory_pressure: "memory pressure",
};

function clampScore(value: number): number {
  return Math.max(0, Math.min(1, Number(value.toFixed(2))));
}

// Observers only emit narrow signals; interpretation is where synthesis begins.
function synthesizeInterpretation(frame: ScenarioFrame): InterpretationSynthesis {
  if (frame.key === "interactional") {
    const { wording, timing, selfReport } = frame.observer_emissions;
    const delayRatio = timing.reply_delay_ms / timing.baseline_delay_ms;

    const triggeredSignals = [
      wording.clipped ? "wording.clipped" : null,
      wording.warmth_delta < 0 ? "wording.cooler_tone" : null,
      timing.timing_flag === "delayed" ? "timing.delayed" : null,
      selfReport.recent_sidestep ? "context.recent_sidestep" : null,
      selfReport.recent_tension !== "none" ? "context.recent_tension" : null,
    ].filter((signal): signal is string => signal !== null);

    const ordinaryOkayScore = clampScore(
      0.58 +
        (selfReport.literal_self_report === "fine" ? 0.18 : 0) +
        (wording.hedging === "low" ? 0.08 : 0) -
        (wording.clipped ? 0.07 : 0) -
        (wording.warmth_delta < 0 ? 0.08 : 0) -
        (timing.timing_flag === "delayed" ? 0.06 : 0) -
        (selfReport.recent_sidestep ? 0.07 : 0) -
        (selfReport.recent_tension === "mild" ? 0.05 : 0),
    );

    const guardedOrStrainedScore = clampScore(
      0.16 +
        (wording.clipped ? 0.14 : 0) +
        (wording.warmth_delta < 0
          ? Math.min(Math.abs(wording.warmth_delta) * 0.24, 0.14)
          : 0) +
        (delayRatio > 1 ? Math.min((delayRatio - 1) * 0.12, 0.18) : 0) +
        (selfReport.recent_sidestep ? 0.1 : 0) +
        (selfReport.recent_tension === "mild" ? 0.08 : 0) +
        (selfReport.recent_tension === "high" ? 0.14 : 0),
    );

    const candidateReadings = (
      [
        { label: "guarded_or_strained", score: guardedOrStrainedScore },
        { label: "ordinary_okay", score: ordinaryOkayScore },
      ] satisfies CandidateScore[]
    ).sort((left, right) => right.score - left.score);

    const scoreGap = Math.abs(candidateReadings[0].score - candidateReadings[1].score);
    const ambiguity: AmbiguityLevel =
      scoreGap <= 0.1 ? "high" : scoreGap <= 0.22 ? "medium" : "low";

    return {
      candidate_readings: candidateReadings,
      ambiguity,
      recommended_mode:
        candidateReadings[0].label === "guarded_or_strained" &&
        (ambiguity !== "low" || triggeredSignals.length >= 3)
          ? "cautious_clarification"
          : "neutral_acknowledgment",
      triggered_signals: triggeredSignals,
      synthesis_notes: [
        `Literal self-report stays in view: "${selfReport.literal_self_report}".`,
        wording.clipped
          ? "Clipped wording lowers confidence in a simple okay reading."
          : "Wording does not add pressure.",
        timing.timing_flag === "delayed"
          ? `Reply timing is slower than baseline (${timing.reply_delay_ms}ms vs ${timing.baseline_delay_ms}ms).`
          : "Timing stays near baseline.",
        selfReport.recent_sidestep || selfReport.recent_tension !== "none"
          ? "Recent sidestep/tension keeps the guarded reading live without upgrading it to fact."
          : "No recent context pushes toward strain.",
      ],
    };
  }

  const { smell, thermal, visual } = frame.observer_emissions;

  const triggeredSignals = [
    smell.voc_anomaly === "mild" ? "smell.mild_voc_anomaly" : null,
    thermal.heat_rise === "slight" ? "thermal.slight_heat_rise" : null,
    visual.visible_smoke === false ? "visual.no_visible_smoke" : null,
  ].filter((signal): signal is string => signal !== null);

  const benignVariationScore = clampScore(
    0.34 +
      (visual.visible_smoke === false ? 0.18 : 0) -
      (smell.voc_anomaly === "mild" ? 0.08 : 0) -
      (thermal.heat_rise === "slight" ? 0.07 : 0),
  );

  const possibleLocalHazardScore = clampScore(
    0.22 +
      (smell.voc_anomaly === "mild" ? 0.2 : 0) +
      (thermal.heat_rise === "slight" ? 0.16 : 0) +
      (visual.visible_smoke === false ? 0.05 : 0),
  );

  const candidateReadings = (
    [
      { label: "possible_local_hazard", score: possibleLocalHazardScore },
      {
        label: "benign_environmental_variation",
        score: benignVariationScore,
      },
    ] satisfies CandidateScore[]
  ).sort((left, right) => right.score - left.score);

  const scoreGap = Math.abs(candidateReadings[0].score - candidateReadings[1].score);
  const ambiguity: AmbiguityLevel =
    scoreGap <= 0.1 ? "medium" : scoreGap <= 0.22 ? "medium" : "low";

  return {
    candidate_readings: candidateReadings,
    ambiguity,
    recommended_mode: "cautious_verification",
    triggered_signals: triggeredSignals,
    synthesis_notes: [
      "Smell and thermal observers point to a local anomaly without confirming severity.",
      "No visible smoke keeps the reading bounded and blocks alarm-state certainty.",
      "The environmental cue is treated as a prompt to verify, not as an emergency fact.",
    ],
  };
}

// Mediation converts interpretation into bounded response-shaping constraints.
function mediateBehavior(
  interpretation: InterpretationSynthesis,
): BehaviorMediation {
  const topCandidate = interpretation.candidate_readings[0];

  if (
    topCandidate.label === "guarded_or_strained" &&
    interpretation.recommended_mode === "cautious_clarification"
  ) {
    return {
      allowed_response_band: "low_pressure_clarifying",
      pacing: "gentle",
      trust_update: "blocked",
      memory_pressure: "none",
    };
  }

  if (
    topCandidate.label === "possible_local_hazard" &&
    interpretation.recommended_mode === "cautious_verification"
  ) {
    return {
      allowed_response_band: "low_pressure_verification",
      pacing: "gentle",
      trust_update: "blocked",
      memory_pressure: "none",
    };
  }

  return {
    allowed_response_band: "narrow_acknowledgment",
    pacing: "neutral",
    trust_update: "blocked",
    memory_pressure: "none",
  };
}

// The governor is the last boundary before user-facing consequence.
function deriveGovernorDecision(
  frame: ScenarioFrame,
  interpretation: InterpretationSynthesis,
  mediation: BehaviorMediation,
): GovernorDecision {
  const allow: AllowedResponse[] =
    mediation.allowed_response_band === "low_pressure_clarifying"
      ? ["gentle_follow_up"]
      : mediation.allowed_response_band === "low_pressure_verification"
        ? ["inspect_prompt"]
        : interpretation.recommended_mode === "neutral_acknowledgment"
          ? ["neutral_acknowledgment"]
          : [];

  const responseClass: ResponseClass = allow[0] ?? "none";

  let finalResponse = "";
  if (responseClass === "gentle_follow_up") {
    finalResponse = "Got it. I won’t push, but I’m here if something feels off.";
  } else if (responseClass === "neutral_acknowledgment") {
    finalResponse = "Got it. Thanks for letting me know.";
  } else if (responseClass === "inspect_prompt") {
    finalResponse =
      "Noted. Let’s verify nearby sources calmly and inspect the area before treating it as something more serious.";
  }

  const deny =
    frame.key === "interactional"
      ? [
          {
            action: "strong_distress_claim" as const,
            reason: "weak cues are insufficient",
          },
          {
            action: "memory_commit" as const,
            reason: "durable write not allowed here",
          },
          {
            action: "relationship_state_change" as const,
            reason: "single episode does not justify state shift",
          },
        ]
      : [
          {
            action: "alarm_state_overreach" as const,
            reason: "bounded cues do not justify alarm-state certainty",
          },
          {
            action: "emergency_shutdown_overreach" as const,
            reason: "inspection is allowed, emergency certainty is not",
          },
          {
            action: "memory_commit" as const,
            reason: "durable write not allowed here",
          },
        ];

  return {
    allow,
    deny,
    memory_write: "none",
    response_class: responseClass,
    final_response: finalResponse,
  };
}

function toPacketView(data: ObserverEmission | BehaviorMediation): PacketView {
  return data as unknown as PacketView;
}

function formatPacketView(data: ObserverEmission | BehaviorMediation): string {
  return JSON.stringify(toPacketView(data), null, 2);
}

function summarizeObserver(emission: ObserverEmission): string {
  switch (emission.observer) {
    case "wording":
      return `Clipped wording, ${
        emission.warmth_delta < 0 ? "lower warmth" : "steady warmth"
      }, hedging ${emission.hedging}.`;
    case "timing":
      return `Delayed vs baseline (${emission.reply_delay_ms}ms vs ${emission.baseline_delay_ms}ms).`;
    case "self_report_context":
      return `Says "${emission.literal_self_report}," recent ${
        emission.recent_sidestep ? "sidestep" : "directness"
      }, ${emission.recent_tension} tension.`;
    case "smell":
      return "Mild VOC anomaly detected, source confidence remains low.";
    case "thermal":
      return `Slight heat rise (${emission.temperature_delta_c}°C above baseline).`;
    case "visual":
      return "No visible smoke; visual channel does not confirm escalation.";
  }
}

function getObserverCards(
  frame: ScenarioFrame,
): Array<{ title: string; emission: ObserverEmission }> {
  if (frame.key === "interactional") {
    return [
      { title: "Wording observer", emission: frame.observer_emissions.wording },
      { title: "Timing observer", emission: frame.observer_emissions.timing },
      {
        title: "Self-report/context observer",
        emission: frame.observer_emissions.selfReport,
      },
    ];
  }

  return [
    { title: "Smell observer", emission: frame.observer_emissions.smell },
    { title: "Thermal observer", emission: frame.observer_emissions.thermal },
    { title: "Visual observer", emission: frame.observer_emissions.visual },
  ];
}

function ObserverCard({
  title,
  emission,
}: {
  title: string;
  emission: ObserverEmission;
}) {
  return (
    <section className="card">
      <div className="eyebrow">{title}</div>
      <p className="card-summary">{summarizeObserver(emission)}</p>
      <pre>{formatPacketView(emission)}</pre>
    </section>
  );
}

function CandidateScoreRows({ readings }: { readings: CandidateScore[] }) {
  return (
    <div className="score-list">
      {readings.map((reading, index) => (
        <div key={reading.label} className="score-row">
          <span className="rank-tag">#{index + 1}</span>
          <strong className="score-label">{reading.label}</strong>
          <span className="pill allow score-pill">
            {reading.score.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
}

function KeyValueBadgeRow({
  label,
  value,
  tone = "allow",
}: {
  label: string;
  value: string;
  tone?: "allow" | "deny";
}) {
  return (
    <div className="label-row">
      <span className="label-row-key">{label}</span>
      <span className={`pill ${tone}`}>{value}</span>
    </div>
  );
}

function AllowList({ items }: { items: AllowedResponse[] }) {
  return (
    <section className="card">
      <div className="eyebrow">Allow</div>
      {items.length > 0 ? (
        <div className="pill-row">
          {items.map((item) => (
            <span key={item} className="pill allow">
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p style={{ margin: 0, color: "#6c7a89" }}>No response band cleared.</p>
      )}
    </section>
  );
}

function DenyList({ items }: { items: DeniedDecision[] }) {
  return (
    <section className="card">
      <div className="eyebrow">Deny</div>
      <div className="deny-list">
        {items.map((item) => (
          <div key={item.action} className="deny-item">
            <div className="deny-item-header">
              <strong className="deny-action">{item.action}</strong>
              <span className="pill deny">denied</span>
            </div>
            <div className="deny-reason">{item.reason}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MediationField({
  label,
  value,
}: {
  label: keyof BehaviorMediation;
  value: string;
}) {
  return (
    <div className="mediation-row">
      <span className="label-row-key">{mediationDisplayLabels[label]}</span>
      <span className="mediation-value">{value}</span>
    </div>
  );
}

export default function App() {
  const [activeScenarioKey, setActiveScenarioKey] =
    useState<ScenarioKey>("interactional");

  const activeScenario = scenarios[activeScenarioKey];
  const observerCards = getObserverCards(activeScenario);
  const interpretation = synthesizeInterpretation(activeScenario);
  const mediation = mediateBehavior(interpretation);
  const governorDecision = deriveGovernorDecision(
    activeScenario,
    interpretation,
    mediation,
  );

  return (
    <main className="shell">
      <header className="hero">
        <div className="hero-panel">
          <div className="hero-copy">
            <p className="kicker">Notice → Interpret → Shape → Govern</p>
            <h1>Bounded weak-signal companion architecture</h1>
            <p className="summary">
              Weak cues are represented, interpreted provisionally, shaped into
              bounded response options, and governed before consequence.
            </p>
          </div>

          <div className="hero-controls">
            <div className="scenario-switcher" aria-label="Scenario toggle">
              {(Object.keys(scenarios) as ScenarioKey[]).map((scenarioKey) => {
                const scenario = scenarios[scenarioKey];
                const isActive = scenarioKey === activeScenarioKey;

                return (
                  <button
                    key={scenarioKey}
                    type="button"
                    className={`scenario-toggle${isActive ? " is-active" : ""}`}
                    onClick={() => setActiveScenarioKey(scenarioKey)}
                    aria-pressed={isActive}
                  >
                    {scenario.label}
                  </button>
                );
              })}
            </div>

            <div className="input-card hero-input-card">
              <span className="input-label">{activeScenario.label}</span>
              <strong>{activeScenario.user_input}</strong>
            </div>
          </div>
        </div>
      </header>

      <section className="grid">
        <div className="column">
          <div className="column-title">Observers</div>
          {observerCards.map((card) => (
            <ObserverCard
              key={card.title}
              title={card.title}
              emission={card.emission}
            />
          ))}
        </div>

        <div className="column">
          <div className="column-title">Interpret + Shape</div>

          <section className="card">
            <div className="eyebrow">Interpreter output</div>
            <CandidateScoreRows readings={interpretation.candidate_readings} />
            <div className="label-row-group">
              <KeyValueBadgeRow label="ambiguity" value={interpretation.ambiguity} />
              <KeyValueBadgeRow
                label="recommended_mode"
                value={interpretation.recommended_mode}
              />
            </div>
            <p className="support-note">
              Candidate readings are ranked provisionally. Weak cues stay
              suggestive here rather than becoming truth claims.
            </p>
          </section>

          <section className="card">
            <div className="eyebrow">Synthesis notes</div>
            <div className="note-list">
              {interpretation.synthesis_notes.map((note) => (
                <p key={note} className="note-item">
                  {note}
                </p>
              ))}
            </div>
          </section>

          <section className="card mediation-card">
            <div className="eyebrow">Behavior mediation</div>
            <div className="mediation-grid">
              <MediationField
                label="allowed_response_band"
                value={mediation.allowed_response_band}
              />
              <MediationField label="pacing" value={mediation.pacing} />
              <MediationField label="trust_update" value={mediation.trust_update} />
              <MediationField
                label="memory_pressure"
                value={mediation.memory_pressure}
              />
            </div>
            <p className="support-note">
              This step narrows response shape without upgrading weak cues into
              memory, trust change, or stronger claims.
            </p>
          </section>
        </div>

        <div className="column">
          <div className="column-title">Governor</div>
          <AllowList items={governorDecision.allow} />
          <DenyList items={governorDecision.deny} />
          <section className="card final-response">
            <div className="eyebrow">Final response</div>
            <p>{governorDecision.final_response}</p>
          </section>
        </div>
      </section>

      <footer className="audit-strip">
        <div className="audit-item">
          <span className="audit-label">scenario_id</span>
          <span className="audit-value">{activeScenario.scenario_id}</span>
        </div>
        <div className="audit-item">
          <span className="audit-label">baseline_id</span>
          <span className="audit-value">{activeScenario.baseline_id}</span>
        </div>
        <div className="audit-item audit-wide">
          <span className="audit-label">triggered_signals</span>
          <span className="audit-value">
            {interpretation.triggered_signals.join(", ")}
          </span>
        </div>
        <div className="audit-item">
          <span className="audit-label">memory_write</span>
          <span className="audit-value">{governorDecision.memory_write}</span>
        </div>
        <div className="audit-item">
          <span className="audit-label">response_class</span>
          <span className="audit-value">{governorDecision.response_class}</span>
        </div>
      </footer>
    </main>
  );
}
