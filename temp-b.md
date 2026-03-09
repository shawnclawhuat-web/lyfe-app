I need you to delete all existing users and data from my Supabase project and recreate seed data. Connect to my Supabase project using the Management API or SQL Editor.

**Supabase Project Ref:** `nvtedkyjwulkzjeoqjgx`

## Step 1: Delete all data (in FK order)

```sql
DELETE FROM roadshow_activities;
DELETE FROM roadshow_attendance;
DELETE FROM roadshow_configs;
DELETE FROM event_attendees;
DELETE FROM events;
DELETE FROM exam_answers;
DELETE FROM exam_attempts;
DELETE FROM lead_activities;
DELETE FROM leads;
DELETE FROM candidate_activities;
DELETE FROM candidate_documents;
DELETE FROM interviews;
DELETE FROM candidates;
DELETE FROM invite_tokens;
DELETE FROM pa_manager_assignments;
DELETE FROM users;
```

Then delete all auth users from `auth.users`.

## Step 2: Create auth users via Supabase Auth Admin API

Create these users with phone auth (no email/password). The `handle_new_user()` trigger will auto-create rows in the public `users` table. After auth user creation, UPDATE the public `users` table to set `role`, `full_name`, `reports_to`, and `is_active`.

## User Hierarchy

### Admin
| Phone | Role | Name |
|-------|------|------|
| +6580000001 | admin | Sarah Chen |

### Directors (report to no one)
| Phone | Role | Name |
|-------|------|------|
| +6580000002 | director | James Tan |
| +6580000030 | director | Vincent Ng |

### Managers under James Tan
| Phone | Role | Name |
|-------|------|------|
| +6580000003 | manager | Rachel Lim |
| +6580000010 | manager | Marcus Goh |
| +6580000011 | manager | Priya Sharma |
| +6580000031 | manager | Derek Ong |

### Managers under Vincent Ng
| Phone | Role | Name |
|-------|------|------|
| +6580000032 | manager | Samantha Foo |
| +6580000033 | manager | Jonathan Tay |
| +6580000034 | manager | Karen Yap |

### Agents under Rachel Lim
| Phone | Role | Name |
|-------|------|------|
| +6580000004 | agent | David Wong |
| +6580000012 | agent | Amanda Teo |
| +6580000013 | agent | Bryan Koh |
| +6580000014 | agent | Cindy Tan |
| +6580000035 | agent | Peter Loh |

### Agents under Marcus Goh
| Phone | Role | Name |
|-------|------|------|
| +6580000015 | agent | Eric Lau |
| +6580000016 | agent | Fiona Yeo |
| +6580000017 | agent | Gerald Sim |
| +6580000036 | agent | Hazel Poh |

### Agents under Priya Sharma
| Phone | Role | Name |
|-------|------|------|
| +6580000018 | agent | Hannah Ong |
| +6580000019 | agent | Ivan Chua |
| +6580000037 | agent | Jenny Liew |

### Agents under Derek Ong
| Phone | Role | Name |
|-------|------|------|
| +6580000038 | agent | Kenneth Soh |
| +6580000039 | agent | Linda Goh |
| +6580000040 | agent | Michael Tan |

### Agents under Samantha Foo
| Phone | Role | Name |
|-------|------|------|
| +6580000041 | agent | Nicole Ang |
| +6580000042 | agent | Oscar Lee |
| +6580000043 | agent | Patricia Koh |
| +6580000044 | agent | Quincy Wee |

### Agents under Jonathan Tay
| Phone | Role | Name |
|-------|------|------|
| +6580000045 | agent | Raymond Chia |
| +6580000046 | agent | Sandra Low |
| +6580000047 | agent | Timothy Phua |

### Agents under Karen Yap
| Phone | Role | Name |
|-------|------|------|
| +6580000048 | agent | Ursula Seah |
| +6580000049 | agent | Victor Lim |
| +6580000050 | agent | Wendy Chong |
| +6580000051 | agent | Xavier Ho |

### PAs
| Phone | Role | Name |
|-------|------|------|
| +6580000005 | pa | Michelle Lee |
| +6580000020 | pa | Nancy Wee |
| +6580000052 | pa | Olivia Toh |

### PA-Manager Assignments
| PA | Managers |
|----|---------|
| Michelle Lee | Rachel Lim, Marcus Goh |
| Nancy Wee | Priya Sharma, Derek Ong |
| Olivia Toh | Samantha Foo, Jonathan Tay, Karen Yap |

### Candidates under Rachel Lim
| Phone | Role | Name |
|-------|------|------|
| +6580000006 | candidate | Kevin Ng |
| +6580000021 | candidate | Lisa Pang |
| +6580000053 | candidate | Aaron Quek |

### Candidates under Marcus Goh
| Phone | Role | Name |
|-------|------|------|
| +6580000022 | candidate | Ryan Tay |
| +6580000054 | candidate | Belinda Chua |

### Candidates under Priya Sharma
| Phone | Role | Name |
|-------|------|------|
| +6580000055 | candidate | Charles Teo |
| +6580000056 | candidate | Diana Soh |

### Candidates under Samantha Foo
| Phone | Role | Name |
|-------|------|------|
| +6580000057 | candidate | Edwin Lau |
| +6580000058 | candidate | Felicia Neo |

### Candidates under Jonathan Tay
| Phone | Role | Name |
|-------|------|------|
| +6580000059 | candidate | George Yeo |

### Candidates under Karen Yap
| Phone | Role | Name |
|-------|------|------|
| +6580000060 | candidate | Helen Sim |
| +6580000061 | candidate | Ian Koh |

## Step 3: Set all users

- `is_active = true`
- `onboarding_complete = true`
- Agents: `lifecycle_stage = 'active_agent'`
- Candidates: `lifecycle_stage = 'applied'`
- All others: `lifecycle_stage = NULL`

## DB Enums for reference

```
user_role: admin | director | manager | agent | pa | candidate
lifecycle_stage: applied | interview_scheduled | interviewed | approved | exam_prep | licensed | active_agent
```

## Summary

- 1 admin
- 2 directors
- 7 managers (4 under James Tan, 3 under Vincent Ng)
- 28 agents (spread across all 7 managers, 3-5 each)
- 3 PAs (assigned across managers)
- 11 candidates (spread across 6 managers)
- **Total: 52 users**
