# Fingerprint native changes action

This action checks native fingerprint changes between commits / tags

## Inputs

### `profile`

**Required** The name of the profile: "pull-request" | "production".

## Outputs

### `changes`

Any changes made

## Example usage

```yaml
uses: @ahirdman/fingerprint@main
with:
  profile: 'pull-request'
```
