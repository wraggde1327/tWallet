// --- Переменные и DOM-элементы ---
let paymentsData = [];
let filteredPayments = [];
let lastUpdated = null;
let selectedPayment = null;
let isEditing = false;
let editInput = null;

const paymentsList = document.getElementById("paymentsList");
const totalSumEl = document.getElementById("totalSum");
const updatedAtEl = document.getElementById("updatedAt");
const dialog = document.getElementById("dialog");
const dialogText = document.getElementById("dialogText");
const paymentsCountBadge = document.getElementById("paymentsCountBadge");
const searchInput = document.getElementById("searchInput");
const clearSearchBtn = document.getElementById("clearSearchBtn");
const dialogOverlay = document.getElementById("dialog-overlay");
const dialogButtons = document.getElementById("dialog-buttons");
const buttons = dialogButtons.getElementsByTagName("button"); // [0] Да, [1] Изменить, [2] Нет

// --- Telegram Web App интеграция ---
const tgUserInfoDiv = document.getElementById('tgUserInfo');
let tgUserLabel = '';
let tgUserId = null; // username
let tgUserObj = null;

// Список разрешённых пользователей
const allowedUsers = ['nick_xnm', 'jekminaev', 'boss'];

const tg = window.Telegram?.WebApp;

function askForUser() {
  return new Promise((resolve, reject) => {
    // Создаём overlay
    let overlay = document.getElementById('user-input-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'user-input-overlay';
      overlay.style.position = 'fixed';
      overlay.style.top = 0;
      overlay.style.left = 0;
      overlay.style.width = '100vw';
      overlay.style.height = '100vh';
      overlay.style.background = 'rgba(0,0,0,0.5)';
      overlay.style.zIndex = 2000;
      overlay.style.display = 'flex';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      document.body.appendChild(overlay);
    }
    // Создаём окно
    let modal = document.createElement('div');
    modal.style.background = 'white';
    modal.style.padding = '32px 24px';
    modal.style.borderRadius = '16px';
    modal.style.boxShadow = '0 8px 24px rgba(0,0,0,0.25)';
    modal.style.textAlign = 'center';
    modal.innerHTML = `<div style="font-size:18px;margin-bottom:16px;">Введите имя пользователя</div>
      <input id="userInputField" type="text" style="font-size:16px;padding:8px 12px;border-radius:8px;border:1.5px solid #ccc;width:90%;margin-bottom:16px;" placeholder="никнейм (например, nick_xnm)" />
      <br><button id="userInputBtn" style="padding:8px 18px;border-radius:12px;border:none;font-weight:600;font-size:14px;background:#4a90e2;color:white;cursor:pointer;">Войти</button>
      <div id="userInputError" style="color:red;margin-top:10px;font-size:14px;display:none;"></div>`;
    overlay.appendChild(modal);
    const input = modal.querySelector('#userInputField');
    const btn = modal.querySelector('#userInputBtn');
    const errorDiv = modal.querySelector('#userInputError');
    btn.onclick = () => {
      const value = input.value.trim();
      if (!value) {
        errorDiv.textContent = 'Введите никнейм!';
        errorDiv.style.display = 'block';
        return;
      }
      if (!allowedUsers.includes(value)) {
        errorDiv.textContent = 'Нет доступа!';
        errorDiv.style.display = 'block';
        return;
      }
      overlay.remove();
      resolve(value);
    };
    input.onkeydown = (e) => {
      if (e.key === 'Enter') btn.onclick();
    };
    input.focus();
  });
}

// Функция для скрытия и показа основного контента
function setAppVisibility(visible) {
  const container = document.querySelector('.container');
  if (container) {
    container.style.display = visible ? '' : 'none';
  }
  // Скрываем диалоги и уведомления
  const dialog = document.getElementById('dialog');
  if (dialog) dialog.style.display = 'none';
  const dialogOverlay = document.getElementById('dialog-overlay');
  if (dialogOverlay) dialogOverlay.style.display = 'none';
  const notification = document.getElementById('notification');
  if (notification) notification.style.display = 'none';
  const notificationOverlay = document.getElementById('notification-overlay');
  if (notificationOverlay) notificationOverlay.style.display = 'none';
}

