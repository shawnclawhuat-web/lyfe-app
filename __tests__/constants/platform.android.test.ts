/**
 * Android-side validation: verifies platform constants return
 * the ADJUSTED Android values (not iOS values).
 *
 * Run with: npx jest --config jest.config.android.js
 */
import {
    HAIRLINE,
    KAV_BEHAVIOR,
    MODAL_ANIM_DIALOG,
    MODAL_ANIM_SHEET,
    MODAL_STATUS_BAR_TRANSLUCENT,
    TAB_BAR_HEIGHT,
    TAB_BAR_PADDING_BOTTOM,
    displayWeight,
    letterSpacing,
    shadow,
} from '@/constants/platform';

describe('platform constants (Android validation)', () => {
    // ── Tab bar ─────────────────────────────────────────────
    test('TAB_BAR_HEIGHT is reduced on Android', () => {
        expect(TAB_BAR_HEIGHT).toBe(60);
    });

    test('TAB_BAR_PADDING_BOTTOM is reduced on Android', () => {
        expect(TAB_BAR_PADDING_BOTTOM).toBe(8);
    });

    // ── Typography ──────────────────────────────────────────
    test('letterSpacing zeroes out negative values on Android', () => {
        expect(letterSpacing(-0.3)).toBe(0);
        expect(letterSpacing(-1)).toBe(0);
        expect(letterSpacing(-2)).toBe(0);
    });

    test('letterSpacing preserves positive values on Android', () => {
        expect(letterSpacing(0.2)).toBe(0.2);
        expect(letterSpacing(0.5)).toBe(0.5);
    });

    test('displayWeight steps 800 down to 700 on Android', () => {
        expect(displayWeight('800')).toBe('700');
        expect(displayWeight('700')).toBe('700');
    });

    // ── KeyboardAvoidingView ────────────────────────────────
    test('KAV_BEHAVIOR is height on Android', () => {
        expect(KAV_BEHAVIOR).toBe('height');
    });

    // ── Shadows ─────────────────────────────────────────────
    test('shadow returns elevation + border on Android', () => {
        const md = shadow('md');
        expect(md).toHaveProperty('elevation', 4);
        expect(md).toHaveProperty('borderWidth');
        expect(md).toHaveProperty('borderColor');
        expect(md).not.toHaveProperty('shadowColor');
        expect(md).not.toHaveProperty('shadowOffset');
    });

    // ── Modals ──────────────────────────────────────────────
    test('MODAL_ANIM_SHEET is fade on Android', () => {
        expect(MODAL_ANIM_SHEET).toBe('fade');
    });

    test('MODAL_ANIM_DIALOG is fade on Android', () => {
        expect(MODAL_ANIM_DIALOG).toBe('fade');
    });

    test('MODAL_STATUS_BAR_TRANSLUCENT is true on Android', () => {
        expect(MODAL_STATUS_BAR_TRANSLUCENT).toBe(true);
    });

    // ── Borders ─────────────────────────────────────────────
    test('HAIRLINE is 1px on Android (not hairlineWidth)', () => {
        expect(HAIRLINE).toBe(1);
    });
});
