DROP POLICY IF EXISTS clientes_owner ON public.clientes;
CREATE POLICY clientes_owner ON public.clientes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS cobrancas_owner ON public.cobrancas;
CREATE POLICY cobrancas_owner ON public.cobrancas FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS envios_owner ON public.envios;
CREATE POLICY envios_owner ON public.envios FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS perfil_owner ON public.perfil_cobranca;
CREATE POLICY perfil_owner ON public.perfil_cobranca FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);