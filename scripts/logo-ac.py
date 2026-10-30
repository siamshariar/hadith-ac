#!/usr/bin/env python3
# Builds the Hadith.ac logos (config/countries.json "ac") from public/img/logo.png, the
# "Hadith.vn" logo (2020x343), reusing that logo's own glyphs, since its font is not
# available:
#   - "Hadith." : the original pixels (alpha kept apart from the colour, so no fringe when
#                 it is recoloured for the dark theme);
#   - "a"       : the second letter of "Hadith", its alpha used as a mask;
#   - "c"       : the bowl of that "a" with the stem cut away by a vertical line through the
#                 counter, which opens the right side with vertical terminals. The bowl is two
#                 circles (fitted to its edges: rms 0.14 px); the terminals' corners are
#                 rounded like the font's own corners (9 px outside, 6 px inside).
# "ac" keeps the baseline, x-height and weight of the original, and the font's own spacing
# from "a" to a round letter ("ad" in "Hadith"). It is coloured with a linear gradient, in
# sRGB like the CSS ribbon (config/countries.json "accent"). The canvas stays 2020x343, so
# the logo drops in where logo.png goes (components/web/HeaderLogo.js).
#
#   python3 scripts/logo-ac.py            writes public/img/logo_ac.png, logo_ac_dark.png
#                                         and s_logo_ac.png (the share image)
#
# Needs Python 3 with numpy, and ImageMagick's `convert` (PNG in and out, as raw RGBA).
import os
import subprocess

import numpy as np

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
IMG = os.path.join(ROOT, "public", "img")
W, H = 2020, 343

# The international gradient: teal, blue, indigo (Tailwind 600; 500 on the dark header, where
# the 600 indigo would be 2.6:1). Analogous to the brand green of "Hadith." and the colours
# of the globe; no country's flag.
LIGHT = ("#173A1D", ["#0D9488", "#2563EB", "#4F46E5"])
DARK = ("#EEF3EC", ["#14B8A6", "#3B82F6", "#6366F1"])
ANGLE = 35.0  # gradient direction, degrees above the horizontal (bottom left to top right)

# Glyph boxes (columns) of the source.
A_LEFT, A_RIGHT = 291, 547  # "a" of "Hadith"
D_LEFT = 575  # "d": the font's advance from "a" to a round letter
DOT_RIGHT = 1523  # "." ends here; "vn" starts at 1533
GAP = 37.0  # dot to the bowl of the "a": the font's "h." (51) less straight-round (14)
X_TOP, BASELINE = 99, 339  # x-height (top of the bowl) and baseline rows

# The bowl of the "a", in pixel-edge coordinates (pixel (i, j) covers [i, i+1) x [j, j+1)).
OC, OR = np.array([410.387, 218.963]), 119.240  # outer contour
IC, IR = np.array([414.607, 218.384]), 52.669  # counter
CUT = IC[0] + 25.0  # the vertical cut, 25 px right of the counter's centre
ROUND_OUTER, ROUND_INNER = 9.0, 6.0
SS = 16  # samples per pixel side for the rounded corners
DELTA = 0.35  # the rounded shape is grown by this much: along the arcs the source pixels win


def read_rgba(path):
    raw = subprocess.run(["convert", path, "-depth", "8", "rgba:-"], check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.uint8).reshape(H, W, 4).astype(float)


def write_png(path, rgba):
    data = np.clip(np.round(rgba), 0, 255).astype(np.uint8)
    h, w = data.shape[:2]
    subprocess.run(
        ["convert", "-size", f"{w}x{h}", "-depth", "8", "rgba:-", "-strip", f"PNG32:{path}"],
        input=data.tobytes(),
        check=True,
    )


def hex_rgb(value):
    value = value.lstrip("#")
    return np.array([int(value[i : i + 2], 16) for i in (0, 2, 4)], dtype=float)


def corner(fillet, rho, tangent_line, tangent_circle, sharp):
    """The corner a fillet (centre `fillet`, radius rho) rounds off: the points whose
    direction from the fillet's centre lies between its two tangent points (the angle that
    holds the sharp corner), no farther than the sharp corner, and outside the fillet."""
    a1, a2 = tangent_line - fillet, tangent_circle - fillet
    cross = a1[0] * a2[1] - a1[1] * a2[0]
    reach = np.hypot(*(sharp - fillet)) + 1.5

    def removed(px, py):
        vx, vy = px - fillet[0], py - fillet[1]
        c1 = a1[0] * vy - a1[1] * vx
        c2 = vx * a2[1] - vy * a2[0]
        between = (c1 >= 0) & (c2 >= 0) if cross > 0 else (c1 <= 0) & (c2 <= 0)
        dist2 = vx * vx + vy * vy
        return between & (dist2 <= reach * reach) & (dist2 > (rho + DELTA) ** 2)

    return fillet, rho, removed


