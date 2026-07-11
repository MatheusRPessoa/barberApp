import { api } from './api';

export interface Coupon {
    id: string;
    code: string;
    discount_percent: number;
    valid_until: string;
    days_left: number;
    barber: { id: string; shop_name: string };
}

export const couponService = {
    list: () => api.get<Coupon[]>('/coupons', false),
    validate: (code: string, barberId: string) =>
        api.get<{ code: string; discount_percent: number; valid_until: string }>(
            `/coupons/validate?code=${encodeURIComponent(code.trim())}&barberId=${barberId}`
        ),
};
