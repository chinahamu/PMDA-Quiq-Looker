# Security Policy

## Supported versions

Security fixes are applied to the latest release branch and `main` unless otherwise noted.

## Reporting a vulnerability

Please report suspected security or privacy issues through GitHub Issues only when the report does not contain sensitive information. If the report includes sensitive details, contact the repository maintainer through a private channel before posting public details.

Do not include patient information, electronic medical record screenshots, chart IDs, private URLs, credentials, API tokens, or institution-specific secrets in reports.

## Project security principles

- Keep Chrome extension permissions minimal.
- Do not dynamically load external scripts.
- Do not use `eval()`.
- Avoid unsafe HTML insertion.
- Do not collect or transmit patient identifiers, full page contents, or browsing history.
- Treat package insert lookup as reference support, not clinical decision automation.

## Disclosure expectations

When a vulnerability is confirmed, the project will:

1. Assess the affected versions and impact.
2. Prepare a fix in a private or minimally disclosed workflow when appropriate.
3. Release the fix and document the user-visible impact.
4. Credit the reporter if requested and appropriate.
