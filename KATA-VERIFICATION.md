# Lightweight KataGo trial verification

Verified on the separately deployed `games/play/kata-preview.html` in the desktop browser on 2026-11-06:

- GPU inference and WASM CPU inference both initialized and produced legal moves.
- Actual replies on 9x9, 13x13 and 19x19 boards; a two-stone handicap start.
- Continued play, captures, passes and game-end handling.
- Switching back to the existing GNU Go engine.
- Injected model-loading failure displays an error without silently replacing the selected engine.
- Closing setup while model initialization is pending keeps the board in standby, including after the delayed initialization settles.
- Setup controls at a mobile viewport. This is not a physical-mobile-device performance test.

The production integration retains GNU Go as the default and adds an explicit `katago-lite` choice. The official g170 b10 network is policy-only: there is no MCTS search and no independently established rank. Model weights are loaded on demand and cached locally where available. No dedicated inference server is used.

Still to verify after the production deployment: production-page selection and actual replies, selection persistence across reloads, matched strength comparisons, low-end-device latency and thermal/battery impact.

See `games/play/kata-licenses.txt` for source attribution and model licensing.