function showUserWelcome(nick) {
  setAppVisibility(false);
  return new Promise((resolve) => {
    let overlay = document.getElementById('user-input-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'user-input-overlay';
      overlay.style.position = 'fixed';
      overlay.style.top = 0;
      overlay.style.left = 0;
      overlay.style.width = '100vw';
      overlay.style.height = '100vh';
      overlay.style.background = 'rgba(0,0,0,0.5)';
      overlay.style.zIndex = 2000;
      overlay.style.display = 'flex';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      document.body.appendChild(overlay);
    }
    let modal = document.createElement('div');
    modal.style.background = 'white';
    modal.style.padding = '32px 24px';
    modal.style.borderRadius = '16px';
    modal.style.boxShadow = '0 8px 24px rgba(0,0,0,0.25)';
    modal.style.textAlign = 'center';
    if (nick) {
      modal.innerHTML = `<div style="font-size:18px;margin-bottom:16px;">Приветствуем, <b>@${nick}</b>!</div>
        <button id="userInputBtn" style="padding:8px 18px;border-radius:12px;border:none;font-weight:600;font-size:14px;background:#4a90e2;color:white;cursor:pointer;">Продолжить</button>`;
    } else {
      modal.innerHTML = `<div style="font-size:18px;margin-bottom:16px;">Введите никнейм</div>
        <input id="userInputField" type="text" style="font-size:16px;padding:8px 12px;border-radius:8px;border:1.5px solid #ccc;width:90%;margin-bottom:16px;" placeholder="никнейм (например, nick_xnm)" />
        <br><button id="userInputBtn" style="padding:8px 18px;border-radius:12px;border:none;font-weight:600;font-size:14px;background:#4a90e2;color:white;cursor:pointer;">Продолжить</button>
        <div id="userInputError" style="color:red;margin-top:10px;font-size:14px;display:none;"></div>`;
    }
    overlay.appendChild(modal);
    const btn = modal.querySelector('#userInputBtn');
    if (nick) {
      btn.onclick = () => {
        overlay.remove();
        setAppVisibility(true);
        resolve(nick);
      };
    } else {
      const input = modal.querySelector('#userInputField');
      const errorDiv = modal.querySelector('#userInputError');
      btn.onclick = () => {
        const value = input.value.trim();
        if (!value) {
          errorDiv.textContent = 'Введите никнейм!';
          errorDiv.style.display = 'block';
          return;
        }
        if (!allowedUsers.includes(value)) {
          errorDiv.textContent = 'Нет доступа!';
          errorDiv.style.display = 'block';
          return;
        }
        overlay.remove();
        setAppVisibility(true);
        resolve(value);
      };
      input.onkeydown = (e) => {
        if (e.key === 'Enter') btn.onclick();
      };
      input.focus();
    }
  });
}

async function ensureUser() {
  // Всегда показываем всплывашку
  let savedNick = localStorage.getItem('manualUserId');
  let nick = null;
  if (tg && tg.initDataUnsafe?.user?.username) {
    savedNick = tg.initDataUnsafe.user.username;
    localStorage.setItem('manualUserId', savedNick);
  }
  if (savedNick && allowedUsers.includes(savedNick)) {
    nick = await showUserWelcome(savedNick);
  } else {
    nick = await showUserWelcome(null);
    localStorage.setItem('manualUserId', nick);
  }
  if (!allowedUsers.includes(nick)) {
    showNotification('Нет доступа! Пользователь не разрешён.', 'error', 5000);
    throw new Error('Нет доступа!');
  }
  tgUserId = nick;
  tgUserLabel = nick;
  if (tgUserInfoDiv) {
    tgUserInfoDiv.textContent = tgUserLabel;
    tgUserInfoDiv.title = tgUserId;
  }
}

