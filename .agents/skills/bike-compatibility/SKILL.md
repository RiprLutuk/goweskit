---
name: bike-compatibility
description: Design and implement deterministic bicycle component compatibility standards/rules for upgrades and Garage specs.
---

# Bike Compatibility

1. Identify component category.
2. Normalize bike-side and candidate-side standards.
3. Evaluate explicit rules.
4. Return one:
   - compatible
   - conditional
   - unknown
   - incompatible
5. Explain failed/conditional checks.
6. List missing specs.
7. Attach provenance/version.
8. Add golden tests.

Never infer fit from brand alone.
Never assume missing = default.
Never let an LLM decide compatibility.
