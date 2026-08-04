import { expect, test } from '@playwright/test'

test.describe('VMC Spatial experience', () => {
  test('opens on the conceptual exterior experience', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByLabel('VMC Spatial Studio')).toBeVisible()
    await expect(page.getByTestId('scene-stage')).toContainText('Exterior · Puerto Madero')
    await expect(page.locator('.scene-disclaimer')).toContainText('DEMO')
    await expect(page.locator('.scene-disclaimer')).toContainText('Datos no validados')
    await expect(page.locator('canvas')).toBeVisible()
  })

  test('flies to floor 16 and settles at the facade', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('button', { name: /Ir al piso 16/ }).click()
    await expect(page.getByTestId('scene-stage')).toContainText('Fachada · Piso 16', {
      timeout: 10_000,
    })
  })

  test('enters the room and enables 3D editing mode', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')

    const edit3D = page.getByRole('button', { name: 'Editar 3D' })
    await edit3D.click()
    await expect(edit3D).toHaveClass(/active/)
    await expect(page.locator('.editing-hud')).toBeVisible()
    await expect(page.locator('aside.side')).toHaveCount(2)

    await page.getByRole('button', { name: /Entrar a la sala/ }).click()
    await expect(page.getByTestId('scene-stage')).toContainText('Sala demostrativa · Piso 16')
    await expect(page.getByRole('button', { name: 'Techo' })).toBeVisible()
  })

  test('offers the editable plan when WebGL fallback is forced', async ({ page }) => {
    await page.goto('/?fallback=1')

    const fallback = page.getByRole('alert')
    await expect(fallback).toContainText('Tu dispositivo no pudo iniciar la escena 3D')
    await expect(page.locator('canvas')).toHaveCount(0)

    await page.getByRole('button', { name: 'Abrir plano 2D' }).click()

    await expect(fallback).toHaveCount(0)
    await expect(page.locator('svg.plan-svg')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Plano' })).toHaveClass(/active/)
  })

  test('keeps Phase 2 diagnostics, night preference and demo classification observable', async ({
    page,
  }, testInfo) => {
    const consoleErrors: string[] = []
    const pageErrors: string[] = []

    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text())
    })
    page.on('pageerror', (error) => pageErrors.push(error.message))

    await page.goto('/?diagnostics=1')

    const disclaimer = page.getByLabel('Clasificación de la escena')
    await expect(disclaimer).toContainText('DEMO · NO VERIFICADO')

    await page.waitForFunction(() => {
      const metrics = (
        window as Window & {
          __VMC_SCENE_METRICS__?: {
            calls: number
            triangles: number
            lines: number
            points: number
            geometries: number
            textures: number
            programs: number
            dpr: number
            viewport: { width: number; height: number }
            frame: number
            timestamp: number
          }
        }
      ).__VMC_SCENE_METRICS__

      if (!metrics) return false
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
    })

    const metrics = await page.evaluate(
      () =>
        (
          window as Window & {
            __VMC_SCENE_METRICS__?: Record<string, unknown>
          }
        ).__VMC_SCENE_METRICS__,
    )
    expect(metrics).toBeDefined()
    expect(metrics).not.toBeNull()
    expect(Number(metrics?.calls)).toBeLessThan(200)
    expect(Number(metrics?.triangles)).toBeLessThan(250_000)
    await testInfo.attach('phase-2-scene-metrics', {
      body: JSON.stringify(metrics, null, 2),
      contentType: 'application/json',
    })

    const dayNight = page.getByRole('button', { name: 'Alternar día y noche' })
    await expect(dayNight).toHaveText('Día')
    await dayNight.click()
    await expect(dayNight).toHaveText('Noche')

    await page.reload()
    await expect(page.getByRole('button', { name: 'Alternar día y noche' })).toHaveText('Noche')

    await page.getByRole('button', { name: 'Plano' }).click()
    await expect(page.locator('svg.plan-svg')).toBeVisible()
    await expect(disclaimer).toContainText('DEMO · NO VERIFICADO')

    expect(consoleErrors, `console.error: ${consoleErrors.join('\n')}`).toEqual([])
    expect(pageErrors, `pageerror: ${pageErrors.join('\n')}`).toEqual([])
  })
})
