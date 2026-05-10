# Security Strategy: BPress Tracker

## 1. Data Invariants
- `sets`: Every document must have a `userId` matching `request.auth.uid`.
- `sets`: Fields `weight` and `reps` must be positive numbers.
- `sets`: Field `timestamp` must be a valid number (or timestamp).
- `users`: Every document ID must match `request.auth.uid`.
- `users`: Users cannot modify their own streak record arbitrarily (must be validated, but since we're client-side for now, we'll enforce schema at least).

## 2. The Dirty Dozen Payloads (Attempted violations)

1. **Identity Theft**: Create a set with `userId: "OTHER_USER_ID"`. (DENIED)
2. **Schema Poisoning**: Create a set with `weight: "one thousand kg"` (string instead of number). (DENIED)
3. **Ghost Fields**: Create a set with `isVerified: true` (hidden fields). (DENIED)
4. **Negative Gains**: Create a set with `reps: -5`. (DENIED)
5. **ID Poisoning**: Request `sets/LARGE_JUNK_STRING`. (DENIED if ID exceeds limit)
6. **Profile Takeover**: Update `users/OTHER_USER_ID`. (DENIED)
7. **Streak Inflation**: Update `users/MY_ID` with `currentStreak: 9999` without having done the work (Difficult to block purely on client-side rules without server functions, but we'll enforce strict key updates).
8. **PII Leak**: List all users. (DENIED)
9. **Total Wipe**: Delete all sets. (DENIED)
10. **Replay Attack**: Create 100 sets in 1 second (Rate limiting usually handled by Firebase, but we'll check timestamp).
11. **Type Swapping**: Send an array for `weight`. (DENIED)
12. **Null Spoofing**: Send `userId: null`. (DENIED)

## 3. Test Runner (Draft)
A simple test runner would ensure `doc.userId == auth.uid`.
