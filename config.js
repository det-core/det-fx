// ============================================================
//  DET TRADES — config.js
//  Dark Empire Technologies | fx.darkempiretech.eu.cc
// ============================================================

const config = {

  // ── App ────────────────────────────────────────────────────
  APP: {
    NAME: "DET Trades",
    BRAND: "Dark Empire Technologies",
    DOMAIN: process.env.APP_DOMAIN || "https://fx.darkempiretech.eu.cc",
    PORT: 4010,
    ENV: process.env.NODE_ENV || "production",
    JWT_SECRET: process.env.JWT_SECRET || "DET_TRADES_SECRET_2025",
    JWT_EXPIRES_IN: "7d",
    JWT_REMEMBER_EXPIRES_IN: "30d",
  },

  // ── Firebase Admin SDK ────────────────────────────────────
  FIREBASE: {
    PROJECT_ID: process.env.FIREBASE_PROJECT_ID || "jarvis-det",
    PRIVATE_KEY: (process.env.FIREBASE_PRIVATE_KEY || "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDAmhJoc+USU03c\nwXF86YxH4oosPIItkW3sixTOhsCZBYe9/YOncTnltfTQFqxIb5iwGSfLxq6G3hf8\naE8rst9wCQj7bcet1RTGcgmntnpUSkr+mKwLLvNmCMlUPaVX12A3akojAp7CdDG7\nMbzTV31Rr4vuos8hOf0r+m2Dg6l9NaKl1NVYCgp87tEEQ16NIgHw4DK1rekGZkgs\nGI46BUxGsLlagJRnNPLlkYNGod6j6ZesUDsDpUDwlQc8MRzaO8A+504UPycEKSAP\nbbKVNYSpZ8cLPWasEnDOMX6NAX+KBYNjqNaHRR8x1O/qR6G9Sgt4ETJlArZyX12/\ny3h07CfTAgMBAAECggEAA1vsjEPRL/Oh/QKmrw4Hs01BKapYfuD1cNWwJDX3b/PH\nvUmJnUb9QoNc5LAwiwbfO9sEdapeat2+v1k2YEW7XeHadUAh5mc7+IYOow0srwGo\nsy4Ieh10g0gN8tksZA7Oj8jbyCaIjE2ofGJOr8Tr25vbLetK/4JaZwT0GgIW16cr\nD9E18uxSz1RBlXf8F4NjUnIaypxnrDfQ7oeZMPrjfbnHGp3+jCr1Ci3+tIcTLgFC\ni1fwbq+SzxsxHD78yxzX3obfHCrshVPMsW8J0l+7vbCJ6OcFZVt+Oxqd6kFCvdtV\nDjZ0IGtBcavtIj0bAUqem3S3LLpGQPzDftXnmE9moQKBgQDrZJMGElqDjkvd9BSG\n+XPUnkpdM+txxnR9p9GwcnmdnYI/mbegyECIP1Y866onVrQIjVCvEp4EIlb90zb/\nCBrKW4MSRxU3vKcUqlfPMa4I71G5VKuc/ZGLebpTL0YTQqf5lW/gjbJWNnLWrLzm\n5UkBbyuIKGhZYEXB5tqNA4SMQwKBgQDRdoBZqCwdhOgtIjKGKduuJMynbq2SqKdm\nGYwi23YTT4hTluFT5H87laZb9q1sQMrTTCHdU8xyLsYpybYFKVXSavPhiCw+gldC\n4z3sCAY5yM4/j2POhjahG9WuayGOEn3PVrs8jfsvzSl6Lu4ebCI1sUB01Qb+fvJO\nOAoh0fAFMQKBgFAf9/vFG5JUSXbPsn0PRGJHT0DSf35G8zgie7n3/XWtO7yyclME\nVxMJnC04er7RQI74q1IsoCUAG2RjFQFSnOvson0CPTKvwJ/ELAeW/YqFC+ht7cyO\nc5BqawYNvWio88x9FYv2L5IxDn4MZnCh82vNj5/VQU/K+XO7RQFjBSdJAoGATyA5\nyiSqTZhocKxLc70aPIWwPcukjBNj8UDTXFOVHiRcNl93zU4y9hpJFtJvnsY3GGzZ\nGhfO0o9y0lRdi0ObJPq8GEVtmUt5lU3slV5Oo8OEjiQnqtuuhVvTc6kKqvW3SvzT\njEOCUQNqmLpjv2BP6AKGe9wBYWApPn0S7sW0qvECgYEAsT17ZB1BgGgfng6ExOOY\nbhlDPREHhuWUQ1LsXLlgFwUZsJ+eokYiArhoq2VesturMGv+oVpkHvyGAa64gP1K\n7cz6bpO7+6a86Z2p6spFfHka4g4CC15rzmApgkPtz5bRAP4kWinkKSQnySbEAdHe\n2drYYKUW4AC3ZjbE3NIJbxA=\n-----END PRIVATE KEY-----\n").replace(/\\n/g, "\n"),
    CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || "firebase-adminsdk-fbsvc@jarvis-det.iam.gserviceaccount.com",
    DATABASE_URL: process.env.FIREBASE_DATABASE_URL || "https://jarvis-det-default-rtdb.firebaseio.com",
  },

  // ── Firebase Web (Frontend reference) ────────────────────
  FIREBASE_WEB: {
    API_KEY: "AIzaSyBGyJ2dWlcwcf7zjOy0wPlka9LyvxylHJA",
    AUTH_DOMAIN: "jarvis-det.firebaseapp.com",
    PROJECT_ID: "jarvis-det",
    STORAGE_BUCKET: "jarvis-det.firebasestorage.app",
    MESSAGING_SENDER_ID: "797806372245",
    APP_ID: "1:797806372245:web:327f31b02d3b64ca44829c",
    MEASUREMENT_ID: "G-220VFR3EJS",
  },

  // ── Paystack ──────────────────────────────────────────────
  PAYSTACK: {
    SECRET_KEY: process.env.PAYSTACK_SECRET_KEY || "sk_test_45a8bf6ca388b90abac188824790c4b4f44a5edf",
    PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY || "pk_test_3a31c89c675a416efeb27d563868b6519e577a0f",
    WEBHOOK_SECRET: process.env.PAYSTACK_WEBHOOK_SECRET || "sk_test_45a8bf6ca388b90abac188824790c4b4f44a5edf",
  },

  // ── AI Providers ──────────────────────────────────────────
  AI: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "YOUR_ANTHROPIC_API_KEY",
    ANTHROPIC_MODEL: "claude-opus-4-5",
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || "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",
    OPENROUTER_MODEL: "anthropic/claude-3.5-sonnet",
    OPENROUTER_FALLBACK_MODEL: "openai/gpt-4o",
  },

  // ── Subscription Plans ────────────────────────────────────
  PLANS: {
    FREE: {
      id: "free",
      name: "Free",
      price: 0,
      analyses_per_day: 3,
      analyses_per_week: null,
      tp_count: 1,
      has_reasoning: false,
      has_risk_setup: false,
      has_history: false,
      has_signal_feed: false,
      has_support_chat: false,
      chat_images_per_day: 5,
    },
    WEEKLY: {
      id: "weekly",
      name: "Weekly",
      price: 500000,
      analyses_per_day: 3,
      analyses_per_week: 15,
      tp_count: 3,
      has_reasoning: true,
      has_risk_setup: true,
      has_history: true,
      has_signal_feed: false,
      has_support_chat: false,
      chat_images_per_day: null,
    },
    MONTHLY: {
      id: "monthly",
      name: "Monthly",
      price: 1500000,
      analyses_per_day: null,
      analyses_per_week: null,
      tp_count: 3,
      has_reasoning: true,
      has_risk_setup: true,
      has_history: true,
      has_signal_feed: true,
      has_support_chat: true,
      chat_images_per_day: null,
    },
  },

  // ── Referral System ───────────────────────────────────────
  REFERRAL: {
    ENABLED: true,
    REWARD_HOURS: 6,
    REFERRED_BONUS_ANALYSES: 1,
    MILESTONE_3_REFS: "1_week",
    MILESTONE_10_REFS: "1_month",
    SELF_REFERRAL_BLOCK: true,
  },

  // ── Upload / Storage ──────────────────────────────────────
  UPLOADS: {
    CHAT_IMAGES_PATH: "./uploads/chat-images",
    ANALYSIS_IMAGES_PATH: "./uploads/analysis",
    MAX_CHAT_IMAGE_SIZE_MB: 2,
    MAX_ANALYSIS_IMAGE_SIZE_MB: 10,
    ALLOWED_TYPES: ["image/jpeg", "image/png", "image/webp"],
    CHAT_IMAGE_RETENTION_DAYS: 30,
    ANALYSIS_IMAGE_RETENTION_DAYS: 7,
  },

  // ── Rate Limiting & IP Protection ─────────────────────────
  SECURITY: {
    RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000,
    RATE_LIMIT_MAX_GENERAL: 100,
    RATE_LIMIT_MAX_AUTH: 10,
    RATE_LIMIT_MAX_ANALYSIS: 20,
    IP_FLAG_THRESHOLD: 3,
    IP_BLOCK_THRESHOLD: 5,
    VPN_DETECTION_API: "http://ip-api.com/json",
  },

  // ── CORS ──────────────────────────────────────────────────
  CORS: {
    ALLOWED_ORIGINS: [
      "https://fx.darkempiretech.eu.cc",
      "https://darkempiretech.eu.cc",
      "https://www.darkempiretech.eu.cc",
      "http://localhost:3000",
      "http://localhost:5500",
      "http://127.0.0.1:5500",
    ],
  },

};

module.exports = config;
