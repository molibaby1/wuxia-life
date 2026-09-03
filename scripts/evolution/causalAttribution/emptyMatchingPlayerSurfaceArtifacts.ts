import {
  serializeObservablePayload,
} from '../../../src/evolution/playerObservableTranscript';
import { projectHeadlessApiPlayerObservablePayload } from '../../../src/evolution/wuxiaPlayerObservableProjector';
import {
  HEADLESS_API_PLAYER_SURFACE_SOURCE_VERSION,
  type HeadlessApiPlayerSurfaceTrace,
} from '../../../src/headless/playability/playerSurfaceCapture';
import { canonicalJson } from '../phase0/provenance';

/** Minimal sealed surface + byte-identical projected observable for active-loop fixtures. */
export function emptyMatchingPlayerSurfaceArtifacts(): {
  surface: HeadlessApiPlayerSurfaceTrace;
  surfaceBytes: string;
  observableBytes: string;
} {
  const surface: HeadlessApiPlayerSurfaceTrace = {
    schemaVersion: HEADLESS_API_PLAYER_SURFACE_SOURCE_VERSION,
    steps: [],
  };
  const observableBytes = serializeObservablePayload(
    projectHeadlessApiPlayerObservablePayload(surface),
  );
  return {
    surface,
    surfaceBytes: `${canonicalJson(surface)}\n`,
    observableBytes,
  };
}
