
-- Allow authenticated users to delete their own assessments
CREATE POLICY "auth_delete_assessments" ON public.assessments
FOR DELETE TO authenticated
USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

-- Allow authenticated users to delete questions for their assessments
CREATE POLICY "auth_delete_questions" ON public.questions
FOR DELETE TO authenticated
USING (assessment_id IN (SELECT id FROM assessments WHERE company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())));

-- Allow authenticated users to delete candidates for their assessments
CREATE POLICY "auth_delete_candidates" ON public.candidates
FOR DELETE TO authenticated
USING (assessment_id IN (SELECT id FROM assessments WHERE company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())));

-- Allow authenticated users to delete candidate_responses for their candidates
CREATE POLICY "auth_delete_responses" ON public.candidate_responses
FOR DELETE TO authenticated
USING (candidate_id IN (SELECT c.id FROM candidates c JOIN assessments a ON c.assessment_id = a.id WHERE a.company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())));

-- Allow authenticated users to delete candidate_scores for their candidates
CREATE POLICY "auth_delete_scores" ON public.candidate_scores
FOR DELETE TO authenticated
USING (candidate_id IN (SELECT c.id FROM candidates c JOIN assessments a ON c.assessment_id = a.id WHERE a.company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())));

-- Allow authenticated users to delete anticheat_logs for their candidates
CREATE POLICY "auth_delete_anticheat" ON public.anticheat_logs
FOR DELETE TO authenticated
USING (candidate_id IN (SELECT c.id FROM candidates c JOIN assessments a ON c.assessment_id = a.id WHERE a.company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())));
