"""Step 4 of the gram audit: unique shapes modelled in Blender (bpy 5.3, Python 3.13), weighed by mesh volume.

Run: PYTHONPATH=<bpy target> python3.13 blender_models.py   -> models.json
Every solid is built from the dimensions the listing itself states (description or catalog `dims`); a dimension the
listing does not state is written here as an assumption. 14K density 13.07 g/cm3. Models are solid metal; openwork
motifs are tubes along their outline. Each result is a likely figure; pricing uses likely x 1.15.
"""
import bpy, bmesh, json, math
from pathlib import Path
RHO14 = 0.01307  # g per mm3


def inner_d(us):
    return 11.63 + 0.8128 * us


def vol(bm):
    bmesh.ops.triangulate(bm, faces=bm.faces[:])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    v = abs(bm.calc_volume(signed=True))
    bm.free()
    return v


def ring(us, w_fn, t_fn, n=240):
    """Closed band: rectangular section, width and thickness given per angle (0 = top of the ring)."""
    bm = bmesh.new()
    r0 = inner_d(us) / 2
    secs = []
    for k in range(n):
        a = 2 * math.pi * k / n
        w, t = w_fn(a), t_fn(a)
        pts = [(r0, -w / 2), (r0 + t, -w / 2), (r0 + t, w / 2), (r0, w / 2)]
        secs.append([bm.verts.new((r * math.sin(a), z, r * math.cos(a))) for r, z in pts])
    for k in range(n):
        A, B = secs[k], secs[(k + 1) % n]
        for j in range(4):
            bm.faces.new((A[j], A[(j + 1) % 4], B[(j + 1) % 4], B[j]))
    return vol(bm)


def prism(outline, h):
    """Extruded flat outline (list of x, y), height h."""
    bm = bmesh.new()
    lo = [bm.verts.new((x, y, 0)) for x, y in outline]
    hi = [bm.verts.new((x, y, h)) for x, y in outline]
    bm.faces.new(lo[::-1]); bm.faces.new(hi)
    n = len(outline)
    for k in range(n):
        bm.faces.new((lo[k], lo[(k + 1) % n], hi[(k + 1) % n], hi[k]))
    return vol(bm)


def ellipse(a, b, n=96):
    return [(a / 2 * math.cos(2 * math.pi * k / n), b / 2 * math.sin(2 * math.pi * k / n)) for k in range(n)]


def rrect(a, b, r, n=12):
    out = []
    for cx, cy, a0 in ((a / 2 - r, b / 2 - r, 0), (-a / 2 + r, b / 2 - r, 90), (-a / 2 + r, -b / 2 + r, 180), (a / 2 - r, -b / 2 + r, 270)):
        for k in range(n + 1):
            t = math.radians(a0 + 90 * k / n)
            out.append((cx + r * math.cos(t), cy + r * math.sin(t)))
    return out


def tube(path, d, closed=True, n=16):
    """Round wire of diameter d along a 3D polyline."""
    bm = bmesh.new()
    m = len(path)
    rings = []
    for i, p in enumerate(path):
        q0 = path[(i - 1) % m] if (closed or i > 0) else p
        q1 = path[(i + 1) % m] if (closed or i < m - 1) else p
        tx, ty, tz = (q1[0] - q0[0], q1[1] - q0[1], q1[2] - q0[2])
        L = math.sqrt(tx * tx + ty * ty + tz * tz) or 1
        tx, ty, tz = tx / L, ty / L, tz / L
        ux, uy, uz = (-ty, tx, 0) if abs(tz) < 0.9 else (1, 0, 0)
        L = math.sqrt(ux * ux + uy * uy + uz * uz); ux, uy, uz = ux / L, uy / L, uz / L
        vx, vy, vz = (ty * uz - tz * uy, tz * ux - tx * uz, tx * uy - ty * ux)
        rings.append([bm.verts.new((p[0] + d / 2 * (math.cos(t) * ux + math.sin(t) * vx),
                                    p[1] + d / 2 * (math.cos(t) * uy + math.sin(t) * vy),
                                    p[2] + d / 2 * (math.cos(t) * uz + math.sin(t) * vz)))
                      for t in (2 * math.pi * j / n for j in range(n))])
    for i in range(m if closed else m - 1):
        A, B = rings[i], rings[(i + 1) % m]
        for j in range(n):
            bm.faces.new((A[j], A[(j + 1) % n], B[(j + 1) % n], B[j]))
    if not closed:
        bm.faces.new(rings[0][::-1]); bm.faces.new(rings[-1])
    return vol(bm)


