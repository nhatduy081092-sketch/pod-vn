import { normalizePhone, referrerHostOf, sourceGroups } from "@pod/shared";

/**
 * Email / SĐT dùng để đặt đơn thử (chủ shop, nhân viên, người kiểm thử), cách nhau bằng dấu phẩy.
 * Để trống = không đơn nào bị coi là đơn thử theo liên hệ (vẫn còn cờ ?yala_test=1 từ trình duyệt).
 */
function testContacts() {
  return new Set(
    (process.env.TEST_ORDER_CONTACTS ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
      .map((s) => (s.includes("@") ? s : normalizePhone(s)))
      .filter(Boolean),
  );
}

/** Cột nguồn khách lưu cùng đơn – máy chủ tự phân loại, không tin nhãn nhóm do trình duyệt gửi */
export function orderSource(utm: Record<string, string> | undefined, contact: { phone: string; email?: string }) {
  const { first, last } = sourceGroups(utm);
  const tests = testContacts();
  const isTest = utm?.test === "1" || tests.has(normalizePhone(contact.phone)) || (!!contact.email && tests.has(contact.email.trim().toLowerCase()));
  return { sourceGroup: last, firstSourceGroup: first, referrerHost: referrerHostOf(utm), isTest };
}
