/**
 * Braze Scenario Simulator
 *
 * Generates realistic multi-user data patterns via REST API (/users/track).
 * Useful for testing segment targeting, internal user groups, and
 * Currents / S3 / Snowflake connectivity.
 */

// ============================================================
// Scenario Definitions
// ============================================================

const SCENARIOS = {

  'ecommerce': {
    id: 'ecommerce',
    name: 'E-Commerce: Buyers, Browsers & Churned',
    description: 'Creates 9 users across 3 cohorts. After running, build Braze segments on purchase_count, lifecycle_stage, and cart_abandon_count to target each group differently.',
    personas: [
      // ---- HIGH-VALUE BUYERS ----
      {
        id: 'hv_buyer_001',
        label: 'High-Value Buyer — Active',
        badge: 'buyer',
        attributes: {
          first_name: 'Alice', last_name: 'Chen',
          email: 'alice.chen@sim-test.example.com',
          lifecycle_stage: 'active_customer',
          customer_tier: 'gold',
          purchase_count: 7,
          total_spend: 1249.93,
          preferred_category: 'electronics',
          country: 'US'
        },
        events: [
          { name: 'product_viewed', time_offset_days: -1, properties: { category: 'electronics', product_id: 'PROD_A1' } },
          { name: 'add_to_cart',    time_offset_days: -1, properties: { product_id: 'PROD_A1', price: 299.99 } },
          { name: 'checkout_started', time_offset_days: 0, properties: { cart_value: 299.99 } }
        ],
        purchases: [
          { product_id: 'PROD_B2', currency: 'USD', price: 199.99, quantity: 1, time_offset_days: -7 },
          { product_id: 'PROD_C3', currency: 'USD', price: 89.95,  quantity: 1, time_offset_days: -30 }
        ]
      },
      {
        id: 'hv_buyer_002',
        label: 'High-Value Buyer — Repeat',
        badge: 'buyer',
        attributes: {
          first_name: 'Marcus', last_name: 'Williams',
          email: 'marcus.williams@sim-test.example.com',
          lifecycle_stage: 'loyal_customer',
          customer_tier: 'platinum',
          purchase_count: 15,
          total_spend: 3102.50,
          preferred_category: 'apparel',
          country: 'CA'
        },
        events: [
          { name: 'product_viewed', time_offset_days: -2, properties: { category: 'apparel' } },
          { name: 'wishlist_added', time_offset_days: -2, properties: { product_id: 'PROD_D4' } }
        ],
        purchases: [
          { product_id: 'PROD_E5', currency: 'CAD', price: 149.00, quantity: 1, time_offset_days: -3 }
        ]
      },
      {
        id: 'hv_buyer_003',
        label: 'High-Value Buyer — Recent First Purchase',
        badge: 'buyer',
        attributes: {
          first_name: 'Priya', last_name: 'Patel',
          email: 'priya.patel@sim-test.example.com',
          lifecycle_stage: 'new_customer',
          customer_tier: 'silver',
          purchase_count: 1,
          total_spend: 249.99,
          country: 'GB'
        },
        events: [
          { name: 'product_viewed', time_offset_days: -5, properties: { category: 'home' } },
          { name: 'checkout_started', time_offset_days: -4, properties: { cart_value: 249.99 } }
        ],
        purchases: [
          { product_id: 'PROD_F6', currency: 'GBP', price: 249.99, quantity: 1, time_offset_days: -4 }
        ]
      },
      // ---- BROWSERS / CART ABANDONERS ----
      {
        id: 'browser_001',
        label: 'Cart Abandoner — High Intent',
        badge: 'browser',
        attributes: {
          first_name: 'Jake', last_name: 'Torres',
          email: 'jake.torres@sim-test.example.com',
          lifecycle_stage: 'prospect',
          purchase_count: 0,
          sessions_last_30_days: 8,
          cart_abandon_count: 3,
          country: 'US'
        },
        events: [
          { name: 'product_viewed',   time_offset_days: -1, properties: { category: 'electronics', product_id: 'PROD_G7' } },
          { name: 'add_to_cart',      time_offset_days: -1, properties: { product_id: 'PROD_G7', price: 599.99 } },
          { name: 'checkout_started', time_offset_days: -1, properties: { cart_value: 599.99 } }
        ],
        purchases: []
      },
      {
        id: 'browser_002',
        label: 'Browser — Low Intent',
        badge: 'browser',
        attributes: {
          first_name: 'Nina', last_name: 'Okafor',
          email: 'nina.okafor@sim-test.example.com',
          lifecycle_stage: 'prospect',
          purchase_count: 0,
          sessions_last_30_days: 3,
          cart_abandon_count: 0,
          country: 'NG'
        },
        events: [
          { name: 'product_viewed', time_offset_days: -3, properties: { category: 'beauty' } },
          { name: 'product_viewed', time_offset_days: -3, properties: { category: 'beauty', product_id: 'PROD_H8' } }
        ],
        purchases: []
      },
      {
        id: 'browser_003',
        label: 'Cart Abandoner — Mid-funnel',
        badge: 'browser',
        attributes: {
          first_name: 'Liam', last_name: 'Park',
          email: 'liam.park@sim-test.example.com',
          lifecycle_stage: 'prospect',
          purchase_count: 0,
          sessions_last_30_days: 12,
          cart_abandon_count: 1,
          country: 'KR'
        },
        events: [
          { name: 'product_viewed', time_offset_days: -2, properties: { category: 'sports', product_id: 'PROD_I9' } },
          { name: 'add_to_cart',    time_offset_days: -2, properties: { product_id: 'PROD_I9', price: 89.00 } }
        ],
        purchases: []
      },
      // ---- CHURNED / LAPSED ----
      {
        id: 'churned_001',
        label: 'Lapsed Customer — 90 days inactive',
        badge: 'churned',
        attributes: {
          first_name: 'Sandra', last_name: 'Kim',
          email: 'sandra.kim@sim-test.example.com',
          lifecycle_stage: 'lapsed',
          customer_tier: 'silver',
          purchase_count: 4,
          total_spend: 480.00,
          days_since_last_order: 91,
          country: 'US'
        },
        events: [
          { name: 'product_viewed', time_offset_days: -90, properties: { category: 'beauty' } }
        ],
        purchases: [
          { product_id: 'PROD_OLD1', currency: 'USD', price: 120.00, quantity: 1, time_offset_days: -91 }
        ]
      },
      {
        id: 'churned_002',
        label: 'Lapsed Customer — Never repurchased',
        badge: 'churned',
        attributes: {
          first_name: 'Derek', last_name: 'Santos',
          email: 'derek.santos@sim-test.example.com',
          lifecycle_stage: 'lapsed',
          customer_tier: 'bronze',
          purchase_count: 1,
          total_spend: 39.99,
          days_since_last_order: 180,
          country: 'BR'
        },
        events: [
          { name: 'product_viewed', time_offset_days: -180, properties: { category: 'books' } }
        ],
        purchases: [
          { product_id: 'PROD_OLD2', currency: 'BRL', price: 39.99, quantity: 1, time_offset_days: -180 }
        ]
      },
      {
        id: 'churned_003',
        label: 'High-value Lapsed — Win-back target',
        badge: 'churned',
        attributes: {
          first_name: 'Elena', last_name: 'Rossi',
          email: 'elena.rossi@sim-test.example.com',
          lifecycle_stage: 'lapsed',
          customer_tier: 'gold',
          purchase_count: 10,
          total_spend: 2100.00,
          days_since_last_order: 120,
          country: 'IT'
        },
        events: [
          { name: 'product_viewed', time_offset_days: -120, properties: { category: 'jewelry' } }
        ],
        purchases: [
          { product_id: 'PROD_OLD3', currency: 'EUR', price: 350.00, quantity: 1, time_offset_days: -121 }
        ]
      }
    ]
  },

  'saas-onboarding': {
    id: 'saas-onboarding',
    name: 'SaaS: Trial → Conversion Funnel',
    description: 'Creates 8 users representing each stage of a SaaS funnel. Build segments on converted_to_paid, trial_day, and features_activated to trigger targeted onboarding nudges.',
    personas: [
      {
        id: 'saas_converted_power',
        label: 'Converted — Power User',
        badge: 'converted',
        attributes: {
          first_name: 'Sophia', last_name: 'Laurent',
          email: 'sophia.laurent@saas-sim.example.com',
          trial_started: true, converted_to_paid: true,
          plan_type: 'enterprise', trial_day: 7,
          features_activated: 5, team_size: 12,
          lifecycle_stage: 'paying_customer'
        },
        events: [
          { name: 'trial_started',            time_offset_days: -14 },
          { name: 'feature_activated',        time_offset_days: -13, properties: { feature: 'integrations' } },
          { name: 'feature_activated',        time_offset_days: -12, properties: { feature: 'analytics' } },
          { name: 'invited_team_member',      time_offset_days: -10, properties: { count: 3 } },
          { name: 'upgrade_clicked',          time_offset_days: -7 }
        ],
        purchases: [
          { product_id: 'plan_enterprise_monthly', currency: 'USD', price: 299.00, quantity: 1, time_offset_days: -7 }
        ]
      },
      {
        id: 'saas_converted_basic',
        label: 'Converted — Basic Plan',
        badge: 'converted',
        attributes: {
          first_name: 'Omar', last_name: 'Hassan',
          email: 'omar.hassan@saas-sim.example.com',
          trial_started: true, converted_to_paid: true,
          plan_type: 'starter', trial_day: 12,
          features_activated: 2, team_size: 1,
          lifecycle_stage: 'paying_customer'
        },
        events: [
          { name: 'trial_started',   time_offset_days: -16 },
          { name: 'feature_activated', time_offset_days: -14, properties: { feature: 'export' } },
          { name: 'upgrade_clicked', time_offset_days: -4 }
        ],
        purchases: [
          { product_id: 'plan_starter_monthly', currency: 'USD', price: 29.00, quantity: 1, time_offset_days: -4 }
        ]
      },
      {
        id: 'saas_trial_d7_high',
        label: 'Trial Day 7 — High Engagement',
        badge: 'trial',
        attributes: {
          first_name: 'Mei', last_name: 'Zhang',
          email: 'mei.zhang@saas-sim.example.com',
          trial_started: true, converted_to_paid: false,
          trial_day: 7, features_activated: 4, team_size: 2,
          lifecycle_stage: 'trialing'
        },
        events: [
          { name: 'trial_started',            time_offset_days: -7 },
          { name: 'onboarding_step_completed', time_offset_days: -7, properties: { step: 1 } },
          { name: 'feature_activated',        time_offset_days: -6, properties: { feature: 'dashboard' } },
          { name: 'feature_activated',        time_offset_days: -5, properties: { feature: 'reports' } },
          { name: 'feature_activated',        time_offset_days: -3, properties: { feature: 'api_access' } },
          { name: 'upgrade_clicked',          time_offset_days: -1 }
        ],
        purchases: []
      },
      {
        id: 'saas_trial_d3_low',
        label: 'Trial Day 3 — Low Engagement',
        badge: 'trial',
        attributes: {
          first_name: 'Ben', last_name: 'Miller',
          email: 'ben.miller@saas-sim.example.com',
          trial_started: true, converted_to_paid: false,
          trial_day: 3, features_activated: 1, team_size: 1,
          lifecycle_stage: 'trialing'
        },
        events: [
          { name: 'trial_started',            time_offset_days: -3 },
          { name: 'onboarding_step_completed', time_offset_days: -3, properties: { step: 1 } }
        ],
        purchases: []
      },
      {
        id: 'saas_trial_d10_medium',
        label: 'Trial Day 10 — Mid Engagement',
        badge: 'trial',
        attributes: {
          first_name: 'Ingrid', last_name: 'Berg',
          email: 'ingrid.berg@saas-sim.example.com',
          trial_started: true, converted_to_paid: false,
          trial_day: 10, features_activated: 2, team_size: 1,
          lifecycle_stage: 'trialing'
        },
        events: [
          { name: 'trial_started',   time_offset_days: -10 },
          { name: 'feature_activated', time_offset_days: -9, properties: { feature: 'dashboard' } },
          { name: 'feature_activated', time_offset_days: -6, properties: { feature: 'export' } }
        ],
        purchases: []
      },
      {
        id: 'saas_trial_expired',
        label: 'Trial Expired — Churned',
        badge: 'churned',
        attributes: {
          first_name: 'Carlos', last_name: 'Mendez',
          email: 'carlos.mendez@saas-sim.example.com',
          trial_started: true, converted_to_paid: false,
          trial_day: 14, trial_expired: true,
          features_activated: 0, team_size: 1,
          lifecycle_stage: 'churned_trial'
        },
        events: [
          { name: 'trial_started', time_offset_days: -28 },
          { name: 'trial_expired', time_offset_days: -14 }
        ],
        purchases: []
      },
      {
        id: 'saas_freemium',
        label: 'Freemium — Not Upgrading',
        badge: 'trial',
        attributes: {
          first_name: 'Aya', last_name: 'Tanaka',
          email: 'aya.tanaka@saas-sim.example.com',
          trial_started: false, converted_to_paid: false,
          plan_type: 'free', features_activated: 1,
          lifecycle_stage: 'freemium'
        },
        events: [
          { name: 'feature_activated', time_offset_days: -20, properties: { feature: 'dashboard' } },
          { name: 'upgrade_page_viewed', time_offset_days: -5 },
          { name: 'upgrade_page_viewed', time_offset_days: -2 }
        ],
        purchases: []
      },
      {
        id: 'saas_reactivated',
        label: 'Reactivated — Lapsed then Returned',
        badge: 'converted',
        attributes: {
          first_name: 'James', last_name: 'Osei',
          email: 'james.osei@saas-sim.example.com',
          trial_started: true, converted_to_paid: true,
          plan_type: 'pro', reactivated: true,
          lifecycle_stage: 'reactivated_customer'
        },
        events: [
          { name: 'trial_started',   time_offset_days: -90 },
          { name: 'subscription_cancelled', time_offset_days: -60 },
          { name: 'reactivation_clicked',   time_offset_days: -2 }
        ],
        purchases: [
          { product_id: 'plan_pro_monthly', currency: 'USD', price: 79.00, quantity: 1, time_offset_days: -2 }
        ]
      }
    ]
  },

  'media-engagement': {
    id: 'media-engagement',
    name: 'Media: Content Engagement Tiers',
    description: 'Creates 7 users representing different content engagement depths. Useful for building re-engagement campaigns targeting lapsed subscribers or upgrading free users.',
    personas: [
      {
        id: 'media_superfan',
        label: 'Super Fan — Daily Active',
        badge: 'media',
        attributes: {
          first_name: 'Rosa', last_name: 'Ferreira',
          email: 'rosa.ferreira@media-sim.example.com',
          subscription_tier: 'premium',
          articles_read_30d: 47,
          videos_completed_30d: 12,
          newsletter_subscriber: true,
          content_category_preference: 'technology',
          lifecycle_stage: 'super_fan'
        },
        events: [
          { name: 'article_read',    time_offset_days: 0,  properties: { category: 'tech', read_time_seconds: 240 } },
          { name: 'video_completed', time_offset_days: 0,  properties: { duration_seconds: 1800 } },
          { name: 'content_shared',  time_offset_days: -1, properties: { channel: 'twitter' } },
          { name: 'article_read',    time_offset_days: -1, properties: { category: 'tech', read_time_seconds: 180 } }
        ],
        purchases: [
          { product_id: 'premium_annual', currency: 'USD', price: 99.00, quantity: 1, time_offset_days: -180 }
        ]
      },
      {
        id: 'media_engaged_weekly',
        label: 'Engaged — Weekly Reader',
        badge: 'media',
        attributes: {
          first_name: 'Tom', last_name: 'Nguyen',
          email: 'tom.nguyen@media-sim.example.com',
          subscription_tier: 'premium',
          articles_read_30d: 14,
          videos_completed_30d: 3,
          newsletter_subscriber: true,
          lifecycle_stage: 'engaged'
        },
        events: [
          { name: 'article_read', time_offset_days: -2, properties: { category: 'business' } },
          { name: 'article_read', time_offset_days: -7, properties: { category: 'science' } }
        ],
        purchases: [
          { product_id: 'premium_monthly', currency: 'USD', price: 12.00, quantity: 1, time_offset_days: -30 }
        ]
      },
      {
        id: 'media_casual',
        label: 'Casual — Monthly Browser',
        badge: 'media',
        attributes: {
          first_name: 'Dana', last_name: 'Kowalski',
          email: 'dana.kowalski@media-sim.example.com',
          subscription_tier: 'free',
          articles_read_30d: 4,
          newsletter_subscriber: false,
          lifecycle_stage: 'casual'
        },
        events: [
          { name: 'article_read', time_offset_days: -5,  properties: { category: 'lifestyle' } },
          { name: 'article_read', time_offset_days: -18, properties: { category: 'food' } }
        ],
        purchases: []
      },
      {
        id: 'media_newsletter_only',
        label: 'Newsletter-only — No App Visits',
        badge: 'media',
        attributes: {
          first_name: 'Haruto', last_name: 'Yamamoto',
          email: 'haruto.yamamoto@media-sim.example.com',
          subscription_tier: 'free',
          articles_read_30d: 0,
          newsletter_subscriber: true,
          newsletter_opens_30d: 8,
          lifecycle_stage: 'newsletter_only'
        },
        events: [
          { name: 'newsletter_opened', time_offset_days: -2 },
          { name: 'newsletter_opened', time_offset_days: -9 }
        ],
        purchases: []
      },
      {
        id: 'media_lapsed',
        label: 'Lapsed Subscriber — Re-engagement Target',
        badge: 'churned',
        attributes: {
          first_name: 'Anika', last_name: 'Gupta',
          email: 'anika.gupta@media-sim.example.com',
          subscription_tier: 'premium',
          articles_read_30d: 0,
          last_content_interaction_days_ago: 45,
          newsletter_subscriber: false,
          lifecycle_stage: 'lapsed'
        },
        events: [
          { name: 'article_read', time_offset_days: -45, properties: { category: 'health' } }
        ],
        purchases: [
          { product_id: 'premium_monthly', currency: 'USD', price: 12.00, quantity: 1, time_offset_days: -60 }
        ]
      },
      {
        id: 'media_new_free',
        label: 'New Free User — Onboarding',
        badge: 'media',
        attributes: {
          first_name: 'Leo', last_name: 'Dubois',
          email: 'leo.dubois@media-sim.example.com',
          subscription_tier: 'free',
          articles_read_30d: 2,
          lifecycle_stage: 'new_user'
        },
        events: [
          { name: 'account_created', time_offset_days: -3 },
          { name: 'article_read',    time_offset_days: -3, properties: { category: 'tech' } },
          { name: 'article_read',    time_offset_days: -1, properties: { category: 'business' } }
        ],
        purchases: []
      },
      {
        id: 'media_cancelled',
        label: 'Cancelled Premium — Downgraded to Free',
        badge: 'churned',
        attributes: {
          first_name: 'Fatima', last_name: 'Al-Rashid',
          email: 'fatima.alrashid@media-sim.example.com',
          subscription_tier: 'free',
          articles_read_30d: 1,
          previously_premium: true,
          lifecycle_stage: 'cancelled'
        },
        events: [
          { name: 'subscription_cancelled', time_offset_days: -14, properties: { reason: 'too_expensive' } },
          { name: 'article_read', time_offset_days: -2, properties: { category: 'lifestyle' } }
        ],
        purchases: []
      }
    ]
  },

  'internal-group-setup': {
    id: 'internal-group-setup',
    name: 'Internal Group: 5 Named Test Users',
    description: 'Creates 5 clearly named test users optimised for Braze Internal Groups. After running, add them to Settings → Internal Groups in Braze to enable per-message delivery logs and test sends.',
    personas: [
      {
        id: 'test_alice',
        label: 'Alice — Email QA',
        badge: 'test',
        attributes: {
          first_name: 'Alice', last_name: 'TestUser',
          email: 'alice-test@internal.example.com',
          is_test_user: true, test_role: 'qa_email',
          country: 'US'
        },
        events: [
          { name: 'internal_group_setup', time_offset_days: 0, properties: { role: 'email_tester', tool: 'braze-api-tester' } }
        ],
        purchases: []
      },
      {
        id: 'test_bob',
        label: 'Bob — Push QA',
        badge: 'test',
        attributes: {
          first_name: 'Bob', last_name: 'TestUser',
          email: 'bob-test@internal.example.com',
          is_test_user: true, test_role: 'qa_push',
          country: 'US'
        },
        events: [
          { name: 'internal_group_setup', time_offset_days: 0, properties: { role: 'push_tester', tool: 'braze-api-tester' } }
        ],
        purchases: []
      },
      {
        id: 'test_carol',
        label: 'Carol — SMS QA',
        badge: 'test',
        attributes: {
          first_name: 'Carol', last_name: 'TestUser',
          email: 'carol-test@internal.example.com',
          is_test_user: true, test_role: 'qa_sms',
          country: 'US'
        },
        events: [
          { name: 'internal_group_setup', time_offset_days: 0, properties: { role: 'sms_tester', tool: 'braze-api-tester' } }
        ],
        purchases: []
      },
      {
        id: 'test_david',
        label: 'David — In-App QA',
        badge: 'test',
        attributes: {
          first_name: 'David', last_name: 'TestUser',
          email: 'david-test@internal.example.com',
          is_test_user: true, test_role: 'qa_inappmessage',
          country: 'US'
        },
        events: [
          { name: 'internal_group_setup', time_offset_days: 0, properties: { role: 'inapp_tester', tool: 'braze-api-tester' } }
        ],
        purchases: []
      },
      {
        id: 'test_eva',
        label: 'Eva — Canvas QA',
        badge: 'test',
        attributes: {
          first_name: 'Eva', last_name: 'TestUser',
          email: 'eva-test@internal.example.com',
          is_test_user: true, test_role: 'qa_canvas',
          country: 'US'
        },
        events: [
          { name: 'internal_group_setup', time_offset_days: 0, properties: { role: 'canvas_tester', tool: 'braze-api-tester' } }
        ],
        purchases: []
      }
    ]
  },

  'currents-ping': {
    id: 'currents-ping',
    name: 'Currents / S3 / Snowflake Connectivity Ping',
    description: 'Fires a single distinctive event with a unique trace_id. After Currents processes it (typically 5–30 min), use the generated SQL or CLI command to verify it arrived in your data warehouse.',
    personas: [
      {
        id: 'connectivity_test_user',
        label: 'Connectivity Test User',
        badge: 'ping',
        attributes: {
          first_name: 'Connectivity', last_name: 'TestUser',
          test_purpose: 'currents_connectivity_check',
          fired_at: null  // injected at runtime
        },
        events: [
          {
            name: 'braze_connectivity_ping',
            time_offset_days: 0,
            properties: {
              trace_id: null,  // injected at runtime
              tool: 'braze-api-tester',
              environment: 'test'
            }
          }
        ],
        purchases: []
      }
    ]
  }

};

