# User Guide

---

## How to use Planning Poker

### Creating a room

1. Go to the home page.
2. Enter your name.
3. Click **Create New Room**.
4. Optionally set an **admin PIN** (recommended — lets you reclaim admin access later).
5. Share the generated **Room ID** with your team.

### Joining a room

1. Go to the home page.
2. Enter your name.
3. Click **Join Existing Room**.
4. Enter the Room ID shared by the admin.
5. Click **Join Room**. If the room does not exist you will see an inline error.

### Rejoining as admin

1. Click **Join Existing Room**.
2. Enter your name and the Room ID.
3. Check **Join as admin (requires PIN)**.
4. Click **Join Room**, then enter the PIN in the dialog.

---

## Voting flow

1. **Admin** optionally checks "I want to participate in voting" to vote alongside the team.
2. **Admin** clicks **Start Voting** — this clears any previous votes.
3. **Participants** each see voting cards; select a value. Cards are face-down to others.
   - Cards turn green when a participant has voted.
   - `?` is pre-selected for participants who have not voted yet.
4. **Admin** clicks **Reveal Votes** — a 3D card-flip animation reveals all votes simultaneously.
   - Voting is locked; participants cannot change their vote while revealed.
5. The average is calculated (excludes `?` votes and non-participating admin).
6. **Admin** clicks **Reset Votes** to start the next story.

### Voting cards

```
0   1   2   3   5   8   13   20   35   50   100   ?
```

---

## Discussion mode

Available after votes are revealed when estimates differ.

1. **Admin** clicks **Discuss**.
2. The app randomly selects one participant with the lowest estimate and one with the highest.
3. Those participants are highlighted with pulsing animations and LOW / HIGH badges.
4. All other participants are dimmed.
5. Click **End Discussion** to exit, or hide votes — discussion ends automatically.

---

## Admin controls

| Control | Effect |
|---|---|
| Participation toggle | Include / exclude yourself from voting |
| Start Voting | Clears all votes and opens a new round |
| Reveal / Hide votes | Toggles vote visibility with animation |
| Discuss | Starts discussion mode (available when votes differ) |
| Reset Votes | Clears all votes and returns to initial state |
| Remove participant | Removes a participant (hover a card to reveal button) |
| Share / Copy | Copies room URL or room ID to clipboard |

---

## Keyboard shortcuts

### Admin only

| Key | Action |
|---|---|
| `V` | Reveal / hide votes |
| `S` | Start voting |
| `D` | Start discussion (when available) |
| `Z` | Reset votes |

### Participants (while voting is active)

| Key | Action |
|---|---|
| `0`–`9` | Quick vote on card at that position |
| `?` | Vote unknown |

### Universal

| Key | Action |
|---|---|
| `C` | Copy room ID |
| `Shift+C` | Share room URL (native share on mobile, clipboard on desktop) |
| `Esc` | Leave room |

Shortcuts are ignored when typing in input fields or when modifier keys are held.

---

## Mobile

On mobile the voting cards are presented as a **Tinder-style carousel**:
- Swipe left → next card
- Swipe right → previous card
- Dot indicators show current position
- The app attempts to auto-lock to landscape orientation for a better poker-table view

---

## Installing as a PWA

| Platform | Steps |
|---|---|
| Android / Chrome | Menu → "Add to Home screen" or "Install app" |
| iOS / Safari | Share button (□↑) → "Add to Home Screen" |
| Desktop (Chrome/Edge) | Click ⊕ install icon in the address bar |

Once installed, the app runs in a standalone window, loads instantly from cache, and supports offline access for previously visited rooms.

### Update notifications

When a new version is deployed, the app will prompt you to reload. You can choose "Update Now" or "Later".

---

## Privacy and data

- No user accounts or registration required.
- Only your display name and votes are stored; no personal information is collected.
- All data is transmitted over HTTPS.
- Regular participant sessions expire after 24 hours; admin sessions persist until the PIN is used to re-authenticate.
- Participants who close their browser are removed from the room within seconds.
- All room data lives in a Supabase PostgreSQL database.
