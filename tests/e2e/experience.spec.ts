import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

type StableStage = 'exterior' | 'floor16' | 'interior'

interface SceneMetrics {
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
  viewport: { width: number; height: number }
  frame: number
  timestamp: number
}

interface BrowserErrors {
  console: string[]
  page: string[]
}

const errorsByPage = new WeakMap<Page, BrowserErrors>()

async function readMetrics(page: Page, stage: StableStage) {
  await expect
    .poll(
      () =>
        page.evaluate((expectedStage) => {
          const metrics = (
            window as Window & {
              __VMC_SCENE_METRICS__?: SceneMetrics
            }
          ).__VMC_SCENE_METRICS__

          if (!metrics || metrics.stage !== expectedStage) return null

          const values = [
            metrics.calls,
            metrics.triangles,
            metrics.lines,
            metrics.points,
            metrics.geometries,
            metrics.textures,
            metrics.programs,
            metrics.dpr,
            metrics.viewport.width,
            metrics.viewport.height,
            metrics.frame,
            metrics.timestamp,
          ]

          return values.every((value) => Number.isFinite(value)) && metrics.frame > 0
            ? expectedStage
            : null
        }, stage),
      { message: `métricas WebGL observables para ${stage}`, timeout: 15_000 },
    )
    .toBe(stage)

  const metrics = await page.evaluate(
    () =>
      (
        window as Window & {
          __VMC_SCENE_METRICS__?: SceneMetrics
        }
      ).__VMC_SCENE_METRICS__,
  )

  expect(metrics, `métricas disponibles para ${stage}`).toBeDefined()
  expect(metrics?.stage).toBe(stage)
  expect(metrics?.calls).toBeLessThan(200)
  expect(metrics?.triangles).toBeLessThan(250_000)
  return metrics as SceneMetrics
}

