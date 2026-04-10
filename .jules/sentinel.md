## 2026-04-10 - HTML Injection in SageMaker Detached Server Error Page
**Vulnerability:** Reflected Cross-Site Scripting (XSS)
**Learning:** Dynamic HTML generation using template literals without proper escaping allowed arbitrary HTML/JS injection.
**Prevention:** Always use a sanitization or escaping function when embedding untrusted data into HTML strings.
