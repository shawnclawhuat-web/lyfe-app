import React from 'react';
import { render } from '@testing-library/react-native';
import Confetti, { CONFETTI_DURATION } from '@/components/Confetti';

jest.mock('react-native-reanimated', () => {
    const { View } = require('react-native');
    return {
        __esModule: true,
        default: {
            View: (props: any) => <View {...props} />,
        },
        useSharedValue: jest.fn((v: number) => ({ value: v })),
        useAnimatedStyle: jest.fn((fn: () => any) => ({})),
        withTiming: jest.fn((_v: number, _cfg: any) => 0),
        cancelAnimation: jest.fn(),
        Easing: { linear: jest.fn() },
    };
});

describe('Confetti', () => {
    it('returns null when not visible', () => {
        const { toJSON } = render(<Confetti visible={false} confettiKey={0} />);
        expect(toJSON()).toBeNull();
    });

    it('renders particles when visible', () => {
        const { toJSON } = render(<Confetti visible={true} confettiKey={1} />);
        const tree = toJSON();
        expect(tree).not.toBeNull();
    });

    it('renders 40 particle children', () => {
        const { toJSON } = render(<Confetti visible={true} confettiKey={1} />);
        const tree = toJSON() as any;
        // The root View contains 40 ConfettiParticle Animated.Views
        expect(tree.children.length).toBe(40);
    });

    it('exports CONFETTI_DURATION constant', () => {
        expect(CONFETTI_DURATION).toBe(2600);
    });

    it('re-renders with different confettiKey', () => {
        const { rerender, toJSON } = render(<Confetti visible={true} confettiKey={1} />);
        expect(toJSON()).not.toBeNull();
        rerender(<Confetti visible={true} confettiKey={2} />);
        expect(toJSON()).not.toBeNull();
    });

    it('hides when visible transitions from true to false', () => {
        const { rerender, toJSON } = render(<Confetti visible={true} confettiKey={1} />);
        expect(toJSON()).not.toBeNull();
        rerender(<Confetti visible={false} confettiKey={1} />);
        expect(toJSON()).toBeNull();
    });
});
