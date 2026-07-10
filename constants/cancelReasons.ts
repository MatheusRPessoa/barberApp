export interface CancelReason {
    code: string;
    label: string;
}

export const CLIENT_REASONS: CancelReason[] = [
    { code: 'PERSONAL_ISSUE', label: 'Imprevisto pessoal' },
    { code: 'FOUND_ANOTHER_TIME', label: 'Encontrei outro horário' },
    { code: 'WILL_RESCHEDULE', label: 'Vou remarcar' },
    { code: 'SHOP_PROBLEM', label: 'Problema com a barbearia' },
    { code: 'OTHER', label: 'Outro' },
];

export const BARBER_REAONS: CancelReason[] = [
    { code: 'UNAVAILABLE', label: 'Indisponibilidade' },
    { code: 'CLIENT_NO_SHOW', label: 'Cliente não confirmou' },
    { code: 'DUPLICATE_SLOT', label: 'Horário duplicado' },
    { code: 'EMERGENCY', label: 'Emergência' },
    { code: 'OTHER', label: 'Outro' },
];

export const CANCEL_REASON_LABELS: Record<string, string> = Object.fromEntries(
    [...CLIENT_REASONS, ...BARBER_REAONS].map((r) => [r.code, r.label])
)