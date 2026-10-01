/**
 * YALA – nhận yêu cầu báo giá doanh nghiệp từ website:
 *   1. Ghi 1 dòng vào sheet "Báo giá" của Google Sheet chứa script này
 *   2. Gửi email báo cho sales (từ tài khoản Google chạy script)
 *
 * Cài đặt (5 phút) – xem README.md cùng thư mục.
 * Script properties (Project Settings → Script properties):
 *   SECRET        chuỗi bí mật, trùng QUOTE_WEBHOOK_SECRET trên máy chủ
 *   NOTIFY_EMAILS email nhận thông báo, nhiều email cách nhau dấu phẩy
 */
var SHEET_NAME = "Báo giá";
var HEADERS = ["Thời gian", "Mã", "Loại", "Trạng thái", "Họ tên", "SĐT", "Email", "Công ty", "Dịp", "Ngân sách/phần", "Cần hàng", "Sản phẩm", "Tổng SL", "Ghi chú", "Trang", "Nguồn", "Mở trong CMS"];

function doPost(e) {
  try {
    var props = PropertiesService.getScriptProperties();
    var data = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    if (!props.getProperty("SECRET") || data.secret !== props.getProperty("SECRET")) return json({ ok: false, error: "secret" });
    delete data.secret;

    var lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      appendRow(data);
    } finally {
      lock.releaseLock();
    }
    sendMail(data, props.getProperty("NOTIFY_EMAILS") || "");
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

/** Mở URL web app trên trình duyệt để kiểm tra đã deploy */
function doGet() {
  return json({ ok: true, service: "yala-quotes" });
}

function appendRow(d) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold").setBackground("#1d1d1f").setFontColor("#ffffff");
    sh.setFrozenRows(1);
  }
  var items = (d.items || []).map(function (i) {
    return i.name + (i.quantity ? " × " + i.quantity : "") + (i.note ? " (" + i.note + ")" : "");
  });
  var total = (d.items || []).reduce(function (s, i) { return s + (Number(i.quantity) || 0); }, 0);
  sh.appendRow([
    d.createdAt ? new Date(d.createdAt) : new Date(),
    d.code || "",
    d.kind === "lead" ? "Liên hệ" : "Báo giá",
    "Mới",
    d.name || "",
    "'" + (d.phone || ""), // giữ số 0 đầu
    d.email || "",
    d.company || "",
    d.occasion || "",
    d.budget || "",
    d.deadline || "",
    items.join("\n"),
    total || "",
    d.note || "",
    d.pageUrl || "",
    d.source || "",
    d.adminUrl || "",
  ]);
}

function sendMail(d, to) {
  if (!to) return;
  var esc = function (s) { return String(s || "").replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var total = (d.items || []).reduce(function (s, i) { return s + (Number(i.quantity) || 0); }, 0);
  var subject = "[YALA] " + (d.kind === "lead" ? "Liên hệ doanh nghiệp " : "Yêu cầu báo giá ") + d.code + " – " + (d.company || d.name) + (total ? " – " + total + " sp" : "");
  var rows = [
    ["Khách", esc(d.name) + " · " + esc(d.phone) + (d.company ? " · " + esc(d.company) : "")],
    ["Email", esc(d.email)],
    ["Dịp", esc(d.occasion)],
    ["Ngân sách/phần", esc(d.budget)],
    ["Cần hàng", esc(d.deadline)],
    ["Nguồn", esc(d.source)],
  ].filter(function (r) { return r[1]; });
  var html =
    '<div style="font-family:Arial,sans-serif;font-size:14px;color:#1d1d1f">' +
    '<h2 style="margin:0 0 12px">' + esc(subject.replace("[YALA] ", "")) + "</h2>" +
    '<table cellpadding="6" style="border-collapse:collapse">' +
    rows.map(function (r) { return '<tr><td style="color:#6b6660">' + r[0] + "</td><td><b>" + r[1] + "</b></td></tr>"; }).join("") +
    "</table>" +
    ((d.items || []).length
      ? '<h3 style="margin:16px 0 6px">Sản phẩm</h3><ul>' +
        d.items.map(function (i) { return "<li>" + esc(i.name) + (i.quantity ? " × <b>" + i.quantity + "</b>" : "") + (i.note ? " – " + esc(i.note) : "") + "</li>"; }).join("") +
        "</ul>"
      : "") +
    (d.note ? '<h3 style="margin:16px 0 6px">Ghi chú</h3><p style="white-space:pre-wrap">' + esc(d.note) + "</p>" : "") +
    '<p style="margin-top:16px">' +
    '<a href="https://zalo.me/' + esc(String(d.phone || "").replace(/\D/g, "")) + '" style="background:#E4570B;color:#fff;padding:8px 14px;border-radius:20px;text-decoration:none">Nhắn Zalo khách</a> ' +
    (d.adminUrl ? '<a href="' + esc(d.adminUrl) + '" style="margin-left:8px;color:#1d1d1f">Mở trong CMS</a>' : "") +
    "</p></div>";
  var opts = { htmlBody: html, name: "YALA – Báo giá" };
  if (d.email) opts.replyTo = d.email;
  MailApp.sendEmail(to, subject, "Mở email ở chế độ HTML để xem chi tiết.", opts);
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
