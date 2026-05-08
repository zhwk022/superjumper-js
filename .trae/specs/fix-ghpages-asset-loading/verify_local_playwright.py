from __future__ import annotations

import asyncio
import pathlib

from playwright.async_api import async_playwright


BASE = "http://127.0.0.1:8090/superjumper-js/"
OUT_DIR = pathlib.Path(__file__).with_name("verify_out")


async def click_ui(page, ui_x: float, ui_y: float):
    canvas = page.locator("#game")
    box = await canvas.bounding_box()
    if not box:
        raise RuntimeError("canvas bbox missing")
    css_x = box["width"] * (ui_x / 320.0)
    css_y = box["height"] * ((480.0 - ui_y) / 480.0)
    await canvas.click(position={"x": css_x, "y": css_y})


async def run():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    wrote: list[pathlib.Path] = []

    async def snap_canvas(page, name: str):
        p = OUT_DIR / name
        await page.locator("#game").screenshot(path=str(p))
        wrote.append(p)

    async with async_playwright() as p:
        browser = await p.chromium.launch(channel="chrome-dev", headless=True)

        ctx = await browser.new_context(viewport={"width": 900, "height": 900})
        page = await ctx.new_page()
        await page.goto(f"{BASE}?debug=1", wait_until="load")
        await page.evaluate("""() => {
          if (!window.__SJ_DEBUG__ || typeof window.__SJ_DEBUG__.forceLoadingOverlay !== 'function') return false;
          window.__SJ_DEBUG__.forceLoadingOverlay();
          return true;
        }""")
        await asyncio.sleep(0.15)
        await snap_canvas(page, "01_loading_overlay.png")
        await ctx.close()

        ctx = await browser.new_context(viewport={"width": 900, "height": 900})
        page = await ctx.new_page()

        async def fail_items(route, request):
            await route.abort("failed")

        await page.route("**/assets/data/items.png", fail_items)
        await page.goto(BASE, wait_until="domcontentloaded")
        await asyncio.sleep(1.2)
        await snap_canvas(page, "02_error_overlay.png")
        await ctx.close()

        ctx = await browser.new_context(viewport={"width": 900, "height": 900})
        page = await ctx.new_page()
        await page.goto(BASE, wait_until="load")
        await asyncio.sleep(0.6)
        await snap_canvas(page, "03_menu.png")

        await click_ui(page, 160, 200)
        await asyncio.sleep(0.4)
        await snap_canvas(page, "04_highscores.png")
        await click_ui(page, 32, 32)
        await asyncio.sleep(0.3)
        await snap_canvas(page, "05_back_to_menu.png")

        await click_ui(page, 160, 164)
        await asyncio.sleep(0.5)
        await snap_canvas(page, "06_help_1.png")
        await click_ui(page, 288, 32)
        await asyncio.sleep(0.3)
        await snap_canvas(page, "07_help_2.png")
        for _ in range(4):
            await click_ui(page, 288, 32)
            await asyncio.sleep(0.2)
        await snap_canvas(page, "08_help_after_5_nexts.png")

        await click_ui(page, 160, 236)
        await asyncio.sleep(0.4)
        await snap_canvas(page, "09_game_ready.png")
        await click_ui(page, 160, 240)
        await asyncio.sleep(0.8)
        await snap_canvas(page, "10_game_running.png")

        await click_ui(page, 288, 448)
        await asyncio.sleep(0.4)
        await snap_canvas(page, "11_game_paused.png")
        await click_ui(page, 160, 258)
        await asyncio.sleep(0.5)
        await snap_canvas(page, "12_game_resumed.png")

        await click_ui(page, 288, 448)
        await asyncio.sleep(0.3)
        await click_ui(page, 160, 222)
        await asyncio.sleep(0.4)
        await snap_canvas(page, "13_quit_to_menu.png")

        await ctx.close()

        ctx = await browser.new_context(viewport={"width": 900, "height": 900})
        page = await ctx.new_page()
        await page.goto(f"{BASE}?debug=1", wait_until="load")
        await asyncio.sleep(0.5)
        ok = await page.evaluate("""() => {
          if (!window.__SJ_DEBUG__ || typeof window.__SJ_DEBUG__.enterWinStory !== 'function') return false;
          window.__SJ_DEBUG__.enterWinStory();
          return true;
        }""")
        await asyncio.sleep(0.3)
        if ok:
            await snap_canvas(page, "14_win_story.png")
            await click_ui(page, 160, 240)
            await asyncio.sleep(0.3)
            await snap_canvas(page, "15_win_story_after_click.png")

        await ctx.close()
        await browser.close()

    print("WROTE")
    for p in wrote:
        print(p)


if __name__ == "__main__":
    asyncio.run(run())
