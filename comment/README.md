# Create comment on pr

This action creates a comment on a pr

## Example usage

```yaml
uses: @ahirdman/comment@main
with:
    github-token: {{ secrets.GITHUB_TOKEN }}
    message: "Foo"
```
