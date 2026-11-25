const searchInput = document.querySelector("#search");
const sortButton = document.querySelector("#sort");
const message = document.querySelector("#message");
const retryButton = document.querySelector("#retry");
const ordersTable = document.querySelector("#orders");
const orderRows = document.querySelector("#rows");

const orderStatuses = {
  new: { label: "جديد", className: "new" },
  onWay: { label: "في الطريق", className: "on-way" },
  delivered: { label: "تم التوصيل", className: "delivered" }
};

const amountFormat = new Intl.NumberFormat("ar-YE", {
  style: "currency",
  currency: "YER",
  maximumFractionDigits: 0
});

const dateFormat = new Intl.DateTimeFormat("ar-YE", {
  dateStyle: "medium",
  timeZone: "UTC"
});

let orders = [];
let sortByAmount = false;

function addCell(row, label, value, className = "") {
  const cell = row.insertCell();
  // على الجوال يظهر اسم الحقل بجانب قيمته داخل البطاقة.
  const mobileLabel = document.createElement("span");
  mobileLabel.className = "cell-label";
  mobileLabel.setAttribute("aria-hidden", "true");
  mobileLabel.textContent = label;

  const content = document.createElement("span");
  content.textContent = value;
  content.className = className;
  cell.append(mobileLabel, content);
}

function addOrderRow(order) {
  const row = orderRows.insertRow();
  const status = orderStatuses[order.status];

  addCell(row, "رقم الطلب", order.id);
  addCell(row, "الزبون", order.customer);
  addCell(row, "المبلغ", amountFormat.format(order.amount));
  addCell(row, "التاريخ", dateFormat.format(new Date(order.date)));
  addCell(row, "الحالة", status.label, `status ${status.className}`);
}

function renderOrders() {
  const searchTerm = searchInput.value.trim();
  // نرتّب نتائج البحث لأنها قائمة جديدة أنشأتها filter.
  const matchingOrders = orders.filter(order => order.customer.includes(searchTerm));

  if (sortByAmount) {
    matchingOrders.sort((first, second) => second.amount - first.amount);
  } else {
    // صيغة YYYY-MM-DD تسمح بترتيب التواريخ كنصوص.
    matchingOrders.sort((first, second) => second.date.localeCompare(first.date));
  }

  orderRows.replaceChildren();
  for (const order of matchingOrders) {
    addOrderRow(order);
  }

  const hasResults = matchingOrders.length > 0;
  ordersTable.hidden = !hasResults;
  message.textContent = hasResults
    ? `عدد الطلبات المعروضة: ${matchingOrders.length}`
    : "ما لقينا طلبات مطابقة للبحث.";
}

async function loadOrders() {
  searchInput.disabled = true;
  sortButton.disabled = true;
  ordersTable.hidden = true;
  retryButton.hidden = true;
  message.textContent = "جاري تحميل الطلبات…";

  try {
    const response = await fetch("./orders.json", { cache: "no-cache" });
    // fetch تعيد استجابة حتى لو كان رمز HTTP مثل 404.
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    orders = await response.json();
    renderOrders();
    searchInput.disabled = false;
    sortButton.disabled = false;
  } catch (error) {
    console.error("Could not load orders:", error);
    message.textContent = "تعذّر تحميل الطلبات.";
    retryButton.hidden = false;
  }
}

function toggleSortOrder() {
  sortByAmount = !sortByAmount;
  sortButton.textContent = sortByAmount
    ? "الترتيب: أعلى مبلغ أولًا"
    : "الترتيب: الأحدث أولًا";

  renderOrders();
}

searchInput.addEventListener("input", renderOrders);
sortButton.addEventListener("click", toggleSortOrder);
retryButton.addEventListener("click", loadOrders);

loadOrders();
