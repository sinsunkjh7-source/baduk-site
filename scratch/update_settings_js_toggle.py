# -*- coding: utf-8 -*-
with open(r'C:\Users\sinsu\dev\baduk-site\teacher\app.js', 'r', encoding='utf-8') as f:
    js = f.read()

target = '''    // 열기
    if (btnOpen) {
      btnOpen.addEventListener('click', function () {
        syncModalUI();
        modal.hidden = false;
      });
    }

    // 닫기
    function closeModal() {
      modal.hidden = true;
    }
    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnSave) btnSave.addEventListener('click', closeModal);'''

replacement = '''    // 열기 및 닫기 토글 제어
    function openModal() {
      syncModalUI();
      modal.hidden = false;
      if (btnOpen) btnOpen.classList.add('active');
    }
    function closeModal() {
      modal.hidden = true;
      if (btnOpen) btnOpen.classList.remove('active');
    }

    if (btnOpen) {
      btnOpen.addEventListener('click', function (e) {
        e.stopPropagation();
        if (modal.hidden) {
          openModal();
        } else {
          closeModal();
        }
      });
    }

    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnSave) btnSave.addEventListener('click', closeModal);

    // ESC 키로 닫기
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.hidden) {
        closeModal();
      }
    });

    // 바깥 클릭 시 닫기 (메인 화면 및 바둑판 조작 방해 없이 패널 외부 클릭 시 자연스럽게 닫힘)
    document.addEventListener('pointerdown', function (e) {
      if (!modal.hidden) {
        var dialog = modal.querySelector('.settings-dialog');
        if (dialog && !dialog.contains(e.target) && !btnOpen.contains(e.target)) {
          closeModal();
        }
      }
    });'''

# normalize line endings for safe replace
js_normalized = js.replace('\r\n', '\n')
target_normalized = target.replace('\r\n', '\n')
replacement_normalized = replacement.replace('\r\n', '\n')

assert target_normalized in js_normalized, "Target block not found"
js_updated = js_normalized.replace(target_normalized, replacement_normalized)

with open(r'C:\Users\sinsu\dev\baduk-site\teacher\app.js', 'w', encoding='utf-8') as f:
    f.write(js_updated)

print("Updated teacher/app.js toggle logic successfully!")
