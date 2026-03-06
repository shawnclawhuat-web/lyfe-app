import Avatar from '@/components/Avatar';
import ScreenHeader from '@/components/ScreenHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { createEvent, fetchAllUsers, fetchEventById, updateEvent, type SimpleUser } from '@/lib/events';
import { isMockMode } from '@/lib/mockMode';
import type { AttendeeRole, CreateEventInput, EventType, ExternalAttendee } from '@/types/event';
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS } from '@/types/event';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const MOCK_USERS: SimpleUser[] = [
    { id: 'u1', full_name: 'Alice Tan', role: 'agent' },
    { id: 'u2', full_name: 'Bob Lee', role: 'agent' },
    { id: 'u3', full_name: 'David Lim', role: 'manager' },
    { id: 'u4', full_name: 'Emily Koh', role: 'manager' },
    { id: 'u5', full_name: 'Jason Teo', role: 'candidate' },
    { id: 'u6', full_name: 'Sarah Wong', role: 'agent' },
];

const EVENT_TYPES: EventType[] = ['team_meeting', 'training', 'agency_event', 'roadshow', 'other'];
const ATTENDEE_ROLES: { key: AttendeeRole; label: string }[] = [
    { key: 'attendee', label: 'Attendee' },
    { key: 'host', label: 'Host' },
    { key: 'duty_manager', label: 'Duty Mgr' },
    { key: 'presenter', label: 'Presenter' },
];

const AVATAR_COLORS = ['#6366F1', '#0D9488', '#E11D48', '#F59E0B', '#8B5CF6'];

function getAvatarColor(name: string) {
    return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

interface SelectedAttendee {
    user_id: string;
    full_name: string;
    role: string;
    attendee_role: AttendeeRole;
    avatar_url?: string | null;
}

/** Returns today as YYYY-MM-DD */
function todayStr() {
    return new Date().toISOString().split('T')[0];
}

/** Validates YYYY-MM-DD */
function isValidDate(s: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s).getTime());
}

/** Validates HH:MM (24h) */
function isValidTime(s: string): boolean {
    return /^([01]?\d|2[0-3]):[0-5]\d$/.test(s);
}

