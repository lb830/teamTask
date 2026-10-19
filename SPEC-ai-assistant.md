# Spec: AI Assistant (Deferred)

## Objective

Reserve a visible product entry point for future AI chat with team files. The provider is not selected, so AI integration is not part of this build.

## Requirements for this build

- Show the AI entry point in a disabled state with setup guidance.
- Do not call an AI provider or persist AI conversations in this build.

## Future behavior already agreed

- A later provider-backed assistant will search the entire selected team's supported vault files automatically.
- ZIP archive contents will not be indexed.
- Conversation history will be visible only to its creator.
- Team membership will gate both file retrieval and any future conversation data.

## Dependencies

The disabled entry point depends on `teams` and `vault`. Provider integration remains out of scope until the provider is selected.

## Success criteria

- Members see that AI is unavailable until a provider is configured.
- No provider request is made while the feature is disabled.
