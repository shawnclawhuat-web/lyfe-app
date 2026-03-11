import { render, fireEvent } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import Touchable from '@/components/Touchable';

describe('Touchable', () => {
    test('renders children', () => {
        const { getByText } = render(
            <Touchable>
                <Text>Press me</Text>
            </Touchable>,
        );
        expect(getByText('Press me')).toBeTruthy();
    });

    test('fires onPress', () => {
        const onPress = jest.fn();
        const { getByText } = render(
            <Touchable onPress={onPress}>
                <Text>Press me</Text>
            </Touchable>,
        );
        fireEvent.press(getByText('Press me'));
        expect(onPress).toHaveBeenCalledTimes(1);
    });

    test('does not fire onPress when disabled', () => {
        const onPress = jest.fn();
        const { getByText } = render(
            <Touchable onPress={onPress} disabled>
                <Text>Press me</Text>
            </Touchable>,
        );
        fireEvent.press(getByText('Press me'));
        expect(onPress).not.toHaveBeenCalled();
    });

    test('does not set android_ripple on iOS', () => {
        // On jest-expo/ios, Platform.OS === 'ios' → android_ripple should be undefined
        const { toJSON } = render(
            <Touchable testID="touch">
                <Text>Tap</Text>
            </Touchable>,
        );
        const tree = toJSON();
        // The root node should not carry android_ripple props on iOS
        expect(tree?.props?.android_ripple).toBeUndefined();
    });
});
