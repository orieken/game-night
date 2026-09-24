# Firestore Backup and Recovery

Game Night uses a local Admin SDK tool instead of Firestore's managed export and scheduled-backup products. The managed products require billing; this workflow keeps the app compatible with Firebase's Spark plan and uses the project's normal Firestore read/write quota.

The tool recursively exports Firestore documents into a versioned JSON file. It also queries every collection name used by the app so leaf documents beneath virtual/nonexistent ancestors—such as public story highlights—are included. It preserves timestamps, byte values, geographic points, document references, and special numeric values. Recovery is merge-only: it never deletes documents that are absent from the backup.

## Important boundaries

- This backs up Cloud Firestore data only. It does not back up Firebase Authentication passwords/accounts, Netlify environment variables, or third-party services.
- A backup can contain user profiles, private campaign recaps, DM notes, invitations, and character details. Treat it as sensitive personal data.
- Backup files and service-account keys are ignored by Git. Store backups in an encrypted location outside the repository and never commit or share a service-account key.
- This is a manual snapshot, not point-in-time recovery. Changes made after the snapshot are not recoverable from it.
- Backup and verification consume document reads; recovery consumes document writes. Run them sparingly enough to remain within the Spark daily quota.

## One-time credentials setup

Use a dedicated Firebase service account with only the permissions needed to read and write this Firestore database. Download its JSON key from Firebase/Google Cloud, keep it outside the repository, and set its absolute path for the terminal session:

```sh
export GOOGLE_APPLICATION_CREDENTIALS=/private/path/to/game-night-backup-service-account.json
export FIREBASE_PROJECT_ID=rieken-game-night
```

Do not place the private key in `.env`, Netlify, the browser app, or the repository. Revoke and replace it immediately if it is exposed.

## Create a backup

```sh
npm run firebase:backup
```

The default destination is `backups/firestore/`, which Git ignores. To write directly to encrypted/removable storage:

```sh
npm run firebase:backup -- --output /private/backup-location/game-night.json
```

The command prints the exact path and document count. Confirm that the file exists, is non-empty, and has restrictive file permissions before considering the run successful.

## Preview recovery

Recovery always starts as a dry run. It validates the format, document paths, declared count, and project ID, but writes nothing:

```sh
npm run firebase:restore -- --file /private/backup-location/game-night.json
```

Read the reported project, timestamp, and document count. Stop if any value is unexpected.

## Apply and verify recovery

Pass the exact Firebase project ID as the confirmation value. This prevents an accidental paste or casual invocation from writing data:

```sh
npm run firebase:restore -- --file /private/backup-location/game-night.json --confirm rieken-game-night
npm run firebase:verify -- --file /private/backup-location/game-night.json
```

Restore writes in batches of 400 and merges backup fields into each document. It does not remove fields added after the backup and does not delete newer documents. Verification reads the restored documents and confirms that every field represented in the backup now matches.

After a real incident, also sign in to the deployed app and manually check:

1. The active table and member list load.
2. Games and game nights open, including RSVPs and completed session results.
3. Campaigns, characters, adventure logs, and private DM notes load for authorized users.
4. A public story link still shows only its sanitized published blurb.

If Firebase Authentication users were deleted, Firestore recovery alone will not recreate their login accounts. Recreate those accounts through an approved account-recovery process before expecting those players to sign in.

## Operating cadence

Create and retain an encrypted backup before rule/schema migrations and at least monthly while the app is active. Keep more than one generation so a bad snapshot does not replace the only good copy. Once per quarter, run the disposable local recovery drill before relying on a newly changed backup tool:

```sh
npm run firebase:recovery-check
```

The check creates root, nested, and leaf-only documents in the `demo-game-night` Firestore emulator, backs them up, deletes them, restores and verifies them, and then cleans them up. It refuses to run without the emulator or against a non-demo project.
