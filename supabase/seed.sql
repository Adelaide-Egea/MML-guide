-- Seed groups + options. Members are added by the admin in the app.
-- Tokens are long URL-safe strings — regenerate from /admin after deploy if you prefer.

insert into groups (
  id, name, invite_token, start_time, arrival_note, evenings,
  lead_days, horizon_days, vote_hours, show_budget, area_label, preferred_lines
) values
(
  'french',
  'French Mums',
  'FrMumsK7x9Qp2mNv4Lw8Rj3Hs6YbCd',
  '19:00',
  '7pm start',
  '{2,3,4}',
  11, 28, 24, 50,
  'Central London. Members live in Barnes, Clapham, West Hampstead',
  '{northern,victoria,district,hammersmith}'
),
(
  'barnes',
  'Barnes Mums',
  'BaMumsT3n8Wc5Kd1Mf9Zx7Pq4JuRvEh',
  '20:00',
  'Arrive any time from 8pm, after bedtime',
  '{2,3,4}',
  11, 28, 24, null,
  'Barnes, between Church Road (Riva) and White Hart Lane',
  '{}'
);

-- Options are seeded via scripts/seed.ts (keeps Google search URLs consistent).
-- After running this SQL, run: npm run seed
