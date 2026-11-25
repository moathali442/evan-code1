const searchInput = document.querySelector("#search");
const sortButton = document.querySelector("#sort");
const message = document.querySelector("#message");
const retryButton = document.querySelector("#retry");
const table = document.querySelector("#orders");
const rows = document.querySelector("#rows");

const statuses = {
  new: { label: "جديد", className: "new" },
  onWay: { label: "في الطريق", className: "on-way" },
  delivered: { label: "تم التوصيل", className: "delivered" }
};
const amountFormat = new Intl.NumberFormat("ar-YE", { style: "currency", currency: "YER", maximumFractionDigits: 0 });
const dateFormat = new Intl.DateTimeFormat("ar-YE", { dateStyle: "medium", timeZone: "UTC" });

let orders = [];
let sortByAmount = false;

function addCell(row, label, value, className) {
  const cell = row.insertCell();
  // On narrow screens each cell shows its own label.
  const mobileLabel = document.createElement("span");
  mobileLabel.className = "cell-label";
  mobileLabel.setAttribute("aria-hidden", "true");
  mobileLabel.textContent = label;

  const content = document.createElement("span");
  content.textContent = value;
  if (className) {
    content.className = className;
  }
  cell.append(mobileLabel, content);
}

function renderOrders() {
  const search = searchInput.value.trim();
  // filter creates a new array, so sorting leaves the original orders intact.
  const matchingOrders = orders.filter(order => order.customer.includes(search));

  if (sortByAmount) {
    matchingOrders.sort((first, second) => second.amount - first.amount);
  } else {
    // YYYY-MM-DD dates can be compared as text.
    matchingOrders.sort((first, second) => second.date.localeCompare(first.date));
  }

  rows.replaceChildren();
  for (const order of matchingOrders) {
    const row = rows.insertRow();
    const status = statuses[order.status];
    addCell(row, "رقم الطلب", order.id);
    addCell(row, "الزبون", order.customer);
    addCell(row, "المبلغ", amountFormat.format(order.amount));
    addCell(row, "التاريخ", dateFormat.format(new Date(order.date)));
    addCell(row, "الحالة", status.label, "status " + status.className);
  }

  table.hidden = matchingOrders.length === 0;
  message.textContent = matchingOrders.length
    ? `عدد الطلبات المعروضة: ${matchingOrders.length}`
    : "ما لقينا طلبات مطابقة للبحث.";
}

async function loadOrders() {
  searchInput.disabled = true;
  sortButton.disabled = true;
  table.hidden = true;
  retryButton.hidden = true;
  message.textContent = "جاري تحميل الطلبات…";

  try {
    const response = await fetch("./orders.json", { cache: "no-cache" });
    // fetch can resolve even when the server returns an HTTP error.
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

searchInput.addEventListener("input", renderOrders);
sortButton.addEventListener("click", () => {
  sortByAmount = !sortByAmount;
  sortButton.textContent = sortByAmount ? "الترتيب: أعلى مبلغ أولًا" : "الترتيب: الأحدث أولًا";
  renderOrders();
});
retryButton.addEventListener("click", loadOrders);
loadOrders();
