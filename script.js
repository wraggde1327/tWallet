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
let tgUserId = null;
let tgUserObj = null;

const tg = window.Telegram?.WebApp;

if (tg) {
  document.body.classList.add('telegram-webapp');
  tg.ready();

  const user = tg.initDataUnsafe?.user;
  if (user) {
    tgUserObj = user;
    tgUserId = user.id;
    tgUserLabel = user.username ? '@' + user.username : 'ID: ' + user.id;

    if (tgUserInfoDiv) {
      tgUserInfoDiv.textContent = tgUserLabel;
      tgUserInfoDiv.title = user.first_name + (user.last_name ? ' ' + user.last_name : '');
    }
  }
}

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
