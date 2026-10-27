import React, { useEffect, useState, useCallback } from 'react';
import API from "../../api/axios";
/* ------------------------------------------------------------------
   ReferralPage.jsx
   Fully dynamic: code + reward amounts come from GET /referral/me
   Response: { success, code, link, referrerReward, refereeReward, stats }
------------------------------------------------------------------- */

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Bitter:wght@300;400;700;800&display=swap');

.ref-page {
  font-family: 'Bitter', Georgia, serif;
  color: #111;
  padding: 40px 16px 64px;
  max-width: 640px;
  margin: 0 auto;
}

.ref-title {
  text-align: center;
  font-size: 1.6rem;
  font-weight: 800;
  margin: 0 0 32px;
}

.ref-card {
  border: 6px solid #000;
  border-radius: 28px;
  background: #fff;
  padding: 36px 32px 44px;
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.28);
}

.ref-text {
  font-size: 0.95rem;
  line-height: 1.6;
  font-weight: 300;
  color: #555;
  margin: 0 0 40px;
}

.ref-code-box {
  position: relative;
  background: #333;
  border-radius: 14px;
  width: min(100%, 310px);
  margin: 0 auto;
  padding: 36px 16px;
  text-align: center;
}

.ref-code {
  font-family: 'Courier New', Courier, monospace;
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: 0.35em;
  padding-left: 0.35em; /* balances trailing letter-spacing so it looks centered */
  color: #fff;
  word-break: break-all;
  user-select: all;
}

.ref-copy {
  position: absolute;
  top: 10px;
  right: 12px;
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  background: transparent;
  border: 0;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
}
.ref-copy:hover { background: rgba(255, 255, 255, 0.12); }
.ref-copy:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }

.ref-copied {
  position: absolute;
  top: 14px;
  right: 50px;
  font-size: 0.75rem;
  color: #fff;
  opacity: 0.85;
}

.ref-skeleton {
  height: 1.15rem;
  width: 70%;
  margin: 0 auto;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.18);
}

.ref-error {
  text-align: center;
  color: #b00020;
  font-size: 0.95rem;
}
.ref-error button {
  margin-top: 12px;
  font-family: inherit;
  font-weight: 700;
  padding: 8px 18px;
  border: 2px solid #000;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
}

@media (max-width: 480px) {
  .ref-card { padding: 28px 20px 36px; border-width: 5px; }
  .ref-code { letter-spacing: 0.25em; font-size: 1rem; }
}
`;

const CopyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z" />
  </svg>
);

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
  </svg>
);

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for http / older browsers
    try {
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(el);
      return ok;
    } catch {
      return false;
    }
  }
}

export default function ReferralPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

 
const load = useCallback(async (signal) => {
  setLoading(true);
  setError("");

  try {
    const response = await API.get("/referral/me", { signal });
    const json = response.data;

    console.log("REFERRAL API RESPONSE:", json);

    if (response.status === 401) {
      window.location.href = "/login";
      return;
    }

    // Support either a direct response or a wrapped response.
    const referralData = json.data || json;

    if (!referralData.code) {
      throw new Error(
        referralData.message || "Referral code not returned by backend"
      );
    }

    setData(referralData);
  } catch (err) {
    if (err.name !== "AbortError" && err.code !== "ERR_CANCELED") {
      console.error("REFERRAL ERROR:", err.response?.data || err);

      if (err.response?.status === 401) {
        window.location.href = "/login";
        return;
      }

      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to load referral code"
      );
    }
  } finally {
    if (!signal?.aborted) {
      setLoading(false);
    }
  }
}, []);


  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const handleCopy = async () => {
    if (!data?.code) return;
    const ok = await copyToClipboard(data.code);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <>
      <style>{styles}</style>

      <main className="ref-page">
        <h1 className="ref-title">My Referral Code</h1>

        <section className="ref-card">
          {error ? (
            <div className="ref-error" role="alert">
              <p>{error}</p>
              <button type="button" onClick={() => load()}>
                Try again
              </button>
            </div>
          ) : (
            <>
              <p className="ref-text">
                “Invite your friends and earn rewards! Share your unique referral code to get ₹
                {data ? data.referrerReward : '…'} credited to your wallet when they join, and your
                friend receives ₹{data ? data.refereeReward : '…'} too. Spread the word and start
                earning together!”
              </p>

              <div className="ref-code-box">
                {loading ? (
                  <div className="ref-skeleton" aria-label="Loading your code" />
                ) : (
                  <>
                    <div className="ref-code" aria-label="Your referral code">
                      {data.code}
                    </div>

                    {copied && (
                      <span className="ref-copied" role="status">
                        Copied
                      </span>
                    )}

                    <button
                      type="button"
                      className="ref-copy"
                      onClick={handleCopy}
                      aria-label="Copy referral code"
                      title="Copy referral code"
                    >
                      {copied ? <CheckIcon /> : <CopyIcon />}
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </section>
      </main>
    </>
  );
}
