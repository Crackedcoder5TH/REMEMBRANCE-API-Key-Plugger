# Remembrance API Key Plugger — Verified Capabilities

This repo's piece of the [ecosystem](../Void-Data-Compressor/CAPABILITIES.md).

Last verified: 2026-04-30, branch `claude/audit-remembrance-ecosystem-xaaUr`.

---

## Role in ecosystem

API key management / credential handling layer. Provides the
secure-storage and rotation primitives used by other ecosystem
components when they need to call out to third-party services.

By function count: 53 functions across 39 PULL / 13 REFINE / 1 REJECT
(74% recognized). Per-repo modulator: μ=0.9087, modulator=0.9818 —
slightly below mean, small penalty. The 1 REJECT is `encrypt`,
flagged as `unmeasured` because its slice was too short to evaluate.

---

## ✅ Verified

| # | Capability | Test |
|---|---|---|
| 1 | All 53 functions scored under v3 | `python3 -c "import json; d=json.load(open('../Void-Data-Compressor/cross_repo_function_records.json')); print(sum(1 for r in d['records'] if r['repo']=='plugger'))"` returns 53 |
| 2 | Decision distribution | 39 PULL / 13 REFINE / 1 REJECT per `pipeline/decisions_summary.json::per_repo.plugger` |
| 3 | Modulator computed | `pipeline/repo_modulators.json::modulators.plugger` ≈ 0.9818 |
| 4 | Source paths resolve | `REPO_ROOTS['plugger'] = '/home/user/REMEMBRANCE-API-Key-Plugger'` consistent across 6 void-side scripts |

### Note on the REJECT

`plugger::encrypt` (in `src/services/key-store.js`) routed to REJECT
because the function slice was too short for the compressor to score
(`unmeasured`, `unified=0`). This is a measurement gap, not a code
defect. Either lengthen the function or add explicit substrate tagging
to make it scorable.

---

## ❌ Out of scope here

- Substrate / scoring — void
- Atomic table / covenant — oracle
- Pattern publication — blockchain

---

## Quick verification

```bash
cd ../Void-Data-Compressor
python3 -c "
import json
d = json.load(open('cross_repo_function_records.json'))
plug = [r for r in d['records'] if r['repo'] == 'plugger']
print(f'plugger records: {len(plug)}')
from collections import Counter
print('decisions:', Counter(r.get('gate_decision') for r in plug))

# Show the one REJECT
for r in plug:
    if r.get('gate_decision') == 'REJECT':
        print(f'REJECT: {r[\"name\"]} src={r[\"source_path\"]}')
"
```

---

*Cross-cutting capabilities: see [`Void-Data-Compressor/CAPABILITIES.md`](../Void-Data-Compressor/CAPABILITIES.md).*