if (tg) {
  document.body.classList.add('telegram-webapp');
  tg.ready();

  const user = tg.initDataUnsafe?.user;
  if (user) {
    tgUserObj = user;
    tgUserId = user.username ? user.username : (user.id ? String(user.id) : null);
    tgUserLabel = user.username ? '@' + user.username : 'ID: ' + user.id;

    if (tgUserInfoDiv) {
      tgUserInfoDiv.textContent = tgUserLabel;
      tgUserInfoDiv.title = user.first_name + (user.last_name ? ' ' + user.last_name : '');
    }
  }
}

// Проверяем пользователя при запуске
ensureUser().catch(() => {
  // Блокируем интерфейс, если нет доступа
  document.body.innerHTML = '<div style="color:red;font-size:22px;text-align:center;margin-top:30vh;">Нет доступа к приложению</div>';
});

// --- Переключение вкладок ---

document.addEventListener('DOMContentLoaded', () => {
  const tabs = {
    payments: document.getElementById('paymentsTab'),
    invoice: document.getElementById('invoiceTab'),
    contract: document.getElementById('contractTab'),
  };

  const contents = {
    payments: document.getElementById('paymentsContent'),
    invoice: document.getElementById('invoiceContent'),
    contract: document.getElementById('contractContent'),
  };

  function showTab(tabName) {
    // Скрываем все
    Object.values(contents).forEach(c => c.style.display = 'none');
    Object.values(tabs).forEach(t => t.classList.remove('active'));

    // Показываем выбранную
    contents[tabName].style.display = 'block';
    tabs[tabName].classList.add('active');
  }

  // Обработчики кликов
  tabs.payments.addEventListener('click', () => showTab('payments'));
  tabs.invoice.addEventListener('click', () => showTab('invoice'));
  tabs.contract.addEventListener('click', () => showTab('contract'));

  // Показываем первую вкладку по умолчанию
  showTab('payments');
});


// Загрузка данных
function fetchPayments() {
  updatedAtEl.textContent = "Обновление...";
  fetch("https://24sdmahom.ru/pending")
    .then(res => {
      console.log("Статус ответа загрузки:", res.status, res.statusText);
      if (!res.ok) {
        throw new Error(`Ошибка загрузки: ${res.status} ${res.statusText}`);
      }
      return res.json();
    })
    .then(data => {
      console.log("Загруженные данные:", data);
      console.log("Структура первого элемента:", data.length > 0 ? data[0] : "Нет данных");
      
      paymentsData = data;
      lastUpdated = new Date();
      filteredPayments = paymentsData;
      renderPayments();
    })
    .catch(err => {
      console.error("Полная ошибка загрузки:", err);
      paymentsList.innerHTML = "<p style='color:red; padding:12px;'>Ошибка загрузки данных</p>";
      totalSumEl.textContent = "Общая сумма: 0";
      updatedAtEl.textContent = "Обновлено: —";
      paymentsCountBadge.textContent = "0";
      showNotification("Ошибка загрузки данных. Проверьте соединение.", "error", 5000);
    });
}

// Фильтрация по названию
function filterPayments() {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) {
    filteredPayments = paymentsData;
  } else {
    filteredPayments = paymentsData.filter(p =>
      p["Название"].toLowerCase().startsWith(query)
    );
  }
  renderPayments();
}

// Сброс поиска
function clearSearch() {
  searchInput.value = "";
  filteredPayments = paymentsData;
  renderPayments();
}

