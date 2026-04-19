# Community Regenerative Solutions Employment Application

This is a public-facing employment application for applicants and potential employees.

## Current submission workflow

1. Applicant fills out the existing employment application.
2. The browser submits the answers to `/api/submit-application`.
3. The Vercel server-side function generates a print-ready PDF.
4. The server emails the PDF attachment to `Info@communityregenerativesolutions.com` using Resend.
5. The page shows the success message only after the server email call succeeds.

## Email service setup

This project uses the Resend Node SDK from a Vercel server-side function.

Add this environment variable in Vercel:

```text
RESEND_API_KEY=your_resend_api_key_here
```

The email is sent with:

```js
from: "onboarding@resend.dev"
to: "Info@communityregenerativesolutions.com"
subject: "New CRS Employment Application"
```

The generated PDF is attached as:

```text
application.pdf
```

## Files

- `index.html` contains the applicant-facing form.
- `assets/styles.css` contains the visual styling.
- `src/app.js` handles validation, submit, visible errors, success message, and local PDF download.
- `src/config.js` points the browser to `/api/submit-application`.
- `src/pdf-generator.js` creates the applicant-side downloadable PDF.
- `api/submit-application.js` is the Vercel server route that generates the emailed PDF and sends it through Resend.
- `package.json` declares the `resend` dependency used by the Vercel function.

## How to test

1. Deploy the project to Vercel.
2. Add `RESEND_API_KEY` in the Vercel project environment variables.
3. Redeploy after adding the environment variable.
4. Open the live Vercel site.
5. Fill out all required fields.
6. Submit the application.
7. Confirm the success message appears.
8. Check `Info@communityregenerativesolutions.com`.
9. Confirm the email has `application.pdf` attached.

## Troubleshooting

- If the page shows a submission failure, check the Vercel Function logs for `/api/submit-application`.
- If the logs mention `Missing RESEND_API_KEY`, add the environment variable in Vercel and redeploy.
- If no email arrives, check spam/junk and the Resend dashboard logs.
- If Resend rejects the sender, confirm that your Resend account allows `onboarding@resend.dev`.
- If the PDF is attached but missing fields, update the `pdfTemplate` in `api/submit-application.js`.
