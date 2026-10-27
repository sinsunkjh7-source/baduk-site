# -*- coding: utf-8 -*-
# Verify the 4 star points coordinates in 10x9 diagram:
# SGF coordinates: x in [9..18], y in [10..18]
# shiftX = 9, shiftY = 10
# 19x19 star points are at x in {3, 9, 15}, y in {3, 9, 15}
# Let's see which star points fall into x in [9..18] and y in [10..18]:

stars_19 = [(x, y) for x in [3, 9, 15] for y in [3, 9, 15]]
print("All 9 star points in 19x19:")
for s in stars_19:
    mapped_x = s[0] - 9
    mapped_y = s[1] - 10
    in_range = (0 <= mapped_x < 10) and (0 <= mapped_y < 9)
    print(f"  19x19 ({s[0]}, {s[1]}): mapped=({mapped_x}, {mapped_y}) -> In 10x9? {in_range}")