// ============================================================
// Engine
// ============================================================

/**
 * Convert a persona definition into a /users/track payload object.
 * time_offset_days is converted to an ISO timestamp relative to now.
 */
function buildPersonaPayload(persona, prefix) {
  const externalId = prefix + persona.id;
  const now = Date.now();
  const msPerDay = 24 * 60 * 60 * 1000;

  const attributeObject = {
    external_id: externalId,
    ...persona.attributes
  };

  const eventObjects = (persona.events || []).map(evt => ({
    external_id: externalId,
    name: evt.name,
    time: new Date(now + evt.time_offset_days * msPerDay).toISOString(),
    properties: evt.properties || {}
  }));

  const purchaseObjects = (persona.purchases || []).map(p => ({
    external_id: externalId,
    product_id: p.product_id,
    currency: p.currency,
    price: p.price,
    quantity: p.quantity || 1,
    time: new Date(now + p.time_offset_days * msPerDay).toISOString()
  }));

  return {
    attributes: [attributeObject],
    events: eventObjects.length ? eventObjects : undefined,
    purchases: purchaseObjects.length ? purchaseObjects : undefined
  };
}

/**
 * Deep-clone a persona and inject a trace_id + fired_at timestamp.
 * Used exclusively for the currents-ping scenario.
 */
