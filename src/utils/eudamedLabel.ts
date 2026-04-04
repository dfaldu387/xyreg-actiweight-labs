import type { EudamedDevice } from '@/hooks/useEudamedRegistry';

// Build a meaningful label for an EUDAMED device using best-available fields
// CRITICAL: Always prioritize device_name over trade_names for correct medical device naming
export function getEudamedDeviceLabel(device?: Partial<EudamedDevice> | null): string {
  if (!device) return 'Unnamed Device';

  const pick = (v?: unknown) => {
    if (v === null || v === undefined) return '';
    const s = String(v).trim();
    return s;
  };

  // PRIORITY ORDER: device_name is the official medical device name, should always be used first
  const deviceName = pick(device.device_name);
  if (deviceName) {
    return deviceName;
  }

  // Fallback hierarchy - only use if device_name is truly empty
  const model = pick((device as any).model ?? device.device_model);
  const ref = pick((device as any).reference_number);
  const basic = pick((device as any).basic_udi_di_code);
  const udi = pick(device.udi_di);

  // Trade names should be last resort only
  const firstTradeName = (() => {
    const raw = pick(device.trade_names);
    if (!raw) return '';
    const first = raw.split(/[;|,]/)[0]?.trim();
    return first || '';
  })();

  const label = model || ref || basic || firstTradeName || udi;
  return label || 'Unnamed Device';
}
