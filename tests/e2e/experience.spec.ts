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
})