// Рендер платежей
function renderPayments() {
  if (!filteredPayments.length) {
    paymentsList.innerHTML = "<p style='padding: 12px; color: #999;'>Нет ожидающих платежей.</p>";
    totalSumEl.textContent = "Общая сумма: 0";
    updatedAtEl.textContent = lastUpdated
      ? "Обновлено: " + lastUpdated.toLocaleTimeString("ru-RU")
      : "Обновлено: —";
    paymentsCountBadge.textContent = "0";
    return;
  }

  let sum = 0;
  paymentsList.innerHTML = "";

  filteredPayments.forEach((row, idx) => {
    // Проверяем структуру данных
    console.log(`Обрабатываем платеж ${idx}:`, row);
    
    const div = document.createElement("div");
    div.className = "payment-row";
    div.tabIndex = 0;
    div.setAttribute("role", "row");
    div.setAttribute(
      "aria-label",
      `Платёж ${row["Название"]} №${row["№"]}, сумма ${row["Сумма"]}, статус ${row["Статус"]}`
    );

    let formattedDate = "—";
    if (row["Дата"]) {
      const dateObj = new Date(row["Дата"]);
      if (!isNaN(dateObj)) {
        formattedDate = dateObj.toLocaleDateString("ru-RU", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric"
        });
      }
    }

    // Формируем класс для статуса
    const statusClass = `status ${row["Статус"]?.toLowerCase().trim() === "ожидает" ? "await" : ""}`;

    div.innerHTML = `
      <div role="cell">${row["№"] ?? idx + 1}</div>
      <div role="cell">${row["Название"] ?? "—"}</div>
      <div role="cell">${row["Тип"] ?? "—"}</div>
      <div role="cell">${formattedDate}</div>
      <div role="cell">${row["Сумма"] ?? "—"}</div>
      <div role="cell" class="${statusClass}">${row["Статус"] ?? "—"}</div>
    `;

    div.addEventListener("click", () => openDialog(row));
    paymentsList.appendChild(div);

    if (row["Статус"]?.toLowerCase().trim() === "ожидает") {
      const amount = parseFloat(row["Сумма"]);
      if (!isNaN(amount)) {
        sum += amount;
      }
    }
  });

  totalSumEl.textContent = "Общая сумма: " + sum.toLocaleString("ru-RU");
  updatedAtEl.textContent = "Обновлено: " + lastUpdated.toLocaleTimeString("ru-RU");
  paymentsCountBadge.textContent = filteredPayments.length.toString();
}

// Открыть диалог
function openDialog(row) {
  selectedPayment = row;
  isEditing = false;

  dialogText.innerHTML = `Провести платёж "<strong>${row["Название"]}</strong>" на сумму <strong>${row["Сумма"]}</strong>?`;

  if (editInput) {
    editInput.remove();
    editInput = null;
  }

  buttons[0].style.display = "inline-block"; // Да
  buttons[1].style.display = "inline-block"; // Изменить
  buttons[2].style.display = "inline-block"; // Нет

  enableButtons(true);

  dialog.style.display = "block";
  dialogOverlay.style.display = "block";
}

// Включить/отключить кнопки диалога
function enableButtons(enabled) {
  for (let btn of buttons) {
    btn.disabled = !enabled;
  }
}

// Начать редактирование суммы
function startEdit() {
  if (isEditing) return;
  isEditing = true;

  dialogText.innerHTML = `Изменить сумму платежа "<strong>${selectedPayment["Название"]}</strong>"? Введите новую сумму:`;

  editInput = document.createElement("input");
  editInput.type = "number";
  editInput.min = "0";
  editInput.value = selectedPayment["Сумма"];
  editInput.style.width = "100%";
  editInput.classList.add("dialog-edit-input");
  editInput.autofocus = true;

  dialogText.appendChild(editInput);

  buttons[1].style.display = "none"; // скрыть "Изменить"
}