def corners():
    out = []
    for sign in (-1, 1):  # top terminal, bottom terminal
        # outside: a fillet inside the outer circle, tangent to the cut
        fx = CUT - ROUND_OUTER
        fy = OC[1] + sign * np.sqrt((OR - ROUND_OUTER) ** 2 - (fx - OC[0]) ** 2)
        f = np.array([fx, fy])
        sharp = np.array([CUT, OC[1] + sign * np.sqrt(OR**2 - (CUT - OC[0]) ** 2)])
        out.append(corner(f, ROUND_OUTER, np.array([CUT, fy]), OC + (f - OC) * OR / (OR - ROUND_OUTER), sharp))
        # inside: a fillet outside the counter, tangent to the cut
        fx = CUT - ROUND_INNER
        fy = IC[1] + sign * np.sqrt((IR + ROUND_INNER) ** 2 - (fx - IC[0]) ** 2)
        f = np.array([fx, fy])
        sharp = np.array([CUT, IC[1] + sign * np.sqrt(IR**2 - (CUT - IC[0]) ** 2)])
        out.append(corner(f, ROUND_INNER, np.array([CUT, fy]), IC + (f - IC) * IR / (IR + ROUND_INNER), sharp))
    return out


def c_alpha(alpha):
    """The "c": the source "a" left of the cut (the cut anti-aliased), and near the four
    terminal corners no more than the coverage of the rounded shape."""
    x1 = int(np.ceil(CUT))
    a = alpha[:, A_LEFT:x1].copy()
    a *= np.clip(CUT - np.arange(A_LEFT, x1), 0, 1)[None, :]
    offsets = (np.arange(SS) + 0.5) / SS
    all_corners = corners()
    for fillet, rho, _ in all_corners:
        reach = rho * 2.5 + 3
        for j in range(max(int(np.floor(fillet[1] - reach)), 0), min(int(np.ceil(fillet[1] + reach)), H)):
            for i in range(int(np.floor(fillet[0] - 2)), x1):
                sx = np.tile(i + offsets, (SS, 1))
                sy = np.tile((j + offsets)[:, None], (1, SS))
                inside = (
                    (sx <= CUT + DELTA)
                    & ((sx - OC[0]) ** 2 + (sy - OC[1]) ** 2 <= (OR + DELTA) ** 2)
                    & ((sx - IC[0]) ** 2 + (sy - IC[1]) ** 2 >= (IR - DELTA) ** 2)
                )
                for _f, _r, removed in all_corners:
                    inside &= ~removed(sx, sy)
                a[j, i - A_LEFT] = min(a[j, i - A_LEFT], inside.mean())
    return a


def ac_mask(alpha):
    mask = np.zeros((H, W))
    left = int(round(DOT_RIGHT + 1 + GAP))
    mask[:, left : left + A_RIGHT - A_LEFT + 1] = alpha[:, A_LEFT : A_RIGHT + 1]
    c = c_alpha(alpha)
    start = left + (D_LEFT - A_LEFT)
    mask[:, start : start + c.shape[1]] = np.maximum(mask[:, start : start + c.shape[1]], c)
    return mask


def gradient(mask, stops):
    cols = np.nonzero(mask.max(0) > 0)[0]
    x0, x1 = cols[0], cols[-1] + 1
    angle = np.radians(ANGLE)
    ux, uy = np.cos(angle), -np.sin(angle)  # rows grow downwards
    X, Y = np.meshgrid(np.arange(W) + 0.5, np.arange(H) + 0.5)
    ends = [x * ux + y * uy for x, y in ((x0, BASELINE), (x1, X_TOP), (x0, X_TOP), (x1, BASELINE))]
    t = np.clip((X * ux + Y * uy - min(ends)) / (max(ends) - min(ends)), 0, 1) * (len(stops) - 1)
    k = np.minimum(t.astype(int), len(stops) - 2)
    f = (t - k)[..., None]
    s = np.array([hex_rgb(stop) for stop in stops])
    return s[k] * (1 - f) + s[k + 1] * f


def logo(src, ink, stops, mask):
    out = np.zeros((H, W, 4))
    keep = DOT_RIGHT + 5  # "Hadith." only, nothing of "vn"
    out[:, :keep] = src[:, :keep]
    letters = out[:, :keep, 3] > 0
    out[:, :keep, :3][letters] = hex_rgb(ink)
    rgb = gradient(mask, stops)
    sel = mask > 0
    out[:, :, :3][sel] = rgb[sel]
    out[:, :, 3][sel] = np.round(mask[sel] * 255)
    return out


def main():
    src = read_rgba(os.path.join(IMG, "logo.png"))
    mask = ac_mask(src[:, :, 3] / 255)
    light = os.path.join(IMG, "logo_ac.png")
    write_png(light, logo(src, LIGHT[0], LIGHT[1], mask))
    write_png(os.path.join(IMG, "logo_ac_dark.png"), logo(src, DARK[0], DARK[1], mask))
    # The share image, laid out as s_logo.png: 512x521 white, the logo 485 px wide at (16, 215).
    subprocess.run(
        ["convert", "-size", "512x521", "xc:white", "(", light, "-resize", "485x", ")",
         "-geometry", "+16+215", "-composite", "-strip", "-depth", "8", "PNG24:" + os.path.join(IMG, "s_logo_ac.png")],
        check=True,
    )
    cols = np.nonzero(mask.max(0) > 0)[0]
    print(f'"ac" in columns {cols[0]}..{cols[-1]} of {W}x{H}; wrote logo_ac.png, logo_ac_dark.png, s_logo_ac.png')


if __name__ == "__main__":
    main()
