"""히어로 '바둑' 글자 분리 + 원본 자리 인페인트
- 결과1: assets/hero-word-baduk.png  (글자만 투명 배경)
- 결과2: assets/hero_cut_nobtn.webp  (글자 지운 히어로)
"""
from PIL import Image, ImageFilter
import numpy as np, cv2, shutil, os, pathlib

SRC = 'assets/hero_cut_nobtn.webp'
BOX = (1044, 24, 1348, 190)      # left, top, right, bottom (글자 여유 포함)
PAD = 6

im = Image.open(SRC).convert('RGB')
arr = np.array(im)

# 백업 (사이트 밖)
bak_dir = pathlib.Path('../_backup_html')
bak_dir.mkdir(exist_ok=True)
shutil.copy2(SRC, bak_dir / 'hero_cut_nobtn_before_sway.webp')
print('백업:', (bak_dir / 'hero_cut_nobtn_before_sway.webp').resolve())

x0, y0, x1, y1 = BOX
x0 -= PAD; y0 -= PAD; x1 += PAD; y1 += PAD

sub = arr[y0:y1, x0:x1].astype(np.int16)
r, g, b = sub[:, :, 0], sub[:, :, 1], sub[:, :, 2]
green = g - (r + b) / 2.0                       # 초록 정도
dark = (sub.max(axis=2) < 110)                  # 진한 테두리 후보

alpha = np.clip((green - 12) * 4.2, 0, 255)
alpha[dark & (g > b + 15)] = 255                # 어두운 초록 테두리 보존
alpha[alpha < 45] = 0

# 살짝 부드럽게
am = Image.fromarray(alpha.astype(np.uint8), mode='L').filter(ImageFilter.GaussianBlur(0.7))

cut = Image.new('RGBA', (x1 - x0, y1 - y0), (0, 0, 0, 0))
cut.paste(Image.fromarray(arr[y0:y1, x0:x1]).convert('RGBA'), (0, 0), am)
cut.save('assets/hero-word-baduk.png')
print('글자 PNG', cut.size, 'alpha 평균', round(np.asarray(am).mean(), 1))

# 원본 자리 인페인트
mask = np.zeros(arr.shape[:2], np.uint8)
mask[y0:y1, x0:x1] = np.where(alpha > 0, 255, 0).astype(np.uint8)
mask = cv2.dilate(mask, np.ones((9, 9), np.uint8), iterations=1)
filled = cv2.inpaint(cv2.cvtColor(arr, cv2.COLOR_RGB2BGR), mask, 8, cv2.INPAINT_TELEA)
filled = cv2.cvtColor(filled, cv2.COLOR_BGR2RGB)

Image.fromarray(filled).save(SRC, quality=92, method=6)
print('히어로 갱신', os.path.getsize(SRC), 'bytes')

Image.fromarray(filled[y0 - 20:y1 + 20, x0 - 20:x1 + 20]).resize(((x1 - x0 + 40) * 2, (y1 - y0 + 40) * 2), Image.LANCZOS).save('C:/Users/sinsu/Videos/hero_noword.png')