function injectTraceId(persona, traceId, firedAt) {
  return {
    ...persona,
    attributes: { ...persona.attributes, fired_at: firedAt },
    events: persona.events.map(evt => ({
      ...evt,
      properties: { ...evt.properties, trace_id: traceId }
    }))
  };
}

/**
 * Run a scenario — iterates personas and POSTs each one via /api/proxy.
 * @param {string}   scenarioId    - key in SCENARIOS
 * @param {string}   prefix        - user ID prefix, e.g. "sim_"
 * @param {number}   delayMs       - ms to wait between API calls
 * @param {string}   apiKey        - Braze REST API key
 * @param {string}   restEndpoint  - Braze REST base URL
 * @param {Function} onProgress    - callback(current, total, label, status)
 * @returns {Object} { success, errors, traceId, firedAt }
 */
async function runScenario(scenarioId, prefix, delayMs, apiKey, restEndpoint, onProgress) {
  const scenario = SCENARIOS[scenarioId];
  if (!scenario) throw new Error('Unknown scenario: ' + scenarioId);

  const results = { success: [], errors: [], traceId: null, firedAt: null };

  for (let i = 0; i < scenario.personas.length; i++) {
    let persona = scenario.personas[i];

    // Inject trace ID for connectivity ping
    if (scenarioId === 'currents-ping') {
      const traceId = crypto.randomUUID();
      const firedAt = new Date().toISOString();
      results.traceId = traceId;
      results.firedAt = firedAt;
      persona = injectTraceId(persona, traceId, firedAt);
    }

    const payload = buildPersonaPayload(persona, prefix);
    const externalId = prefix + persona.id;
    onProgress(i + 1, scenario.personas.length, persona.label, 'sending');

    try {
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'POST',
          endpoint: '/users/track',
          body: payload,
          apiKey,
          restEndpoint
        })
      });
      const data = await response.json();

      if (data.status >= 200 && data.status < 300) {
        results.success.push({ id: externalId, label: persona.label, badge: persona.badge });
        onProgress(i + 1, scenario.personas.length, persona.label, 'success');
      } else {
        const errMsg = (data.data && data.data.message) || data.statusText || String(data.status);
        results.errors.push({ id: externalId, label: persona.label, detail: errMsg });
        onProgress(i + 1, scenario.personas.length, persona.label, 'error');
      }
    } catch (err) {
      results.errors.push({ id: externalId, label: persona.label, detail: err.message });
      onProgress(i + 1, scenario.personas.length, persona.label, 'error');
    }

    if (i < scenario.personas.length - 1 && delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

// ============================================================
// Results rendering helpers
// ============================================================

function renderPersonaList(personas) {
  return `
    <div class="persona-grid">
      ${personas.map(p => `
        <div class="persona-card">
          <span class="persona-badge ${p.badge || ''}">${p.badge || 'user'}</span>
          <div>${p.label}</div>
          <small>${(p.events || []).length} event(s)${(p.purchases || []).length ? ', ' + p.purchases.length + ' purchase(s)' : ''}</small>
        </div>
      `).join('')}
    </div>
  `;
}

function renderResultsList(success, errors) {
  const items = [
    ...success.map(u => `
      <li class="scenario-result-item success">
        <span class="result-icon">✓</span>
        <span class="result-label">${escHtml(u.label)}</span>
        <span class="result-id">${escHtml(u.id)}</span>
      </li>
    `),
    ...errors.map(u => `
      <li class="scenario-result-item error">
        <span class="result-icon">✗</span>
        <span class="result-label">${escHtml(u.label)}</span>
        <span class="result-id">${escHtml(u.detail)}</span>
      </li>
    `)
  ];
  return `<ul class="scenario-result-list">${items.join('')}</ul>`;
}

function renderSnowflakeSQL(prefix, traceId, firedAt) {
  const externalId = prefix + 'connectivity_test_user';
  return `
    <div class="sql-block">
      <h4>Find this event in Snowflake (Braze Currents)</h4>
      <p class="help-text" style="margin-bottom:8px;">Allow 5–30 minutes for Currents to deliver, then run:</p>
      <pre>-- Custom Events table (Braze Currents)
SELECT
  external_user_id,
  name AS event_name,
  PARSE_JSON(properties):trace_id::string AS trace_id,
  TO_TIMESTAMP(time) AS event_time
FROM BRAZE_CLOUD_PRODUCTION.CURRENTS.USERS_BEHAVIORS_CUSTOMEVENT
WHERE PARSE_JSON(properties):trace_id::string = '${escHtml(traceId)}'
  AND name = 'braze_connectivity_ping'
ORDER BY event_time DESC;</pre>
      <button type="button" class="btn-small" style="margin-bottom:16px;" onclick="navigator.clipboard.writeText(this.previousElementSibling.textContent).then(()=>{this.textContent='Copied!';setTimeout(()=>this.textContent='Copy SQL',2000)})">Copy SQL</button>

      <h4>Find in S3 (raw Currents files)</h4>
      <pre>aws s3 cp s3://YOUR-CURRENTS-BUCKET/ /tmp/currents/ \\
  --recursive --include "*.json"

grep -r '${escHtml(traceId)}' /tmp/currents/</pre>
      <button type="button" class="btn-small" onclick="navigator.clipboard.writeText(this.previousElementSibling.textContent).then(()=>{this.textContent='Copied!';setTimeout(()=>this.textContent='Copy CLI',2000)})">Copy CLI</button>

      <p class="help-text" style="margin-top:12px;">
        Event fired at: <strong>${escHtml(firedAt)}</strong><br>
        External ID: <code>${escHtml(externalId)}</code><br>
        trace_id: <code>${escHtml(traceId)}</code>
      </p>
    </div>
  `;
}

function renderInternalGroupInstructions(prefix, userIds) {
  const idList = userIds.map(id => escHtml(id)).join(', ');
  return `
    <div class="instructions-block status-info" style="display:block;">
      <h4>Next Steps: Add Users to a Braze Internal Group</h4>
      <ol>
        <li>In Braze Dashboard, go to <strong>Settings → Internal Groups</strong></li>
        <li>Create a new group (e.g. "API Tester QA") or open an existing one</li>
        <li>Click <strong>Add Users</strong> and paste these external_ids:</li>
      </ol>
      <div class="id-copy-block">${idList}</div>
      <button type="button" class="btn-small" style="margin-bottom:12px;" onclick="navigator.clipboard.writeText('${userIds.map(id => id.replace(/'/g, "\\'"  )).join(', ')}').then(()=>{this.textContent='Copied!';setTimeout(()=>this.textContent='Copy IDs',2000)})">Copy IDs</button>
      <ol start="4">
        <li>Save the group, then send a test campaign/canvas to these users</li>
        <li>Go to <strong>Message Activity Log</strong> and filter by external_id to see per-message delivery logs</li>
      </ol>
      <p class="help-text" style="margin-top:8px;">
        All users have <code>is_test_user: true</code> — useful for building a segment that permanently excludes or targets test accounts.
      </p>
    </div>
  `;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ============================================================
// DOM wiring
// ============================================================

/**
 * Initialise the Scenario Simulator UI.
 * Called from app.js DOMContentLoaded with the existing credential inputs.
 *
 * @param {HTMLInputElement}  apiKeyInput     - #api-key-input
 * @param {HTMLSelectElement} endpointSelect  - #endpoint-select
 */
export function initScenarioSimulator(apiKeyInput, endpointSelect) {
  const scenarioSelect    = document.getElementById('scenario-select');
  const prefixInput       = document.getElementById('scenario-prefix');
  const delayInput        = document.getElementById('scenario-delay');
  const descriptionEl     = document.getElementById('scenario-description');
  const runBtn            = document.getElementById('run-scenario-btn');
  const previewBtn        = document.getElementById('preview-scenario-btn');
  const progressWrap      = document.getElementById('scenario-progress');
  const progressFill      = document.getElementById('scenario-progress-fill');
  const progressLabel     = document.getElementById('scenario-progress-label');
  const resultsEl         = document.getElementById('scenario-results');

  if (!scenarioSelect) return; // section not present in DOM

  // ---- Scenario selection ----
  scenarioSelect.addEventListener('change', () => {
    const id = scenarioSelect.value;
    if (!id || !SCENARIOS[id]) {
      descriptionEl.style.display = 'none';
      runBtn.disabled = true;
      previewBtn.disabled = true;
      resultsEl.style.display = 'none';
      return;
    }
    const scenario = SCENARIOS[id];
    descriptionEl.innerHTML = `
      <h3>${escHtml(scenario.name)}</h3>
      <p>${escHtml(scenario.description)}</p>
      ${renderPersonaList(scenario.personas)}
    `;
    descriptionEl.style.display = 'block';
    runBtn.disabled = false;
    previewBtn.disabled = false;
    progressWrap.style.display = 'none';
    resultsEl.style.display = 'none';
  });

  // ---- Preview payload ----
  previewBtn.addEventListener('click', () => {
    const id = scenarioSelect.value;
    if (!id || !SCENARIOS[id]) return;
    const scenario = SCENARIOS[id];
    const prefix = prefixInput.value || 'sim_';
    const payloads = scenario.personas.map(p => buildPersonaPayload(p, prefix));
    resultsEl.innerHTML = `
      <h3 style="margin-bottom:10px;">Payload Preview (${scenario.personas.length} user${scenario.personas.length > 1 ? 's' : ''})</h3>
      <p class="help-text" style="margin-bottom:8px;">
        This is the JSON that will be sent to <code>/users/track</code> — one call per user.
      </p>
      <pre style="background:#1e293b;color:#e2e8f0;padding:14px;border-radius:6px;font-size:12px;overflow:auto;max-height:360px;line-height:1.5;">${escHtml(JSON.stringify(payloads, null, 2))}</pre>
    `;
    resultsEl.style.display = 'block';
  });

  // ---- Run scenario ----
  runBtn.addEventListener('click', async () => {
    const id = scenarioSelect.value;
    if (!id || !SCENARIOS[id]) return;

    const apiKey = apiKeyInput.value.trim();
    const restEndpoint = endpointSelect.value;
    if (!apiKey) {
      alert('Please enter your REST API Key in the Configuration section first.');
      return;
    }

    const scenario = SCENARIOS[id];
    const prefix = prefixInput.value || 'sim_';
    const delayMs = parseInt(delayInput.value, 10) || 300;

    // Reset UI
    runBtn.disabled = true;
    previewBtn.disabled = true;
    progressFill.style.width = '0%';
    progressLabel.textContent = 'Starting...';
    progressWrap.style.display = 'block';
    resultsEl.style.display = 'none';

    const total = scenario.personas.length;

    function onProgress(current, total, label, status) {
      const pct = Math.round((current / total) * 100);
      progressFill.style.width = pct + '%';
      const icon = status === 'sending' ? '⏳' : status === 'success' ? '✓' : '✗';
      progressLabel.textContent = `${icon} ${current} of ${total}: ${label}`;
    }

    let results;
    try {
      results = await runScenario(id, prefix, delayMs, apiKey, restEndpoint, onProgress);
    } catch (err) {
      progressLabel.textContent = 'Error: ' + err.message;
      runBtn.disabled = false;
      previewBtn.disabled = false;
      return;
    }

    progressLabel.textContent = `Done — ${results.success.length} of ${total} users created successfully.`;

    // Build results HTML
    const successCount = results.success.length;
    const errorCount = results.errors.length;
    const summaryClass = errorCount === 0 ? 'status-success' : (successCount === 0 ? 'status-error' : 'status-warning');

    let html = `
      <p class="scenario-summary status-message ${summaryClass}" style="display:block; margin-bottom:14px;">
        ${successCount} of ${total} users created successfully${errorCount ? ' (' + errorCount + ' failed)' : ''}.
      </p>
      ${renderResultsList(results.success, results.errors)}
    `;

    // Context-specific post-run panels
    if (id === 'currents-ping' && results.traceId) {
      html += renderSnowflakeSQL(prefix, results.traceId, results.firedAt);
    }

    if (id === 'internal-group-setup' && results.success.length) {
      const ids = results.success.map(u => u.id);
      html += renderInternalGroupInstructions(prefix, ids);
    }

    resultsEl.innerHTML = html;
    resultsEl.style.display = 'block';
    resultsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    runBtn.disabled = false;
    previewBtn.disabled = false;
  });
}
