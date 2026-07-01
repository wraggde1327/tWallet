// --- Логика для вкладки "Договора" ---

(function () {
  const contractForm = document.getElementById('contractForm');
  if (!contractForm) return;

  const orgButtons = document.querySelectorAll('.button-org');
  const orgTypeInput = document.getElementById('orgType');

  orgButtons.forEach(btn => {
    btn.addEventListener('click', function () {
      orgButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      orgTypeInput.value = this.dataset.value;
    });
  });

  const tarifButtons = document.querySelectorAll('.button-tarif');
  const tarifInput = document.getElementById('tarif');

  tarifButtons.forEach(btn => {
    btn.addEventListener('click', function () {
      tarifButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      tarifInput.value = this.dataset.value;
    });
  });

  contractForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const requiredFields = contractForm.querySelectorAll('[required]');
    let valid = true;
    requiredFields.forEach(field => {
      if (!field.value.trim()) {
        field.classList.add('input-error');
        valid = false;
      } else {
        field.classList.remove('input-error');
      }
    });

    if (!valid) {
      showNotification('Заполните все обязательные поля', 'error', 4000);
      return;
    }

    const payload = {
      contract_number: document.getElementById('contractNumber').value.trim(),
      contract_date: document.getElementById('contractDate').value,
      org_type: orgTypeInput.value,
      zakazchik: document.getElementById('zakazchik').value.trim(),
      inn: document.getElementById('inn').value.trim(),
      ogrn: document.getElementById('ogrn').value.trim(),
      lico: document.getElementById('lico').value.trim(),
      osnovan: document.getElementById('osnovan').value.trim(),
      ruководитель: document.getElementById('rucl').value.trim(),
      adress: document.getElementById('adress').value.trim(),
      tel: document.getElementById('tel').value.trim(),
      pochta: document.getElementById('pochta').value.trim(),
      bank: document.getElementById('bank').value.trim(),
      bik: document.getElementById('bik').value.trim(),
      rs: document.getElementById('rs').value.trim(),
      ks: document.getElementById('ks').value.trim(),
      tarif: tarifInput.value,
      who: typeof tgUserId !== 'undefined' ? tgUserId : null
    };

    showNotification('Создание договора...', 'status', 1500);

    fetch(API_BASE + '/contracts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(data => {
        if (data && data.error) {
          throw new Error(data.error);
        }
        showNotification('Договор успешно создан!', 'info', 3000);
        contractForm.reset();
        orgButtons.forEach(b => b.classList.remove('active'));
        orgButtons[0].classList.add('active');
        orgTypeInput.value = orgButtons[0].dataset.value;
        tarifButtons.forEach(b => b.classList.remove('active'));
        tarifButtons[0].classList.add('active');
        tarifInput.value = tarifButtons[0].dataset.value;
      })
      .catch(err => {
        console.error('Ошибка создания договора:', err);
        showNotification('Ошибка создания договора: ' + err.message, 'error', 4000);
      });
  });
})();
