# Lightweight KataGo trial verification

Verified on the separately deployed `games/play/kata-preview.html` in the desktop browser on 2026-11-06:

- GPU inference and WASM CPU inference both initialized and produced legal moves.
- Actual replies on 9x9, 13x13 and 19x19 boards; a two-stone handicap start.
- Continued play, captures, passes and game-end handling.
- Switching back to the existing GNU Go engine.
- Injected model-loading failure displays an error without silently replacing the selected engine.
- Closing setup while model initialization is pending keeps the board in standby, including after the delayed initialization settles.
- Setup controls at a mobile viewport. This is not a physical-mobile-device performance test.

Update 2026-11-26: GNU Go has been removed. All three 스쿨봇 levels now use `katago-lite`: LV3 plays the top policy move, LV1 and LV2 sample moves from the policy with temperatures 1.5 and 0.6 (`BOTS` in `games/play/app.js`). If the model cannot be loaded, that game falls back to the site's own rule-based AI (`ai.js`) with a notice. The preview page and GNU Go notes above describe the 2026-11-06 trial. The official g170 b10 network is policy-only: there is no MCTS search and no independently established rank. Model weights are loaded on demand and cached locally where available. No dedicated inference server is used.

Still to verify after the production deployment: production-page selection and actual replies, selection persistence across reloads, matched strength comparisons, low-end-device latency and thermal/battery impact.

See `games/play/kata-licenses.txt` for source attribution and model licensing.
