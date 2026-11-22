/**
 * The lapak form's field rules, in one place. `required` drives both the red
 * asterisk on the label and the "wajib diisi" check, and the limits mirror the
 * backend (SaveMarketplaceListing in TasktifyBE/internal/tasktify/profiles.go).
 */

export const LISTING_LIMITS = {
  nameMin: 3,
  nameMax: 120,
  locationMax: 160,
  descriptionMin: 20,
  descriptionMax: 500,
  addressMin: 10,
  addressMax: 500,
  termsMax: 300,
  serviceNameMax: 120,
  serviceDescriptionMax: 500,
  serviceDurationMax: 80,
  priceMax: 2_147_483_647,
} as const;

type FieldRule = {
  label: string;
  required: boolean;
  /** Message when a required field is left empty; defaults to "<label> wajib diisi". */
  emptyMessage?: string;
};

export const listingFields = {
  name: { label: "Nama lapak", required: true },
  category: { label: "Kategori", required: true, emptyMessage: "Pilih kategori lapak" },
  location: { label: "Kota atau area layanan", required: true },
  description: { label: "Deskripsi layanan", required: true },
  image: { label: "Foto lapak", required: false },
  services: { label: "Jenis jasa", required: true, emptyMessage: "Tambahkan minimal satu jasa aktif dengan nama dan harga" },
  serviceName: { label: "Nama jasa", required: true },
  serviceDescription: { label: "Deskripsi singkat", required: false },
  servicePrice: { label: "Harga", required: true },
  serviceUnit: { label: "Satuan", required: true, emptyMessage: "Pilih satuan jasa" },
  serviceDuration: { label: "Estimasi durasi", required: false },
  whatsapp: { label: "Nomor WhatsApp", required: true },
  fullAddress: { label: "Alamat lengkap / patokan lokasi", required: true, emptyMessage: "Alamat lengkap wajib diisi" },
  serviceTypes: { label: "Tipe layanan", required: true, emptyMessage: "Pilih jenis layanan" },
  instagramUrl: { label: "Link Instagram", required: false },
  tiktokUrl: { label: "Link TikTok", required: false },
  termsWarranty: { label: "Syarat & garansi", required: false },
} satisfies Record<string, FieldRule>;

export type ListingField = keyof typeof listingFields;

export function emptyMessage(field: ListingField) {
  const rule: FieldRule = listingFields[field];
  return rule.emptyMessage ?? `${rule.label} wajib diisi`;
}

/** Label props for FieldLabelText: asterisk if required, "(opsional)" otherwise. */
export function labelProps(field: ListingField) {
  const rule: FieldRule = listingFields[field];
  return { label: rule.label, required: rule.required, optional: !rule.required };
}

/**
 * Indonesian mobile number in the saved format "628…". Accepts 08…, +628…,
 * 628… (and 8…), with spaces, dots, dashes or brackets. Returns "" when invalid.
 * Same rule as normalizeWhatsApp in the backend.
 */
export function normalizeWhatsApp(value: string) {
  let number = value.trim().replace(/[ ().-]/g, "");
  if (!/^\+?[0-9]+$/.test(number)) return "";
  number = number.replace(/^\+/, "");
  if (number.startsWith("0")) number = `62${number.slice(1)}`;
  else if (number.startsWith("8")) number = `62${number}`;
  return /^628[1-9][0-9]{7,10}$/.test(number) ? number : "";
}
