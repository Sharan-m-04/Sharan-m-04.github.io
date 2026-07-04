/* ============================================================
   Cloudflare Worker — portfolio contact form → Resend → inbox

   This file is a reference copy. It is NOT served by GitHub
   Pages; it runs on Cloudflare. Deploy steps: worker/README.md

   The Resend API key is read from env.RESEND_API_KEY — a
   Cloudflare secret set in the dashboard. It never appears in
   this repo, in the browser, or in any request the visitor
   can see.
   ============================================================ */

const TO_EMAIL = 'msharan.hnp@gmail.com';
const FROM = 'Portfolio Contact <onboarding@resend.dev>';

const NAME_MAX = 100;
const MESSAGE_MAX = 3000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function allowedOrigin(origin) {
    if (!origin) return null;
    if (origin === 'https://sharan-m-04.github.io') return origin;
    // local development
    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return origin;
    return null;
}

function corsHeaders(origin) {
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400'
    };
}

function json(body, status, origin) {
    return new Response(JSON.stringify(body), {
        status: status,
        headers: Object.assign(
            { 'Content-Type': 'application/json' },
            corsHeaders(origin)
        )
    });
}

export default {
    async fetch(request, env) {
        const origin = allowedOrigin(request.headers.get('Origin'));

        if (request.method === 'OPTIONS') {
            if (!origin) return new Response(null, { status: 403 });
            return new Response(null, { status: 204, headers: corsHeaders(origin) });
        }

        if (!origin) {
            return new Response(JSON.stringify({ ok: false, error: 'forbidden origin' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (request.method !== 'POST') {
            return json({ ok: false, error: 'method not allowed' }, 405, origin);
        }

        let data;
        try {
            data = await request.json();
        } catch (e) {
            return json({ ok: false, error: 'invalid JSON' }, 400, origin);
        }

        // honeypot: real visitors never fill this hidden field —
        // bots do. Pretend success so they move on.
        if (data.website) {
            return json({ ok: true }, 200, origin);
        }

        const name = String(data.name || '').trim().slice(0, NAME_MAX);
        const email = String(data.email || '').trim();
        const message = String(data.message || '').trim().slice(0, MESSAGE_MAX);

        if (!name || !message || !EMAIL_RE.test(email)) {
            return json({ ok: false, error: 'invalid fields' }, 400, origin);
        }

        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + env.RESEND_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: FROM,
                to: [TO_EMAIL],
                reply_to: email,
                subject: 'Portfolio contact — ' + name,
                text: 'Name: ' + name + '\n' +
                      'Email: ' + email + '\n\n' +
                      message
            })
        });

        if (!res.ok) {
            return json({ ok: false, error: 'delivery failed' }, 502, origin);
        }

        return json({ ok: true }, 200, origin);
    }
};
