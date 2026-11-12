export function rupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function rating(value: number) {
  return value.toFixed(1);
}

export const serviceUnitLabels: Record<string, string> = {
  per_pasangan: "per pasang",
  per_item: "per item",
  per_jam: "per jam",
  per_meter: "per meter",
  per_kg: "per kg",
  per_unit: "per unit",
  sekali_datang: "sekali datang",
};