// Подтвердить платеж (или изменение суммы)
function confirmPayment() {
  if (!selectedPayment) {
    showNotification("Ошибка: платеж не выбран", "error", 4500);
    console.error("Платёж не выбран");
    return;
  }

  // Сохраняем данные в локальные переменные
  let amountToSend = selectedPayment["Сумма"];
  const invoiceId = selectedPayment["№"];
  const paymentName = selectedPayment["Название"];

  // Проверяем корректность данных
  if (!invoiceId) {
    showNotification("Ошибка: отсутствует ID платежа", "error", 4500);
    console.error("Отсутствует ID платежа:", selectedPayment);
    return;
  }

  if (isEditing) {
    if (!editInput) {
      alert("Ошибка: поле ввода суммы не найдено.");
      enableButtons(true);
      return;
    }
    const val = parseFloat(editInput.value);
    if (isNaN(val) || val <= 0) {
      alert("Введите корректную сумму больше 0.");
      enableButtons(true);
      return;
    }
    amountToSend = val;
  }

  // Проверяем, что сумма корректная
  if (!amountToSend || isNaN(amountToSend) || amountToSend <= 0) {
    showNotification("Ошибка: некорректная сумма платежа", "error", 4500);
    console.error("Некорректная сумма:", amountToSend);
    return;
  }

  // Убеждаемся, что данные имеют правильные типы
  const numericInvoiceId = parseInt(invoiceId);
  const numericAmount = parseFloat(amountToSend);

  if (isNaN(numericInvoiceId)) {
    showNotification("Ошибка: некорректный ID платежа", "error", 4500);
    console.error("Некорректный ID:", invoiceId);
    return;
  }
  if (!tgUserId) {
    showNotification("Ошибка: не определён пользователь Telegram", "error", 4500);
    console.error("Не определён tgUserId");
    return;
  }

  // Закрываем диалог после сохранения данных
  closeDialog();

  enableButtons(false);

  const payload = {
    invoice_id: numericInvoiceId,
    amount: numericAmount,
    who: tgUserId
  };

  // Альтернативный вариант payload (на случай, если сервер ожидает другие названия полей)
  const alternativePayload = {
    id: numericInvoiceId,
    sum: numericAmount,
    who: tgUserId
  };

  // Третий вариант - FormData (если сервер ожидает multipart/form-data)
  const formData = new FormData();
  formData.append('invoice_id', numericInvoiceId);
  formData.append('amount', numericAmount);
  formData.append('who', tgUserId);

  // Отладочная информация
  console.log("Отправляем данные:", payload);
  console.log("Альтернативный вариант:", alternativePayload);
  console.log("FormData вариант:", formData);
  console.log("Исходные данные платежа:", selectedPayment);
  console.log("Типы данных:", {
    invoice_id: typeof numericInvoiceId,
    amount: typeof numericAmount,
    invoice_id_value: numericInvoiceId,
    amount_value: numericAmount
  });

  showNotification("Отправка платежа...", "status", 1500);

  // Функция для отправки данных с возможностью повтора
  function sendPaymentData(payloadToSend, isRetry = false, useFormData = false) {
    const requestOptions = {
      method: "POST",
      headers: useFormData ? {} : { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: useFormData ? payloadToSend : JSON.stringify(payloadToSend)
    };

    fetch("https://24sdmahom.ru/update_invoice", requestOptions)
      .then(response => {
        console.log("Ответ сервера:", response.status, response.statusText);
        
        if (!response.ok) {
          // Пытаемся получить детали ошибки
          return response.text().then(errorText => {
            console.error("Детали ошибки:", errorText);
            
            // Если это первая попытка и ошибка 422, пробуем альтернативный формат
            if (!isRetry && response.status === 422) {
              console.log("Пробуем альтернативный формат данных...");
              return sendPaymentData(alternativePayload, true, false);
            }
            
            // Если вторая попытка тоже не удалась, пробуем FormData
            if (isRetry && response.status === 422) {
              console.log("Пробуем FormData формат...");
              return sendPaymentData(formData, true, true);
            }
            
            throw new Error(`Ошибка сервера: ${response.status} ${response.statusText}. ${errorText}`);
          });
        }
        return response.json();
      })
      .then(data => {
        console.log("Успешный ответ:", data);
        showNotification(`Платёж "${paymentName}" на сумму ${amountToSend} успешно проведён.`, "info", 3000);

        if (isEditing) {
          const idx = paymentsData.findIndex(p => p["№"] === invoiceId);
          if (idx !== -1) paymentsData[idx]["Сумма"] = amountToSend;
        }

        paymentsData = paymentsData.filter(p => p["№"] !== invoiceId);

        filterPayments();
      })
      .catch(error => {
        console.error("Полная ошибка:", error);
        showNotification(`Ошибка при отправке платежа: ${error.message}`, "error", 5000);
      })
      .finally(() => {
        enableButtons(true);
      });
  }

  // Отправляем данные
  sendPaymentData(payload);
}


// Закрыть диалог
function closeDialog() {
  dialog.style.display = "none";
  dialogOverlay.style.display = "none";
  selectedPayment = null;
  isEditing = false;

  buttons[1].style.display = "inline-block"; // показать "Изменить", если скрыта

  if (editInput) {
    editInput.remove();
    editInput = null;
  }
}

// Уведомления с затемнением
function showNotification(message, type = "info", duration = 2000) {
  let overlay = document.getElementById("notification-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "notification-overlay";
    document.body.appendChild(overlay);
  }
  overlay.style.display = "block";

  let notif = document.getElementById("notification");
  if (!notif) {
    notif = document.createElement("div");
    notif.id = "notification";
    document.body.appendChild(notif);
  }
  notif.className = "show" + (type === "error" ? " error" : "");
  notif.textContent = message;

  notif.style.opacity = "1";
  notif.style.pointerEvents = "auto";

  let showTime = duration;
  if (type === "error") showTime = 4500;
  if (type === "status") showTime = 1000;

  setTimeout(() => {
    notif.style.opacity = "0";
    notif.style.pointerEvents = "none";
    overlay.style.display = "none";
  }, showTime);
}

// Назначаем обработчики кнопок (без inline onclick)
buttons[0].addEventListener("click", confirmPayment); // Да
buttons[1].addEventListener("click", startEdit);      // Изменить
buttons[2].addEventListener("click", closeDialog);    // Нет

// Клик по overlay закрывает диалог
dialogOverlay.addEventListener("click", closeDialog);

// События для поиска
searchInput.addEventListener("input", filterPayments);
clearSearchBtn.addEventListener("click", clearSearch);

// Первая загрузка
fetchPayments();

// --- Логика для вкладки 'Счета' ---
const invoiceTab = document.getElementById('invoiceTab');
const invoiceContent = document.getElementById('invoiceContent');
const invoiceForm = document.getElementById('invoiceForm');
const clientSearchInput = document.getElementById('clientSearchInput');
const clientDropdown = document.getElementById('clientDropdown');
const paymentTypeBtns = document.querySelectorAll('.payment-type-btn');
const paymentTypeInput = document.getElementById('paymentTypeInput');
const amountInput = document.getElementById('amountInput');
const clientsLoadIndicator = document.getElementById('clientsLoadIndicator');

let clientsList = [];
let clientsLoaded = false;

function showModalLoading(text = 'Загрузка...') {
  let modal = document.getElementById('modal-loading');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modal-loading';
    modal.style.position = 'fixed';
    modal.style.top = 0;
    modal.style.left = 0;
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(10,10,20,0.88)';
    modal.style.zIndex = 3000;
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.innerHTML = `<div style="background:#181a20;color:#fff;padding:32px 24px;border-radius:16px;font-size:18px;box-shadow:0 8px 32px rgba(0,0,0,0.45);text-align:center;">${text}</div>`;
    document.body.appendChild(modal);
  } else {
    modal.style.display = 'flex';
    modal.firstChild.textContent = text;
  }
}
function hideModalLoading() {
  const modal = document.getElementById('modal-loading');
  if (modal) modal.style.display = 'none';
}

