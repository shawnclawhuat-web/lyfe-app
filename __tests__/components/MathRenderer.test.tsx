import React from 'react';
import { render } from '@testing-library/react-native';
import MathRenderer from '@/components/MathRenderer';

jest.mock('@/contexts/ThemeContext', () => ({
    useTheme: jest.fn(() => ({
        colors: require('@/constants/Colors').Colors.light,
        isDark: false,
        mode: 'light' as const,
        resolved: 'light' as const,
        setMode: jest.fn(),
    })),
}));

jest.mock('react-native-webview', () => {
    const { View } = require('react-native');
    return {
        __esModule: true,
        default: (props: any) => <View testID="mock-webview" {...props} />,
    };
});

describe('MathRenderer', () => {
    it('renders plain text when no LaTeX delimiters present', () => {
        const { getByText } = render(<MathRenderer content="Hello world" />);
        expect(getByText('Hello world')).toBeTruthy();
    });

    it('renders plain text with default fontSize', () => {
        const { getByText } = render(<MathRenderer content="Plain text here" />);
        const text = getByText('Plain text here');
        expect(text.props.style).toEqual(expect.arrayContaining([expect.objectContaining({ fontSize: 15 })]));
    });

    it('renders plain text with custom fontSize', () => {
        const { getByText } = render(<MathRenderer content="Custom size" fontSize={18} />);
        const text = getByText('Custom size');
        expect(text.props.style).toEqual(expect.arrayContaining([expect.objectContaining({ fontSize: 18 })]));
    });

    it('uses WebView for content with LaTeX dollar signs', () => {
        const { getByTestId } = render(<MathRenderer content="The formula is $x^2 + y^2$" />);
        expect(getByTestId('mock-webview')).toBeTruthy();
    });

    it('uses WebView for content with LaTeX commands', () => {
        const { getByTestId } = render(<MathRenderer content="Calculate \\frac{1}{2}" />);
        expect(getByTestId('mock-webview')).toBeTruthy();
    });

    it('uses WebView for content with \\times', () => {
        const { getByTestId } = render(<MathRenderer content="3 \\times 4 = 12" />);
        expect(getByTestId('mock-webview')).toBeTruthy();
    });

    it('renders plain text for content without math commands', () => {
        const { queryByTestId, getByText } = render(<MathRenderer content="No math here, just regular text." />);
        expect(queryByTestId('mock-webview')).toBeNull();
        expect(getByText('No math here, just regular text.')).toBeTruthy();
    });

    it('accepts custom style prop for plain text', () => {
        const customStyle = { marginTop: 10 };
        const { getByText } = render(<MathRenderer content="Styled text" style={customStyle} />);
        const text = getByText('Styled text');
        expect(text.props.style).toEqual(expect.arrayContaining([expect.objectContaining({ marginTop: 10 })]));
    });
});