test.describe('VMC Spatial experience', () => {
  // The real-motion case owns a WebGL canvas for the whole cinematic route. Running
  // the suite serially avoids GPU contention with the diagnostics measurements.
  test.describe.configure({ mode: 'serial' })

  test.beforeEach(async ({ page }) => {
    const errors: BrowserErrors = { console: [], page: [] }
    errorsByPage.set(page, errors)

    page.on('console', (message) => {
      if (message.type() === 'error') errors.console.push(message.text())
    })
    page.on('pageerror', (error) => errors.page.push(error.message))
  })

  test.afterEach(async ({ page }) => {
    const errors = errorsByPage.get(page)
    expect(errors?.console ?? [], `console.error: ${errors?.console.join('\n') ?? ''}`).toEqual([])
    expect(errors?.page ?? [], `pageerror: ${errors?.page.join('\n') ?? ''}`).toEqual([])
  })

  test('opens on the conceptual exterior experience with its demo classification', async ({
    page,
  }) => {
    await page.goto('/')

    await expect(page.getByLabel('VMC Spatial Studio')).toBeVisible()
    await expect(page.getByTestId('scene-stage')).toContainText('Exterior · Puerto Madero')
    await expect(page.getByLabel('Clasificación de la escena')).toContainText(
      'DEMO · NO VERIFICADO',
    )
    await expect(page.locator('.scene-disclaimer')).toContainText('Datos no validados')
    await expect(page.locator('canvas')).toBeVisible()
  })

  test('completes the real exterior to floor 16 to interior cinematic route', async ({ page }) => {
    await page.goto('/')

    const stage = page.getByTestId('scene-stage')
    const transition = page.getByLabel('Estado del recorrido cinematográfico')

    await page.getByRole('button', { name: /Ir al piso 16/ }).click()

    await expect(transition).toBeVisible()
    await expect(transition).toHaveAttribute('data-phase', 'flight')
    await expect(transition.getByRole('progressbar')).toBeVisible()
    await expect(stage).toContainText('Exterior · Puerto Madero')

    await expect(stage).toContainText('Fachada · Piso 16', { timeout: 20_000 })
    await expect(transition).toHaveCount(0)

    await page.getByRole('button', { name: /Entrar a la sala/ }).click()

    await expect(transition).toBeVisible()
    await expect(stage).toContainText('Fachada · Piso 16')
    await expect
      .poll(
        async () => {
          const phase = await transition.getAttribute('data-phase')
          return phase === 'cover' || phase === 'handoff' || phase === 'reveal'
        },
        { message: 'la entrega visual a través del acceso del piso 16', timeout: 15_000 },
      )
      .toBe(true)
    await expect(page.getByTestId('cinematic-handoff')).toBeVisible()

    await expect(stage).toContainText('Sala demostrativa · Piso 16', { timeout: 20_000 })
    await expect(transition).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Techo' })).toBeVisible()
  })

  test('honors reduced motion and Escape cancels without a late floor callback', async ({
    page,
  }) => {
    await page.goto('/')

    const stage = page.getByTestId('scene-stage')
    const transition = page.getByLabel('Estado del recorrido cinematográfico')
    const progress = transition.getByRole('progressbar')
    const flightStartedAt = await page.evaluate(() => performance.now())

    await page.getByRole('button', { name: /Ir al piso 16/ }).click()
    await expect(transition).toBeVisible()
    await expect
      .poll(async () => Number(await progress.getAttribute('value')), {
        message: 'el vuelo comenzó antes de cancelarlo',
      })
      .toBeGreaterThan(0)

    await page.keyboard.press('Escape')
    await expect(transition).toHaveCount(0)
    await expect(stage).toContainText('Exterior · Puerto Madero')

    // Read the DOM after the original route would have completed. A stale camera
    // callback used to move the store to floor16 after cancellation.
    await expect
      .poll(
        async () => {
          const now = await page.evaluate(() => performance.now())
          return now - flightStartedAt >= 8_000 ? await stage.textContent() : null
        },
        {
          message: 'el exterior permanece estable tras cancelar',
          timeout: 12_000,
          intervals: [250],
        },
      )
      .toContain('Exterior · Puerto Madero')
    await expect(transition).toHaveCount(0)

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await expect
      .poll(() => page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches))
      .toBe(true)

    const edit3D = page.getByRole('button', { name: 'Editar 3D' })
    await edit3D.click()
    await expect(edit3D).toHaveClass(/active/)
    await expect(page.locator('.editing-hud')).toBeVisible()
    await expect(page.locator('aside.side')).toHaveCount(2)

    // Reduced-motion timing is measured on the presentation renderer. The
    // detailed editor intentionally keeps its higher-fidelity legacy meshes
    // and has a separate performance envelope.
    await page.getByRole('button', { name: 'Presentación' }).click()
    await expect(page.locator('.editing-hud')).toHaveCount(0)

    const reducedStartedAt = await page.evaluate(() => performance.now())
    await page.getByRole('button', { name: /Ir al piso 16/ }).click()
    await expect(stage).toContainText('Fachada · Piso 16')
    const reducedFinishedAt = await page.evaluate(() => performance.now())

    expect(reducedFinishedAt - reducedStartedAt).toBeLessThan(5_000)
    await expect(transition).toHaveCount(0)

    const entryStartedAt = await page.evaluate(() => performance.now())
    await page.getByRole('button', { name: /Entrar a la sala/ }).click()
    await expect(stage).toContainText('Sala demostrativa · Piso 16')
    const entryFinishedAt = await page.evaluate(() => performance.now())

    expect(entryFinishedAt - entryStartedAt).toBeLessThan(5_000)
    await expect(transition).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Techo' })).toBeVisible()
  })

  test('opening the plan cancels a route and the forced WebGL fallback remains editable', async ({
    page,
  }) => {
    await page.goto('/')

    const transition = page.getByLabel('Estado del recorrido cinematográfico')
    await page.getByRole('button', { name: /Ir al piso 16/ }).click()
    await expect(transition).toBeVisible()

    await page.getByRole('button', { name: 'Plano' }).click()

    await expect(transition).toHaveCount(0)
    await expect(page.locator('svg.plan-svg')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Plano' })).toHaveClass(/active/)

    await page.goto('/?fallback=1')

    const fallback = page.getByRole('alert')
    await expect(fallback).toContainText('Tu dispositivo no pudo iniciar la escena 3D')
    await expect(page.locator('canvas')).toHaveCount(0)

    await page.getByRole('button', { name: 'Abrir plano 2D' }).click()

    await expect(fallback).toHaveCount(0)
    await expect(page.locator('svg.plan-svg')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Plano' })).toHaveClass(/active/)
  })

  test('measures every stable scene under budget and persists the night preference', async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/?diagnostics=1')

    const disclaimer = page.getByLabel('Clasificación de la escena')
    await expect(disclaimer).toContainText('DEMO · NO VERIFICADO')

    const metrics: Record<StableStage, SceneMetrics> = {
      exterior: await readMetrics(page, 'exterior'),
      floor16: {} as SceneMetrics,
      interior: {} as SceneMetrics,
    }

    const dayNight = page.getByRole('button', { name: 'Alternar día y noche' })
    await expect(dayNight).toHaveText('Día')
    await dayNight.click()
    await expect(dayNight).toHaveText('Noche')

    await page.reload()
    await expect(dayNight).toHaveText('Noche')

    await page.getByRole('button', { name: /Ir al piso 16/ }).click()
    await expect(page.getByTestId('scene-stage')).toContainText('Fachada · Piso 16')
    metrics.floor16 = await readMetrics(page, 'floor16')

    await page.getByRole('button', { name: /Entrar a la sala/ }).click()
    await expect(page.getByTestId('scene-stage')).toContainText('Sala demostrativa · Piso 16')
    metrics.interior = await readMetrics(page, 'interior')

    await testInfo.attach('phase-3-scene-metrics', {
      body: JSON.stringify(metrics, null, 2),
      contentType: 'application/json',
    })
  })
})
