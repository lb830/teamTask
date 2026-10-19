# Spec: Vault

## Objective

Give each team a private vault with named project folders and standalone files.

## Requirements

- Any team member can create project folders, upload files, list files, and download files in that team.
- Accept ZIP archives, PDF, Word documents, Markdown/text, CSV, and source-code files.
- Limit each item to 100 MB.
- Store files in a private Supabase Storage bucket and enforce team membership for listing and downloads.
- ZIP archives are downloadable but their contents are not indexed for AI.
- Uploaded files and projects remain with the team if a member leaves.

## Dependencies

Depends on `teams`.

## Success criteria

- Members can create named project folders and upload standalone files.
- Non-members cannot list or download team files.
- Items above the configured limit are rejected before upload completes.