// Индикатор загрузки клиентов
function setClientsIndicator(state) {
  clientsLoadIndicator.classList.remove('loading', 'loaded');
  if (state === 'loading') {
    clientsLoadIndicator.classList.add('loading');
    clientsLoadIndicator.title = 'Загрузка клиентов...';
  } else if (state === 'loaded') {
    clientsLoadIndicator.classList.add('loaded');
    clientsLoadIndicator.title = 'Клиенты загружены';
  } else {
    clientsLoadIndicator.title = 'Клиенты не загружены';
  }
}
setClientsIndicator();

// Получение клиентов при переходе на вкладку 'Счета' (только один раз)
document.getElementById('invoiceTab').addEventListener('click', () => {
  if (!clientsLoaded) {
    showModalLoading('Загрузка клиентов...');
    setClientsIndicator('loading');
    fetch('/clients')
      .then(res => res.json())
      .then(data => {
        clientsList = Array.isArray(data) ? data : [];
        clientsLoaded = true;
        setClientsIndicator('loaded');
        hideModalLoading();
      })
      .catch(err => {
        setClientsIndicator();
        hideModalLoading();
        showNotification('Ошибка загрузки клиентов', 'error', 4000);
      });
  }
});

// Выпадающий список клиентов по клику (focus) — всегда показывать
clientSearchInput.addEventListener('focus', function() {
  clientDropdown.innerHTML = '';
  if (!clientsList.length) return;
  clientsList.slice(0, 8).forEach(client => {
    const div = document.createElement('div');
    div.className = 'autocomplete-item';
    div.textContent = client.name;
    div.onclick = () => {
      clientSearchInput.value = client.name;
      clientDropdown.innerHTML = '';
      clientSearchInput.dataset.clientId = client.id;
    };
    clientDropdown.appendChild(div);
  });
});

