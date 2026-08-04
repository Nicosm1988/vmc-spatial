import { useEffect, useRef } from 'react'
import { addAfterEffect, addEffect, useThree } from '@react-three/fiber'

interface SceneMetricsProps {
  stage: string
  quality: string
}

export interface SceneMetricsSnapshot {
  calls: number
  triangles: number
  lines: number
  points: number
  geometries: number
  textures: number
  programs: number
  stage: string
  quality: string
  dpr: number
  viewport: {
    width: number
    height: number
  }
  frame: number
  timestamp: number
}

interface MetricsWindow extends Window {
  __VMC_SCENE_METRICS__?: SceneMetricsSnapshot
}

export default function SceneMetrics({ stage, quality }: SceneMetricsProps) {
  const gl = useThree((state) => state.gl)
  const rendererRef = useRef(gl)
  const stageRef = useRef(stage)
  const qualityRef = useRef(quality)
  const lastPublishedRef = useRef<SceneMetricsSnapshot | null>(null)

  useEffect(() => {
    stageRef.current = stage
    qualityRef.current = quality
  }, [quality, stage])

  useEffect(() => {
    rendererRef.current = gl
    const renderer = rendererRef.current
    const metricsWindow = window as MetricsWindow
    const previousAutoReset = renderer.info.autoReset
    renderer.info.autoReset = false

    const removeBeforeEffect = addEffect(() => {
      renderer.info.reset()
    })

    const removeAfterEffect = addAfterEffect((timestamp) => {
      const canvas = renderer.domElement
      const snapshot: SceneMetricsSnapshot = {
        calls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        lines: renderer.info.render.lines,
        points: renderer.info.render.points,
        geometries: renderer.info.memory.geometries,
        textures: renderer.info.memory.textures,
        programs: renderer.info.programs?.length ?? 0,
        stage: stageRef.current,
        quality: qualityRef.current,
        dpr: renderer.getPixelRatio(),
        viewport: {
          width: canvas.clientWidth,
          height: canvas.clientHeight,
        },
        frame: renderer.info.render.frame,
        timestamp,
      }

      lastPublishedRef.current = snapshot
      metricsWindow.__VMC_SCENE_METRICS__ = snapshot
    })

    return () => {
      removeBeforeEffect()
      removeAfterEffect()
      renderer.info.autoReset = previousAutoReset

      if (metricsWindow.__VMC_SCENE_METRICS__ === lastPublishedRef.current) {
        delete metricsWindow.__VMC_SCENE_METRICS__
      }
      lastPublishedRef.current = null
    }
  }, [gl])

  return null
}
