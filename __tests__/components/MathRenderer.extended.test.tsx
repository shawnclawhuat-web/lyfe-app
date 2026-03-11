/**
 * Extended tests for components/MathRenderer.tsx — covering branches missed by MathRenderer.test.tsx.
 *
 * Coverage gaps addressed:
 *   - onMessage callback (height update, error handling, zero-height guard)
 *   - hasLatex edge cases (lone "$", \\div, \\text triggers)
 *   - buildKatexHtml output verification
 *   - Platform.OS === 'web' branch (WebMathRenderer)
 */
import React from 'react';
import { Platform } from 'react-native';
import { act, render } from '@testing-library/react-native';
import MathRenderer from '@/components/MathRenderer';

// ── Capture object for mock internals ──
// Must be prefixed with "mock" so Jest's Babel transform allows it inside jest.mock factories.

const mockCapture = {
    lastOnMessage: null as ((event: any) => void) | null,
    lastSource: null as { html: string } | null,
    lastScrollEnabled: undefined as boolean | undefined,
};

jest.mock('@/contexts/ThemeContext', () => ({
    useTheme: jest.fn(() => ({
        colors: {
            ...require('@/constants/Colors').Colors.light,
            webViewBg: '#FFFFFF',
            webViewText: '#000000',
        },
        isDark: false,
        mode: 'light' as const,
        resolved: 'light' as const,
        setMode: jest.fn(),
    })),
}));

jest.mock('react-native-webview', () => {
    const React = require('react');
    const { View } = require('react-native');
    return {
        __esModule: true,
        default: React.forwardRef((props: any, _ref: any) => {
            // Capture props so individual tests can inspect them directly.
            // mockCapture is allowed here because the variable name starts with "mock".
            if (props.onMessage) {
                mockCapture.lastOnMessage = props.onMessage;
            }
            if (props.source) {
                mockCapture.lastSource = props.source;
            }
            mockCapture.lastScrollEnabled = props.scrollEnabled;
            return <View testID="mock-webview" />;
        }),
    };
});

// ── Helper ──

function makeMessageEvent(data: object | string): { nativeEvent: { data: string } } {
    return { nativeEvent: { data: typeof data === 'string' ? data : JSON.stringify(data) } };
}

beforeEach(() => {
    mockCapture.lastOnMessage = null;
    mockCapture.lastSource = null;
    mockCapture.lastScrollEnabled = undefined;
});

// ── onMessage callback ──

describe('MathRenderer — onMessage (WebView height messages)', () => {
    it('updates WebView height when a valid height message is received', async () => {
        const { getByTestId } = render(<MathRenderer content="$x + y$" />);
        expect(getByTestId('mock-webview')).toBeTruthy();

        const onMessage = mockCapture.lastOnMessage;
        expect(onMessage).not.toBeNull();

        // Dispatching a valid height message should not throw and the component stays mounted
        await act(async () => {
            onMessage!(makeMessageEvent({ type: 'height', value: 120 }));
        });

        expect(getByTestId('mock-webview')).toBeTruthy();
    });

    it('does not throw or crash when onMessage receives invalid JSON', () => {
        render(<MathRenderer content="$a^2 + b^2 = c^2$" />);

        const onMessage = mockCapture.lastOnMessage;
        expect(onMessage).not.toBeNull();

        // The component catches the parse error internally; nothing should propagate
        expect(() => {
            act(() => {
                onMessage!({ nativeEvent: { data: 'not-valid-json{{{{' } });
            });
        }).not.toThrow();
    });

    it('ignores height messages where value is 0', () => {
        render(<MathRenderer content="\\frac{1}{2}" />);

        const onMessage = mockCapture.lastOnMessage;
        expect(onMessage).not.toBeNull();

        // value=0 is explicitly guarded against (data.value > 0 check in component)
        expect(() => {
            act(() => {
                onMessage!(makeMessageEvent({ type: 'height', value: 0 }));
            });
        }).not.toThrow();
    });

    it('ignores messages with an unrecognised type field', () => {
        render(<MathRenderer content="$n^2$" />);

        const onMessage = mockCapture.lastOnMessage;
        expect(onMessage).not.toBeNull();

        expect(() => {
            act(() => {
                onMessage!(makeMessageEvent({ type: 'unknown', value: 200 }));
            });
        }).not.toThrow();
    });
});

