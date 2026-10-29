# Summary of a responsive audit run: python3 summarize.py out/results-chromium.json
import json, sys, collections
rows = json.load(open(sys.argv[1]))
def real(lst): return [x for x in lst or [] if 'visually_hidden' not in x]
errs = [r for r in rows if r.get('error')]
print('loads', len(rows), 'load errors', len(errs))
for r in errs: print('  ', r['vp'], r['page'], r['error'][:150])
print('\nHORIZONTAL OVERFLOW:')
for r in rows:
    if r.get('hOverflow'): print(f"  {r['vp']:30} {r['page']:40} scrollWidth={r['scrollWidth']} vw={r['innerWidth']}")
print('\nOVERFLOWING ELEMENTS (by element, viewports):')
d = collections.defaultdict(set)
for r in rows:
    for o in real(r.get('overflowing')): d[o.split(' [')[0]].add(f"{r['vp'].split(' ')[0]}{r['page']}")
for k, v in sorted(d.items(), key=lambda kv: -len(kv[1])): print(f"  {k}  x{len(v)}  e.g. {sorted(v)[:3]}")
print('\nCLIPPED TEXT:')
d = collections.defaultdict(set)
for r in rows:
    for o in real(r.get('clipped')): d[o].add(r['vp'].split(' ')[0])
for k, v in d.items(): print(f"  {k}  {sorted(v)[:4]}")
print('\nCONSOLE (excluding expected 404 page):')
d = collections.defaultdict(set)
for r in rows:
    if r['page'] == '/no-such-page': continue
    for e in r.get('errors') or []: d[e[:160]].add(r['page'])
for k, v in d.items(): print(f"  {k}  pages={sorted(v)[:4]}")
print('\nTOUCH TARGETS <24px (touch viewports only):')
d = collections.defaultdict(set)
for r in rows:
    if not r['vp'].startswith(('phone', 'tablet')): continue
    for t in r.get('touchTargets') or []: d[t].add(r['page'])
for k, v in sorted(d.items(), key=lambda kv: -len(kv[1]))[:30]: print(f"  {k}  pages={len(v)} {sorted(v)[:2]}")
print('\nTEXT < 12px:')
d = collections.defaultdict(set)
for r in rows:
    for t in r.get('smallText') or []: d[t].add(r['vp'].split(' ')[0])
for k, v in sorted(d.items(), key=lambda kv: -len(kv[1]))[:20]: print(f"  {k}  {len(v)} viewports")
print('\nUNNAMED CONTROLS / IMG NO ALT:')
d = collections.Counter()
for r in rows:
    for t in (r.get('noName') or []) + ['IMG ' + x for x in r.get('imgsNoAlt') or []]: d[t] += 1
for k, v in d.most_common(15): print(f"  {k}  x{v}")
print('\nARABIC TEXT STYLE by viewport (hadith page):')
for r in rows:
    if r['page'] == '/books/bukhari/hadiths/1': print(f"  {r['vp']:30} arabic={r.get('arabic')} body={r.get('bodyFont')} fixed={r.get('fixed')}")
print('\nTITLES/H1 (390):')
for r in rows:
    if r['vp'].startswith('phone-390'): print(f"  {r['page']:40} lang={r.get('lang')} h1={r.get('h1')} title={r.get('title')[:70]!r}")