// Автозаполнение клиентов по вводу
clientSearchInput.addEventListener('input', function() {
  const query = this.value.trim().toLowerCase();
  clientDropdown.innerHTML = '';
  if (!clientsList.length) return;
  let matches = clientsList;
  if (query) {
    matches = clientsList.filter(c => c.name.toLowerCase().includes(query));
  }
  matches.slice(0, 8).forEach(client => {
    const div = document.createElement('div');
    div.className = 'autocomplete-item';
    div.textContent = client.name;
    div.onclick = () => {
      clientSearchInput.value = client.name;
      clientDropdown.innerHTML = '';
      clientSearchInput.dataset.clientId = client.id;
    };
    clientDropdown.appendChild(div);
  });
});

document.addEventListener('click', (e) => {
  if (!clientDropdown.contains(e.target) && e.target !== clientSearchInput) {
    clientDropdown.innerHTML = '';
  }
});

// Кнопки выбора типа: по умолчанию все серые, при активации — нужный цвет и белый текст
paymentTypeBtns.forEach(btn => {
  btn.classList.remove('active', 'blue', 'green', 'yellow');
  btn.addEventListener('click', function() {
    paymentTypeBtns.forEach(b => b.classList.remove('active', 'blue', 'green', 'yellow'));
    this.classList.add('active');
    if (this.dataset.type === 'Счет') this.classList.add('blue');
    if (this.dataset.type === 'Наличные') this.classList.add('green');
    if (this.dataset.type === 'Пополнить') this.classList.add('yellow');
    paymentTypeInput.value = this.dataset.type;
  });
});
// По умолчанию активируем первую кнопку (Счет)
if (paymentTypeBtns.length) {
  paymentTypeBtns.forEach(b => b.classList.remove('active', 'blue', 'green', 'yellow'));
  paymentTypeBtns[0].classList.add('active', 'blue');
  paymentTypeInput.value = paymentTypeBtns[0].dataset.type;
}

// Отправка формы счета
invoiceForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const clientName = clientSearchInput.value.trim();
  const clientObj = clientsList.find(c => c.name === clientName);
  const clientId = clientObj ? clientObj.id : null;
  const sum = parseFloat(amountInput.value);
  const type = paymentTypeInput.value;
  if (!clientId) {
    showNotification('Выберите клиента из списка!', 'error', 4000);
    return;
  }
  if (!sum || sum <= 0) {
    showNotification('Введите корректную сумму!', 'error', 4000);
    return;
  }
  if (!type) {
    showNotification('Выберите тип!', 'error', 4000);
    return;
  }
  if (!tgUserId) {
    showNotification('Пользователь не определён!', 'error', 4000);
    return;
  }
  const payload = {
    id: clientId,
    sum: sum,
    type: type,
    who: tgUserId
  };
  showModalLoading('Создание счета...');
  fetch('/invoices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .then(data => {
      hideModalLoading();
      if (data && data.message) {
        showNotification('Счет успешно создан!', 'info', 3000);
        invoiceForm.reset();
        clientSearchInput.dataset.clientId = '';
        paymentTypeBtns.forEach(b => b.classList.remove('active', 'blue', 'green', 'yellow'));
        paymentTypeBtns[0].classList.add('active', 'blue');
        paymentTypeInput.value = paymentTypeBtns[0].dataset.type;
      } else {
        showNotification('Ошибка создания счета', 'error', 4000);
      }
    })
    .catch(err => {
      hideModalLoading();
      showNotification('Ошибка при создании счета', 'error', 4000);
    });
});