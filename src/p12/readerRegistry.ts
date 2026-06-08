export type ProfileReaderStatus = 'profile-first' | 'deferred';

export interface ProfileReaderEntry {
  id: string;
  module: string;
  description: string;
  status: ProfileReaderStatus;
  note?: string;
}

/**
 * Registry of key runtime readers for P12 gate reporting.
 * Status reflects the runtime entry API, not whether underlying data shares profile assembly.
 */
export const PROFILE_READER_REGISTRY: ProfileReaderEntry[] = [
  {
    id: 'narrative.age40_identity',
    module: 'NarrativeConfigLoader.resolveConfiguredAge40Identity',
    description: 'Age-40 identity assembly (profile routes/echo; template helper deferred)',
    status: 'profile-first',
  },
  {
    id: 'narrative.echo_summary',
    module: 'NarrativeConfigLoader.resolveConfiguredEchoSummaryVars',
    description: 'Echo-derived summary variables',
    status: 'profile-first',
  },
  {
    id: 'narrative.stage_purpose',
    module: 'NarrativeConfigLoader.getStagePurposeForAge',
    description: 'Stage purpose by age',
    status: 'profile-first',
  },
  {
    id: 'narrative.stage_feedback',
    module: 'NarrativeConfigLoader.getStageFeedbackExpectationForAge',
    description: 'Stage feedback expectation by age',
    status: 'profile-first',
  },
  {
    id: 'narrative.echo_hook_lookup',
    module: 'NarrativeConfigLoader.resolveEchoHookForFlags',
    description: 'Echo hook resolution from flags',
    status: 'profile-first',
  },
  {
    id: 'p11.scheduling_routes',
    module: 'p11/schedulingContext.resolveActiveRouteIds',
    description: 'P11 active route resolution',
    status: 'profile-first',
  },
  {
    id: 'p11.report_routes',
    module: 'p11/reportBuilder.buildRouteBaseline',
    description: 'P11 route baseline reporting',
    status: 'profile-first',
  },
  {
    id: 'p11.stage_baseline',
    module: 'p11/reportBuilder.buildStageBaseline',
    description: 'P11 stage baseline reporting',
    status: 'profile-first',
  },
  {
    id: 'p11.signal_detection_stage',
    module: 'p11/signalDetection.getStageExpectedSignals',
    description: 'P11 stage signal detection',
    status: 'profile-first',
  },
  {
    id: 'p8.echo_metrics',
    module: 'p8/collectPersonaMetrics configured echo detection',
    description: 'P8 persona echo callback metrics',
    status: 'profile-first',
  },
  {
    id: 'active.minimum_actions',
    module: 'activeActionCatalog.getMinimumActions',
    description: 'Minimum active action set for 0-40 slice',
    status: 'profile-first',
  },
  {
    id: 'config.summary_template',
    module: 'config/summaryTemplates.getSummaryTemplateForIdentity',
    description: 'Age-40 summary template selection',
    status: 'deferred',
    note: 'Reads WUXIA_SUMMARY_TEMPLATES const; same array reference as profile.summaryTemplates',
  },
  {
    id: 'config.route_helpers',
    module: 'config/routeDefinitions.getRouteDefinition',
    description: 'Direct route lookup helper',
    status: 'deferred',
    note: 'Legacy config helper; profile assembly uses the same routeDefinitions array',
  },
  {
    id: 'config.stage_helpers',
    module: 'config/stageConfig.getAllStageConfigs',
    description: 'Direct stage config enumeration',
    status: 'deferred',
    note: 'Legacy config helper; profile assembly uses the same stageConfig array',
  },
  {
    id: 'config.echo_helpers',
    module: 'config/echoHooks.getEchoHookByFlag',
    description: 'Direct echo hook lookup helpers',
    status: 'deferred',
    note: 'Legacy config helper; runtime metrics migrated to profile echo helpers',
  },
  {
    id: 'attribute.meanings',
    module: 'data/attributeMeanings.ts',
    description: 'Player attribute cognition labels',
    status: 'deferred',
    note: 'UI cognition layer; not part of executable world pack in P12',
  },
  {
    id: 'engine.player_state',
    module: 'types/eventTypes PlayerState',
    description: 'Authoritative numeric stat storage',
    status: 'deferred',
    note: 'Save schema unchanged; profile supplies metadata only',
  },
];

export function summarizeReaderRegistry(): {
  profileFirst: ProfileReaderEntry[];
  deferred: ProfileReaderEntry[];
} {
  return {
    profileFirst: PROFILE_READER_REGISTRY.filter(entry => entry.status === 'profile-first'),
    deferred: PROFILE_READER_REGISTRY.filter(entry => entry.status === 'deferred'),
  };
}
