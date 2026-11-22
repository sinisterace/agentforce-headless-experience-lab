import type { TileNode } from './TileRenderer';
import { financialServicesTileBuilders } from './financialServicesTiles';
import { insuranceTileBuilders } from './insuranceTiles';
import { healthcareTileBuilders } from './healthcareTiles';
import { retailTileBuilders } from './retailTiles';
import { tmcTileBuilders } from './tmcTiles';
import { mfgTileBuilders } from './mfgTiles';
import { energyTileBuilders } from './energyTiles';
import { hvacTileBuilders } from './hvacTiles';
import { autoTileBuilders } from './autoTiles';
import { pseTileBuilders } from './pseTiles';
import { legalTileBuilders } from './legalTiles';
import { travelTileBuilders } from './travelTiles';

/**
 * The one place the Slack frame learns how to render a CLT as Block Kit tiles.
 * Adding an industry = one import + one spread here; SlackFrame never changes.
 * A CLT with no builder returns null and the frame falls back to the live LWC
 * preview, so the surface never breaks. All 48 CLTs are covered below.
 */
const TILE_BUILDERS: Record<string, (payload: any) => TileNode> = {
  ...financialServicesTileBuilders,
  ...insuranceTileBuilders,
  ...healthcareTileBuilders,
  ...retailTileBuilders,
  ...tmcTileBuilders,
  ...mfgTileBuilders,
  ...energyTileBuilders,
  ...hvacTileBuilders,
  ...autoTileBuilders,
  ...pseTileBuilders,
  ...legalTileBuilders,
  ...travelTileBuilders,
};

export function buildTiles(
  dtoFieldName: string,
  payload: any,
  _meta: { label: string; description?: string },
): TileNode | null {
  const build = TILE_BUILDERS[dtoFieldName];
  return build ? build(payload) : null;
}
