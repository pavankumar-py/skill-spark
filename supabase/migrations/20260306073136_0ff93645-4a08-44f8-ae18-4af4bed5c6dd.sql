
-- Drop restrictive policies and recreate as permissive for public/anonymous access
DROP POLICY IF EXISTS "Anyone can register as candidate" ON public.candidates;
DROP POLICY IF EXISTS "Anyone can update candidate status" ON public.candidates;
DROP POLICY IF EXISTS "Anyone can insert responses" ON public.candidate_responses;
DROP POLICY IF EXISTS "Anyone can insert scores" ON public.candidate_scores;
DROP POLICY IF EXISTS "Anyone can update scores" ON public.candidate_scores;
DROP POLICY IF EXISTS "Anyone can insert anticheat logs" ON public.anticheat_logs;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Anyone can register as candidate" ON public.candidates FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update candidate status" ON public.candidates FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert responses" ON public.candidate_responses FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can insert scores" ON public.candidate_scores FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update scores" ON public.candidate_scores FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert anticheat logs" ON public.anticheat_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