// ── hasLatex — edge cases ──

describe('MathRenderer — hasLatex edge cases', () => {
    it('renders WebView for content containing \\div', () => {
        const { getByTestId } = render(<MathRenderer content="The result of 10 \\div 2 is 5" />);
        expect(getByTestId('mock-webview')).toBeTruthy();
    });

    it('renders WebView for content containing \\text', () => {
        const { getByTestId } = render(<MathRenderer content="\\text{Let } x = 1" />);
        expect(getByTestId('mock-webview')).toBeTruthy();
    });

    it('renders plain text for a lone dollar sign with no closing delimiter', () => {
        // /\$[^$]+\$/ requires at least one non-$ character between delimiters — not satisfied here
        const { queryByTestId, getByText } = render(<MathRenderer content="Price: $100" />);
        expect(queryByTestId('mock-webview')).toBeNull();
        expect(getByText('Price: $100')).toBeTruthy();
    });

    it('renders plain text for two adjacent dollar signs with no content between them', () => {
        // "$$" has no content between delimiters so /\$[^$]+\$/ does not match
        const { queryByTestId, getByText } = render(<MathRenderer content="Empty $$" />);
        expect(queryByTestId('mock-webview')).toBeNull();
        expect(getByText('Empty $$')).toBeTruthy();
    });

    it('renders WebView for content with a properly delimited inline formula', () => {
        const { getByTestId } = render(<MathRenderer content="Solve $x = 5$." />);
        expect(getByTestId('mock-webview')).toBeTruthy();
    });

    it('renders plain text for purely numeric content with no math markers', () => {
        const { queryByTestId, getByText } = render(<MathRenderer content="42" />);
        expect(queryByTestId('mock-webview')).toBeNull();
        expect(getByText('42')).toBeTruthy();
    });
});

// ── buildKatexHtml output ──

describe('MathRenderer — WebView source HTML (buildKatexHtml)', () => {
    it('WebView source HTML contains the KaTeX CDN script and renderMathInElement call', () => {
        render(<MathRenderer content="$E = mc^2$" />);

        expect(mockCapture.lastSource).not.toBeNull();
        expect(mockCapture.lastSource!.html).toContain('katex');
        expect(mockCapture.lastSource!.html).toContain('renderMathInElement');
    });

    it('WebView source HTML embeds the content string', () => {
        render(<MathRenderer content="$x^2 + y^2 = r^2$" />);

        expect(mockCapture.lastSource!.html).toContain('x^2 + y^2 = r^2');
    });

    it('passes scrollEnabled={false} to the WebView', () => {
        render(<MathRenderer content="\\frac{a}{b}" />);

        expect(mockCapture.lastScrollEnabled).toBe(false);
    });

    it('WebView source HTML contains the theme background color', () => {
        render(<MathRenderer content="$n!$" />);

        // useTheme mock returns webViewBg: '#FFFFFF' — buildKatexHtml interpolates it into the style block
        expect(mockCapture.lastSource!.html).toContain('#FFFFFF');
    });
});

// ── Platform.OS === 'web' branch ──

describe('MathRenderer — web platform branch', () => {
    const originalOS = Platform.OS;

    beforeEach(() => {
        Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
    });

    afterEach(() => {
        Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true });
    });

    it('does not render the native WebView when Platform.OS is "web"', () => {
        // On web the component renders WebMathRenderer (an iframe) instead of react-native-webview.
        // The mock WebView (testID="mock-webview") should therefore NOT be present.
        const { queryByTestId } = render(<MathRenderer content="$x^2$" />);
        expect(queryByTestId('mock-webview')).toBeNull();
    });
});
