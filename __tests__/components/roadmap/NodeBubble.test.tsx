import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import NodeBubble from '@/components/roadmap/NodeBubble';
import { Colors } from '@/constants/Colors';
import type { NodeState } from '@/types/roadmap';

const colors = Colors.light;

describe('NodeBubble', () => {
    const onAction = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const renderBubble = (
        overrides: {
            title?: string;
            state?: NodeState;
            nodeColor?: string;
            caretOffset?: number;
        } = {},
    ) =>
        render(
            <NodeBubble
                title={overrides.title ?? 'Intro to Insurance'}
                state={overrides.state ?? 'available'}
                nodeColor={overrides.nodeColor ?? colors.accent}
                onAction={onAction}
                colors={colors}
                caretOffset={overrides.caretOffset ?? 80}
            />,
        );

    // ── Content ───────────────────────────────────────────────────

    it('renders the module title', () => {
        const { getByText } = renderBubble({ title: 'MAS Regulations' });
        expect(getByText('MAS Regulations')).toBeTruthy();
    });

    // ── Action button labels ──────────────────────────────────────

    it('shows START for available nodes', () => {
        const { getByText } = renderBubble({ state: 'available' });
        expect(getByText('START')).toBeTruthy();
    });

    it('shows START for current nodes', () => {
        const { getByText } = renderBubble({ state: 'current' });
        expect(getByText('START')).toBeTruthy();
    });

    it('shows REVIEW for completed nodes', () => {
        const { getByText } = renderBubble({ state: 'completed' });
        expect(getByText('REVIEW')).toBeTruthy();
    });

    it('shows LOCKED for locked nodes', () => {
        const { getByText } = renderBubble({ state: 'locked' });
        expect(getByText('LOCKED')).toBeTruthy();
    });

    // ── Interaction ───────────────────────────────────────────────

    it('calls onAction when action button is pressed', () => {
        const { getByText } = renderBubble({ state: 'available' });
        fireEvent.press(getByText('START'));
        expect(onAction).toHaveBeenCalledTimes(1);
    });

    it('does not call onAction for locked button', () => {
        const { getByText } = renderBubble({ state: 'locked' });
        fireEvent.press(getByText('LOCKED'));
        expect(onAction).not.toHaveBeenCalled();
    });

    // ── Active styling (colored bg, white title, white button) ───

    it('uses nodeColor as bubble background for active states', () => {
        const { toJSON } = renderBubble({ state: 'available', nodeColor: '#FF69B4' });
        const json = JSON.stringify(toJSON());
        expect(json).toContain('#FF69B4');
    });

    it('uses white button background for active states', () => {
        const { toJSON } = renderBubble({ state: 'available' });
        const json = JSON.stringify(toJSON());
        // White button bg
        expect(json).toContain('"backgroundColor":"#FFFFFF"');
    });

    // ── Locked styling (neutral bg, border, subtitle) ────────────

    it('renders subtitle for locked state', () => {
        const { getByText } = renderBubble({ state: 'locked' });
        expect(getByText(/Complete earlier modules/)).toBeTruthy();
    });

    it('uses surfacePrimary background for locked state', () => {
        const { toJSON } = renderBubble({ state: 'locked' });
        const json = JSON.stringify(toJSON());
        expect(json).toContain(colors.surfacePrimary);
    });

    it('renders border for locked state', () => {
        const { toJSON } = renderBubble({ state: 'locked' });
        const json = JSON.stringify(toJSON());
        expect(json).toContain('"borderWidth":2');
    });
});
