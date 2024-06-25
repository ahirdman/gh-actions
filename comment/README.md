# Create comment on pr

This action creates a comment on a pr

## Basig usage

```yaml
uses: @ahirdman/comment@main
with:
    github-token: {{ secrets.GITHUB_TOKEN }}
    message: "Foo"
    template: none
```

## Post a comment that pretty prints a @expo/fingerprint diff

```yaml
uses: @ahirdman/comment@main
with:
    github-token: {{ secrets.GITHUB_TOKEN }}
    fingerprint-diff: <diff>
    template: fingerprint
```