def loop(a, b, n=200):
    return [(x, y, 0) for x, y in ellipse(a, b, n)]


def lemniscate(a, b, n=240):
    return [(a / 2 * math.sin(t), b / 2 * math.sin(2 * t), 0.15 * math.cos(t)) for t in (2 * math.pi * k / n for k in range(n))]


def taper(top, back, span=70):
    """Width: `top` at the head, easing to `back` over `span` degrees each side."""
    def f(a):
        d = min(a, 2 * math.pi - a) * 180 / math.pi
        return back + (top - back) * max(0.0, 1 - d / span) ** 1.5
    return f


def const(x):
    return lambda a: x


def signet(us, face, head_h, shoulder, back_w, back_t, shape="ellipse"):
    """Signet: tapered shank plus a solid head; the head sits on the shank top, counted above the shank thickness."""
    a, b = face
    shank = ring(us, taper(min(a, b) * 0.85, back_w), lambda ang: back_t + (shoulder - back_t) * max(0.0, 1 - min(ang, 2 * math.pi - ang) * 180 / math.pi / 70))
    out = ellipse(a, b) if shape == "ellipse" else rrect(a, b, min(a, b) * 0.18)
    return shank + prism(out, head_h)


M = {}


def put(key, mm3, note, extra14=0.0):
    M[key] = {"mm3": round(mm3, 1), "g14": round(mm3 * RHO14 + extra14, 2), "note": note}


# ---- signets (reference size in the key)
put("BAS-S01-CRT@US7", signet(7, (11, 9), 2.0, 2.2, 4.0, 1.6), "oval 11 x 9 face 2.0 mm thick, 4 mm shank, 1.6 mm thick at the back; head height and shoulder thickness assumed")
put("BAS-S01-CRT@US4", signet(4, (11, 9), 2.0, 2.2, 4.0, 1.6), "same, US 4")
put("BAS-W02@US7", signet(7, (13, 11), 2.0, 2.2, 3.0, 1.6), "table 13 x 11, shank 3 mm; thicknesses assumed")
put("BAS-HM-R03@US9", signet(9, (9, 9), 2.0, 2.2, 3.5, 1.7, "rrect"), "square face 9 x 9; shank 3.5 x 1.7 assumed")
put("BAS-HM-R04@US9", signet(9, (12, 4), 2.0, 2.0, 3.0, 1.7, "rrect"), "bar face 12 x 4; shank 3 x 1.7 assumed")
put("BAS-F26-SIGNET@US7", signet(7, (10, 10), 2.0, 2.2, 3.5, 1.6), "no stated dimensions; round 10 mm face assumed from the photos")
for k, face in (("R01", (6.5, 6.5)), ("R02", (8, 4.2)), ("R03", (7, 5.5)), ("R04", (8, 4.5)), ("R05", (8, 6))):
    put(f"BAS-27-MINE-{k}@US7", signet(7, face, 1.6, 1.6, 2.0, 1.3, "rrect"), f"face {face[0]} x {face[1]} (R03 to R05 faces assumed), 2.0 x 1.3 shank assumed")