export default function CreateEventScreen() {
    const { colors } = useTheme();
    const { user } = useAuth();
    const router = useRouter();
    const MOCK_OTP = isMockMode();
    const { eventId } = useLocalSearchParams<{ eventId?: string }>();
    const isEditing = !!eventId;

    const [title, setTitle] = useState('');
    const [eventType, setEventType] = useState<EventType>('team_meeting');
    const [eventDate, setEventDate] = useState(todayStr());
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [selectedAttendees, setSelectedAttendees] = useState<SelectedAttendee[]>([]);
    const [showAttendeePicker, setShowAttendeePicker] = useState(false);
    const [pickerTab, setPickerTab] = useState<'team' | 'external'>('team');
    const [allUsers, setAllUsers] = useState<SimpleUser[]>([]);
    const [userSearch, setUserSearch] = useState('');
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [loadingEvent, setLoadingEvent] = useState(isEditing);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [usersError, setUsersError] = useState<string | null>(null);

    // External (non-user) attendees
    const [externalAttendees, setExternalAttendees] = useState<(ExternalAttendee & { _key: string })[]>([]);
    const [externalName, setExternalName] = useState('');
    const [externalRole, setExternalRole] = useState<AttendeeRole>('attendee');

    const loadUsers = useCallback(async () => {
        setLoadingUsers(true);
        setUsersError(null);
        if (MOCK_OTP) {
            setAllUsers(MOCK_USERS);
            setLoadingUsers(false);
            return;
        }
        const { data, error } = await fetchAllUsers();
        if (error) setUsersError('Failed to load users. Tap to retry.');
        setAllUsers(data);
        setLoadingUsers(false);
    }, []);

    useEffect(() => { loadUsers(); }, [loadUsers]);

    // Supabase returns time as "HH:MM:SS" — strip seconds for the form
    const toHHMM = (t: string | null | undefined) => (t ?? '').slice(0, 5);

    // Pre-populate form when editing
    useEffect(() => {
        if (!isEditing || !eventId) return;

        if (MOCK_OTP) {
            // Use a representative mock event so the edit flow is testable
            setTitle('Agency Kickoff 2026');
            setEventType('agency_event');
            setEventDate(new Date().toISOString().split('T')[0]);
            setStartTime('09:00');
            setEndTime('12:00');
            setLocation('Marina Bay Sands Convention Centre');
            setDescription('Annual agency kickoff event for all staff.');
            setSelectedAttendees([
                { user_id: 'u1', full_name: 'Alice Tan', role: 'agent', attendee_role: 'attendee' },
                { user_id: 'u2', full_name: 'David Lim', role: 'manager', attendee_role: 'duty_manager' },
            ]);
            setExternalAttendees([
                { _key: 'ext_0', name: 'John Smith (Client)', attendee_role: 'attendee' },
            ]);
            setLoadingEvent(false);
            return;
        }

        fetchEventById(eventId).then(({ data }) => {
            if (data) {
                setTitle(data.title);
                setEventType(data.event_type);
                setEventDate(data.event_date);
                setStartTime(toHHMM(data.start_time));
                setEndTime(toHHMM(data.end_time));
                setLocation(data.location || '');
                setDescription(data.description || '');
                setSelectedAttendees(data.attendees.map(a => ({
                    user_id: a.user_id,
                    full_name: a.full_name ?? '',
                    role: '',
                    attendee_role: a.attendee_role,
                    avatar_url: a.avatar_url,
                })));
                setExternalAttendees((data.external_attendees || []).map((a, i) => ({
                    _key: `ext_${i}_${Date.now()}`,
                    name: a.name,
                    attendee_role: a.attendee_role,
                })));
            }
            setLoadingEvent(false);
        });
    }, [isEditing, eventId]);

    const toggleAttendee = (u: SimpleUser) => {
        setSelectedAttendees(prev => {
            if (prev.find(a => a.user_id === u.id)) {
                return prev.filter(a => a.user_id !== u.id);
            }
            return [...prev, { user_id: u.id, full_name: u.full_name, role: u.role, attendee_role: 'attendee', avatar_url: u.avatar_url }];
        });
    };

    const updateAttendeeRole = (userId: string, role: AttendeeRole) => {
        setSelectedAttendees(prev =>
            prev.map(a => a.user_id === userId ? { ...a, attendee_role: role } : a)
        );
    };

    const validate = (): boolean => {
        const e: Record<string, string> = {};
        if (!title.trim()) e.title = 'Title is required';
        if (!isValidDate(eventDate)) e.eventDate = 'Enter a valid date (YYYY-MM-DD)';
        if (!isValidTime(startTime)) e.startTime = 'Enter a valid time (HH:MM)';
        if (endTime && !isValidTime(endTime)) e.endTime = 'Enter a valid time (HH:MM)';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        setSubmitting(true);

        const input: CreateEventInput = {
            title: title.trim(),
            description: description.trim() || null,
            event_type: eventType,
            event_date: eventDate,
            start_time: startTime,
            end_time: endTime || null,
            location: location.trim() || null,
            attendees: selectedAttendees.map(a => ({
                user_id: a.user_id,
                attendee_role: a.attendee_role,
            })),
            external_attendees: externalAttendees.map(({ name, attendee_role }) => ({ name, attendee_role })),
        };

        if (MOCK_OTP) {
            setSubmitting(false);
            Alert.alert('Success', isEditing ? 'Event updated (mock mode)' : 'Event created (mock mode)', [
                { text: 'OK', onPress: () => router.back() },
            ]);
            return;
        }

        const { error } = isEditing
            ? await updateEvent(eventId!, input)
            : await createEvent(input, user!.id);
        setSubmitting(false);

        if (error) {
            Alert.alert('Error', error);
        } else {
            router.back();
        }
    };

    const filteredUsers = allUsers.filter(u =>
        u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.role.toLowerCase().includes(userSearch.toLowerCase())
    );

    const inputStyle = [styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.textPrimary }];
    const labelStyle = [styles.label, { color: colors.textSecondary }];

    if (loadingEvent) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <ScreenHeader title="Edit Event" showBack onBack={() => router.back()} />
                <ActivityIndicator style={{ marginTop: 40 }} color={colors.accent} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScreenHeader
                title={isEditing ? 'Edit Event' : 'Create Event'}
                showBack
                onBack={() => router.back()}
                rightAction={
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={submitting}
                        style={[styles.saveBtn, { backgroundColor: colors.accent, opacity: submitting ? 0.6 : 1 }]}
                    >
                        {submitting
                            ? <ActivityIndicator size="small" color="#FFFFFF" />
                            : <Text style={styles.saveBtnText}>{isEditing ? 'Save' : 'Create'}</Text>
                        }
                    </TouchableOpacity>
                }
            />

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* Title */}
                    <View style={styles.field}>
                        <Text style={labelStyle}>Title *</Text>
                        <TextInput
                            style={[inputStyle, errors.title && { borderColor: colors.danger }]}
                            placeholder="Event title"
                            placeholderTextColor={colors.textTertiary}
                            value={title}
                            onChangeText={t => { setTitle(t); setErrors(e => ({ ...e, title: '' })); }}
                        />
                        {errors.title ? <Text style={[styles.errorText, { color: colors.danger }]}>{errors.title}</Text> : null}
                    </View>

                    {/* Event Type */}
                    <View style={styles.field}>
                        <Text style={labelStyle}>Event Type *</Text>
                        <View style={styles.typeRow}>
                            {EVENT_TYPES.map(t => {
                                const isActive = eventType === t;
                                const color = EVENT_TYPE_COLORS[t];
                                return (
                                    <TouchableOpacity
                                        key={t}
                                        style={[
                                            styles.typeChip,
                                            {
                                                borderColor: isActive ? color : colors.border,
                                                backgroundColor: isActive ? color + '18' : colors.cardBackground,
                                            },
                                        ]}
                                        onPress={() => setEventType(t)}
                                    >
                                        <Text style={[styles.typeChipText, { color: isActive ? color : colors.textSecondary }]}>
                                            {EVENT_TYPE_LABELS[t]}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Date */}
                    <View style={styles.field}>
                        <Text style={labelStyle}>Date * (YYYY-MM-DD)</Text>
                        <TextInput
                            style={[inputStyle, errors.eventDate && { borderColor: colors.danger }]}
                            placeholder="e.g. 2026-03-15"
                            placeholderTextColor={colors.textTertiary}
                            value={eventDate}
                            onChangeText={v => { setEventDate(v); setErrors(e => ({ ...e, eventDate: '' })); }}
                            keyboardType="numbers-and-punctuation"
                            maxLength={10}
                        />
                        {errors.eventDate ? <Text style={[styles.errorText, { color: colors.danger }]}>{errors.eventDate}</Text> : null}
                    </View>

                    {/* Times */}
                    <View style={styles.timeRow}>
                        <View style={[styles.field, { flex: 1 }]}>
                            <Text style={labelStyle}>Start Time * (HH:MM)</Text>
                            <TextInput
                                style={[inputStyle, errors.startTime && { borderColor: colors.danger }]}
                                placeholder="09:00"
                                placeholderTextColor={colors.textTertiary}
                                value={startTime}
                                onChangeText={v => { setStartTime(v); setErrors(e => ({ ...e, startTime: '' })); }}
                                keyboardType="numbers-and-punctuation"
                                maxLength={5}
                            />
                            {errors.startTime ? <Text style={[styles.errorText, { color: colors.danger }]}>{errors.startTime}</Text> : null}
                        </View>
                        <View style={[styles.field, { flex: 1 }]}>
                            <Text style={labelStyle}>End Time (HH:MM)</Text>
                            <TextInput
                                style={[inputStyle, errors.endTime && { borderColor: colors.danger }]}
                                placeholder="17:00"
                                placeholderTextColor={colors.textTertiary}
                                value={endTime}
                                onChangeText={v => { setEndTime(v); setErrors(e => ({ ...e, endTime: '' })); }}
                                keyboardType="numbers-and-punctuation"
                                maxLength={5}
                            />
                            {errors.endTime ? <Text style={[styles.errorText, { color: colors.danger }]}>{errors.endTime}</Text> : null}
                        </View>
                    </View>

                    {/* Location */}
                    <View style={styles.field}>
                        <Text style={labelStyle}>Location</Text>
                        <TextInput
                            style={inputStyle}
                            placeholder="e.g. Zoom, Marina Bay Sands"
                            placeholderTextColor={colors.textTertiary}
                            value={location}
                            onChangeText={setLocation}
                        />
                    </View>

                    {/* Description */}
                    <View style={styles.field}>
                        <Text style={labelStyle}>Description</Text>
                        <TextInput
                            style={[inputStyle, styles.textArea]}
                            placeholder="Optional details..."
                            placeholderTextColor={colors.textTertiary}
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>

                    {/* Attendees */}
                    <View style={styles.field}>
                        <View style={styles.sectionHeader}>
                            <Text style={labelStyle}>
                                Attendees ({selectedAttendees.length + externalAttendees.length})
                            </Text>
                            <TouchableOpacity
                                onPress={() => setShowAttendeePicker(true)}
                                style={[styles.addAttendeeBtn, { borderColor: colors.accent }]}
                            >
                                <Ionicons name="person-add-outline" size={14} color={colors.accent} />
                                <Text style={[styles.addAttendeeBtnText, { color: colors.accent }]}>Add</Text>
                            </TouchableOpacity>
                        </View>

                        {selectedAttendees.length === 0 && externalAttendees.length === 0 ? (
                            <View style={[styles.emptyAttendees, { backgroundColor: colors.cardBackground }]}>
                                <Text style={[styles.emptyAttendeesText, { color: colors.textTertiary }]}>
                                    No attendees selected
                                </Text>
                            </View>
                        ) : (
                            <>
                                {selectedAttendees.map(a => {
                                    const aColor = getAvatarColor(a.full_name);
                                    return (
                                        <View key={a.user_id} style={[styles.attendeeItem, { backgroundColor: colors.cardBackground }]}>
                                            <Avatar
                                                name={a.full_name}
                                                avatarUrl={a.avatar_url}
                                                size={36}
                                                backgroundColor={aColor + '18'}
                                                textColor={aColor}
                                            />
                                            <View style={styles.attendeeItemInfo}>
                                                <Text style={[styles.attendeeName, { color: colors.textPrimary }]}>
                                                    {a.full_name}
                                                </Text>
                                                <View style={styles.roleRow}>
                                                    {ATTENDEE_ROLES.map(r => {
                                                        const active = a.attendee_role === r.key;
                                                        return (
                                                            <TouchableOpacity
                                                                key={r.key}
                                                                style={[
                                                                    styles.roleChip,
                                                                    { backgroundColor: active ? colors.accent : colors.surfaceSecondary },
                                                                ]}
                                                                onPress={() => updateAttendeeRole(a.user_id, r.key)}
                                                            >
                                                                <Text style={[
                                                                    styles.roleChipText,
                                                                    { color: active ? '#FFFFFF' : colors.textTertiary },
                                                                ]}>
                                                                    {r.label}
                                                                </Text>
                                                            </TouchableOpacity>
                                                        );
                                                    })}
                                                </View>
                                            </View>
                                            <TouchableOpacity
                                                onPress={() => setSelectedAttendees(prev => prev.filter(x => x.user_id !== a.user_id))}
                                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                            >
                                                <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
                                            </TouchableOpacity>
                                        </View>
                                    );
                                })}
                                {externalAttendees.map(a => {
                                    const aColor = getAvatarColor(a.name);
                                    return (
                                        <View key={a._key} style={[styles.attendeeItem, { backgroundColor: colors.cardBackground }]}>
                                            <Avatar
                                                name={a.name}
                                                avatarUrl={null}
                                                size={36}
                                                backgroundColor={aColor + '18'}
                                                textColor={aColor}
                                            />
                                            <View style={styles.attendeeItemInfo}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                    <Text style={[styles.attendeeName, { color: colors.textPrimary }]}>
                                                        {a.name}
                                                    </Text>
                                                    <View style={[styles.guestBadge, { backgroundColor: colors.surfaceSecondary }]}>
                                                        <Text style={[styles.guestBadgeText, { color: colors.textTertiary }]}>Guest</Text>
                                                    </View>
                                                </View>
                                                <View style={styles.roleRow}>
                                                    {ATTENDEE_ROLES.map(r => {
                                                        const active = a.attendee_role === r.key;
                                                        return (
                                                            <TouchableOpacity
                                                                key={r.key}
                                                                style={[
                                                                    styles.roleChip,
                                                                    { backgroundColor: active ? colors.accent : colors.surfaceSecondary },
                                                                ]}
                                                                onPress={() => setExternalAttendees(prev =>
                                                                    prev.map(x => x._key === a._key ? { ...x, attendee_role: r.key } : x)
                                                                )}
                                                            >
                                                                <Text style={[
                                                                    styles.roleChipText,
                                                                    { color: active ? '#FFFFFF' : colors.textTertiary },
                                                                ]}>
                                                                    {r.label}
                                                                </Text>
                                                            </TouchableOpacity>
                                                        );
                                                    })}
                                                </View>
                                            </View>
                                            <TouchableOpacity
                                                onPress={() => setExternalAttendees(prev => prev.filter(x => x._key !== a._key))}
                                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                            >
                                                <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
                                            </TouchableOpacity>
                                        </View>
                                    );
                                })}
                            </>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Attendee Picker Modal */}
            <Modal
                visible={showAttendeePicker}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => { setShowAttendeePicker(false); setUserSearch(''); setExternalName(''); }}
            >
                <SafeAreaView style={[styles.pickerScreen, { backgroundColor: colors.background }]}>
                    <View style={[styles.pickerSheetHeader, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.pickerSheetTitle, { color: colors.textPrimary }]}>Add Attendees</Text>
                        <TouchableOpacity onPress={() => { setShowAttendeePicker(false); setUserSearch(''); setExternalName(''); }}>
                            <Text style={[styles.pickerDone, { color: colors.accent }]}>Done</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Tabs */}
                    <View style={[styles.pickerTabs, { borderBottomColor: colors.border }]}>
                        {(['team', 'external'] as const).map(tab => (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.pickerTab, pickerTab === tab && { borderBottomColor: colors.accent, borderBottomWidth: 2 }]}
                                onPress={() => setPickerTab(tab)}
                            >
                                <Text style={[styles.pickerTabText, { color: pickerTab === tab ? colors.accent : colors.textSecondary }]}>
                                    {tab === 'team' ? 'Team' : 'External'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {pickerTab === 'team' ? (
                        <>
                            <View style={[styles.searchBar, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                                <Ionicons name="search" size={16} color={colors.textTertiary} />
                                <TextInput
                                    style={[styles.searchInput, { color: colors.textPrimary }]}
                                    placeholder="Search by name or role..."
                                    placeholderTextColor={colors.textTertiary}
                                    value={userSearch}
                                    onChangeText={setUserSearch}
                                />
                            </View>

                            {loadingUsers ? (
                                <ActivityIndicator style={{ marginTop: 40 }} color={colors.accent} />
                            ) : usersError ? (
                                <TouchableOpacity
                                    style={[styles.retryBtn, { backgroundColor: colors.cardBackground }]}
                                    onPress={loadUsers}
                                >
                                    <Ionicons name="refresh" size={20} color={colors.accent} />
                                    <Text style={[styles.retryText, { color: colors.accent }]}>{usersError}</Text>
                                </TouchableOpacity>
                            ) : (
                                <FlatList
                                    data={filteredUsers}
                                    keyExtractor={u => u.id}
                                    contentContainerStyle={{ padding: 16 }}
                                    renderItem={({ item }) => {
                                        const isSelected = selectedAttendees.some(a => a.user_id === item.id);
                                        const avatarColor = getAvatarColor(item.full_name);
                                        return (
                                            <TouchableOpacity
                                                style={[
                                                    styles.userRow,
                                                    {
                                                        backgroundColor: isSelected ? colors.accentLight : colors.cardBackground,
                                                        borderColor: isSelected ? colors.accent : 'transparent',
                                                    },
                                                ]}
                                                onPress={() => toggleAttendee(item)}
                                                activeOpacity={0.7}
                                            >
                                                <Avatar
                                                    name={item.full_name}
                                                    avatarUrl={item.avatar_url}
                                                    size={36}
                                                    backgroundColor={avatarColor + '18'}
                                                    textColor={avatarColor}
                                                />
                                                <View style={styles.userInfo}>
                                                    <Text style={[styles.userName, { color: colors.textPrimary }]}>{item.full_name}</Text>
                                                    <Text style={[styles.userRole, { color: colors.textTertiary }]}>
                                                        {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
                                                    </Text>
                                                </View>
                                                {isSelected && <Ionicons name="checkmark-circle" size={22} color={colors.accent} />}
                                            </TouchableOpacity>
                                        );
                                    }}
                                />
                            )}
                        </>
                    ) : (
                        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                            <ScrollView contentContainerStyle={styles.externalTab}>
                                <Text style={[styles.externalHint, { color: colors.textTertiary }]}>
                                    Add guests not in the system — clients, prospects, or external partners.
                                </Text>

                                {/* Name input + role chips + Add button */}
                                <View style={[styles.externalForm, { backgroundColor: colors.cardBackground }]}>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.textPrimary }]}
                                        placeholder="Full name"
                                        placeholderTextColor={colors.textTertiary}
                                        value={externalName}
                                        onChangeText={setExternalName}
                                        returnKeyType="done"
                                    />
                                    <View style={styles.roleRow}>
                                        {ATTENDEE_ROLES.map(r => {
                                            const active = externalRole === r.key;
                                            return (
                                                <TouchableOpacity
                                                    key={r.key}
                                                    style={[styles.roleChip, { backgroundColor: active ? colors.accent : colors.surfaceSecondary }]}
                                                    onPress={() => setExternalRole(r.key)}
                                                >
                                                    <Text style={[styles.roleChipText, { color: active ? '#FFFFFF' : colors.textTertiary }]}>
                                                        {r.label}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.externalAddBtn, { backgroundColor: externalName.trim() ? colors.accent : colors.border }]}
                                        disabled={!externalName.trim()}
                                        onPress={() => {
                                            if (!externalName.trim()) return;
                                            setExternalAttendees(prev => [
                                                ...prev,
                                                { _key: `ext_${Date.now()}`, name: externalName.trim(), attendee_role: externalRole },
                                            ]);
                                            setExternalName('');
                                            setExternalRole('attendee');
                                        }}
                                    >
                                        <Ionicons name="person-add-outline" size={16} color="#FFFFFF" />
                                        <Text style={styles.externalAddBtnText}>Add Guest</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Already-added external attendees */}
                                {externalAttendees.length > 0 && (
                                    <View style={{ gap: 8, marginTop: 4 }}>
                                        <Text style={[styles.label, { color: colors.textSecondary }]}>Added guests</Text>
                                        {externalAttendees.map(a => {
                                            const aColor = getAvatarColor(a.name);
                                            return (
                                                <View key={a._key} style={[styles.userRow, { backgroundColor: colors.cardBackground, borderColor: 'transparent' }]}>
                                                    <Avatar name={a.name} avatarUrl={null} size={36} backgroundColor={aColor + '18'} textColor={aColor} />
                                                    <View style={styles.userInfo}>
                                                        <Text style={[styles.userName, { color: colors.textPrimary }]}>{a.name}</Text>
                                                        <Text style={[styles.userRole, { color: colors.textTertiary }]}>
                                                            {ATTENDEE_ROLES.find(r => r.key === a.attendee_role)?.label ?? a.attendee_role}
                                                        </Text>
                                                    </View>
                                                    <TouchableOpacity
                                                        onPress={() => setExternalAttendees(prev => prev.filter(x => x._key !== a._key))}
                                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                                    >
                                                        <Ionicons name="close-circle" size={22} color={colors.textTertiary} />
                                                    </TouchableOpacity>
                                                </View>
                                            );
                                        })}
                                    </View>
                                )}
                            </ScrollView>
                        </KeyboardAvoidingView>
                    )}
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 60 },

    field: { marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
    input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
    textArea: { minHeight: 96, paddingTop: 12 },
    errorText: { fontSize: 12, marginTop: 4 },

    timeRow: { flexDirection: 'row', gap: 12 },

    typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    typeChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1.5 },
    typeChipText: { fontSize: 13, fontWeight: '600' },

    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    addAttendeeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1.5, borderRadius: 8 },
    addAttendeeBtnText: { fontSize: 13, fontWeight: '600' },

    emptyAttendees: { borderRadius: 12, padding: 20, alignItems: 'center' },
    emptyAttendeesText: { fontSize: 14 },

    attendeeItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 12, padding: 12, marginBottom: 8 },
    avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 13, fontWeight: '700' },
    attendeeItemInfo: { flex: 1, gap: 6 },
    attendeeName: { fontSize: 15, fontWeight: '600' },
    roleRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
    roleChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    roleChipText: { fontSize: 11, fontWeight: '600' },

    saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    saveBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },

    pickerScreen: { flex: 1 },
    pickerSheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
    pickerSheetTitle: { fontSize: 17, fontWeight: '700' },
    pickerDone: { fontSize: 16, fontWeight: '600' },
    searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 16, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
    searchInput: { flex: 1, fontSize: 15, padding: 0 },

    userRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1.5 },
    userInfo: { flex: 1 },
    userName: { fontSize: 15, fontWeight: '600' },
    userRole: { fontSize: 12, marginTop: 1 },

    retryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: 32, borderRadius: 12, padding: 16 },
    retryText: { fontSize: 14, fontWeight: '600' },

    pickerTabs: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth },
    pickerTab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
    pickerTabText: { fontSize: 14, fontWeight: '600' },

    guestBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    guestBadgeText: { fontSize: 10, fontWeight: '700' },

    externalTab: { padding: 16, gap: 16 },
    externalHint: { fontSize: 13, lineHeight: 19 },
    externalForm: { borderRadius: 12, padding: 14, gap: 12 },
    externalAddBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, paddingVertical: 11 },
    externalAddBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});
