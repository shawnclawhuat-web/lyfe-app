/**
 * Guardrail test: verifies platform constants return EXACT existing iOS values.
 *
 * Jest runs with jest-expo/ios preset → Platform.OS === 'ios'.
 * If any value here drifts from the original hardcoded iOS value,
 * this test will fail — catching accidental iOS regressions.
 */
import { StyleSheet } from 'react-native';

import {
    HAIRLINE,
    KAV_BEHAVIOR,
    MODAL_ANIM_DIALOG,
    MODAL_ANIM_SHEET,
    MODAL_STATUS_BAR_TRANSLUCENT,
    TAB_BAR_HEIGHT,
    TAB_BAR_PADDING_BOTTOM,
    TAB_BAR_PADDING_TOP,
    displayWeight,
    letterSpacing,
    shadow,
} from '@/constants/platform';

describe('platform constants (iOS guardrail)', () => {
    // ── Tab bar ─────────────────────────────────────────────
    test('TAB_BAR_HEIGHT matches existing iOS value', () => {
        expect(TAB_BAR_HEIGHT).toBe(72);
    });

    test('TAB_BAR_PADDING_BOTTOM matches existing iOS value', () => {
        expect(TAB_BAR_PADDING_BOTTOM).toBe(20);
    });

    test('TAB_BAR_PADDING_TOP matches existing iOS value', () => {
        expect(TAB_BAR_PADDING_TOP).toBe(6);
    });

    // ── Typography ──────────────────────────────────────────
    test('letterSpacing passes through negative values on iOS', () => {
        expect(letterSpacing(-0.3)).toBe(-0.3);
        expect(letterSpacing(-1)).toBe(-1);
        expect(letterSpacing(-2)).toBe(-2);
    });

    test('letterSpacing passes through positive values on iOS', () => {
        expect(letterSpacing(0.2)).toBe(0.2);
        expect(letterSpacing(0.5)).toBe(0.5);
    });

    test('letterSpacing passes through zero on iOS', () => {
        expect(letterSpacing(0)).toBe(0);
    });

    test('displayWeight returns original weight on iOS', () => {
        expect(displayWeight('800')).toBe('800');
        expect(displayWeight('700')).toBe('700');
    });

    // ── KeyboardAvoidingView ────────────────────────────────
    test('KAV_BEHAVIOR is padding on iOS', () => {
        expect(KAV_BEHAVIOR).toBe('padding');
    });

    // ── Shadows ─────────────────────────────────────────────
    test('shadow returns iOS shadow* properties (not elevation)', () => {
        const sm = shadow('sm');
        expect(sm).toHaveProperty('shadowColor', '#000');
        expect(sm).toHaveProperty('shadowOffset');
        expect(sm).toHaveProperty('shadowOpacity');
        expect(sm).toHaveProperty('shadowRadius');
        expect(sm).not.toHaveProperty('elevation');
    });

    test('shadow(md) matches existing card shadow values', () => {
        const md = shadow('md');
        expect(md).toEqual({
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.04,
            shadowRadius: 12,
        });
    });

    // ── Modals ──────────────────────────────────────────────
    test('MODAL_ANIM_SHEET is slide on iOS', () => {
        expect(MODAL_ANIM_SHEET).toBe('slide');
    });

    test('MODAL_ANIM_DIALOG is fade on iOS', () => {
        expect(MODAL_ANIM_DIALOG).toBe('fade');
    });

    test('MODAL_STATUS_BAR_TRANSLUCENT is false on iOS', () => {
        expect(MODAL_STATUS_BAR_TRANSLUCENT).toBe(false);
    });

    // ── Borders ─────────────────────────────────────────────
    test('HAIRLINE matches StyleSheet.hairlineWidth on iOS', () => {
        expect(HAIRLINE).toBe(StyleSheet.hairlineWidth);
    });
});