# ---- sculptural rings: band stated in the listing plus the motif
band = lambda us, w, t: ring(us, const(w), const(t))
put("BAS-I03-INF@US7", band(7, 1.9, 1.6) + tube(lemniscate(16, 6.2), 1.7) * 0.75, "band 1.9 x 1.6, infinity 16 x 6.2 in 1.7 mm wire, a quarter shared with the band")
put("BAS-M03-ROSETTE@US7", band(7, 2.0, 1.7) + 5 * tube(loop(4.6, 3.6), 1.2) + tube(loop(4.2, 4.2), 1.2), "band 2.0 x 1.7, open rosette 11 x 11: five petal loops and a centre ring in 1.2 mm wire")
put("BAS-M03S-ROSETTE@US7", band(7, 2.1, 1.8) + prism(ellipse(11, 11), 1.6) * 0.72, "band 2.1 x 1.8, solid flower head 11 x 11 x 1.6, 72% fill for the petal notches and recess")
put("BAS-M05-SUNRISE@US7", band(7, 2.1, 1.8) + prism([(-6, 0), (6, 0), (3.5, 3.5), (0, 7), (-3.5, 3.5)], 2.4) * 0.7, "band 2.1 x 1.8, peak motif 12 x 7 rising 2.4, 70% fill")
put("BAS-F26-OPENARC@US7", band(7, 2.0, 1.7) + 2 * tube([(x, 3.2 * math.sin(math.pi * (x + 4) / 8), 0) for x in [i * 0.2 - 4 for i in range(41)]], 1.6, closed=False), "no stated dimensions; band 2.0 x 1.7 with two 8 mm arcs in 1.6 mm wire assumed")
# ---- pendants and charms (motif only; chain and findings added in the table)
put("BAS-M11-LION", tube(loop(17, 14), 1.1) + tube(loop(9, 7), 1.0) + tube(loop(5, 4), 1.0) + tube(loop(3.4, 2.4), 1.0), "open lion 17 x 14: outline, mane line, 5 x 4 cheek and bail in about 1 mm wire")
put("BAS-I13-INF", tube(lemniscate(17, 7.8), 1.5) + 2 * tube(loop(3, 3), 1.0), "wide infinity 17 x 7.8 in 1.5 mm wire with two eyelets")
put("BAS-I13", prism(rrect(18 * 1.9, 2.2, 0.5), 1.0) + tube(loop(3.4, 2.4), 1.0), "Mobius ribbon 18 mm high: 2.2 mm wide, about 1 mm thick, 1.9 x its height in developed length")
put("BAS-MOTH-N01", prism(ellipse(14, 11), 1.0) * 0.55 + tube(loop(3, 3), 1.0), "moth 14 x 11 x 1 mm, openwork at 55% fill, 3 mm bail")
put("BAS-M11", tube([(x, y, 0) for x, y in rrect(12, 8, 1.0)], 1.4) + prism(ellipse(3, 3), 1.6), "open rectangle about 12 x 8 in 1.4 mm wire with a 3 mm bezel; size assumed from the photos")
put("BAS-E08-EYE", tube(loop(11.8, 5.8), 1.2) + prism(ellipse(3, 3), 1.5), "open eye 11.8 x 5.8 in 1.2 mm wire, 3 mm bezel")
put("BAS-E10", prism(ellipse(9, 4.2), 1.8) * 0.8, "eye 9 x 4.2 x 1.8 solid, 80% fill for the dome and the stone seat")
put("BAS-I06", tube(lemniscate(16, 5.2), 1.3), "infinity loop 16 x 5.2 in 1.3 mm wire")
put("BAS-I10", tube(lemniscate(14, 4.8), 1.3) + prism(ellipse(2.5, 2.5), 1.3), "infinity loop 14 x 4.8 with a small inlay seat")
put("BAS-H08-CERCLE", tube(loop(11, 11), 1.6), "open circle 11 mm in 1.6 mm pave wire; diamonds not weighed")
put("BAS-F26-SUNRAY", tube([(9 * math.cos(t), 9 * math.sin(t), 0) for t in [math.pi * i / 60 for i in range(61)]], 1.4, closed=False) + 7 * prism(rrect(1.0, 4.0, 0.3), 1.0), "no stated dimensions; 18 mm arc in 1.4 mm wire with seven 4 mm rays assumed")
put("BAS-TWIG-B01", tube([(x, 0.6 * math.sin(x / 2.5), 0) for x in [i * 0.25 for i in range(81)]], 1.5, closed=False) + prism(ellipse(4.6, 4.6), 1.0) * 0.6, "twig 20 mm in 1.5 mm wire, 4.6 mm pearl cup; pearl not gold")
put("BAS-FW26-L07", 2 * tube([((7.5 - 0.8) * math.cos(t), (7.5 - 0.8) * math.sin(t), 0) for t in [2 * math.pi * i / 200 for i in range(200)]], 1.6), "pair of 15 mm hoops in 1.6 mm wire", extra14=0.25)
json.dump(M, open(Path(__file__).resolve().parent / "models.json", "w"), indent=1)
for k, v in M.items():
    print(f"{k:24s} {v['mm3']:8.1f} mm3  {v['g14']:6.2f} g")
