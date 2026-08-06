/**
 * Centralized PBR material constants for the interior renderer.
 *
 * Source: visual calibration from restricted evidence photographs (F-036/F-037
 * in ASSUMPTIONS_AND_FACTS.md, decision D-024). The photos were observed offline
 * to derive plausible color, roughness and metalness values. No photograph was
 * loaded, converted, or embedded as a texture. All values are procedural
 * constants and remain DEMO / NO VERIFICADOS.
 *
 * @see ASSET_POLICY.md § "Referencia visual para calibración PBR"
 */

// ---------------------------------------------------------------------------
// Color palette – derived from visual observation of restricted photos
// ---------------------------------------------------------------------------

/** Modular carpet tile – warm grey with subtle beige undertone. */
export const CARPET_COLOR = '#8a857e'
export const CARPET_DARK_COLOR = '#5c5854'
export const CARPET_ROUGHNESS = 0.95
export const CARPET_METALNESS = 0.0

/** Desk / table top – white bone matte laminate. */
export const DESK_COLOR = '#f0ece6'
export const DESK_ROUGHNESS = 0.55
export const DESK_METALNESS = 0.0
export const DESK_CLEARCOAT = 0.15
export const DESK_CLEARCOAT_ROUGHNESS = 0.4

/** Pedestal / drawer unit – warm white satin finish. */
export const PEDESTAL_COLOR = '#e8e4de'
export const PEDESTAL_ROUGHNESS = 0.35
export const PEDESTAL_METALNESS = 0.0
export const PEDESTAL_CLEARCOAT = 0.25
export const PEDESTAL_CLEARCOAT_ROUGHNESS = 0.35

/** Ergonomic chair – mesh back, black. */
export const CHAIR_MESH_COLOR = '#1a1a1a'
export const CHAIR_MESH_ROUGHNESS = 0.7
export const CHAIR_MESH_METALNESS = 0.15

/** Chair base / stem – dark metallic. */
export const CHAIR_BASE_COLOR = '#2a2a2a'
export const CHAIR_BASE_ROUGHNESS = 0.3
export const CHAIR_BASE_METALNESS = 0.85

/** Chair seat – dark charcoal fabric. */
export const CHAIR_SEAT_COLOR = '#222222'
export const CHAIR_SEAT_ROUGHNESS = 0.88
export const CHAIR_SEAT_METALNESS = 0.0

/** Chair armrests – dark polymer. */
export const CHAIR_ARMREST_COLOR = '#282828'
export const CHAIR_ARMREST_ROUGHNESS = 0.6
export const CHAIR_ARMREST_METALNESS = 0.0

/** Videowall lower cabinet – white gloss. */
export const VIDEOWALL_CABINET_COLOR = '#f2efe9'
export const VIDEOWALL_CABINET_ROUGHNESS = 0.3
export const VIDEOWALL_CABINET_METALNESS = 0.0
export const VIDEOWALL_CABINET_CLEARCOAT = 0.35
export const VIDEOWALL_CABINET_CLEARCOAT_ROUGHNESS = 0.25

/** Videowall support panel – bronze/brown dark with decorative perforations. */
export const VIDEOWALL_PANEL_COLOR = '#6b5a4a'
export const VIDEOWALL_PANEL_ROUGHNESS = 0.45
export const VIDEOWALL_PANEL_METALNESS = 0.3

/** Divider panels – yellow/olive tone. */
export const DIVIDER_YELLOW_COLOR = '#c4a840'
export const DIVIDER_GREEN_COLOR = '#6b8040'
export const DIVIDER_ROUGHNESS = 0.75
export const DIVIDER_METALNESS = 0.0

/** Wall cladding – warm oak wood. */
export const WALL_WOOD_COLOR = '#b08050'
export const WALL_WOOD_ROUGHNESS = 0.6
export const WALL_WOOD_METALNESS = 0.0

/** Ceiling acoustic tile – off-white. */
export const CEILING_COLOR = '#f5f3f0'
export const CEILING_ROUGHNESS = 0.92
export const CEILING_METALNESS = 0.0

/** Monitor frame – matte black plastic. */
export const MONITOR_FRAME_COLOR = '#0a0a0a'
export const MONITOR_FRAME_ROUGHNESS = 0.5
export const MONITOR_FRAME_METALNESS = 0.6

/** Monitor stem/base – polished metal. */
export const MONITOR_STAND_COLOR = '#383838'
export const MONITOR_STAND_ROUGHNESS = 0.35
export const MONITOR_STAND_METALNESS = 0.65

/** Concrete column – exposed aggregate, warm grey beige. */
export const CONCRETE_COLOR = '#a09890'
export const CONCRETE_ROUGHNESS = 0.88
export const CONCRETE_METALNESS = 0.0

/** Core walls – very dark blue-black. */
export const CORE_COLOR = '#0c1226'
export const CORE_ROUGHNESS = 0.82
export const CORE_METALNESS = 0.08

/** Window frame / mullion – aluminium. */
export const WINDOW_FRAME_COLOR = '#b0b4b8'
export const WINDOW_FRAME_ROUGHNESS = 0.4
export const WINDOW_FRAME_METALNESS = 0.7

/** Floor-to-ceiling glass – low-e coating. */
export const GLASS_COLOR = '#ccd8e4'
export const GLASS_ROUGHNESS = 0.05
export const GLASS_METALNESS = 0.0
export const GLASS_TRANSMISSION = 0.92
export const GLASS_IOR = 1.5

/** Roller shade cassette – powder-coated aluminium. */
export const SHADE_CASSETTE_COLOR = '#c8c4be'
export const SHADE_CASSETTE_ROUGHNESS = 0.5
export const SHADE_CASSETTE_METALNESS = 0.35

/** Roller shade fabric – translucent grey. */
export const SHADE_FABRIC_COLOR = '#d0ccc5'
export const SHADE_FABRIC_ROUGHNESS = 0.94
export const SHADE_FABRIC_METALNESS = 0.0

/** Entry door frame – matches videowall panel. */
export const ENTRY_FRAME_COLOR = '#e2ddd5'
export const ENTRY_FRAME_ROUGHNESS = 0.78
export const ENTRY_FRAME_METALNESS = 0.0

/** LED wrap-around column – emissive blue. */
export const LED_COLUMN_COLOR = '#1040ff'
export const LED_COLUMN_EMISSIVE_INTENSITY = 1.8

// ---------------------------------------------------------------------------
// Ceiling luminaire – linear LED warm white
// ---------------------------------------------------------------------------
export const LUMINAIRE_EMISSIVE_DAY = '#fff4d5'
export const LUMINAIRE_EMISSIVE_NIGHT = '#ffd994'
export const LUMINAIRE_INTENSITY_DAY = 0.85
export const LUMINAIRE_INTENSITY_NIGHT = 1.5

// ---------------------------------------------------------------------------
// Practical (point) light parameters derived from photos
// ---------------------------------------------------------------------------
export const PRACTICAL_LIGHT_COLOR_DAY = '#fff1cf'
export const PRACTICAL_LIGHT_COLOR_NIGHT = '#ffdba0'
export const PRACTICAL_LIGHT_INTENSITY_DAY = 3.2
export const PRACTICAL_LIGHT_INTENSITY_NIGHT = 8.0
export const PRACTICAL_LIGHT_DISTANCE = 11
export const PRACTICAL_LIGHT_DECAY = 2
