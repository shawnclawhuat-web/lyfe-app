import React from 'react';
import { Linking } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import ResourceItem from '@/components/roadmap/ResourceItem';
import type { RoadmapResource, ResourceType } from '@/types/roadmap';
import { RESOURCE_TYPE_CONFIG } from '@/types/roadmap';
import { Colors } from '@/constants/Colors';

const colors = Colors.light;

const makeResource = (overrides: Partial<RoadmapResource> = {}): RoadmapResource => ({
    id: 'res-1',
    module_id: 'mod-1',
    title: 'Study Guide',
    description: 'A helpful study guide for the module.',
    resource_type: 'link',
    content_url: 'https://example.com/guide',
    content_text: null,
    display_order: 1,
    is_active: true,
    created_at: '2026-01-01',
    ...overrides,
});

describe('ResourceItem', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as any);
    });

    // ── Rendering ──────────────────────────────────────────────────

    it('renders the resource title', () => {
        const { getByText } = render(<ResourceItem resource={makeResource()} colors={colors} />);
        expect(getByText('Study Guide')).toBeTruthy();
    });

    it('renders the resource description when present', () => {
        const { getByText } = render(<ResourceItem resource={makeResource()} colors={colors} />);
        expect(getByText('A helpful study guide for the module.')).toBeTruthy();
    });

    it('does not render description when absent', () => {
        const { queryByText } = render(<ResourceItem resource={makeResource({ description: null })} colors={colors} />);
        expect(queryByText('A helpful study guide for the module.')).toBeNull();
    });

    // ── Resource type labels ───────────────────────────────────────

    it('renders "Link" type label for link resources', () => {
        const { getByText } = render(
            <ResourceItem resource={makeResource({ resource_type: 'link' })} colors={colors} />,
        );
        expect(getByText(RESOURCE_TYPE_CONFIG.link.label)).toBeTruthy();
    });

    it('renders "File" type label for file resources', () => {
        const { getByText } = render(
            <ResourceItem resource={makeResource({ resource_type: 'file' })} colors={colors} />,
        );
        expect(getByText(RESOURCE_TYPE_CONFIG.file.label)).toBeTruthy();
    });

    it('renders "Video" type label for video resources', () => {
        const { getByText } = render(
            <ResourceItem resource={makeResource({ resource_type: 'video' })} colors={colors} />,
        );
        expect(getByText(RESOURCE_TYPE_CONFIG.video.label)).toBeTruthy();
    });

    it('renders "Article" type label for text resources', () => {
        const { getByText } = render(
            <ResourceItem resource={makeResource({ resource_type: 'text' })} colors={colors} />,
        );
        expect(getByText(RESOURCE_TYPE_CONFIG.text.label)).toBeTruthy();
    });

    // ── Tap behavior ───────────────────────────────────────────────

    it('opens URL when a link resource is tapped', () => {
        const { getByText } = render(
            <ResourceItem
                resource={makeResource({ resource_type: 'link', content_url: 'https://example.com' })}
                colors={colors}
            />,
        );
        fireEvent.press(getByText('Study Guide'));
        expect(Linking.openURL).toHaveBeenCalledWith('https://example.com');
    });

    it('opens URL when a file resource is tapped', () => {
        const { getByText } = render(
            <ResourceItem
                resource={makeResource({ resource_type: 'file', content_url: 'https://example.com/doc.pdf' })}
                colors={colors}
            />,
        );
        fireEvent.press(getByText('Study Guide'));
        expect(Linking.openURL).toHaveBeenCalledWith('https://example.com/doc.pdf');
    });

    it('opens URL when a video resource is tapped', () => {
        const { getByText } = render(
            <ResourceItem
                resource={makeResource({ resource_type: 'video', content_url: 'https://youtube.com/watch?v=abc' })}
                colors={colors}
            />,
        );
        fireEvent.press(getByText('Study Guide'));
        expect(Linking.openURL).toHaveBeenCalledWith('https://youtube.com/watch?v=abc');
    });

    it('does not open URL for text resources', () => {
        const { getByText } = render(
            <ResourceItem
                resource={makeResource({ resource_type: 'text', content_url: 'https://example.com' })}
                colors={colors}
            />,
        );
        fireEvent.press(getByText('Study Guide'));
        expect(Linking.openURL).not.toHaveBeenCalled();
    });

    it('does not open URL when content_url is null', () => {
        const { getByText } = render(
            <ResourceItem resource={makeResource({ resource_type: 'link', content_url: null })} colors={colors} />,
        );
        fireEvent.press(getByText('Study Guide'));
        expect(Linking.openURL).not.toHaveBeenCalled();
    });

    // ── Chevron visibility ─────────────────────────────────────────

    it('renders chevron for linkable resources', () => {
        const { toJSON } = render(<ResourceItem resource={makeResource({ resource_type: 'link' })} colors={colors} />);
        const json = JSON.stringify(toJSON());
        // chevron-forward icon should be present for linkable resources
        expect(json).toContain('chevron-forward');
    });

    it('does not render chevron for text resources', () => {
        const { toJSON } = render(<ResourceItem resource={makeResource({ resource_type: 'text' })} colors={colors} />);
        const json = JSON.stringify(toJSON());
        expect(json).not.toContain('chevron-forward');
    });

    it('does not render chevron when content_url is null (link type)', () => {
        const { toJSON } = render(
            <ResourceItem resource={makeResource({ resource_type: 'link', content_url: null })} colors={colors} />,
        );
        const json = JSON.stringify(toJSON());
        expect(json).not.toContain('chevron-forward');
    });

    // ── Accessibility hint ──────────────────────────────────────────

    it('has accessibilityHint "Opens external link" for linkable resources', () => {
        const { toJSON } = render(<ResourceItem resource={makeResource({ resource_type: 'link' })} colors={colors} />);
        const json = JSON.stringify(toJSON());
        expect(json).toContain('Opens external link');
    });

    it('has accessibilityHint for file resources with a URL', () => {
        const { toJSON } = render(
            <ResourceItem
                resource={makeResource({ resource_type: 'file', content_url: 'https://example.com/doc.pdf' })}
                colors={colors}
            />,
        );
        const json = JSON.stringify(toJSON());
        expect(json).toContain('Opens external link');
    });

    it('has accessibilityHint for video resources with a URL', () => {
        const { toJSON } = render(
            <ResourceItem
                resource={makeResource({ resource_type: 'video', content_url: 'https://youtube.com/watch?v=abc' })}
                colors={colors}
            />,
        );
        const json = JSON.stringify(toJSON());
        expect(json).toContain('Opens external link');
    });

    it('does NOT have accessibilityHint "Opens external link" for non-linkable text resources', () => {
        const { toJSON } = render(
            <ResourceItem
                resource={makeResource({ resource_type: 'text', content_url: 'https://example.com' })}
                colors={colors}
            />,
        );
        const json = JSON.stringify(toJSON());
        expect(json).not.toContain('Opens external link');
    });

    it('does NOT have accessibilityHint when content_url is null', () => {
        const { toJSON } = render(
            <ResourceItem resource={makeResource({ resource_type: 'link', content_url: null })} colors={colors} />,
        );
        const json = JSON.stringify(toJSON());
        expect(json).not.toContain('Opens external link');
    });
});
