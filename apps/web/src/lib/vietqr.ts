/** Ảnh VietQR (img.vietqr.io) – số tiền + nội dung chuyển khoản điền sẵn */
export function vietQrUrl(bank: { bankId: string; accountNo: string; accountName: string } | null | undefined, amount: number, info: string): string {
  if (!bank?.bankId || !bank.accountNo) return "";
  return `https://img.vietqr.io/image/${encodeURIComponent(bank.bankId)}-${encodeURIComponent(bank.accountNo)}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(info)}&accountName=${encodeURIComponent(bank.accountName)}`;
}
